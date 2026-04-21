/**
 * video-trimmer-worker.js
 * 
 * Web Worker for trimming and cropping videos using mediabunny.
 */

import {
  Input,
  Output,
  Conversion,
  ALL_FORMATS,
  BlobSource,
  Mp4OutputFormat,
  BufferTarget
} from 'mediabunny';

self.onmessage = async (event) => {
  const { type, file, settings } = event.data;

  if (type === 'start') {
    try {
      const { trimStart, trimEnd, cropX, cropY, cropWidth, cropHeight } = settings;

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

      if (cropWidth > 0 && cropHeight > 0) {
        videoOptions.crop = {
          left: Math.round(cropX),
          top: Math.round(cropY),
          width: Math.round(cropWidth),
          height: Math.round(cropHeight),
        };
      }

      const conversionOptions = {
        input,
        output,
        video: videoOptions,
        audio: {
          codec: 'aac',
          sampleRate: 48000,
          numberOfChannels: 2,
        }
      };

      if (trimStart !== undefined || trimEnd !== undefined) {
        conversionOptions.trim = {};
        if (trimStart !== undefined && trimStart > 0) conversionOptions.trim.start = trimStart;
        if (trimEnd !== undefined) conversionOptions.trim.end = trimEnd;
      }

      const conversion = await Conversion.init(conversionOptions);

      if (!conversion.isValid) {
        const reasons = conversion.discardedTracks.map(t => t.reason).join(', ');
        throw new Error(`Video trimming/cropping setup failed: ${reasons}`);
      }

      conversion.onProgress = (progress) => {
        self.postMessage({ type: 'progress', value: progress });
      };

      await conversion.execute();
      self.postMessage({ type: 'done', buffer: target.buffer }, [target.buffer]);

    } catch (err) {
      console.error('Trimmer error:', err);
      self.postMessage({ type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  }
};
