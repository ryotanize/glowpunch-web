/**
 * audio-extractor-worker.js
 * 
 * Web Worker for extracting audio from video files using mediabunny.
 */

import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  Mp3OutputFormat,
  WavOutputFormat,
  AdtsOutputFormat,
  BufferTarget
} from 'mediabunny';

self.onmessage = async (event) => {
  const { type, file, format, settings } = event.data;

  if (type === 'extract') {
    try {
      const input = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(file),
      });

      const target = new BufferTarget();
      let outputFormat;
      let audioOptions = {
        sampleRate: 48000,
        numberOfChannels: 2,
      };

      if (format === 'mp3') {
        outputFormat = new Mp3OutputFormat();
        audioOptions.codec = 'mp3';
        audioOptions.bitrate = settings?.bitrate || 192000;
      } else if (format === 'wav') {
        outputFormat = new WavOutputFormat();
        audioOptions.codec = 'pcm_s16le'; // Most compatible PCM format
      } else if (format === 'aac') {
        outputFormat = new AdtsOutputFormat();
        audioOptions.codec = 'aac';
        audioOptions.bitrate = settings?.bitrate || 192000;
      } else {
        throw new Error('Unsupported format requested');
      }

      const output = new Output({
        format: outputFormat,
        target,
      });

      const conversion = await Conversion.init({
        input,
        output,
        audio: audioOptions, // Note: video options are omitted to drop the video track
      });

      if (!conversion.isValid) {
        const reasons = conversion.discardedTracks.map(t => t.reason).join(', ');
        throw new Error(`音声の抽出に失敗しました: ${reasons}`);
      }

      conversion.onProgress = (progress) => {
        self.postMessage({ type: 'progress', value: progress });
      };

      await conversion.execute();
      self.postMessage({ type: 'done', buffer: target.buffer, format }, [target.buffer]);

    } catch (err) {
      console.error('Extraction error:', err);
      self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }
};
