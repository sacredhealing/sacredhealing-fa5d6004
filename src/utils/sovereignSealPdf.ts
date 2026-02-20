/**
 * Sovereign Seal PDF — Akashic Soul Manuscript.
 * Combines all 3 Scrolls (Lineage, Shadow, Future) + Bhrigu Remedy as Mandatory Frequency.
 */

interface SiddhaGuide {
  lineage: string;
  guideName: string;
  secretVow: string;
}

interface ShadowVowInsight {
  shadowVow: string;
  shadowAnalysis: string;
  explanation: string;
}

interface PathToPower {
  prophecy: string;
  mantraName: string;
  bhriguMantra: string;
}

interface KarmicWindow {
  year: number;
  theme: string;
  focus: string;
}

export interface SovereignManuscriptData {
  userName: string;
  siddhaGuide: SiddhaGuide;
  shadowVowInsight: ShadowVowInsight;
  pathToPower: PathToPower;
  bhriguRemedy: string; // e.g. "Sun Mantra"
  sovereignTimeline?: {
    powerYear: number;
    powerYearMeaning: string;
    timeline: [KarmicWindow, KarmicWindow, KarmicWindow];
  };
}

export function generateSovereignSealPdf(data: SovereignManuscriptData): void {
  const { userName, siddhaGuide, shadowVowInsight, pathToPower, bhriguRemedy, sovereignTimeline } = data;
  const displayName = userName?.trim() || 'Soul';

  const timelineHtml = sovereignTimeline
    ? `
    <section>
      <h3>Your Power Year</h3>
      <p><strong>Age ${sovereignTimeline.powerYear}:</strong> ${sovereignTimeline.powerYearMeaning}</p>
    </section>
    <section>
      <h3>Sovereign Timeline — Next 3 Karmic Windows</h3>
      ${sovereignTimeline.timeline
        .map(
          (w) =>
            `<p><strong>${w.year}:</strong> ${w.theme} — ${w.focus}</p>`
        )
        .join('')}
    </section>
  `
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Akashic Soul Manuscript — ${displayName}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 48px; font-family: Georgia, 'Times New Roman', serif; background: #0a0a0a; color: #e5e5e5; }
    .manuscript { max-width: 680px; margin: 0 auto; }
    .seal { width: 90px; height: 90px; margin: 0 auto 20px; border-radius: 50%;
      background: linear-gradient(135deg, #D4AF37 0%, #b8860b 50%, #D4AF37 100%);
      border: 4px solid #c9a227; box-shadow: 0 0 40px rgba(212,175,55,0.6);
      display: flex; align-items: center; justify-content: center; }
    .seal-inner { font-size: 40px; color: #0a0a0a; }
    .title { font-size: 24px; font-weight: bold; text-align: center; color: #D4AF37; margin-bottom: 8px; letter-spacing: 0.1em; }
    .subtitle { font-size: 11px; text-align: center; color: #D4AF37; opacity: 0.9; margin-bottom: 36px; letter-spacing: 0.25em; text-transform: uppercase; }
    section { margin-bottom: 28px; }
    h3 { font-size: 10px; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 10px; border-bottom: 1px solid rgba(212,175,55,0.3); padding-bottom: 6px; }
    p { margin: 0 0 12px; line-height: 1.65; font-size: 13px; }
    .scroll-divider { margin: 32px 0; border-top: 2px solid #D4AF37; opacity: 0.4; }
    .mandatory { background: rgba(212,175,55,0.15); border-left: 4px solid #D4AF37; padding: 16px 20px; margin: 24px 0; }
    @media print { body { background: #0a0a0a; } .manuscript { padding: 24px; } }
  </style>
</head>
<body>
  <div class="manuscript">
    <div class="seal"><span class="seal-inner">ॐ</span></div>
    <h1 class="title">Akashic Soul Manuscript</h1>
    <p class="subtitle">The Three Scrolls of the Siddhas — ${displayName}</p>

    <section>
      <h3>Scroll 1 — The Lineage Identifier</h3>
      <p><strong>Your Siddha Guide:</strong> ${siddhaGuide.guideName}</p>
      <p><em>${siddhaGuide.lineage}</em></p>
      <p>The Secret Vow this soul took: &ldquo;${siddhaGuide.secretVow}&rdquo;</p>
    </section>

    <div class="scroll-divider"></div>

    <section>
      <h3>Scroll 2 — The 8th Gate (Shadow)</h3>
      <p>${shadowVowInsight.shadowAnalysis}</p>
      <p><strong>The Shadow Vow:</strong> Vow of ${shadowVowInsight.shadowVow}</p>
      <p>${shadowVowInsight.explanation}</p>
    </section>

    <div class="scroll-divider"></div>

    <section>
      <h3>Scroll 3 — The Sovereign Future</h3>
      <p>${pathToPower.prophecy}</p>
      <p><strong>${pathToPower.mantraName}:</strong> ${pathToPower.bhriguMantra}</p>
      ${timelineHtml}
    </section>

    <div class="mandatory">
      <h3>Mandatory Frequency for Future Success</h3>
      <p>Your <strong>Bhrigu Remedy</strong> is the <strong>${bhriguRemedy}</strong>. Practice this mantra 108 times daily at 432Hz. This frequency is the key to unlocking the Sovereign Timeline and transmuting karmic blocks.</p>
    </div>

    <p style="margin-top: 48px; font-size: 10px; color: #666; text-align: center;">
      Sacred Healing — Akashic Soul Manuscript • Sovereign Seal • A Siddha Transmission
    </p>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) {
    w.onload = () => URL.revokeObjectURL(url);
  } else {
    URL.revokeObjectURL(url);
  }
}
