/**
 * WAV Encoder - Converts AudioBuffer to WAV Blob
 * Browser-native implementation, no external libraries needed
 */

export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitsPerSample = 16;

  // IMPORTANT: avoid allocating an extra interleaved Float32Array for long renders.
  // That extra copy is large enough to crash Chrome during export.
  const length = buffer.length;

  // Create WAV file
  const dataLength = length * numChannels * 2; // 16-bit = 2 bytes per sample
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true); // file size - 8
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk1 size (16 for PCM)
  view.setUint16(20, format, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // block align
  view.setUint16(34, bitsPerSample, true);
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write audio data
  floatTo16BitPCMFromBuffer(view, 44, buffer);
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}


function floatTo16BitPCMFromBuffer(view: DataView, offset: number, buffer: AudioBuffer): void {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
}

/**
 * Get the duration of a WAV blob in seconds
 */
export function getWavDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio'));
    };
  });
}
