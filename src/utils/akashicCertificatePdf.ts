/** Generates printable Certificate of Origin HTML and triggers save-as-PDF flow. */
export function generateAkashicCertificatePdf(
  userName: string,
  record: {
    title: string;
    origin: string;
    debt: string;
    remedy: string;
    incarnation: string;
    saturnDebt: string;
    eighthHouseGift: string;
    soulOccupation: string;
    unfinishedLesson: string;
    eighthHouseShadow: string;
    transmutationPath: string;
    akashicOrigin: string;
    siddhaMastery: string;
    shadowOfSaturn: string;
  },
  yearClimax: number
): void {
  const displayName = userName?.trim() || 'Soul';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>The ${displayName} Akashic Record</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 48px; font-family: Georgia, 'Times New Roman', serif; background: #0a0a0a; color: #e5e5e5; }
    .cert { max-width: 680px; margin: 0 auto; }
    .seal { width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%; background: linear-gradient(135deg, #D4AF37 0%, #b8860b 50%, #D4AF37 100%); 
      border: 3px solid #c9a227; box-shadow: 0 0 30px rgba(212,175,55,0.5); display: flex; align-items: center; justify-content: center; }
    .seal-inner { font-size: 32px; color: #0a0a0a; }
    .title { font-size: 22px; font-weight: bold; text-align: center; color: #D4AF37; margin-bottom: 8px; letter-spacing: 0.1em; }
    .subtitle { font-size: 12px; text-align: center; color: #D4AF37; opacity: 0.9; margin-bottom: 32px; letter-spacing: 0.2em; text-transform: uppercase; }
    section { margin-bottom: 24px; }
    h3 { font-size: 11px; color: #D4AF37; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px; }
    p { margin: 0 0 12px; line-height: 1.6; font-size: 13px; }
    .border-gold { border-left: 4px solid #D4AF37; padding-left: 16px; background: rgba(212,175,55,0.08); padding: 12px 16px; }
    @media print {
      body { background: #0a0a0a; }
      .cert { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="seal"><span class="seal-inner">ॐ</span></div>
    <h1 class="title">The ${displayName} Akashic Record</h1>
    <p class="subtitle">A Siddha Transmission</p>

    <section>
      <h3>Summary</h3>
      <p><strong>${record.title}</strong></p>
      <p><em>${record.origin}</em></p>
      <p>${record.incarnation}</p>
    </section>

    <section>
      <h3>The Akashic Origin</h3>
      <p>${record.akashicOrigin}</p>
    </section>

    <section>
      <h3>The Siddha Mastery</h3>
      <p>${record.siddhaMastery}</p>
    </section>

    <section>
      <h3>The Shadow of Saturn</h3>
      <p>${record.shadowOfSaturn}</p>
    </section>

    <section>
      <h3>The Soul's Occupation</h3>
      <p>${record.soulOccupation}</p>
    </section>

    <section>
      <h3>The Unfinished Lesson</h3>
      <p>${record.unfinishedLesson}</p>
    </section>

    <section>
      <h3>The 8th House Shadow</h3>
      <p>${record.eighthHouseShadow}</p>
    </section>

    <section class="border-gold">
      <h3>The Transmutation Path</h3>
      <p>${record.transmutationPath}</p>
    </section>

    <section>
      <h3>The Saturnian Debt</h3>
      <p>${record.saturnDebt}</p>
    </section>

    <section>
      <h3>The Hidden Gift</h3>
      <p>${record.eighthHouseGift}</p>
    </section>

    <section>
      <h3>Siddha Remedy</h3>
      <p>Practice the <strong>${record.remedy}</strong> daily at 432Hz to clear this frequency.</p>
    </section>

    <section>
      <h3>Year of Karmic Climax</h3>
      <p>The year in this life when the past-life debt is fully paid: <strong>${yearClimax}</strong>.</p>
    </section>

    <p style="margin-top: 48px; font-size: 10px; color: #666; text-align: center;">
      Siddha Quantum Nexus — Akashic Decoder • A Siddha Transmission
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
