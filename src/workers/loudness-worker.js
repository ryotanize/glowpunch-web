/**
 * loudness-worker.js
 * 
 * Web Worker for measuring and adjusting audio loudness (EBU R128 / ITU-R BS.1770-4).
 * Uses mediabunny's AudioSampleSink for PCM extraction.
 */

import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  Mp4OutputFormat,
  BufferTarget,
  AudioSampleSink,
  AudioSample
} from 'mediabunny';

// Filter coefficients for 48kHz (ITU-R BS.1770-4)
const STAGE1 = {
  b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285,
  a1: -1.69065929318241, a2: 0.73248077421585
};
const STAGE2 = {
  b0: 0.995738812322616, b1: -1.99147762464523, b2: 0.995738812322616,
  a1: -1.99147762464523, a2: 0.99147762464523
};

class BiquadChannel {
  constructor(coeffs) {
    this.b0 = coeffs.b0; this.b1 = coeffs.b1; this.b2 = coeffs.b2;
    this.a1 = coeffs.a1; this.a2 = coeffs.a2;
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
  }
  process(x0) {
    const y0 = this.b0 * x0 + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x0;
    this.y2 = this.y1; this.y1 = y0;
    return y0;
  }
}

self.onmessage = async (event) => {
  const { type, file, settings } = event.data;

  try {
    if (type === 'analyze') {
      await analyzeLoudness(file);
    } else if (type === 'normalize') {
      await normalizeLoudness(file, settings);
    }
  } catch (err) {
    console.error('Worker error:', err);
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};

async function analyzeLoudness(file) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });

  const audioTrack = await input.getPrimaryAudioTrack();
  if (!audioTrack) {
    throw new Error('音声トラックが見つかりません。音声のない動画は解析できません。');
  }

  const sampleRate = audioTrack.sampleRate || 48000;
  const numChannels = audioTrack.numberOfChannels || 1;
  const duration = await input.computeDuration();
  
  const windowSize = Math.floor(0.4 * sampleRate);
  const stepSize = Math.floor(0.1 * sampleRate);
  
  const filters = Array.from({ length: numChannels }, () => ({
    s1: new BiquadChannel(STAGE1),
    s2: new BiquadChannel(STAGE2)
  }));

  let blockPowers = []; 
  
  let slidingBuffers = Array.from({ length: numChannels }, () => new Float32Array(windowSize));
  let writeIdx = 0;
  let filled = 0;

  const sink = new AudioSampleSink(audioTrack);
  let framesProcessed = 0;
  const totalFrames = duration * sampleRate;

  self.postMessage({ type: 'progress', label: '音声をスキャン中...', value: 0 });

  for await (const sample of sink.samples()) {
    const frameCount = sample.numberOfFrames;
    const sampleData = [];
    for (let ch = 0; ch < numChannels; ch++) {
      const b = new Float32Array(frameCount);
      sample.copyTo(b, { planeIndex: ch, format: 'f32-planar' });
      sampleData.push(b);
    }

    for (let i = 0; i < frameCount; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const raw = sampleData[ch][i];
        const filtered = filters[ch].s2.process(filters[ch].s1.process(raw));
        slidingBuffers[ch][writeIdx] = filtered;
      }
      
      writeIdx++;
      filled = Math.max(filled, writeIdx);
      
      if (writeIdx % stepSize === 0 && filled >= windowSize) {
        let blockPower = 0;
        for (let ch = 0; ch < numChannels; ch++) {
          let sumSq = 0;
          for (let s = 0; s < windowSize; s++) {
            sumSq += slidingBuffers[ch][s] * slidingBuffers[ch][s];
          }
          blockPower += (sumSq / windowSize); 
        }
        blockPowers.push(blockPower);
      }
      
      if (writeIdx >= windowSize) {
        for (let ch = 0; ch < numChannels; ch++) {
          slidingBuffers[ch].copyWithin(0, stepSize);
        }
        writeIdx -= stepSize;
      }
    }
    
    sample.close(); 
    framesProcessed += frameCount;
    if (totalFrames > 0) {
      self.postMessage({ type: 'progress', value: Math.min(0.95, framesProcessed / totalFrames) });
    }
  }

  if (blockPowers.length === 0) {
    throw new Error('解析可能な音声データが不足しています。');
  }

  const ABS_GATE = Math.pow(10, (-70 + 0.691) / 10);
  let absGated = blockPowers.filter(p => p >= ABS_GATE);
  
  let integrated = -70.0;
  if (absGated.length > 0) {
    const gamma_a = absGated.reduce((a, b) => a + b, 0) / absGated.length;
    const REL_GATE_THRESHOLD = gamma_a * Math.pow(10, -10 / 10);
    let relGated = absGated.filter(p => p >= REL_GATE_THRESHOLD);
    
    if (relGated.length > 0) {
      const gamma_i = relGated.reduce((a, b) => a + b, 0) / relGated.length;
      integrated = -0.691 + 10 * Math.log10(gamma_i);
    }
  }

  self.postMessage({ 
    type: 'analysis_done', 
    results: {
      integrated: parseFloat(integrated.toFixed(1))
    } 
  });
}

async function normalizeLoudness(file, settings) {
  const { currentLoudness, targetLoudness } = settings;
  const diff = targetLoudness - currentLoudness;
  const gainValue = Math.pow(10, diff / 20);

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });

  const conversion = await Conversion.init({
    input,
    output,
    video: { codec: 'avc' }, 
    audio: {
      codec: 'aac',
      sampleRate: 48000,
      numberOfChannels: 2,
      process: (sample) => {
        const frameCount = sample.numberOfFrames;
        const numChannels = sample.numberOfChannels;
        const sampleRate = sample.sampleRate;
        const timestamp = sample.timestamp;
        
        // Use exactly 'f32-planar' which is guaranteed to be in AUDIO_SAMPLE_FORMATS
        const targetFormat = 'f32-planar';
        
        // Allocate space for all planes in a single buffer
        // getBytesPerSample('f32-planar') = 4
        const newData = new Float32Array(frameCount * numChannels);
        
        for (let ch = 0; ch < numChannels; ch++) {
          const plane = new Float32Array(frameCount);
          sample.copyTo(plane, { planeIndex: ch, format: targetFormat });
          for (let i = 0; i < frameCount; i++) {
            plane[i] *= gainValue;
          }
          newData.set(plane, ch * frameCount);
        }
        
        try {
          const newSample = new AudioSample({
            format: targetFormat,
            sampleRate: sampleRate,
            numberOfChannels: numChannels,
            timestamp: timestamp,
            data: newData
          });
          sample.close();
          return newSample;
        } catch (e) {
          console.error('Failed to create AudioSample:', e, {
            format: targetFormat,
            sampleRate,
            numChannels,
            timestamp,
            dataLength: newData.length
          });
          throw e;
        }
      }
    }
  });

  conversion.onProgress = (val) => {
    self.postMessage({ type: 'progress', label: '音量を調整中...', value: val });
  };

  await conversion.execute();
  self.postMessage({ type: 'done', buffer: target.buffer }, [target.buffer]);
}
