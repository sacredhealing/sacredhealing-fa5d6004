/**
 * Sovereign Future — 963Hz with layered harmonic strings.
 * Played when the 3rd Scroll (The Sovereign Future) is unrolled.
 */
export function playSovereignFuture963Hz(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const duration = 3;

    // 963Hz fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 963;

    // Harmonic layers for "cinematic strings" feel
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 963 * 2; // octave

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 963 * 1.5; // fifth

    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    gain2.gain.setValueAtTime(0.04, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    gain3.gain.setValueAtTime(0.03, ctx.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    gain1.connect(ctx.destination);
    gain2.connect(ctx.destination);
    gain3.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc3.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + duration);
    osc2.stop(ctx.currentTime + duration);
    osc3.stop(ctx.currentTime + duration);

    setTimeout(() => ctx.close(), (duration + 1) * 1000);
  } catch {
    /* silent fail */
  }
}
