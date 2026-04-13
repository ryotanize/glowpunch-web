/**
 * video-optimizer-worker.js
 * 
 * Web Worker for video conversion using mediabunny's Conversion API.
 * Handles: resolution change, FPS conversion, bitrate control, AAC audio output.
 * 
 * Message Protocol:
 *   IN:  { type: 'start', file: File, settings: { width?, height?, frameRate?, bitrate } }
 *   OUT: { type: 'progress', value: number (0–1) }
 *   OUT: { type: 'done', buffer: ArrayBuffer }
 *   OUT: { type: 'error', message: string }
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

  if (type !== 'start') return;

  try {
    await runConversion(file, settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'error', message });
  }
};

async function runConversion(file, settings) {
  const { width, height, frameRate, bitrate } = settings;

  // ---------------------------------------------------------------------------
  // 1. Set up Input
  // ---------------------------------------------------------------------------
  const input = new Input({
    formats: ALL_FORMATS,
    source: new BlobSource(file),
  });

  // ---------------------------------------------------------------------------
  // 2. Set up Output (MP4 with fastStart for streaming compatibility)
  // ---------------------------------------------------------------------------
  const target = new BufferTarget();
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  });

  // ---------------------------------------------------------------------------
  // 3. Video conversion options
  // ---------------------------------------------------------------------------
  const videoOptions = {};

  // Resolution
  if (width !== undefined && height !== undefined) {
    videoOptions.width = width;
    videoOptions.height = height;
    // Use 'contain' to preserve aspect ratio (letterbox if needed)
    videoOptions.fit = 'contain';
  }

  // Frame rate
  if (frameRate !== undefined) {
    videoOptions.frameRate = frameRate;
  }

  // Bitrate (bps)
  if (bitrate !== undefined) {
    videoOptions.bitrate = bitrate;
  }

  // Always force H.264 (avc) output for maximum compatibility
  videoOptions.codec = 'avc';

  // ---------------------------------------------------------------------------
  // 4. Audio conversion options (always convert to AAC / 48kHz / stereo)
  // ---------------------------------------------------------------------------
  const audioOptions = {
    codec: 'aac',
    sampleRate: 48000,
    numberOfChannels: 2,
  };

  // ---------------------------------------------------------------------------
  // 5. Initialize Conversion
  // ---------------------------------------------------------------------------
  const conversion = await Conversion.init({
    input,
    output,
    video: videoOptions,
    audio: audioOptions,
  });

  // Check if conversion is possible
  if (!conversion.isValid) {
    const reasons = conversion.discardedTracks
      .map((t) => t.reason)
      .join(', ');
    throw new Error(
      `このファイルはブラウザでの変換に対応していません。(理由: ${reasons || '不明'})\nChrome/Edgeの最新版をお試しください。`
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Run Conversion with Progress Reporting
  // ---------------------------------------------------------------------------
  conversion.onProgress = (progress) => {
    self.postMessage({ type: 'progress', value: progress });
  };

  await conversion.execute();

  // ---------------------------------------------------------------------------
  // 7. Return result buffer to main thread
  // ---------------------------------------------------------------------------
  const buffer = target.buffer;

  if (!buffer || buffer.byteLength === 0) {
    throw new Error('変換結果が空です。ファイルが対応フォーマットか確認してください。');
  }

  // Transfer the ArrayBuffer to avoid copying
  self.postMessage({ type: 'done', buffer }, [buffer]);
}
