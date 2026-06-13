import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipTier } from '@/features/membership';
import {
  NADI_LEAF_LESSONS,
  THUMB_SCAN_READINGS,
  MODULE_INFO,
  type NadiLeafLesson,
  type NadiLeafTier,
  type ThumbScanReading,
} from '@/data/nadiLeafData';

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const GOLD = '#D4AF37';
const BG = '#050505';
const CYAN = '#22D3EE';
const GLASS = 'rgba(255,255,255,0.02)';
const BORDER = 'rgba(255,255,255,0.05)';

const TIER_ORDER: Record<NadiLeafTier, number> = { free: 0, prana: 1, siddha: 2, akasha: 3 };
const TIER_COLOR: Record<NadiLeafTier, string> = {
  free: 'rgba(255,255,255,0.55)',
  prana: CYAN,
  siddha: GOLD,
  akasha: '#F59E0B',
};
const TIER_LABEL: Record<NadiLeafTier, string> = {
  free: 'FREE',
  prana: 'PRANA-FLOW',
  siddha: 'SIDDHA-QUANTUM',
  akasha: 'AKASHA INFINITY',
};

// ── TIER RESOLVER ────────────────────────────────────────────────────────────
function getUserTierRank(tier: string | null | undefined, isAdmin: boolean): number {
  if (isAdmin) return 3;
  if (!tier) return 0;
  const t = tier.toLowerCase().replace(/[-_\s]/g, '');
  if (t.includes('akasha') || t.includes('infinity')) return 3;
  if (t.includes('siddha') || t.includes('quantum')) return 2;
  if (t.includes('prana') || t.includes('flow')) return 1;
  return 0;
}

// ── THUMB SCAN DETECTOR (vision-based) ──────────────────────────────────────
type ScanPhase = 'idle' | 'instruction' | 'scanning' | 'analyzing' | 'result';

function detectThumbPattern(imageData: ImageData): string {
  // Ridge density heuristic using pixel variance across the thumb center
  const { data, width, height } = imageData;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const radius = Math.min(cx, cy) * 0.4;

  let ringVariances: number[] = [];
  for (let r = 1; r <= 5; r++) {
    const sampleRadius = radius * (r / 5);
    let vals: number[] = [];
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const x = Math.floor(cx + sampleRadius * Math.cos(angle));
      const y = Math.floor(cy + sampleRadius * Math.sin(angle));
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        vals.push(data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
      }
    }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
    ringVariances.push(variance);
  }

  // Whorl: high center variance + decreasing outward
  // Loop: moderate uniform variance
  // Arch: low center variance + high edge variance
  const centerVar = ringVariances[0] || 0;
  const edgeVar = ringVariances[4] || 0;
  const midVar = ringVariances[2] || 0;
  const total = centerVar + edgeVar + midVar;

  if (total < 100) {
    // Very uniform — use timestamp hash for variety
    const patterns = ['arch', 'loop', 'whorl', 'tented_arch', 'double_loop'];
    return patterns[Date.now() % 5];
  }

  const ratio = centerVar / (edgeVar + 1);
  if (ratio > 1.5) return 'whorl';
  if (ratio < 0.5) return 'arch';
  if (midVar > centerVar && midVar > edgeVar) return 'double_loop';
  if (edgeVar > centerVar * 1.2) return 'tented_arch';
  return 'loop';
}

// ── THUMB BIOMETRIC SCANNER COMPONENT ───────────────────────────────────────
function ThumbBiometricScanner({
  gender,
  onResult,
  onClose,
}: {
  gender: 'male' | 'female';
  onResult: (reading: ThumbScanReading, pattern: string) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>('instruction');
  const [progress, setProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [camErr, setCamErr] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const thumbSide = gender === 'male' ? 'RIGHT' : 'LEFT';

  const startCamera = useCallback(async () => {
    setPhase('scanning');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCamErr('Camera not available. Proceeding with energetic scan.');
      runEnergyScan();
    }
  }, []);

  const runEnergyScan = useCallback(() => {
    const steps = [
      'Initializing Angushtha Vigyan Protocol...',
      'Detecting ridge topology...',
      'Mapping karmic spirals...',
      'Cross-referencing Agastiya Grantham...',
      'Calculating Nadi channel dominance...',
      'Identifying planetary ruler...',
      'Generating Siddha prescription...',
      'Transmission complete ◈',
    ];
    let i = 0;
    const interval = setInterval(() => {
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      setScanStep(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(interval);
        setPhase('analyzing');
        setTimeout(() => {
          const patterns = ['arch', 'loop', 'whorl', 'tented_arch', 'double_loop'];
          const pattern = patterns[Math.floor(Math.random() * patterns.length)];
          const reading = THUMB_SCAN_READINGS[pattern];
          onResult(reading, pattern);
        }, 1500);
      }
    }, 500);
  }, [onResult]);

  const captureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) { runEnergyScan(); return; }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) { runEnergyScan(); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop stream
    streamRef.current?.getTracks().forEach(t => t.stop());

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setPhase('analyzing');

    const steps = [
      'Ridge topology detected...',
      'Spiral center located...',
      'Cross-referencing Nadi Grantham...',
      'Planetary ruler identified...',
      'Karmic prescription ready ◈',
    ];
    let i = 0;
    const interval = setInterval(() => {
      setProgress(Math.round(((i + 1) / steps.length) * 100));
      setScanStep(steps[i]);
      i++;
      if (i >= steps.length) {
        clearInterval(interval);
        const pattern = detectThumbPattern(imageData);
        const reading = THUMB_SCAN_READINGS[pattern] || THUMB_SCAN_READINGS['loop'];
        onResult(reading, pattern);
      }
    }, 600);
  }, [runEnergyScan, onResult]);

  const card: React.CSSProperties = {
    background: GLASS,
    backdropFilter: 'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border: `1px solid ${BORDER}`,
    borderRadius: 40,
    padding: 32,
    maxWidth: 460,
    width: '100%',
    margin: '0 auto',
    position: 'relative',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={card}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 22, cursor: 'pointer' }}>✕</button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: GOLD, opacity: 0.7, marginBottom: 8 }}>ANGUSHTHA VIGYAN · SIDDHA BIOMETRIC</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>Hasta Nadi Scan</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            Scan your <span style={{ color: GOLD, fontWeight: 700 }}>{thumbSide} THUMB</span> · Agastiya Karma Classification
          </div>
        </div>

        {phase === 'instruction' && (
          <div>
            {/* Thumb illustration */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <svg width="120" height="140" viewBox="0 0 120 140">
                {/* Thumb outline */}
                <ellipse cx="60" cy="75" rx="28" ry="55" fill="rgba(212,175,55,0.06)" stroke={GOLD} strokeWidth="1.5"/>
                {/* Fingerprint lines - whorl pattern */}
                {[12,18,24,30,36,42].map((r, i) => (
                  <ellipse key={i} cx="60" cy="68" rx={r * 0.8} ry={r} fill="none" stroke={`rgba(212,175,55,${0.08 + i * 0.05})`} strokeWidth="1"/>
                ))}
                {/* Center dot */}
                <circle cx="60" cy="68" r="2" fill={GOLD} opacity="0.6"/>
                {/* Scan line */}
                <line x1="32" y1="68" x2="88" y2="68" stroke={CYAN} strokeWidth="1" strokeDasharray="4 2" opacity="0.5">
                  <animateTransform attributeName="transform" type="translate" values="0 -20;0 20;0 -20" dur="2s" repeatCount="indefinite"/>
                </line>
                {/* Corner brackets */}
                <path d="M32 20 L32 30 M32 20 L42 20" stroke={GOLD} strokeWidth="1.5" fill="none"/>
                <path d="M88 20 L88 30 M88 20 L78 20" stroke={GOLD} strokeWidth="1.5" fill="none"/>
                <path d="M32 130 L32 120 M32 130 L42 130" stroke={GOLD} strokeWidth="1.5" fill="none"/>
                <path d="M88 130 L88 120 M88 130 L78 130" stroke={GOLD} strokeWidth="1.5" fill="none"/>
                <text x="60" y="115" textAnchor="middle" fill={GOLD} fontSize="7" fontWeight="800" letterSpacing="2" opacity="0.6">ANGUSHTHA</text>
              </svg>
            </div>

            <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', color: GOLD, marginBottom: 12 }}>SCAN PROTOCOL</div>
              {[
                `Press your ${thumbSide.toLowerCase()} thumb firmly onto a white paper`,
                'Photograph the ink print clearly in good light',
                'OR: use your phone camera to scan your thumb directly',
                'The scanner will classify your Nadi karmic signature',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: GOLD, fontWeight: 800, fontSize: 11, minWidth: 20, opacity: 0.7 }}>{i + 1}.</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={startCamera} style={{ background: `linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.06))`, border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 20, padding: '14px 16px', cursor: 'pointer', color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: '0.25em' }}>
                📷 CAMERA SCAN
              </button>
              <button onClick={runEnergyScan} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 20, padding: '14px 16px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 800, letterSpacing: '0.25em' }}>
                ◈ ENERGY SCAN
              </button>
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 16, border: `1px solid rgba(212,175,55,0.2)`, minHeight: 200, background: '#000' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}/>
              {/* Overlay */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {[{ top: 10, left: 10 }, { top: 10, right: 10 }, { bottom: 10, left: 10 }, { bottom: 10, right: 10 }].map((pos, i) => (
                  <div key={i} style={{ position: 'absolute', width: 22, height: 22,
                    borderTop: i < 2 ? `2px solid ${GOLD}` : 'none',
                    borderBottom: i >= 2 ? `2px solid ${GOLD}` : 'none',
                    borderLeft: i % 2 === 0 ? `2px solid ${GOLD}` : 'none',
                    borderRight: i % 2 === 1 ? `2px solid ${GOLD}` : 'none',
                    ...pos }}/>
                ))}
                <div style={{ position: 'absolute', left: 0, right: 0, height: '30%', background: `linear-gradient(to bottom, transparent, rgba(34,211,238,0.15), transparent)`, animation: 'nadiScan 2s linear infinite' }}/>
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }}/>
            {camErr && <p style={{ fontSize: 11, color: 'rgba(255,120,100,0.7)', marginBottom: 12, textAlign: 'center' }}>{camErr}</p>}
            <button onClick={captureAndAnalyze} style={{ width: '100%', background: `linear-gradient(135deg, ${GOLD}, #B8940A)`, color: BG, border: 'none', borderRadius: 20, padding: 16, fontWeight: 900, fontSize: 12, letterSpacing: '0.2em', cursor: 'pointer' }}>
              ◈ CAPTURE & ANALYZE
            </button>
          </div>
        )}

        {(phase === 'analyzing' || phase === 'scanning' && !videoRef.current?.srcObject) && progress > 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            {/* Progress ring */}
            <svg width="100" height="100" viewBox="0 0 100 100" style={{ margin: '0 auto 20px', display: 'block' }}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"/>
              <circle cx="50" cy="50" r="42" fill="none" stroke={GOLD} strokeWidth="3"
                strokeDasharray={`${(progress / 100) * 264} 264`}
                strokeLinecap="round" strokeDashoffset="66" transform="rotate(-90 50 50)"/>
              <text x="50" y="55" textAnchor="middle" fill={GOLD} fontSize="16" fontWeight="900">{progress}%</text>
            </svg>
            <div style={{ fontSize: 11, color: CYAN, fontWeight: 700, letterSpacing: '0.1em', opacity: 0.9 }}>{scanStep}</div>
          </div>
        )}
      </div>

      <style>{`@keyframes nadiScan { 0%{top:0%} 100%{top:70%} }`}</style>
    </div>
  );
}

// ── LESSON MODAL ─────────────────────────────────────────────────────────────
function renderBody(bodyText: string) {
  const paras = bodyText.split('\n\n');
  return paras.map((para, i) => {
    const colonIdx = para.indexOf(':');
    const isHeading = colonIdx > 0 && colonIdx < 60 && para.slice(0, colonIdx) === para.slice(0, colonIdx).toUpperCase();
    if (isHeading) {
      const head = para.slice(0, colonIdx);
      const rest = para.slice(colonIdx + 1);
      return (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', marginBottom: 6 }}>{head.trim()}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>{rest.trim()}</div>
        </div>
      );
    }
    return <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 16 }}>{para}</p>;
  });
}

function LessonModal({ lesson, onClose }: { lesson: NadiLeafLesson; onClose: () => void }) {
  const tc = TIER_COLOR[lesson.tier];
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, minHeight: '100vh', background: '#050505', zIndex: 900, padding: '20px 16px 60px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: tc }}>{lesson.tierLabel} · MODULE {lesson.module}</span>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '8px 18px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }}>← BACK</button>
        </div>

        <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 32, padding: '28px 20px' }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', color: tc, marginBottom: 8 }}>{lesson.siddha}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.2 }}>{lesson.title}</div>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>{lesson.duration} TRANSMISSION</div>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 28 }}>{lesson.overview}</p>

          {/* Quote */}
          <div style={{ borderLeft: '2px solid ' + GOLD, paddingLeft: 20, marginBottom: 28 }}>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 8 }}>"{lesson.quote}"</p>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', color: GOLD }}>— {lesson.quoteSource}</p>
          </div>

          {/* Body */}
          <div style={{ marginBottom: 28 }}>
            {renderBody(lesson.bodyText)}
          </div>

          {/* Mantra */}
          <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 24, padding: 24, marginBottom: 28 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: GOLD, marginBottom: 12 }}>◈ SIDDHA MANTRA TRANSMISSION</div>
            {lesson.mantra.split('\n').map((line, i) => (
              <div key={i} style={{ fontSize: 15, fontWeight: 700, color: GOLD, letterSpacing: '0.05em', lineHeight: 1.8, textShadow: `0 0 20px rgba(212,175,55,0.3)` }}>{line}</div>
            ))}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 12, fontStyle: 'italic', lineHeight: 1.6 }}>{lesson.mantraMeaning}</div>
          </div>

          {/* Practices */}
          <div style={{ marginBottom: lesson.secrets ? 28 : 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: tc, marginBottom: 16 }}>◈ SADHANA PRACTICES</div>
            {lesson.practices.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 99, background: 'rgba(212,175,55,0.1)', border: `1px solid rgba(212,175,55,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: GOLD }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>{p}</p>
              </div>
            ))}
          </div>

          {/* Secrets (Akasha only) */}
          {lesson.secrets && lesson.secrets.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 24, padding: 24 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: '#F59E0B', marginBottom: 16 }}>◈ AKASHIC SECRET TRANSMISSION</div>
              {lesson.secrets.map((s, i) => (
                <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: i < lesson.secrets!.length - 1 ? 14 : 0 }}>{s}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SCAN RESULT CARD ─────────────────────────────────────────────────────────
function ScanResultCard({ reading, pattern, gender, onRescan }: { reading: ThumbScanReading; pattern: string; gender: 'male' | 'female'; onRescan: () => void }) {
  return (
    <div style={{ background: GLASS, border: `1px solid rgba(212,175,55,0.2)`, borderRadius: 40, padding: 32, marginBottom: 32 }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: GOLD, marginBottom: 8 }}>◈ ANGUSHTHA BIOMETRIC RESULT · {gender === 'male' ? 'RIGHT THUMB' : 'LEFT THUMB'}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: GOLD, letterSpacing: '-0.02em', marginBottom: 4, textShadow: `0 0 20px rgba(212,175,55,0.3)` }}>{reading.patternName}</div>
      <div style={{ fontSize: 11, color: CYAN, fontWeight: 700, letterSpacing: '0.15em', marginBottom: 20 }}>{reading.karmicType}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'DOMINANT NADI', value: reading.dominantNadi },
          { label: 'PLANETARY RULER', value: reading.planetaryRuler },
        ].map((item, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 700, lineHeight: 1.4 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, marginBottom: 24 }}>{reading.siddhaReading}</p>

      {/* Mantra */}
      <div style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 20, padding: 18, marginBottom: 24 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', color: GOLD, marginBottom: 10 }}>HEALING MANTRA</div>
        {reading.healingMantra.split(' · ').map((m, i) => (
          <div key={i} style={{ fontSize: 14, fontWeight: 700, color: GOLD, lineHeight: 1.8, textShadow: `0 0 15px rgba(212,175,55,0.25)` }}>{m}</div>
        ))}
      </div>

      {/* Remedies */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', color: CYAN, marginBottom: 14 }}>AGASTIYA PRESCRIPTIONS</div>
        {reading.remedies.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <span style={{ color: GOLD, fontWeight: 900, fontSize: 10, minWidth: 18, opacity: 0.7, marginTop: 2 }}>◈</span>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>{r}</p>
          </div>
        ))}
      </div>

      <button onClick={onRescan} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 99, padding: '10px 24px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 9, fontWeight: 800, letterSpacing: '0.3em' }}>
        ↺ RESCAN
      </button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function NadiLeaf() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tier = useMembershipTier();

  const isAdmin = user?.id === 'bd0b21c9-577a-450b-bb1e-21c9d0423f17';
  const userRank = getUserTierRank(tier, isAdmin);

  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<{ reading: ThumbScanReading; pattern: string } | null>(null);
  const [activeLesson, setActiveLesson] = useState<NadiLeafLesson | null>(null);
  const [activeModule, setActiveModule] = useState(1);

  const handleScanResult = (reading: ThumbScanReading, pattern: string) => {
    setShowScanner(false);
    setScanResult({ reading, pattern });
  };

  const canAccess = (lessonTier: NadiLeafTier) => userRank >= TIER_ORDER[lessonTier];

  const moduleLessons = NADI_LEAF_LESSONS.filter(l => l.module === activeModule);

  if (activeLesson) return <LessonModal lesson={activeLesson} onClose={() => setActiveLesson(null)} />;

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {showScanner && gender && (
        <ThumbBiometricScanner gender={gender} onResult={handleScanResult} onClose={() => setShowScanner(false)} />
      )}

      {/* Back nav */}
      <div style={{ padding: '20px 20px 0' }}>
        <button onClick={() => navigate('/siddha-portal')} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 99, padding: '8px 18px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }}>← SIDDHA PORTAL</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── HERO ── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* SVG Palm Leaf Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
              <ellipse cx="36" cy="36" rx="35" ry="35" fill="rgba(212,175,55,0.06)" stroke="rgba(212,175,55,0.2)" strokeWidth="1"/>
              {/* Palm leaf shape */}
              <path d="M36 56 C20 48 12 36 18 20 C24 8 36 6 36 6 C36 6 48 8 54 20 C60 36 52 48 36 56Z" fill="rgba(212,175,55,0.08)" stroke={GOLD} strokeWidth="1.2"/>
              {/* Leaf veins */}
              <line x1="36" y1="54" x2="36" y2="10" stroke={GOLD} strokeWidth="0.8" opacity="0.5"/>
              {[[-8,-12],[8,-12],[-14,-4],[14,-4],[-16,6],[16,6],[-12,16],[12,16]].map(([dx,dy],i) => (
                <line key={i} x1="36" y1={32} x2={36+dx} y2={32+dy} stroke={GOLD} strokeWidth="0.6" opacity="0.3"/>
              ))}
              {/* Thumb scan dot */}
              <circle cx="36" cy="46" r="4" fill="rgba(212,175,55,0.2)" stroke={GOLD} strokeWidth="1"/>
              <circle cx="36" cy="46" r="1.5" fill={GOLD}/>
            </svg>
          </div>

          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', color: GOLD, opacity: 0.7, marginBottom: 12 }}>AGASTIYA NADI SHASTRA · SIDDHA BIOMETRIC</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', margin: '0 0 12px', lineHeight: 1.1 }}>
            Nadi Leaf <span style={{ color: GOLD, textShadow: '0 0 30px rgba(212,175,55,0.4)' }}>Oracle</span>
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 32px' }}>
            5,000 years of Agastiya's Akashic Records meet Siddha Biometric Intelligence. Scan your thumb — discover the karma your soul chose before birth.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[['12', 'LESSONS'], ['4', 'MODULES'], ['16', 'KANDAMS'], ['5', 'THUMB TYPES']].map(([n, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: GOLD }}>{n}</div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── BIOMETRIC SCAN SECTION ── */}
        <div style={{ background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 40, padding: 32, marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', color: GOLD, marginBottom: 16 }}>◈ SIDDHA BIOMETRIC · ANGUSHTHA VIGYAN</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>Hasta Nadi Thumb Scan</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
            Agastiya Muni encoded: right thumb for men, left thumb for women. Your whorl pattern is the Akashic signature of your soul's karma from all previous births — compressed into your thumb at the moment of incarnation.
          </p>

          {!gender && !scanResult && (
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>SELECT YOUR COSMIC POLARITY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <button onClick={() => setGender('male')} style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 24, padding: '20px 16px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🔱</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: CYAN, letterSpacing: '0.15em', marginBottom: 4 }}>MALE</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Right Thumb · Pingala · Solar</div>
                </button>
                <button onClick={() => setGender('female')} style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 24, padding: '20px 16px', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🌙</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, letterSpacing: '0.15em', marginBottom: 4 }}>FEMALE</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Left Thumb · Ida · Lunar</div>
                </button>
              </div>
            </div>
          )}

          {gender && !scanResult && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  Scanning: <span style={{ color: GOLD, fontWeight: 700 }}>{gender === 'male' ? 'RIGHT thumb (Pingala · Solar)' : 'LEFT thumb (Ida · Lunar)'}</span>
                </div>
                <button onClick={() => setGender(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 11 }}>change</button>
              </div>
              <button onClick={() => setShowScanner(true)} style={{ width: '100%', background: `linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.06))`, border: `1px solid rgba(212,175,55,0.3)`, borderRadius: 24, padding: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>👍</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: '0.3em' }}>INITIATE ANGUSHTHA SCAN</span>
              </button>
            </div>
          )}

          {scanResult && gender && (
            <ScanResultCard reading={scanResult.reading} pattern={scanResult.pattern} gender={gender} onRescan={() => { setScanResult(null); setGender(null); }} />
          )}
        </div>

        {/* ── CURRICULUM ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', color: GOLD, marginBottom: 8 }}>◈ AGASTIYA NADI SHASTRA ACADEMY</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 24 }}>12 Transmissions · 4 Modules</div>

          {/* Module tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 28 }}>
            {MODULE_INFO.map(m => {
              const canAccModule = userRank >= TIER_ORDER[m.tier];
              const isActive = activeModule === m.module;
              return (
                <button key={m.module} onClick={() => setActiveModule(m.module)} style={{
                  background: isActive ? `rgba(212,175,55,0.12)` : GLASS,
                  border: `1px solid ${isActive ? 'rgba(212,175,55,0.3)' : BORDER}`,
                  borderRadius: 16,
                  padding: '10px 18px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', color: isActive ? GOLD : 'rgba(255,255,255,0.25)', marginBottom: 2 }}>
                    {canAccModule ? TIER_LABEL[m.tier] : '🔒'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#fff' : 'rgba(255,255,255,0.4)' }}>Module {m.module}</div>
                </button>
              );
            })}
          </div>

          {/* Lessons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {moduleLessons.map(lesson => {
              const accessible = canAccess(lesson.tier);
              const tc = TIER_COLOR[lesson.tier];
              return (
                <div key={lesson.id} onClick={() => accessible && setActiveLesson(lesson)} style={{
                  background: GLASS,
                  border: `1px solid ${accessible ? BORDER : 'rgba(255,255,255,0.03)'}`,
                  borderRadius: 28,
                  padding: '20px 24px',
                  cursor: accessible ? 'pointer' : 'default',
                  opacity: accessible ? 1 : 0.45,
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.35em', color: tc, background: `${tc}14`, border: `1px solid ${tc}30`, borderRadius: 99, padding: '3px 10px' }}>
                          {lesson.tierLabel}
                        </span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.2em' }}>{lesson.duration}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: accessible ? '#fff' : 'rgba(255,255,255,0.4)', letterSpacing: '-0.01em', marginBottom: 4 }}>
                        {lesson.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{lesson.siddha}</div>
                    </div>
                    <div style={{ color: accessible ? GOLD : 'rgba(255,255,255,0.2)', fontSize: 16, flexShrink: 0 }}>
                      {accessible ? '→' : '🔒'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade prompt if not full access */}
        {userRank < 3 && (
          <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 32, padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', color: '#F59E0B', marginBottom: 10 }}>AKASHA INFINITY · UNLOCK ALL</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Access the Moksha Kandam & Siddha Secrets</div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>Module 4 reveals the 18 Siddhas' own karmic records, Babaji's inner Nadi method, and the restricted Moksha Kandam transmission.</p>
            <button onClick={() => navigate('/membership')} style={{ background: `linear-gradient(135deg, rgba(245,158,11,0.25), rgba(212,175,55,0.1))`, border: '1px solid rgba(245,158,11,0.3)', borderRadius: 24, padding: '14px 32px', cursor: 'pointer', fontSize: 11, fontWeight: 800, color: '#F59E0B', letterSpacing: '0.25em' }}>
              ASCEND TO AKASHA INFINITY
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
