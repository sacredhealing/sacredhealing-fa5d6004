import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
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
import AtmosphereSelector from '@/components/soulmeditate/AtmosphereSelector';
import DSPMasteringRack from '@/components/soulmeditate/DSPMasteringRack';
import SpectralInsights from '@/components/soulmeditate/SpectralInsights';
import StyleGrid, { MeditationStyle } from '@/components/soulmeditate/StyleGrid';
import HealingFrequencySelector from '@/components/soulmeditate/HealingFrequencySelector';
import BrainwaveSelector from '@/components/soulmeditate/BrainwaveSelector';

import ProcessingTerminal from '@/components/soulmeditate/ProcessingTerminal';
import VirtualChannelStrip from '@/components/soulmeditate/VirtualChannelStrip';
import AudioDAW from '@/components/soulmeditate/AudioDAW';

type VisualizerMode = 'bars' | 'wave' | 'radial';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const engine = useSoulMeditateEngine();
  const offlineExport = useOfflineExport();
  
  const [hasExportAccess, setHasExportAccess] = useState(false);
  const [exportAccessLoading, setExportAccessLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // UI State
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [activeStyle, setActiveStyle] = useState<MeditationStyle>('indian');
  const [healingFreq, setHealingFreq] = useState(432);
  const [brainwaveFreq, setBrainwaveFreq] = useState(10);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportDuration, setExportDuration] = useState(300); // Default, will be overridden by neural source
  const [exportResult, setExportResult] = useState<{ blob: Blob; format: 'wav' | 'mp3'; url: string } | null>(null);
  
  // Volume controls
  const [volumes, setVolumes] = useState({
    ambient: 50,
    binaural: 40,
    healing: 20,
    user: 80
  });

  // Frequency volumes - synced with engine
  const healingVolume = engine.solfeggioVolume;
  const brainwaveVolume = engine.binauralVolume;

  // Update engine frequency volume when sliders change — also auto-start if not playing
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

  // Initialize engine on user click (never on page load — browser autoplay policy)
  const handleInitialize = useCallback(async () => {
    await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    toast.success('Neural Engine initialized');
  }, [engine]);

  // Start neural process
  const startNeuralProcess = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      if (!engine.isInitialized) {
        await engine.initialize();
      }

      // CRITICAL: Resume audio context before starting any audio (browser autoplay policy)
      const audioCtx = engine.getAudioContext();
      if (audioCtx) {
        console.log('[StartNeuralProcess] Audio context state before resume:', audioCtx.state);
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
          console.log('[StartNeuralProcess] Audio context resumed, new state:', audioCtx.state);
        }
      } else {
        console.error('[StartNeuralProcess] Audio context is null!');
      }

      // Start solfeggio frequency (healing fundamental) - always start even without neural source
      await engine.startSolfeggio(healingFreq);
      
      // Start binaural beats - always start even without neural source
      await engine.startBinaural(200, brainwaveFreq);
      
      // Verify master volume is set
      console.log('[StartNeuralProcess] Master volume:', engine.masterVolume);
      
      // Toggle play on layers (only if source exists)
      if (engine.neuralLayer.source && !engine.neuralLayer.isPlaying) {
        engine.toggleNeuralPlay();
      }
      if (engine.atmosphereLayer.source && !engine.atmosphereLayer.isPlaying) {
        engine.toggleAtmospherePlay();
      }

      toast.success('DSP Mastering Rack Online');
    } catch (err) {
      console.error('Audio engine error:', err);
      toast.error('Audio engine ignition failure');
    } finally {
      setIsProcessing(false);
    }
  }, [engine, healingFreq, brainwaveFreq]);

  // Stop all
  const stopAll = useCallback(() => {
    if (engine.neuralLayer.isPlaying) engine.toggleNeuralPlay();
    if (engine.atmosphereLayer.isPlaying) engine.toggleAtmospherePlay();
    engine.stopSolfeggio();
    engine.stopBinaural();
  }, [engine]);

  // Toggle play/stop
  const togglePlay = useCallback(() => {
    const isAnythingPlaying = 
      engine.neuralLayer.isPlaying || 
      engine.atmosphereLayer.isPlaying || 
      engine.frequencies.solfeggio.enabled ||
      engine.frequencies.binaural.enabled;

    if (isAnythingPlaying) {
      stopAll();
    } else {
      startNeuralProcess();
    }
  }, [engine, stopAll, startNeuralProcess]);

  // Handle payment for single export (€9.99)
  const handlePayForExport = useCallback(async () => {
    if (!user) {
      toast.info('Please sign in to purchase');
      navigate('/auth');
      return;
    }
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-meditation-audio-checkout', {
        body: { option: 'per_track' },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout. Please try again.');
      setPaymentLoading(false);
    }
  }, [user, navigate]);

  // Handle offline export - gate behind payment if no access
  const handleExport = useCallback(async () => {
    if (!engine.isInitialized) {
      toast.error('Please initialize the engine first');
      return;
    }

    // Require payment for export unless user has access
    if (!hasExportAccess) {
      if (!user) {
        toast.info('Please sign in to export');
        navigate('/auth');
        return;
      }
      setShowPaymentDialog(true);
      return;
    }

    setExportResult(null);
    
    // Get atmosphere URL for the active style (use exportInput.directUrl for actual URL)
    const atmosphereUrl = engine.atmosphereLayer.exportInput?.directUrl;
    const neuralUrl = engine.neuralLayer.exportInput?.directUrl || engine.neuralLayer.source;

    // Convert engine DSP to offline renderer format
    const dspSettings = {
      reverb: engine.dsp.reverb.enabled ? engine.dsp.reverb.wet : 0,
      delay: engine.dsp.delay.enabled ? engine.dsp.delay.time : 0,
      warmth: engine.dsp.warmth.enabled ? engine.dsp.warmth.drive : 0
    };

    const result = await offlineExport.exportMeditation({
      durationSeconds: exportDuration,
      neuralAudioUrl: neuralUrl && /^https?:\/\//i.test(neuralUrl) ? neuralUrl : undefined,
      neuralSourceVolume: engine.neuralLayer.volume,
      atmosphereAudioUrl: atmosphereUrl && /^https?:\/\//i.test(atmosphereUrl) ? atmosphereUrl : undefined,
      atmosphereVolume: engine.atmosphereLayer.volume,
      solfeggioHz: engine.frequencies.solfeggio.enabled ? healingFreq : undefined,
      solfeggioVolume: engine.solfeggioVolume,
      binauralCarrierHz: 200,
      binauralBeatHz: engine.frequencies.binaural.enabled ? brainwaveFreq : undefined,
      binauralVolume: engine.binauralVolume,
      dsp: dspSettings,
      masterVolume: engine.masterVolume
    });

    if (result) {
      setExportResult({
        blob: result.blob,
        format: result.format,
        url: result.url
      });
      toast.success(`Meditation rendered as ${result.format.toUpperCase()}`);
    }
  }, [engine, offlineExport, exportDuration, healingFreq, brainwaveFreq, hasExportAccess, user, navigate]);

  // Cancel export
  const cancelExport = useCallback(() => {
    offlineExport.cancelExport();
    setExportResult(null);
  }, [offlineExport]);

  // Download the result
  const handleDownload = useCallback(() => {
    if (exportResult) {
      offlineExport.downloadResult({ ...exportResult, durationSeconds: exportDuration }, `meditation-${Date.now()}.${exportResult.format}`);
    }
  }, [exportResult, offlineExport, exportDuration]);


  // Check export access: lifetime = forever, monthly = until period end, single = after payment
  const hasValidEntitlement = (ent: { has_access: boolean; plan?: string }) => {
    if (!ent?.has_access) return false;
    return true;
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasExportAccess(false);
        setExportAccessLoading(false);
        return;
      }
      // Admin/Producer always has full Spectral Alchemy access
      if (isAdmin) {
        setHasExportAccess(true);
        setExportAccessLoading(false);
        return;
      }
      try {
        const { data: entitlements } = await supabase
          .from('creative_soul_entitlements')
          .select('has_access, plan')
          .eq('user_id', user.id);
        const { data: grantedAccess } = await supabase
          .from('admin_granted_access')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .in('access_type', ['creative_soul', 'creative_soul_meditation']);
        const hasEntitlement = entitlements?.some(hasValidEntitlement) ?? false;
        setHasExportAccess(hasEntitlement || (grantedAccess && grantedAccess.length > 0));
      } catch {
        setHasExportAccess(false);
      } finally {
        setExportAccessLoading(false);
      }
    };
    checkAccess();
  }, [user, isAdmin, searchParams.get('payment')]); // Refetch when returning from payment

  // Auto-load atmosphere when style changes (random sound from database)
  useEffect(() => {
    if (engine.isInitialized) {
      engine.loadAtmosphere(activeStyle).then((result) => {
        if (result.ok && 'fallbackFrom' in result && result.fallbackFrom) {
          const label = result.fallbackFrom.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          toast.info(`No sounds for ${label}. Loaded from Indian instead.`);
        }
      });
    }
  }, [activeStyle, engine.isInitialized]);

  // Search for new sound in library (same style, no reload)
  const [isRefreshingSound, setIsRefreshingSound] = useState(false);
  const handleRefreshSound = useCallback(async (styleId: MeditationStyle) => {
    if (!engine.isInitialized) return;
    setIsRefreshingSound(true);
    try {
      const result = await engine.loadAtmosphere(styleId);
      if (result.ok) {
        const fallbackFrom = 'fallbackFrom' in result ? result.fallbackFrom : undefined;
        toast.success(
          fallbackFrom
            ? `No sounds for ${fallbackFrom.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}. Loaded from Indian instead.`
            : 'Loaded new sound from library'
        );
      } else if (result.reason === 'no_sounds') {
        const styleLabel = styleId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        toast.error(`No sounds in library for ${styleLabel}. Try Indian or another style.`);
      } else {
        toast.error('Could not load new sound');
      }
    } finally {
      setIsRefreshingSound(false);
    }
  }, [engine]);

  // Self-activating frequency selectors — initialize engine + start audio immediately on click
  const handleHealingFreqSelect = useCallback(async (freq: number) => {
    setHealingFreq(freq);
    if (!engine.isInitialized) await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    engine.stopSolfeggio();
    await new Promise(r => setTimeout(r, 50)); // let old oscillator fully terminate
    await engine.startSolfeggio(freq);
  }, [engine]);

  const handleBrainwaveFreqSelect = useCallback(async (freq: number) => {
    setBrainwaveFreq(freq);
    if (!engine.isInitialized) await engine.initialize();
    const audioCtx = engine.getAudioContext();
    if (audioCtx?.state === 'suspended') await audioCtx.resume();
    engine.stopBinaural();
    await new Promise(r => setTimeout(r, 50)); // let old oscillator fully terminate
    await engine.startBinaural(200, freq);
  }, [engine]);

  // Sync export duration with neural source audio length
  useEffect(() => {
    if (engine.audioBuffer && engine.audioBuffer.duration > 0) {
      const audioDuration = Math.ceil(engine.audioBuffer.duration);
      setExportDuration(audioDuration);
      console.log('Export duration synced to neural source:', audioDuration, 'seconds');
    }
  }, [engine.audioBuffer]);

  const isPlaying = 
    engine.neuralLayer.isPlaying || 
    engine.atmosphereLayer.isPlaying || 
    engine.frequencies.solfeggio.enabled ||
    engine.frequencies.binaural.enabled;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Processing Terminal Overlay */}
      <ProcessingTerminal isProcessing={isProcessing} />

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header */}
        <header className="mb-4 sm:mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                Spectral Alchemy
              </h1>
              <p className="text-[10px] sm:text-xs text-white/50">Neural Production Mastering Suite</p>
            </div>

            {!engine.isInitialized ? (
              <Button
                onClick={handleInitialize}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shrink-0 text-xs sm:text-sm"
              >
                <Power className="w-4 h-4 mr-1" />
                Initialize
              </Button>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shrink-0 text-[10px] sm:text-xs">
                Engine Active
              </Badge>
            )}
          </div>

          {/* Engine controls row - only when initialized */}
          {engine.isInitialized && (
            <div className="flex items-center gap-2 pl-10 sm:pl-14 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={engine.playTestTone}
                className="text-[10px] sm:text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 h-7 px-2"
              >
                🔊 Test Tone
              </Button>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-white/60" />
                <Slider
                  value={[engine.masterVolume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={([v]) => engine.updateMasterVolume(v)}
                  className="w-16 sm:w-20 [&_[role=slider]]:bg-white"
                />
                <span className="text-[10px] sm:text-xs text-white/60 w-7 tabular-nums">
                  {Math.round(engine.masterVolume * 100)}%
                </span>
              </div>
            </div>
          )}
        </header>

        {/* Visualizer */}
        <div className="mb-4 sm:mb-6 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20">
          <div className="bg-black/60 backdrop-blur-xl rounded-xl p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs sm:text-sm text-white/70">Spectral Visualizer</span>
                <Badge variant="outline" className="text-[10px] border-white/20 px-1.5 py-0">2048 FFT</Badge>
              </div>
              <div className="flex items-center gap-0.5 ml-auto">
                {(['bars', 'wave', 'radial'] as VisualizerMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisualizerMode(mode)}
                    className={`text-[10px] sm:text-xs capitalize h-7 px-2 ${
                      visualizerMode === mode
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {mode === 'bars' && <Activity className="w-3 h-3 sm:mr-1" />}
                    {mode === 'wave' && <Waves className="w-3 h-3 sm:mr-1" />}
                    {mode === 'radial' && <Eye className="w-3 h-3 sm:mr-1" />}
                    <span className="hidden sm:inline">{mode}</span>
                  </Button>
                ))}
              </div>
            </div>
            <SpectralVisualizer
              frequencyData={engine.analyserData?.frequencyData || null}
              timeData={engine.analyserData?.timeData || null}
              mode={visualizerMode}
              height={140}
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Button
            size="lg"
            onClick={togglePlay}
            disabled={!engine.isInitialized}
            className={`px-4 sm:px-8 text-sm sm:text-base ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                Stop Session
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
                Begin Session
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            disabled={!engine.isInitialized || offlineExport.progress.isExporting}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10 px-4 sm:px-8 text-sm sm:text-base"
          >
            {offlineExport.progress.isExporting ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
            )}
            Export Master
          </Button>
        </div>

        {/* Export Progress Panel */}
        {(offlineExport.progress.isExporting || exportResult) && (
          <div className="mb-6">
            <Card className="bg-black/40 backdrop-blur-xl border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {exportResult ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    )}
                    <span className="text-sm text-white/80">
                      {exportResult 
                        ? `Export Complete (${exportResult.format.toUpperCase()})`
                        : offlineExport.progress.step || 'Rendering...'}
                    </span>
                    {exportResult && (
                      <Badge variant="outline" className={`text-xs ${
                        exportResult.format === 'mp3' 
                          ? 'border-emerald-500/50 text-emerald-400' 
                          : 'border-amber-500/50 text-amber-400'
                      }`}>
                        {exportResult.format.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60 tabular-nums">
                      {exportResult ? '100' : Math.round(offlineExport.progress.percent)}%
                    </span>
                    {!exportResult && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelExport}
                        className="text-white/50 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Progress
                  value={exportResult ? 100 : offlineExport.progress.percent}
                  className="h-2 mb-3"
                />
                
                {/* Fast render indicator */}
                {offlineExport.progress.isExporting && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-300">
                      Offline render: Full meditation in seconds, not real-time
                    </span>
                  </div>
                )}
                
                {exportResult && (
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Meditation ({exportResult.format.toUpperCase()})
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Neural Source Intake - Above Style Grid */}
        <div className="mb-6">
          <p className="text-base font-semibold text-white/90 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" />
            I. Neural Source Intake
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeuralSourceInput
              layer={engine.neuralLayer}
              onLoadFile={engine.loadNeuralSource}
              onLoadUrl={engine.loadNeuralSource}
              onTogglePlay={engine.toggleNeuralPlay}
              onVolumeChange={engine.updateNeuralVolume}
            />
            
          </div>
        </div>

        {/* Virtual Channel Strip - Vocal Editor */}
        {engine.neuralLayer.source && (
          <div className="mb-6">
            <VirtualChannelStrip
              sourceName={engine.neuralLayer.source || 'AUDIO SOURCE'}
              autoGainDb={8.7}
              lowCutEnabled={engine.eqSettings.lowCutEnabled}
              onLowCutToggle={engine.toggleLowCut}
              onEqChange={engine.updateEQ}
              eqValues={{
                weight: engine.eqSettings.weight,
                presence: engine.eqSettings.presence,
                air: engine.eqSettings.air
              }}
              noiseGate={{
                threshold: engine.eqSettings.noiseGateThreshold ?? -40,
                attack: engine.eqSettings.noiseGateAttack ?? 5,
                release: engine.eqSettings.noiseGateRelease ?? 120,
                range: engine.eqSettings.noiseGateRange ?? -72,
                enabled: engine.eqSettings.noiseGateEnabled ?? true,
              }}
              onNoiseGateChange={engine.updateNoiseGate}
            />
          </div>
        )}

        {/* DAW Timeline Editor */}
        {engine.audioBuffer && (
          <div className="mb-6">
            <AudioDAW
              audioBuffer={engine.audioBuffer}
              regions={engine.dawRegions}
              currentTime={engine.dawCurrentTime}
              duration={engine.audioBuffer.duration}
              isPlaying={engine.neuralLayer.isPlaying}
              onRegionsChange={engine.updateDawRegions}
              onSeek={engine.dawSeek}
              onPlayPause={engine.dawTogglePlay}
              onStop={engine.dawStop}
            />
          </div>
        )}

        {/* Style Grid + Atmosphere Volume */}
        <div className="mb-6">
          <StyleGrid
            activeStyle={activeStyle}
            onStyleSelect={setActiveStyle}
            atmosphereVolume={engine.atmosphereLayer.volume}
            onAtmosphereVolumeChange={engine.updateAtmosphereVolume}
            onRefreshSound={engine.isInitialized ? handleRefreshSound : undefined}
            isRefreshingSound={isRefreshingSound}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Center Column - Frequencies */}
          <div className="space-y-4">
            <div className="px-1">
              <p className="text-base font-semibold text-white/90 mb-3">III. Quantum Calibration</p>
            </div>
            <HealingFrequencySelector 
              activeFrequency={healingFreq} 
              volume={healingVolume}
              onSelect={handleHealingFreqSelect}
              onVolumeChange={handleHealingVolumeChange}
            />
            <BrainwaveSelector 
              activeFrequency={brainwaveFreq} 
              volume={brainwaveVolume}
              onSelect={handleBrainwaveFreqSelect}
              onVolumeChange={handleBrainwaveVolumeChange}
            />
          </div>

          {/* Right Column - DSP & Insights */}
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white/90">
                  IV. DSP Mastering Rack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DSPMasteringRack dsp={engine.dsp} onUpdate={engine.updateDSP} />
              </CardContent>
            </Card>

            <SpectralInsights
              frequencies={engine.frequencies}
              dsp={engine.dsp}
              atmosphereId={engine.atmosphereLayer.source}
              neuralSource={engine.neuralLayer.source}
            />
          </div>
        </div>
      </div>

      {/* Payment required for export */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">Download Master File</DialogTitle>
            <DialogDescription className="text-white/70">
              Create and preview your meditation for free. Pay €9.99 once to download your master file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              One meditation export
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              All styles available
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              High-quality output
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              Pay as you go
            </div>
            <Button
              onClick={handlePayForExport}
              disabled={paymentLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-6"
            >
              {paymentLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Pay €9.99 Per Track
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
