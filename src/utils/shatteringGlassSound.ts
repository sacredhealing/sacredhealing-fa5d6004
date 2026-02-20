/**
 * Shattering Glass — 432Hz, ~5 seconds.
 * Played when user clicks "Break the Vow" (transmutation).
 */
export function playShatteringGlass432Hz(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Base 432Hz carrier with modulated noise for "shatter" texture
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const carrier = Math.sin(2 * Math.PI * 432 * t);
      const decay = Math.exp(-t * 1.2);
      const noise = (Math.random() * 2 - 1) * decay * 0.4;
      data[i] = (carrier * 0.2 + noise) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), (duration + 1) * 1000);
  } catch {
    /* silent fail */
  }
}
