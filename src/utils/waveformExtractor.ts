/**
 * Waveform Extraction Utility
 * Extracts audio peak data for DAW-style waveform visualization
 * High-resolution 500-point extraction for professional quality
 */

// Default resolution for waveform extraction
export const WAVEFORM_RESOLUTION = 500;

export interface WaveformData {
  peaks: number[];        // Normalized peak values (0-1)
  duration: number;       // Audio duration in seconds
  sampleRate: number;     // Original sample rate
  channelCount: number;   // Number of audio channels
}

/**
 * Extract waveform peaks from an audio file
 * @param file - Audio file (File object or URL string)
 * @param targetPeaks - Target number of peaks (default 500 for high resolution)
 * @returns Promise<WaveformData>
 */
export async function extractWaveform(
  file: File | string,
  targetPeaks: number = WAVEFORM_RESOLUTION
): Promise<WaveformData> {
  // Create offline audio context for analysis
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    let arrayBuffer: ArrayBuffer;
    
    if (typeof file === 'string') {
      // Fetch from URL
      const response = await fetch(file);
      if (!response.ok) throw new Error('Failed to fetch audio');
      arrayBuffer = await response.arrayBuffer();
    } else {
      // Read from File object
      arrayBuffer = await file.arrayBuffer();
    }
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0); // Use first channel
    const totalSamples = channelData.length;
    
    // Calculate samples per peak to achieve target resolution
    const samplesPerPeak = Math.floor(totalSamples / targetPeaks);
    const numPeaks = Math.min(targetPeaks, Math.ceil(totalSamples / Math.max(1, samplesPerPeak)));
    const peaks: number[] = new Array(numPeaks);
    
    // Extract peaks by finding max absolute value in each chunk
    for (let i = 0; i < numPeaks; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, totalSamples);
      
      let maxPeak = 0;
      for (let j = start; j < end; j++) {
        const absValue = Math.abs(channelData[j]);
        if (absValue > maxPeak) {
          maxPeak = absValue;
        }
      }
      
      peaks[i] = maxPeak;
    }
    
    // Normalize peaks to 0-1 range
    const maxPeakValue = Math.max(...peaks, 0.001);
    const normalizedPeaks = peaks.map(p => p / maxPeakValue);
    
    audioContext.close();
    
    return {
      peaks: normalizedPeaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channelCount: audioBuffer.numberOfChannels
    };
  } catch (error) {
    console.error('Waveform extraction failed:', error);
    audioContext.close();
    
    // Return placeholder waveform on error
    return {
      peaks: generatePlaceholderWaveform(WAVEFORM_RESOLUTION),
      duration: 0,
      sampleRate: 44100,
      channelCount: 2
    };
  }
}

/**
 * Extract stereo waveform (left and right channels separately)
 */
export async function extractStereoWaveform(
  file: File | string,
  samplesPerPeak: number = 256
): Promise<{ left: number[]; right: number[]; duration: number }> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    let arrayBuffer: ArrayBuffer;
    
    if (typeof file === 'string') {
      const response = await fetch(file);
      if (!response.ok) throw new Error('Failed to fetch audio');
      arrayBuffer = await response.arrayBuffer();
    } else {
      arrayBuffer = await file.arrayBuffer();
    }
    
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.numberOfChannels > 1 
      ? audioBuffer.getChannelData(1) 
      : leftChannel;
    
    const totalSamples = leftChannel.length;
    const numPeaks = Math.ceil(totalSamples / samplesPerPeak);
    
    const leftPeaks: number[] = new Array(numPeaks);
    const rightPeaks: number[] = new Array(numPeaks);
    
    for (let i = 0; i < numPeaks; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, totalSamples);
      
      let maxLeft = 0;
      let maxRight = 0;
      
      for (let j = start; j < end; j++) {
        maxLeft = Math.max(maxLeft, Math.abs(leftChannel[j]));
        maxRight = Math.max(maxRight, Math.abs(rightChannel[j]));
      }
      
      leftPeaks[i] = maxLeft;
      rightPeaks[i] = maxRight;
    }
    
    // Normalize
    const maxValue = Math.max(...leftPeaks, ...rightPeaks, 0.001);
    
    audioContext.close();
    
    return {
      left: leftPeaks.map(p => p / maxValue),
      right: rightPeaks.map(p => p / maxValue),
      duration: audioBuffer.duration
    };
  } catch (error) {
    console.error('Stereo waveform extraction failed:', error);
    audioContext.close();
    
    const placeholder = generatePlaceholderWaveform(100);
    return { left: placeholder, right: placeholder, duration: 0 };
  }
}

/**
 * Generate a placeholder waveform for fallback
 */
export function generatePlaceholderWaveform(numPeaks: number = WAVEFORM_RESOLUTION): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < numPeaks; i++) {
    // Create a realistic-looking random waveform
    const base = 0.3 + Math.sin(i * 0.1) * 0.2;
    const noise = Math.random() * 0.4;
    peaks.push(Math.min(1, base + noise));
  }
  return peaks;
}

/**
 * Resample waveform data to fit a specific width
 */
export function resampleWaveform(peaks: number[], targetLength: number): number[] {
  if (peaks.length === 0) return [];
  if (peaks.length === targetLength) return peaks;
  
  const resampled: number[] = new Array(targetLength);
  const ratio = peaks.length / targetLength;
  
  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.ceil((i + 1) * ratio), peaks.length);
    
    let maxPeak = 0;
    for (let j = start; j < end; j++) {
      maxPeak = Math.max(maxPeak, peaks[j]);
    }
    resampled[i] = maxPeak;
  }
  
  return resampled;
}

/**
 * Spectral Slicing: Extract a visible portion of the waveform based on trim percentages
 * Used when clips are cut with the Quantum Scissor to show only the visible audio
 * 
 * @param waveformData - Full waveform peak data array
 * @param trimStartPercent - Percentage of audio trimmed from the start (0-1)
 * @param trimEndPercent - Percentage of audio trimmed from the end (0-1)
 * @param targetLength - Target number of peaks for the sliced portion
 * @returns Sliced and resampled waveform data
 */
export function sliceWaveform(
  waveformData: number[],
  trimStartPercent: number,
  trimEndPercent: number,
  targetLength: number = WAVEFORM_RESOLUTION
): number[] {
  if (!waveformData.length) return [];
  
  // Calculate slice indices
  const totalPeaks = waveformData.length;
  const startIndex = Math.floor(trimStartPercent * totalPeaks);
  const endIndex = Math.ceil((1 - trimEndPercent) * totalPeaks);
  
  // Extract the visible slice
  const slicedPeaks = waveformData.slice(startIndex, endIndex);
  
  // Resample to target length for consistent display
  return resampleWaveform(slicedPeaks, targetLength);
}
