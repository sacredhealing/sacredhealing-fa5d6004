export interface OfflineNoiseGateSettings {
  enabled?: boolean;
  threshold?: number;
  range?: number;
  attack?: number;
  release?: number;
}

const DEFAULT_ATTACK_SECONDS = 0.005;
const DEFAULT_RELEASE_SECONDS = 0.12;
const RMS_WINDOW_SECONDS = 512 / 48000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeTimeSeconds(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  return value > 1 ? value / 1000 : value;
}

export function applyOfflineNoiseGateToBuffer(
  ctx: BaseAudioContext,
  sourceBuffer: AudioBuffer,
  settings?: OfflineNoiseGateSettings
): AudioBuffer {
  if (!settings?.enabled || sourceBuffer.length === 0) {
    return sourceBuffer;
  }

  const threshold = clamp(settings.threshold ?? -40, -80, -10);
  const range = clamp(settings.range ?? -72, -96, -6);
  const attack = Math.max(0.001, normalizeTimeSeconds(settings.attack, DEFAULT_ATTACK_SECONDS));
  const release = Math.max(0.02, normalizeTimeSeconds(settings.release, DEFAULT_RELEASE_SECONDS));

  const thresholdLinear = Math.pow(10, threshold / 20);
  const rangeLinear = Math.pow(10, range / 20);
  const attackCoeff = Math.exp(-1 / (sourceBuffer.sampleRate * attack));
  const releaseCoeff = Math.exp(-1 / (sourceBuffer.sampleRate * release));

  const outputBuffer = ctx.createBuffer(
    sourceBuffer.numberOfChannels,
    sourceBuffer.length,
    sourceBuffer.sampleRate
  );

  const inputChannels = Array.from({ length: sourceBuffer.numberOfChannels }, (_, channel) =>
    sourceBuffer.getChannelData(channel)
  );
  const outputChannels = Array.from({ length: outputBuffer.numberOfChannels }, (_, channel) =>
    outputBuffer.getChannelData(channel)
  );

  const rmsWindowSize = Math.max(1, Math.round(sourceBuffer.sampleRate * RMS_WINDOW_SECONDS));
  const rmsWindow = new Float32Array(rmsWindowSize);

  let rmsIndex = 0;
  let rmsSquaredSum = 0;
  let gain = 1;

  for (let i = 0; i < sourceBuffer.length; i++) {
    let sumSq = 0;
    for (let channel = 0; channel < inputChannels.length; channel++) {
      const sample = inputChannels[channel][i];
      sumSq += sample * sample;
    }

    const rms = Math.sqrt(sumSq / Math.max(1, inputChannels.length));
    const rmsSquared = rms * rms;

    rmsSquaredSum -= rmsWindow[rmsIndex];
    rmsWindow[rmsIndex] = rmsSquared;
    rmsSquaredSum += rmsSquared;
    rmsIndex = (rmsIndex + 1) % rmsWindowSize;

    const smoothRms = Math.sqrt(rmsSquaredSum / rmsWindowSize);

    if (smoothRms > thresholdLinear) {
      gain = gain * attackCoeff + (1 - attackCoeff);
    } else {
      gain = gain * releaseCoeff + rangeLinear * (1 - releaseCoeff);
    }

    gain = Math.max(rangeLinear, Math.min(1, gain));

    for (let channel = 0; channel < outputChannels.length; channel++) {
      outputChannels[channel][i] = inputChannels[channel][i] * gain;
    }
  }

  return outputBuffer;
}
