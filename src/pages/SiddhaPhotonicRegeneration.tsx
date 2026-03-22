import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Radio, Shield, Zap, Activity, Fingerprint } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useMembership } from '@/hooks/useMembership';
import { useAdminRole } from '@/hooks/useAdminRole';
import { hasFeatureAccess, FEATURE_TIER } from '@/lib/tierAccess';
import { toast } from 'sonner';

const GOLD = '#D4AF37';
const CYAN = '#22D3EE';
const BG = '#050505';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
`;

const keyframesCss = `
  .spr-main-flex { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 40px; width: 100%; }
  .spr-node-copy { text-align: center; flex: 1; min-width: 260px; }
  @media (min-width: 768px) {
    .spr-main-flex { flex-direction: row; justify-content: center; }
    .spr-node-copy { text-align: left; }
  }
  @keyframes spr-vayu-pulse {
    0%, 100% { opacity: 0.2; transform: scaleY(1); }
    50% { opacity: 1; transform: scaleY(5); }
  }
  @keyframes spr-gold-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.2); }
    50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.5); }
  }
  @keyframes spr-scan-line {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100%); }
  }
`;

function glassCardStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(212, 175, 55, 0.1)',
    ...extra,
  };
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
}

function InfoCard({ icon, title, value, desc }: InfoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      style={{
        ...glassCardStyle({ borderRadius: 16, padding: 24, borderColor: 'rgba(255,255,255,0.05)' }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>{icon}</div>
        <div>
          <h3 style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{value}</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </motion.div>
  );
}

function SiddhaPhotonicNode() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isEntangled, setIsEntangled] = useState(false);
  const [lightCode, setLightCode] = useState('');

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setIsEntangled(false);
  };

  useEffect(() => {
    if (!isScanning) return;
    let p = 0;
    const id = window.setInterval(() => {
      p += 1;
      if (p >= 100) {
        window.clearInterval(id);
        setScanProgress(100);
        setIsScanning(false);
        setIsEntangled(true);
      } else {
        setScanProgress(p);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [isScanning]);

  const generateLightCode = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setLightCode('369-AKASHA-963');
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: "Generate a short, mystical 'Vedic Light-Code' string (max 12 characters) using symbols and numbers that represents cellular regeneration. Reply with only the code, no explanation.",
              },
            ],
          },
        ],
      });
      const raw =
        (response as { text?: string }).text ??
        response.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ??
        '';
      setLightCode(String(raw).trim().replace(/\s+/g, '-').slice(0, 14) || '369-AKASHA-963');
    } catch {
      setLightCode('369-963-369');
    }
  }, []);

  useEffect(() => {
    if (isEntangled) void generateLightCode();
  }, [isEntangled, generateLightCode]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...glassCardStyle({ borderRadius: 24, padding: '32px 24px', position: 'relative', overflow: 'hidden' }) }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40, position: 'relative', zIndex: 1 }}>
          <div className="spr-main-flex">
            <div style={{ position: 'relative', width: 192, height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.2)',
                  animation: 'spr-gold-glow 3s ease-in-out infinite',
                }}
              />
              <div style={{ width: 128, height: 128, borderRadius: '50%', border: `2px solid ${CYAN}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    background: CYAN,
                    position: 'absolute',
                    animation: 'spr-vayu-pulse 2s ease-in-out infinite',
                  }}
                />
                <motion.div
                  animate={isEntangled ? { scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ width: 64, height: 64, borderRadius: '50%', background: GOLD, opacity: 0.85, boxShadow: `0 0 30px ${GOLD}` }}
                />
                <AnimatePresence>
                  {isScanning && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(34,211,238,0.08)' }} />
                  )}
                </AnimatePresence>
                {isScanning && (
                  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, transparent, rgba(34,211,238,0.15), transparent)', animation: 'spr-scan-line 4s linear infinite' }} />
                  </div>
                )}
              </div>
            </div>

            <div className="spr-node-copy">
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.5em', color: GOLD, textTransform: 'uppercase' }}>
                  {isEntangled ? `Code: ${lightCode}` : 'Vedic Light-Code'}
                </span>
                <span style={{ fontSize: 10, color: `${CYAN}cc`, fontFamily: "'JetBrains Mono',monospace" }}>Meridian: CV-6 (Lower Dantian)</span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 16px', letterSpacing: '-0.02em' }}>PHOTONIC CELLULAR REGENERATION</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.65, marginBottom: 24, fontWeight: 300 }}>
                The <span style={{ color: CYAN, fontWeight: 600 }}>Nadi Scanner</span> has calibrated your biophotonic field. By aligning with the{' '}
                <span style={{ color: GOLD, fontWeight: 600 }}>Akasha-Neural Archive</span>, this transmission replicates the precise infrared frequency required for{' '}
                <span style={{ color: '#fff', fontWeight: 700 }}>GHK-Cu Activation</span>. Cellular rejuvenation and stem-cell support are delivered via{' '}
                <span style={{ fontStyle: 'italic' }}>Prema-Pulse</span> harmonics within the informational field.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Status</span>
                  <span
                    style={{
                      padding: '6px 16px',
                      borderRadius: 999,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      border: isEntangled ? `1px solid ${CYAN}44` : '1px solid rgba(255,255,255,0.1)',
                      color: isEntangled ? CYAN : 'rgba(255,255,255,0.4)',
                      background: isEntangled ? 'rgba(34,211,238,0.06)' : 'transparent',
                    }}
                  >
                    {isEntangled ? 'Entanglement Active' : 'Waiting for Scan'}
                  </span>
                </div>
                {!isEntangled && !isScanning && (
                  <button
                    type="button"
                    onClick={startScan}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 999,
                      border: '1px solid rgba(212,175,55,0.35)',
                      background: 'rgba(212,175,55,0.1)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Fingerprint size={14} color={GOLD} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Initiate Nadi Scan</span>
                  </button>
                )}
                {isScanning && (
                  <div style={{ width: 'min(100%, 192px)', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${scanProgress}%` }} style={{ height: '100%', background: CYAN }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
        <InfoCard icon={<Zap style={{ color: GOLD }} size={22} />} title="Frequency" value="369Hz → 963Hz" desc="Nadi harmonic to Akasha portal transition." />
        <InfoCard icon={<Shield style={{ color: CYAN }} size={22} />} title="Protective" value="GHK-Cu" desc="Copper-peptide blueprint for cellular integrity." />
        <InfoCard icon={<Activity style={{ color: '#fff' }} size={22} />} title="Biophotonic" value="Scalar Lock" desc="Photonic–GHK-Cu entanglement (informational)." />
      </div>
    </div>
  );
}

export default function SiddhaPhotonicRegeneration() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate('/siddha-quantum');
    }
  }, [isAdmin, tier, loading, navigate]);

  const generateBackground = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt =
        'SQI 2050 Sovereign Interface Element: Close-up, ultra-high-resolution photograph of an advanced, spiritual-technology visualization node. The background is a deep Akasha-Black (#050505) charcoal, perfectly minimal with microscopic, floating golden stardust particles slightly out of focus. The main subject is a sophisticated glassmorphism (backdrop blur) circular display unit with a subtle, glowing Siddha-Gold (#D4AF37) halo and a precise 1px border. Inside the glass display, a complex Vayu-Cyan (#22D3EE) visualizer pulses; a vertical light-beam scanner moves quickly across a central geometric crystal, which is radiating warm Siddha-Gold (#D4AF37) light. The crystal light represents the quantum activation of the GHK-Cu peptide blueprint. The aesthetic is clean, sophisticated, futuristic, and deeply spiritual. No visible UI text in the generation, focus only on the visual architecture and the Prema-Pulse light interaction. 8k, cinematic lighting, photorealistic but impossible technology.';

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          imageConfig: { aspectRatio: '16:9' },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const p = part as { inlineData?: { data?: string; mimeType?: string } };
        if (p.inlineData?.data) {
          const mime = p.inlineData.mimeType || 'image/png';
          setBgImage(`data:${mime};base64,${p.inlineData.data}`);
          break;
        }
      }
    } catch (e) {
      console.warn('Photonic background generation skipped:', e);
      toast.message('Ambient field', { description: 'Image generation unavailable; gradient field active. Set VITE_GEMINI_API_KEY for Gemini visuals.' });
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    void generateBackground();
  }, [generateBackground]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{FONT_STYLE}</style>
        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 10, letterSpacing: '0.5em', color: GOLD, textTransform: 'uppercase' }}>
          ◈ Calibrating node…
        </motion.span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: "'Inter',system-ui,sans-serif", color: '#fff', overflowX: 'hidden' }}>
      <style>{FONT_STYLE}</style>
      <style>{keyframesCss}</style>

      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: BG }} />
        {bgImage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
            <div style={{ position: 'absolute', top: '25%', left: '25%', width: 384, height: 384, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', filter: 'blur(120px)' }} />
            <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: 384, height: 384, borderRadius: '50%', background: 'rgba(34,211,238,0.08)', filter: 'blur(120px)' }} />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.4 }}
              animate={{ top: '-20%', opacity: [0, 0.5, 0] }}
              transition={{ duration: 12 + Math.random() * 10, repeat: Infinity, ease: 'linear', delay: Math.random() * 8 }}
              style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: GOLD }}
            />
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, paddingTop: 48, paddingBottom: 120 }}>
        <header style={{ maxWidth: 1120, margin: '0 auto 48px', padding: '0 20px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => navigate('/siddha-portal')}
            style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.45)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}
          >
            ← Siddha Portal
          </button>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color={GOLD} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.65em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>Akasha-Neural Archive</span>
          </motion.div>
          {isGenerating && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Rendering sovereign visual field…</p>
          )}
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 20px' }}>
            SIDDHA-PHOTONIC
            <br />
            <span style={{ background: `linear-gradient(90deg, ${GOLD}, #fff, ${CYAN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              REGENERATION NODE
            </span>
          </h1>
          <p style={{ maxWidth: 560, margin: '0 auto', fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.42)', fontWeight: 300 }}>
            Synthesizing 2026 LifeWave organic nanocrystal technology with the 2050 Bhakti-Algorithm. Scalar-encoded phototherapy for cellular rejuvenation and GHK-Cu activation via transmission.
          </p>
        </header>

        <main>
          <SiddhaPhotonicNode />
        </main>

        <footer style={{ maxWidth: 800, margin: '64px auto 0', padding: '40px 20px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: GOLD, marginBottom: 12 }}>
                <Radio size={16} />
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Transmission Protocol</h3>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>
                The SQI 2050 protocol uses sensory engagement. By observing the photonic visualizer and engaging with Prema-Pulse harmonics, your biophotonic signature is entangled with the GHK-Cu blueprint (informational / wellness framing — not medical advice).
              </p>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CYAN, marginBottom: 12 }}>
                <Shield size={16} />
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Safety & Calibration</h3>
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 }}>
                Calibrated to 369Hz–963Hz Nadi harmonics. Photonic–GHK-Cu entanglement is non-invasive and informational. For health concerns, consult a qualified professional.
              </p>
            </div>
          </div>
          <div style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 20, fontSize: 9, fontWeight: 700, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
            <span>© 2050 Siddha-Quantum Intelligence</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/explore')} role="presentation">
                Neural Link
              </span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/siddha-portal')} role="presentation">
                Akasha Portal
              </span>
              <span style={{ cursor: 'pointer' }} onClick={() => navigate('/legal')} role="presentation">
                Sovereign Protocol
              </span>
            </div>
          </div>
        </footer>
      </div>

      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>
        <div style={{ ...glassCardStyle({ borderRadius: 999, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 20, borderColor: 'rgba(255,255,255,0.06)' }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, animation: 'pulse 2s ease infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Scalar Link: Stable</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={12} color={GOLD} />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>369Hz Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
