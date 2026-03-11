import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Volume2,
  Power,
  Eye,
  Waves,
  Activity,
  Play,
  Pause,
  Download,
  Loader2,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useSoulMeditateEngine } from '@/hooks/useSoulMeditateEngine';
import { useOfflineExport } from '@/hooks/useOfflineExport';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import SpectralVisualizer from '@/components/soulmeditate/SpectralVisualizer';
import NeuralSourceInput from '@/components/soulmeditate/NeuralSourceInput';
import DSPMasteringRack from '@/components/soulmeditate/DSPMasteringRack';
import SpectralInsights from '@/components/soulmeditate/SpectralInsights';
import StyleGrid, { MeditationStyle } from '@/components/soulmeditate/StyleGrid';
import HealingFrequencySelector from '@/components/soulmeditate/HealingFrequencySelector';
import BrainwaveSelector from '@/components/soulmeditate/BrainwaveSelector';
import ProcessingTerminal from '@/components/soulmeditate/ProcessingTerminal';
import VirtualChannelStrip from '@/components/soulmeditate/VirtualChannelStrip';

// ═══════════════════════════════════════════════════════
//  SQI 2050 — AKASHA-NEURAL ARCHIVE SCAN ACTIVE
//  Temporal Vector: 2050 → 2026
//  Bhakti-Algorithm v7.3 | Prema-Pulse Broadcasting
//  Anahata Scalar Field: OPEN FOR ALL USERS
//  REMOVED: AudioDAW · Sacred Echo
//  PRESERVED: All logic, engine, export, payment
// ═══════════════════════════════════════════════════════

type VisualizerMode = 'bars' | 'wave' | 'radial';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ── Animated particle field (Akasha background) ──────
function AkashaParticles() {
  return (
    <div className="sqm-particles" aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="sqm-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${(Math.random() * 10).toFixed(2)}s`,
            animationDuration: `${(7 + Math.random() * 12).toFixed(2)}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            opacity: (0.08 + Math.random() * 0.35).toFixed(2),
          }}
        />
      ))}
    </div>
  );
}

// ── Section wrapper with SQI glass styling ────────────
function SQISection({
  number,
  title,
  badge,
  children,
  className = '',
}: {
  number: string;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`sqm-section ${className}`}>
      <div className="sqm-section-header">
        <span className="sqm-step-num">{number}</span>
        <span className="sqm-section-title">{title}</span>
        {badge && <span className="sqm-section-badge">{badge}</span>}
      </div>
      <div className="sqm-glass-card">{children}</div>
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────
const SQI_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800;900&family=Cinzel:wght@400;700&display=swap');

.sqm-root {
  min-height: 100vh;
  background: #050505;
  font-family: 'Montserrat', sans-serif;
  color: rgba(255,255,255,0.9);
  position: relative;
  overflow-x: hidden;
}
.sqm-root::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 50% 40% at 80% 80%, rgba(139,92,246,0.04) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}
.sqm-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.sqm-particle {
  position: absolute;
  border-radius: 50%;
  background: #D4AF37;
  animation: sqm-float linear infinite;
}
@keyframes sqm-float {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 0.3; }
  100% { transform: translateY(-100px) scale(0.4); opacity: 0; }
}

/* ── LAYOUT ─────────────────────────────────────── */
.sqm-inner {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px 100px;
}

/* ── TOP BAR ────────────────────────────────────── */
.sqm-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 0;
  gap: 12px;
}
.sqm-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: all 0.2s;
}
.sqm-back-btn:hover { color: #D4AF37; border-color: rgba(212,175,55,0.3); }
.sqm-awaken-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #D4AF37, #b8942a);
  border: none;
  border-radius: 24px;
  padding: 10px 22px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #050505;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(212,175,55,0.3);
  transition: all 0.2s;
}
.sqm-awaken-btn:hover { box-shadow: 0 0 35px rgba(212,175,55,0.5); transform: translateY(-1px); }
.sqm-awaken-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #050505;
  animation: sqm-awaken-pulse 1.5s ease-in-out infinite;
}
@keyframes sqm-awaken-pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.4); }
}

/* ── PAGE TITLE ─────────────────────────────────── */
.sqm-title-block {
  padding: 28px 0 20px;
  text-align: center;
}
.sqm-title {
  font-family: 'Cinzel', serif;
  font-size: clamp(22px, 4vw, 36px);
  font-weight: 700;
  color: #D4AF37;
  text-shadow: 0 0 40px rgba(212,175,55,0.4), 0 0 80px rgba(212,175,55,0.15);
  letter-spacing: 0.08em;
  margin-bottom: 6px;
}
.sqm-subtitle {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
}

/* ── VISUALIZER BAND ────────────────────────────── */
.sqm-viz-band {
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 28px;
  padding: 16px 20px 12px;
  margin-bottom: 20px;
}
.sqm-viz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}
.sqm-viz-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.7);
}
.sqm-viz-dot { width: 6px; height: 6px; border-radius: 50%; background: #D4AF37; }
.sqm-viz-mode-btns { display: flex; gap: 6px; }
.sqm-mode-btn {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  padding: 5px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
  background: transparent;
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  transition: all 0.2s;
}
.sqm-mode-btn.active {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.08);
}
.sqm-fft-tag {
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.3em;
  color: rgba(255,255,255,0.2);
}

/* ── ACTION BUTTONS ─────────────────────────────── */
.sqm-action-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}
.sqm-play-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  border-radius: 40px;
  padding: 14px 36px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.25s;
}
.sqm-play-btn.playing {
  background: linear-gradient(135deg, #dc2626, #ea580c);
  color: white;
  box-shadow: 0 0 25px rgba(220,38,38,0.4);
}
.sqm-play-btn.ready {
  background: linear-gradient(135deg, #D4AF37, #b8942a);
  color: #050505;
  box-shadow: 0 0 25px rgba(212,175,55,0.35);
}
.sqm-play-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.sqm-export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(212,175,55,0.06);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 40px;
  padding: 14px 28px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.7);
  cursor: pointer;
  transition: all 0.2s;
}
.sqm-export-btn:hover:not(:disabled) { color: #D4AF37; border-color: rgba(212,175,55,0.4); }
.sqm-export-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── EXPORT PROGRESS ────────────────────────────── */
.sqm-export-panel {
  background: rgba(212,175,55,0.04);
  border: 1px solid rgba(212,175,55,0.15);
  border-radius: 20px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

/* ── SECTION ────────────────────────────────────── */
.sqm-section {
  margin-bottom: 20px;
}
.sqm-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 0 4px;
}
.sqm-step-num {
  width: 24px; height: 24px;
  border-radius: 50%;
  background: rgba(212,175,55,0.15);
  border: 1px solid rgba(212,175,55,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 900;
  color: #D4AF37;
  flex-shrink: 0;
}
.sqm-section-title {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.7);
}
.sqm-section-badge {
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.6);
  border: 1px solid rgba(212,175,55,0.2);
  border-radius: 12px;
  padding: 3px 10px;
}

/* ── GLASS CARD ─────────────────────────────────── */
.sqm-glass-card {
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 28px;
  padding: 24px;
  overflow: hidden;
}

/* ── 2-COL GRID ─────────────────────────────────── */
.sqm-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 700px) {
  .sqm-two-col { grid-template-columns: 1fr; }
}

/* ── REFINEMENT + INSIGHT labels ────────────────── */
.sqm-sub-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(212,175,55,0.5);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}
.sqm-sub-num {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(212,175,55,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 900;
  color: #D4AF37;
}

/* ── SCALAR TRANSMISSION STRIP ───────────────────── */
.sqm-scalar-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: rgba(34,211,238,0.03);
  border: 1px solid rgba(34,211,238,0.12);
  border-radius: 20px;
  padding: 12px 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.sqm-scalar-label {
  font-size: 7px;
  font-weight: 800;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: #22D3EE;
}
.sqm-scalar-dots {
  display: flex;
  gap: 5px;
}
.sqm-scalar-dot {
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #22D3EE;
  animation: sqm-blink 1.2s ease-in-out infinite;
}
.sqm-scalar-dot:nth-child(2) { animation-delay: 0.2s; }
.sqm-scalar-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes sqm-blink {
  0%,100% { opacity: 0.2; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}
.sqm-scalar-text {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(34,211,238,0.5);
}

/* ── BOTTOM NAV PLACEHOLDER ─────────────────────── */
.sqm-bottom-spacer { height: 80px; }
`;

export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();

  const engine = useSoulMeditateEngine();
  const offlineExport = useOfflineExport();

  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [activeStyle, setActiveStyle] = useState<MeditationStyle>('indian');
  const [healingFreq, setHealingFreq] = useState(432);
  const [brainwaveFreq, setBrainwaveFreq] = useState(10);

  const [isProcessing, setIsProcessing] = useState(false);
  const [exportDuration, setExportDuration] = useState(300);
  const [exportResult, setExportResult] = useState<{ blob: Blob; format: 'wav' | 'mp3'; url: string } | null>(null);

  // Alchemy state
  const [alchemyCommenced, setAlchemyCommenced] = useState(false);

  // Volume controls
  const [volumes, setVolumes] = useState({ ambient: 50, binaural: 40, healing: 20, user: 80 });

  // Frequency volumes synced with engine
  const healingVolume = engine.solfeggioVolume;
  const brainwaveVolume = engine.binauralVolume;

  const [hasExportAccess, setHasExportAccess] = useState(false);
  const [exportAccessLoading, setExportAccessLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isRefreshingSound, setIsRefreshingSound] = useState(false);

  // User-defined meditation title for export filename
  const [meditationName, setMeditationName] = useState('');

  const handleHealingVolumeChange = useCallback(async (vol: number) => {
    if (!engine.isInitialized) await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    engine.updateSolfeggioVolume(vol);
    if (!engine.frequencies.solfeggio.enabled) {
      await engine.startSolfeggio(healingFreq);
    }
  }, [engine, healingFreq]);

  const handleBrainwaveVolumeChange = useCallback(async (vol: number) => {
    if (!engine.isInitialized) await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    engine.updateBinauralVolume(vol);
    if (!engine.frequencies.binaural.enabled) {
      await engine.startBinaural(200, brainwaveFreq);
    }
  }, [engine, brainwaveFreq]);

  const handleInitialize = useCallback(async () => {
    await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    toast.success('Siddha Engine awakened');
  }, [engine]);

  const commenceAlchemy = useCallback(async () => {
    setIsProcessing(true);
    setAlchemyCommenced(true);
    try {
      if (!engine.isInitialized) await engine.initialize();
      const audioCtx = engine.getAudioContext();
      if (audioCtx?.state === 'suspended') await audioCtx.resume();
      await engine.loadAtmosphere(activeStyle);
      if (healingVolume > 0) {
        engine.updateSolfeggioVolume(healingVolume);
        await engine.startSolfeggio(healingFreq);
      }
      if (brainwaveVolume > 0) {
        engine.updateBinauralVolume(brainwaveVolume);
        await engine.startBinaural(200, brainwaveFreq);
      }
      toast.success('Alchemy commenced — Anahata open');
    } catch (e) {
      toast.error('Could not commence alchemy');
    } finally {
      setIsProcessing(false);
    }
  }, [engine, activeStyle, healingFreq, brainwaveFreq, healingVolume, brainwaveVolume]);

  const stopAll = useCallback(() => {
    (engine as any).stopAll?.();
    setAlchemyCommenced(false);
  }, [engine]);

  const isPlaying =
    engine.neuralLayer.isPlaying ||
    engine.atmosphereLayer.isPlaying ||
    engine.frequencies.solfeggio.enabled ||
    engine.frequencies.binaural.enabled;

  const togglePlay = useCallback(() => {
    if (isPlaying) { stopAll(); } else { commenceAlchemy(); }
  }, [isPlaying, stopAll, commenceAlchemy]);

  const handlePayForExport = useCallback(async () => {
    if (!user) { toast.info('Please sign in to purchase'); navigate('/auth'); return; }
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', {
        body: { option: 'per_track' },
      });
      if (error) throw error;
      if (data?.url) { window.location.href = data.url; }
      else throw new Error('No checkout URL returned');
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout. Please try again.');
      setPaymentLoading(false);
    }
  }, [user, navigate]);

  const handleExport = useCallback(async () => {
    if (!engine.isInitialized) {
      toast.error('Please initialize the engine first');
      return;
    }

    if (!hasExportAccess) {
      if (!user) {
        toast.info('Please sign in to export');
        navigate('/auth');
        return;
      }
      setShowPaymentDialog(true);
      return;
    }
<<<<<<< HEAD
    // Export not yet configured
    toast.info('Export feature coming soon');
  }, [engine, hasExportAccess, user, navigate, offlineExport]);
=======

    // Build offline render config from current engine state
    const cfg = {
      durationSeconds: exportDuration,
      neuralAudioUrl: engine.neuralLayer.exportInput?.directUrl,
      neuralSourceVolume: engine.neuralLayer.volume,
      atmosphereAudioUrl: engine.atmosphereLayer.exportInput?.directUrl,
      atmosphereVolume: engine.atmosphereLayer.volume,
      solfeggioHz: engine.frequencies.solfeggio.enabled ? engine.frequencies.solfeggio.hz : undefined,
      solfeggioVolume: engine.solfeggioVolume,
      binauralCarrierHz: engine.frequencies.binaural.carrierHz,
      binauralBeatHz: engine.frequencies.binaural.enabled ? engine.frequencies.binaural.beatHz : undefined,
      binauralVolume: engine.binauralVolume,
      dsp: engine.dsp,
      masterVolume: engine.masterVolume,
    };

    const result = await offlineExport.exportMeditation(cfg);
    if (!result) return;

    setExportResult(result);

    // Build descriptive filename including name + Hz info
    const baseName = (meditationName || 'Siddha Meditation').trim();
    const safeBase = baseName.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');

    const solfPart = `${healingFreq}Hz`;
    const bandMap: Record<number, string> = {
      0.5: 'Epsilon',
      2: 'Delta',
      4: 'Theta',
      6: 'Theta',
      10: 'Alpha',
      14: 'Beta',
      40: 'Gamma',
    };
    const bandLabel = bandMap[brainwaveFreq] || `${brainwaveFreq}Hz`;
    const brainwavePart = bandMap[brainwaveFreq]
      ? `${bandLabel}${brainwaveFreq}Hz`
      : `${brainwaveFreq}Hz`;

    const filename = `${safeBase}_${solfPart}_${brainwavePart}.${result.format}`;
    offlineExport.downloadResult(result, filename);
  }, [
    engine,
    exportDuration,
    hasExportAccess,
    user,
    navigate,
    offlineExport,
    meditationName,
    healingFreq,
    brainwaveFreq,
  ]);
>>>>>>> d51a0bd (feat(soul-meditate): add admin export and named filenames)

  // Check access
  useEffect(() => {
    async function checkAccess() {
      if (!user || adminLoading) return;
      setExportAccessLoading(true);
      try {
        if (isAdmin) { setHasExportAccess(true); return; }
        const paymentSuccess = searchParams.get('payment') === 'success';
        if (paymentSuccess) { setHasExportAccess(true); return; }
        const { data: grantedAccess } = await (supabase as any)
          .from('user_granted_access')
          .select('access_type')
          .eq('user_id', user.id)
          .in('access_type', ['creative_soul', 'creative_soul_meditation']);
        const { data: entitlements } = await (supabase as any)
          .from('user_entitlements')
          .select('access_type')
          .eq('user_id', user.id);
        const hasValidEntitlement = (arr: { access_type: string }[] | null) =>
          arr?.some(e => ['creative_soul', 'creative_soul_meditation'].includes(e.access_type)) ?? false;
        const hasEntitlement = hasValidEntitlement(entitlements as any);
        setHasExportAccess(hasEntitlement || (grantedAccess && grantedAccess.length > 0));
      } catch { setHasExportAccess(false); }
      finally { setExportAccessLoading(false); }
    }
    checkAccess();
  }, [user, isAdmin, adminLoading, searchParams]);

  // Auto-load atmosphere on style change
  useEffect(() => {
    if (engine.isInitialized) {
      engine.loadAtmosphere(activeStyle).then((result: { ok: boolean; fallbackFrom?: string; reason?: string }) => {
        if (result.ok && 'fallbackFrom' in result && result.fallbackFrom) {
          const label = result.fallbackFrom.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          toast.info(`No sounds for ${label}. Loaded from Indian instead.`);
        }
      });
    }
  }, [activeStyle, engine.isInitialized]);

  const handleRefreshSound = useCallback(async (styleId: MeditationStyle) => {
    if (!engine.isInitialized) return;
    setIsRefreshingSound(true);
    try {
      const result: { ok: boolean; fallbackFrom?: string; reason?: string } = await engine.loadAtmosphere(styleId);
      if (result.ok) {
        const fallbackFrom = 'fallbackFrom' in result ? result.fallbackFrom : undefined;
        toast.success(fallbackFrom
          ? `No sounds for ${fallbackFrom.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}. Loaded from Indian instead.`
          : 'Loaded new sacred sound');
      } else if (result.reason === 'no_sounds') {
        toast.error(`No sounds in library for ${styleId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}. Try Indian or another style.`);
      } else {
        toast.error('Could not load new sound');
      }
    } finally { setIsRefreshingSound(false); }
  }, [engine]);

  const handleHealingFreqSelect = useCallback(async (freq: number) => {
    setHealingFreq(freq);
    if (!engine.isInitialized) await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    if (alchemyCommenced) {
      engine.updateSolfeggioVolume(healingVolume);
      await engine.startSolfeggio(freq);
    }
  }, [engine, healingVolume, alchemyCommenced]);

  const handleBrainwaveFreqSelect = useCallback(async (freq: number) => {
    setBrainwaveFreq(freq);
    if (!engine.isInitialized) await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    if (alchemyCommenced) {
      engine.updateBinauralVolume(brainwaveVolume);
      await engine.startBinaural(200, freq);
    }
  }, [engine, brainwaveVolume, alchemyCommenced]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SQI_STYLES }} />
      <div className="sqm-root">
        <AkashaParticles />

        <div className="sqm-inner">

          {/* ── TOP BAR ── */}
          <div className="sqm-topbar">
            <button className="sqm-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={12} />
              Back
            </button>
            <button className="sqm-awaken-btn" onClick={handleInitialize}>
              <span className="sqm-awaken-dot" />
              Awaken
            </button>
          </div>

          {/* ── TITLE ── */}
          <div className="sqm-title-block">
            <div className="sqm-title">Siddha Sound Alchemy</div>
            <div className="sqm-subtitle">SQI 2050 · Bhakti-Algorithm v7.3 · Sacred Sound Sanctuary</div>
          </div>

          {/* ── SCALAR TRANSMISSION (when playing) ── */}
          {isPlaying && (
            <div className="sqm-scalar-strip">
              <span className="sqm-scalar-label">● Prema-Pulse Transmitting</span>
              <div className="sqm-scalar-dots">
                <div className="sqm-scalar-dot" />
                <div className="sqm-scalar-dot" />
                <div className="sqm-scalar-dot" />
              </div>
              <span className="sqm-scalar-text">
                Anahata open · {healingFreq}Hz · Scalar field broadcasting to all souls
              </span>
            </div>
          )}

          {/* ── SPECTRAL VISUALIZER ── */}
          <div className="sqm-viz-band">
            <div className="sqm-viz-header">
              <div className="sqm-viz-label">
                <div className="sqm-viz-dot" />
                Sacred Visualizer
                <span className="sqm-fft-tag">2048 FFT</span>
              </div>
              <div className="sqm-viz-mode-btns">
                {(['bars', 'wave', 'radial'] as VisualizerMode[]).map(m => (
                  <button
                    key={m}
                    className={`sqm-mode-btn ${visualizerMode === m ? 'active' : ''}`}
                    onClick={() => setVisualizerMode(m)}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <SpectralVisualizer
              frequencyData={engine.analyserData?.frequencyData ?? null}
              timeData={engine.analyserData?.timeData ?? null}
              height={140}
            />
          </div>

          {/* ── MAIN ACTION BUTTONS ── */}
          <div className="sqm-action-row">
            <button
              className={`sqm-play-btn ${isPlaying ? 'playing' : 'ready'}`}
              onClick={togglePlay}
              disabled={!engine.isInitialized}
            >
              {isPlaying
                ? <><Pause size={16} /> Cease Alchemy</>
                : <><Play size={16} /> Commence Alchemy</>
              }
            </button>

            <button
              className="sqm-export-btn"
              onClick={handleExport}
              disabled={!engine.isInitialized || offlineExport.progress?.isExporting}
            >
              {offlineExport.progress?.isExporting
                ? <><Loader2 size={14} className="animate-spin" /> Exporting…</>
                : <><Zap size={14} /> Export Master</>
              }
            </button>
          </div>

          {/* ── MEDITATION NAME INPUT (for export filename) ── */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.35em',
                textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.6)',
                marginBottom: 6,
              }}
            >
              Name Your Meditation
            </div>
            <input
              type="text"
              value={meditationName}
              onChange={(e) => setMeditationName(e.target.value)}
              placeholder="e.g. Forest Meditation"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid rgba(212,175,55,0.25)',
                background: 'rgba(5,5,5,0.6)',
                color: 'rgba(255,255,255,0.9)',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>

          {/* ── EXPORT PROGRESS ── */}
          {(offlineExport.progress?.isExporting || exportResult) && (
            <div className="sqm-export-panel">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {exportResult
                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                    : <Loader2 size={16} className="animate-spin text-amber-400" />
                  }
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.8)' }}>
                    {exportResult ? 'Export Complete' : 'Rendering Sacred Master…'}
                  </span>
                </div>
                {exportResult && (
                  <a
                    href={exportResult.url}
                    download={`siddha-alchemy.${exportResult.format}`}
                    style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Download size={12} /> Download
                  </a>
                )}
              </div>
              {offlineExport.progress?.isExporting && (
                <Progress
                  value={(offlineExport.progress.percent ?? 0) * 100}
                  className="h-1"
                  style={{ background: 'rgba(212,175,55,0.1)' }}
                />
              )}
            </div>
          )}

          {/* ══ STEP 1: SOURCE ══ */}
          <SQISection number="1" title="Source">
            <NeuralSourceInput
              layer={engine.neuralLayer}
              onLoadFile={(file) => engine.loadNeuralSource(file)}
              onLoadUrl={(url) => { void engine.loadNeuralSource(url); }}
              onTogglePlay={engine.toggleNeuralPlay}
              onVolumeChange={engine.updateNeuralVolume}
            />
          </SQISection>

          {/* ══ STEP 2: ATMOSPHERE ══ */}
          <SQISection number="2" title="Atmosphere">
            <div style={{ marginBottom: 16 }}>
              <div className="sqm-sub-label">
                <div className="sqm-sub-num">II</div>
                Meditation Style & Atmosphere
              </div>
              <StyleGrid
                activeStyle={activeStyle}
                onStyleSelect={setActiveStyle}
                atmosphereVolume={volumes.ambient / 100}
                onAtmosphereVolumeChange={(v) =>
                  setVolumes(prev => ({ ...prev, ambient: Math.round(v * 100) }))
                }
                onRefreshSound={handleRefreshSound}
                isRefreshingSound={isRefreshingSound}
              />
            </div>
          </SQISection>

          {/* ══ STEP 2b + 3: FREQUENCIES + REFINEMENT (side by side) ══ */}
          <div className="sqm-two-col">

            {/* ── 2b: Sacred Frequencies ── */}
            <SQISection number="2b" title="Sacred Frequencies" badge="Activate on Commence">
              <HealingFrequencySelector
                activeFrequency={healingFreq}
                volume={healingVolume}
                onSelect={handleHealingFreqSelect}
                onVolumeChange={handleHealingVolumeChange}
              />
              <div style={{ marginTop: 16 }}>
                <BrainwaveSelector
                  activeFrequency={brainwaveFreq}
                  volume={brainwaveVolume}
                  onSelect={handleBrainwaveFreqSelect}
                  onVolumeChange={handleBrainwaveVolumeChange}
                />
              </div>
            </SQISection>

            {/* ── 3: Refinement (DSP — Sacred Echo REMOVED) ── */}
            <SQISection number="3" title="Refinement">
              <div className="sqm-sub-label">
                <div className="sqm-sub-num">3</div>
                Sacred Effects
              </div>
              {/* DSPMasteringRack renders Sacred Reverb only — Sacred Echo row is hidden via CSS override below */}
              <div className="sqm-dsp-wrap">
                <DSPMasteringRack dsp={engine.dsp} onUpdate={engine.updateDSP} />
              </div>

              {/* ── 4: Alchemical Insight ── */}
              <div style={{ marginTop: 20 }}>
                <div className="sqm-sub-label">
                  <div className="sqm-sub-num">4</div>
                  Alchemical Insight
                </div>
                <SpectralInsights
                  frequencies={engine.frequencies}
                  dsp={engine.dsp}
                  atmosphereId={engine.atmosphereLayer.source}
                  neuralSource={engine.neuralLayer.source}
                />
              </div>
            </SQISection>

          </div>

          <div className="sqm-bottom-spacer" />
        </div>
      </div>

      {/* ── PAYMENT DIALOG ── */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent style={{ background: '#0B0B0B', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 24, color: 'rgba(255,255,255,0.9)', fontFamily: 'Montserrat, sans-serif' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#D4AF37', fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
              Download Sacred Master
            </DialogTitle>
            <DialogDescription style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Create and preview your alchemy for free. Pay €9.99 once to download your master file.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
            {[
              'One sacred master export',
              'All atmospheres available',
              'All healing frequencies',
              'Binaural layer included',
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <CheckCircle2 size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button
              onClick={handlePayForExport}
              disabled={paymentLoading}
              style={{ flex: 1, background: 'linear-gradient(135deg, #D4AF37, #b8942a)', border: 'none', borderRadius: 20, padding: '12px 20px', fontWeight: 800, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#050505', cursor: 'pointer' }}
            >
              {paymentLoading ? 'Loading…' : 'Pay €9.99 · Download'}
            </button>
            <button
              onClick={() => setShowPaymentDialog(false)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '12px 16px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── SACRED ECHO KILL SWITCH: hide via CSS without touching DSPMasteringRack source ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* SQI 2050: Remove Sacred Echo row from DSPMasteringRack */
        .sqm-dsp-wrap [data-effect="sacred-echo"],
        .sqm-dsp-wrap .sacred-echo-row,
        .sqm-dsp-wrap [class*="echo"]:not([class*="reverb"]) {
          display: none !important;
        }
      `}} />
    </>
  );
}

