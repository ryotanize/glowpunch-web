/**
 * video-optimizer-worker.js
 * 
 * Web Worker for video conversion and inspection using mediabunny's API.
 */

import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  Mp4OutputFormat,
  BufferTarget,
} from 'mediabunny';

self.onmessage = async (event) => {
  const { type, file, settings } = event.data;

  try {
    if (type === 'start') {
      await runConversion(file, settings);
    } else if (type === 'inspect') {
      await runInspection(file);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', message });
  }
};

/**
 * Parses AVC codec string (e.g. avc1.640028) to Profile/Level
 */
function parseAvcCodec(codecStr) {
  if (!codecStr || !codecStr.startsWith('avc1.')) return null;
  const parts = codecStr.split('.');
  if (parts.length < 2) return null;
  const hex = parts[1];
  const profileIcc = parseInt(hex.substring(0, 2), 16);
  const levelIcc = parseInt(hex.substring(4, 6), 16);

  let profile = 'Unknown';
  if (profileIcc === 66) profile = 'Baseline';
  else if (profileIcc === 77) profile = 'Main';
  else if (profileIcc === 100) profile = 'High';

  const level = (levelIcc / 10).toFixed(1);
  return { profile, level };
}

/**
 * Checks if 'moov' atom is before 'mdat' (Fast Start)
 */
async function checkFastStart(file) {
  const blob = file.slice(0, 1024 * 1024); // Read first 1MB
  const buffer = await blob.arrayBuffer();
  const view = new DataView(buffer);
  let offset = 0;
  let moovPos = -1;
  let mdatPos = -1;

  while (offset < view.byteLength - 8) {
    const size = view.getUint32(offset);
    const type = String.fromCharCode(
      view.getUint8(offset + 4),
      view.getUint8(offset + 5),
      view.getUint8(offset + 6),
      view.getUint8(offset + 7)
    );
    
    if (type === 'moov') moovPos = offset;
    if (type === 'mdat') mdatPos = offset;
    
    if (moovPos !== -1 && mdatPos !== -1) break;
    
    if (size === 0) break;
    if (size === 1) {
      offset += 16; // Skip 64-bit size (rare for moov/ftyp)
    } else {
      offset += size;
    }
  }
  
  return moovPos !== -1 && (mdatPos === -1 || moovPos < mdatPos);
}

async function runInspection(file) {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });

  const videoTrack = await input.getPrimaryVideoTrack();
  const audioTrack = await input.getPrimaryAudioTrack();
  const duration = await input.computeDuration();
  const fileSize = file.size;
  const fastStart = await checkFastStart(file);

  const metadata = {
    duration,
    fileSize,
    fastStart,
    video: null,
    audio: null,
  };

  if (videoTrack) {
    const stats = await videoTrack.computePacketStats(300); // Sample 300 packets for bitrate/fps
    const codecStr = await videoTrack.getCodecParameterString();
    const avc = parseAvcCodec(codecStr);
    
    metadata.video = {
      width: videoTrack.codedWidth,
      height: videoTrack.codedHeight,
      displayWidth: videoTrack.displayWidth,
      displayHeight: videoTrack.displayHeight,
      fps: parseFloat(stats.averagePacketRate.toFixed(2)),
      bitrate: Math.round(stats.averageBitrate),
      codec: videoTrack.codec,
      profile: avc?.profile || 'Unknown',
      level: avc?.level || 'Unknown',
    };
  }

  if (audioTrack) {
    const stats = await audioTrack.computePacketStats();
    metadata.audio = {
      codec: audioTrack.codec,
      sampleRate: audioTrack.sampleRate,
      channels: audioTrack.numberOfChannels,
      bitrate: Math.round(stats.averageBitrate),
    };
  }

  self.postMessage({ type: 'inspected', metadata });
}

async function runConversion(file, settings) {
  const { width, height, frameRate, bitrate, audioBitrate } = settings;

  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });

  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });

  const videoOptions = {
    codec: 'avc',
  };

  if (width !== undefined && height !== undefined) {
    videoOptions.width = width;
    videoOptions.height = height;
    videoOptions.fit = 'contain';
  }

  if (frameRate !== undefined) {
    videoOptions.frameRate = frameRate;
  }

  if (bitrate !== undefined) {
    videoOptions.bitrate = bitrate;
  }

  // Audio: Standardizing to AAC 48kHz Stereo for major platforms
  const audioOptions = {
    codec: 'aac',
    sampleRate: 48000,
    numberOfChannels: 2,
    bitrate: audioBitrate || 192000,
  };

  const conversion = await Conversion.init({
    input,
    output,
    video: videoOptions,
    audio: audioOptions,
  });

  if (!conversion.isValid) {
    const reasons = conversion.discardedTracks.map(t => t.reason).join(', ');
    throw new Error(`変換に失敗しました: ${reasons}`);
  }

  conversion.onProgress = (progress) => {
    self.postMessage({ type: 'progress', value: progress });
  };

  await conversion.execute();
  self.postMessage({ type: 'done', buffer: target.buffer }, [target.buffer]);
}
