import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Scissors,
  X,
  CheckCircle2,
  AlertCircle,
  Mic
} from 'lucide-react';
import { useSoulMeditateEngine } from '@/hooks/useSoulMeditateEngine';
import { useBackendExport } from '@/hooks/useBackendExport';
import { useBrowserRecording } from '@/hooks/useBrowserRecording';
import SpectralVisualizer from '@/components/soulmeditate/SpectralVisualizer';
import NeuralSourceInput from '@/components/soulmeditate/NeuralSourceInput';
import AtmosphereSelector from '@/components/soulmeditate/AtmosphereSelector';
import DSPMasteringRack from '@/components/soulmeditate/DSPMasteringRack';
import SpectralInsights from '@/components/soulmeditate/SpectralInsights';
import StyleGrid, { MeditationStyle } from '@/components/soulmeditate/StyleGrid';
import HealingFrequencySelector from '@/components/soulmeditate/HealingFrequencySelector';
import BrainwaveSelector from '@/components/soulmeditate/BrainwaveSelector';
import YouTubeLinker from '@/components/soulmeditate/YouTubeLinker';
import ProcessingTerminal from '@/components/soulmeditate/ProcessingTerminal';
import { supabase } from '@/integrations/supabase/client';

type VisualizerMode = 'bars' | 'wave' | 'radial';
type StemMode = 'full_mix' | 'vocals_only' | 'music_only' | 'stems_all';

const STEM_OPTIONS = [
  { value: 'full_mix', label: 'Full Mix' },
  { value: 'vocals_only', label: 'Vocals Only' },
  { value: 'music_only', label: 'Music Only' },
  { value: 'stems_all', label: 'All Stems' },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const engine = useSoulMeditateEngine();
  const backendExport = useBackendExport();
  const browserRecording = useBrowserRecording();
  
  // UI State
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [activeStyle, setActiveStyle] = useState<MeditationStyle>('indian');
  const [healingFreq, setHealingFreq] = useState(432);
  const [brainwaveFreq, setBrainwaveFreq] = useState(10);
  const [stemMode, setStemMode] = useState<StemMode>('full_mix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportDuration, setExportDuration] = useState(300); // 5 minutes default
  
  // Browser recording state
  const [isBrowserRecording, setIsBrowserRecording] = useState(false);
  const browserRecordingJobIdRef = useRef<string | null>(null);
  
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

  // Update engine frequency volume when sliders change
  const handleHealingVolumeChange = useCallback((vol: number) => {
    engine.updateSolfeggioVolume(vol);
  }, [engine]);

  const handleBrainwaveVolumeChange = useCallback((vol: number) => {
    engine.updateBinauralVolume(vol);
  }, [engine]);

  // Initialize engine on mount
  const handleInitialize = useCallback(async () => {
    await engine.initialize();
    toast.success('Neural Engine initialized');
  }, [engine]);

  // Start neural process
  const startNeuralProcess = useCallback(async () => {
    if (!engine.neuralLayer.source && !engine.atmosphereLayer.source) {
      toast.error('Neural Source missing. Upload audio or link YouTube stream.');
      return;
    }

    setIsProcessing(true);
    
    try {
      if (!engine.isInitialized) {
        await engine.initialize();
      }

      // Start solfeggio frequency
      engine.startSolfeggio(healingFreq);
      
      // Start binaural if enabled
      engine.startBinaural(200, brainwaveFreq);
      
      // Toggle play on layers
      if (engine.neuralLayer.source && !engine.neuralLayer.isPlaying) {
        engine.toggleNeuralPlay();
      }
      if (engine.atmosphereLayer.source && !engine.atmosphereLayer.isPlaying) {
        engine.toggleAtmospherePlay();
      }

      toast.success('DSP Mastering Rack Online');
    } catch (err) {
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

  // Handle backend export
  const handleExport = useCallback(async () => {
    const directUrl = engine.neuralLayer.exportInput?.directUrl;
    const uploadPath = engine.neuralLayer.exportInput?.uploadPath;

    const looksLikeUrl = (v?: string | null) => !!v && /^https?:\/\//i.test(v);

    const jobId = await backendExport.startExport({
      style_slug: activeStyle,
      frequency_hz: healingFreq,
      binaural: {
        enabled: engine.frequencies.binaural.enabled,
        beat_hz: brainwaveFreq,
        carrier_hz: 200,
        volume: engine.binauralVolume,
      },
      healing_frequency: {
        enabled: engine.frequencies.solfeggio.enabled,
        hz: healingFreq,
        volume: engine.solfeggioVolume,
      },
      stem: {
        pre: {
          enabled: stemMode !== 'full_mix',
          action:
            stemMode === 'vocals_only'
              ? 'voice_only'
              : stemMode === 'music_only'
                ? 'remove_music'
                : 'keep_both',
        },
      },
      // Prefer export-safe inputs (uploaded/public URL). Fallback to layer.source if it's already a URL.
      source_audio_url: directUrl || (looksLikeUrl(engine.neuralLayer.source) ? engine.neuralLayer.source! : undefined),
      upload_storage_path: uploadPath,
      // Mix levels
      source_volume: engine.neuralLayer.volume,
      ambient_volume: engine.atmosphereLayer.volume,
      duration: exportDuration,
    });

    // Check if we need browser fallback
    if (jobId && backendExport.currentJob?.useBrowserFallback) {
      browserRecordingJobIdRef.current = jobId;
      startBrowserRecording(jobId);
    }
  }, [activeStyle, healingFreq, brainwaveFreq, stemMode, engine, backendExport, exportDuration]);

  // Browser recording fallback
  const startBrowserRecording = useCallback(async (jobId: string) => {
    if (!engine.isInitialized) {
      await engine.initialize();
    }

    const ctx = engine.getAudioContext();
    const masterNode = engine.getMasterNode();

    if (!ctx || !masterNode) {
      toast.error('Audio engine not ready');
      backendExport.updateJobStatus({
        status: 'failed',
        error: 'Audio engine not initialized',
        progressStep: 'Failed',
      });
      return;
    }

    setIsBrowserRecording(true);
    toast.info(`Recording ${Math.round(exportDuration / 60)} min meditation. Keep this tab open.`);

    // Start playback if not already playing
    if (!engine.neuralLayer.isPlaying && engine.neuralLayer.source) {
      engine.toggleNeuralPlay();
    }
    if (!engine.atmosphereLayer.isPlaying && engine.atmosphereLayer.source) {
      engine.toggleAtmospherePlay();
    }
    if (!engine.frequencies.solfeggio.enabled) {
      engine.startSolfeggio(healingFreq);
    }
    if (!engine.frequencies.binaural.enabled) {
      engine.startBinaural(200, brainwaveFreq);
    }

    // Start recording
    const destination = browserRecording.startRecording(ctx, masterNode, {
      durationSeconds: exportDuration,
      onProgress: (progress, elapsed) => {
        backendExport.updateJobStatus({
          progress,
          progressStep: `Recording: ${formatTime(elapsed)} / ${formatTime(exportDuration)}`,
        });
      },
    });

    if (!destination) {
      setIsBrowserRecording(false);
      backendExport.updateJobStatus({
        status: 'failed',
        error: 'Failed to start browser recording',
        progressStep: 'Recording failed',
      });
      return;
    }

    // Wait for recording to complete
    const checkComplete = setInterval(async () => {
      if (browserRecording.state.status === 'idle' || browserRecording.state.elapsedSeconds >= exportDuration) {
        clearInterval(checkComplete);

        // Stop recording and get blob
        const blob = await browserRecording.stopRecording();
        if (!blob) {
          setIsBrowserRecording(false);
          backendExport.updateJobStatus({
            status: 'failed',
            error: 'No audio recorded',
            progressStep: 'Recording failed',
          });
          return;
        }

        // Upload
        backendExport.updateJobStatus({
          progress: 60,
          progressStep: 'Uploading audio…',
        });

        const uploadedUrl = await browserRecording.uploadRecording(blob, jobId);
        if (!uploadedUrl) {
          setIsBrowserRecording(false);
          backendExport.updateJobStatus({
            status: 'failed',
            error: 'Upload failed',
            progressStep: 'Upload failed',
          });
          return;
        }

        // Try LANDR mastering
        backendExport.updateJobStatus({
          progress: 70,
          progressStep: 'Mastering with LANDR…',
        });

        const finalUrl = await browserRecording.masterWithLandr(jobId, uploadedUrl, 'meditation_warm');
        
        setIsBrowserRecording(false);
        backendExport.markCompleted(finalUrl || uploadedUrl);
      }
    }, 1000);
  }, [engine, browserRecording, backendExport, exportDuration, healingFreq, brainwaveFreq]);

  // Cancel browser recording
  const cancelBrowserRecording = useCallback(() => {
    browserRecording.cancelRecording();
    setIsBrowserRecording(false);
    backendExport.cancelExport();
  }, [browserRecording, backendExport]);

  // Handle YouTube extracted audio
  const handleYouTubeAudio = useCallback((url: string, title: string) => {
    engine.loadNeuralSource(url);
    toast.success(`Loaded: ${title}`);
  }, [engine]);

  // Auto-load atmosphere when style changes (random sound from database)
  useEffect(() => {
    if (engine.isInitialized) {
      engine.loadAtmosphere(activeStyle);
    }
  }, [activeStyle, engine.isInitialized]);

  // Sync frequencies when changed
  useEffect(() => {
    if (engine.frequencies.solfeggio.enabled && engine.frequencies.solfeggio.hz !== healingFreq) {
      engine.stopSolfeggio();
      engine.startSolfeggio(healingFreq);
    }
  }, [healingFreq, engine]);

  useEffect(() => {
    if (engine.frequencies.binaural.enabled && engine.frequencies.binaural.beatHz !== brainwaveFreq) {
      engine.stopBinaural();
      engine.startBinaural(200, brainwaveFreq);
    }
  }, [brainwaveFreq, engine]);

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

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Spectral Alchemy
              </h1>
              <p className="text-xs text-white/50">Neural Production Mastering Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stem Mode Selector */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Scissors className="w-4 h-4 text-cyan-400" />
              <Select value={stemMode} onValueChange={(v) => setStemMode(v as StemMode)}>
                <SelectTrigger className="w-[120px] h-7 text-xs bg-transparent border-0 text-cyan-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STEM_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!engine.isInitialized ? (
              <Button
                onClick={handleInitialize}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Power className="w-4 h-4 mr-2" />
                Initialize
              </Button>
            ) : (
              <>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                  Engine Active
                </Badge>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Volume2 className="w-4 h-4 text-white/60" />
                  <Slider
                    value={[engine.masterVolume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([v]) => engine.updateMasterVolume(v)}
                    className="w-20 [&_[role=slider]]:bg-white"
                  />
                  <span className="text-xs text-white/60 w-8">
                    {Math.round(engine.masterVolume * 100)}%
                  </span>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Visualizer */}
        <div className="mb-6 p-1 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20">
          <div className="bg-black/60 backdrop-blur-xl rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/70">Spectral Visualizer</span>
                <Badge variant="outline" className="text-xs border-white/20">2048 FFT</Badge>
              </div>
              <div className="flex items-center gap-1">
                {(['bars', 'wave', 'radial'] as VisualizerMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => setVisualizerMode(mode)}
                    className={`text-xs capitalize ${
                      visualizerMode === mode
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {mode === 'bars' && <Activity className="w-3 h-3 mr-1" />}
                    {mode === 'wave' && <Waves className="w-3 h-3 mr-1" />}
                    {mode === 'radial' && <Eye className="w-3 h-3 mr-1" />}
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
            <SpectralVisualizer
              frequencyData={engine.analyserData?.frequencyData || null}
              timeData={engine.analyserData?.timeData || null}
              mode={visualizerMode}
              height={160}
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            size="lg"
            onClick={togglePlay}
            disabled={!engine.isInitialized}
            className={`px-8 ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Stop Session
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Begin Session
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleExport}
            disabled={!engine.isInitialized || backendExport.isExporting || isBrowserRecording}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {backendExport.isExporting || isBrowserRecording ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Export Master
          </Button>
        </div>

        {/* Export Progress Panel */}
        {(backendExport.currentJob || isBrowserRecording) && (
          <div className="mb-6">
            <Card className="bg-black/40 backdrop-blur-xl border-cyan-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {backendExport.currentJob?.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : backendExport.currentJob?.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : isBrowserRecording || backendExport.currentJob?.status === 'browser_recording' ? (
                      <Mic className="w-5 h-5 text-pink-400 animate-pulse" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                    )}
                    <span className="text-sm text-white/80">
                      {backendExport.currentJob?.status === 'completed'
                        ? 'Export Complete'
                        : backendExport.currentJob?.status === 'failed'
                          ? 'Export Failed'
                          : isBrowserRecording
                            ? browserRecording.state.statusMessage || 'Recording in browser…'
                            : backendExport.currentJob?.progressStep || 'Processing…'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/60 tabular-nums">
                      {Math.round(isBrowserRecording ? browserRecording.state.progress : (backendExport.currentJob?.progress || 0))}%
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isBrowserRecording ? cancelBrowserRecording : backendExport.cancelExport}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={isBrowserRecording ? browserRecording.state.progress : (backendExport.currentJob?.progress || 0)}
                  className="h-2 mb-3"
                />
                
                {/* Browser recording indicator */}
                {isBrowserRecording && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded bg-pink-500/10 border border-pink-500/20">
                    <Mic className="w-4 h-4 text-pink-400" />
                    <span className="text-xs text-pink-300">
                      Recording in browser • Keep this tab open • {formatTime(browserRecording.state.elapsedSeconds)} elapsed
                    </span>
                  </div>
                )}
                
                {backendExport.currentJob?.status === 'completed' && backendExport.currentJob.resultUrl && (
                  <Button
                    onClick={backendExport.downloadResult}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Meditation Audio
                  </Button>
                )}
                {backendExport.currentJob?.status === 'failed' && backendExport.currentJob.error && (
                  <p className="text-sm text-red-400">{backendExport.currentJob.error}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Neural Source Intake - Above Style Grid */}
        <div className="mb-6">
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-white/90">
                <Layers className="w-4 h-4 text-pink-400" />
                I. Neural Source Intake
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NeuralSourceInput
                layer={engine.neuralLayer}
                onLoadFile={engine.loadNeuralSource}
                onLoadUrl={engine.loadNeuralSource}
                onTogglePlay={engine.toggleNeuralPlay}
                onVolumeChange={engine.updateNeuralVolume}
              />
              <YouTubeLinker onAudioExtracted={handleYouTubeAudio} />
            </CardContent>
          </Card>
        </div>

        {/* Style Grid + Atmosphere Volume */}
        <div className="mb-6">
          <StyleGrid
            activeStyle={activeStyle}
            onStyleSelect={setActiveStyle}
            atmosphereVolume={engine.atmosphereLayer.volume}
            onAtmosphereVolumeChange={engine.updateAtmosphereVolume}
          />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Center Column - Frequencies */}
          <div className="space-y-6">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white/90">
                  III. Quantum Calibration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <HealingFrequencySelector 
                  activeFrequency={healingFreq} 
                  volume={healingVolume}
                  onSelect={setHealingFreq}
                  onVolumeChange={handleHealingVolumeChange}
                />
                <BrainwaveSelector 
                  activeFrequency={brainwaveFreq} 
                  volume={brainwaveVolume}
                  onSelect={setBrainwaveFreq}
                  onVolumeChange={handleBrainwaveVolumeChange}
                />
              </CardContent>
            </Card>
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
    </div>
  );
}
