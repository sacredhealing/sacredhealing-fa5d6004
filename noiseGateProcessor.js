/**
 * Professional Noise Gate - AudioWorklet Processor
 * Envelope-following gate with attack, release, threshold, and range.
 * Reduces background hiss and noise during quiet sections.
 */
class NoiseGateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -40, minValue: -80, maxValue: -10, automationRate: 'a-rate' },
      { name: 'attack', defaultValue: 0.005, minValue: 0.001, maxValue: 0.1, automationRate: 'k-rate' },
      { name: 'release', defaultValue: 0.15, minValue: 0.02, maxValue: 1, automationRate: 'k-rate' },
      { name: 'range', defaultValue: -60, minValue: -96, maxValue: -6, automationRate: 'k-rate' },
      { name: 'enabled', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' }
    ];
  }

  constructor(options) {
    super(options);
    this._gain = 1;
    this._rmsWindow = new Float32Array(512);  // ~10ms at 48kHz for smooth envelope
    this._rmsIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input.length || !output.length) return true;

    const threshold = parameters.threshold.length > 1 ? parameters.threshold[0] : parameters.threshold[0];
    const attack = parameters.attack[0];
    const release = parameters.release[0];
    const range = parameters.range[0];
    const enabled = parameters.enabled[0] > 0.5;

    const thresholdLinear = Math.pow(10, threshold / 20);
    const rangeLinear = Math.pow(10, range / 20);
    const attackCoeff = Math.exp(-1 / (sampleRate * attack));
    const releaseCoeff = Math.exp(-1 / (sampleRate * release));

    const blockSize = input[0]?.length ?? 128;
    for (let i = 0; i < blockSize; i++) {
      if (!enabled) {
        for (let ch = 0; ch < Math.min(input.length, output.length); ch++) {
          if (input[ch] && output[ch]) output[ch][i] = input[ch][i];
        }
        continue;
      }

      // RMS from all channels (stereo: use max to avoid gating when one channel has signal)
      let sumSq = 0;
      for (let ch = 0; ch < input.length; ch++) {
        if (input[ch]) sumSq += input[ch][i] * input[ch][i];
      }
      const rms = Math.sqrt(sumSq / Math.max(1, input.length));

      this._rmsWindow[this._rmsIndex] = rms * rms;
      this._rmsIndex = (this._rmsIndex + 1) % this._rmsWindow.length;
      let sum = 0;
      for (let k = 0; k < this._rmsWindow.length; k++) sum += this._rmsWindow[k];
      const smoothRms = Math.sqrt(sum / this._rmsWindow.length);

      // Envelope follower
      if (smoothRms > thresholdLinear) {
        this._gain = this._gain * attackCoeff + 1 * (1 - attackCoeff);
      } else {
        this._gain = this._gain * releaseCoeff + rangeLinear * (1 - releaseCoeff);
      }
      this._gain = Math.max(rangeLinear, Math.min(1, this._gain));

      for (let ch = 0; ch < Math.min(input.length, output.length); ch++) {
        if (input[ch] && output[ch]) output[ch][i] = input[ch][i] * this._gain;
      }
    }
    return true;
  }
}

registerProcessor('noise-gate-processor', NoiseGateProcessor);
