/**
 * Voice of the Shadow — 174Hz low-frequency tone.
 * Played when the 8th Gate (Shadow) scroll is unrolled.
 */
export function playVoiceOfShadow174Hz(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 174;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.5);
    setTimeout(() => ctx.close(), 3000);
  } catch {
    /* silent fail */
  }
}
