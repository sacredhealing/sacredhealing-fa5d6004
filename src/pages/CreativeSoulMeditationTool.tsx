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
  Zap
} from 'lucide-react';
import { useSoulMeditateEngine } from '@/hooks/useSoulMeditateEngine';
import { useOfflineExport } from '@/hooks/useOfflineExport';
import { useTimelineEditor } from '@/hooks/useTimelineEditor';
import { useDAWPlaybackEngine } from '@/hooks/useDAWPlaybackEngine';
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
import VirtualChannelStrip from '@/components/soulmeditate/VirtualChannelStrip';
import DAWTransportBar from '@/components/soulmeditate/DAWTransportBar';
import ClipTimeline from '@/components/soulmeditate/ClipTimeline';

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
  const offlineExport = useOfflineExport();
  const dawEngine = useDAWPlaybackEngine();
  
  // Create a ref for the neural audio element (used by timeline)
  const neuralAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize timeline editor
  const timeline = useTimelineEditor(neuralAudioRef);
  
  // Ref to track if DAW sync is active
  const dawSyncActiveRef = useRef(false);
  
  // UI State
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');
  const [activeStyle, setActiveStyle] = useState<MeditationStyle>('indian');
  const [healingFreq, setHealingFreq] = useState(432);
  const [brainwaveFreq, setBrainwaveFreq] = useState(10);
  const [stemMode, setStemMode] = useState<StemMode>('full_mix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportDuration, setExportDuration] = useState(300); // 5 minutes default
  const [exportResult, setExportResult] = useState<{ blob: Blob; format: 'wav' | 'mp3'; url: string } | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  
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

  // Start neural process - now synced with DAW transport
  const startNeuralProcess = useCallback(async () => {
    if (!engine.neuralLayer.source && !engine.atmosphereLayer.source && timeline.clips.length === 0) {
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
      
      // Also start DAW playback if there are clips on the timeline
      if (timeline.clips.length > 0) {
        await dawEngine.initialize();
        const clipUrlMap = timeline.getClipUrlMap();
        const eqSettings = {
          lowCut: engine.eqSettings?.lowCutEnabled ?? true,
          boxyGain: engine.eqSettings?.weight ?? -0.5,
          presenceGain: engine.eqSettings?.presence ?? 3,
          airGain: engine.eqSettings?.air ?? 1
        };
        await dawEngine.startPlayback(timeline.clips, clipUrlMap, timeline.currentTime, eqSettings);
        dawSyncActiveRef.current = true;
        timeline.setIsPlaying(true);
      }

      toast.success('DSP Mastering Rack Online');
    } catch (err) {
      toast.error('Audio engine ignition failure');
    } finally {
      setIsProcessing(false);
    }
  }, [engine, dawEngine, timeline, healingFreq, brainwaveFreq]);

  // Stop all
  const stopAll = useCallback(() => {
    if (engine.neuralLayer.isPlaying) engine.toggleNeuralPlay();
    if (engine.atmosphereLayer.isPlaying) engine.toggleAtmospherePlay();
    engine.stopSolfeggio();
    engine.stopBinaural();
    dawEngine.stopPlayback();
    dawSyncActiveRef.current = false;
  }, [engine, dawEngine]);

  // Toggle play/stop
  const togglePlay = useCallback(() => {
    const isAnythingPlaying = 
      engine.neuralLayer.isPlaying || 
      engine.atmosphereLayer.isPlaying || 
      engine.frequencies.solfeggio.enabled ||
      engine.frequencies.binaural.enabled ||
      dawEngine.isPlaying;

    if (isAnythingPlaying) {
      stopAll();
    } else {
      startNeuralProcess();
    }
  }, [engine, dawEngine, stopAll, startNeuralProcess]);

  // Sync DAW engine with timeline clips when they change
  useEffect(() => {
    if (!dawEngine.isPlaying || !dawSyncActiveRef.current) return;
    
    // Get clip URLs and sync with DAW engine
    const clipUrlMap = timeline.getClipUrlMap();
    const eqSettings = {
      lowCut: engine.eqSettings?.lowCutEnabled ?? true,
      boxyGain: engine.eqSettings?.weight ?? -0.5,
      presenceGain: engine.eqSettings?.presence ?? 3,
      airGain: engine.eqSettings?.air ?? 1
    };
    
    dawEngine.syncClips(timeline.clips, clipUrlMap, timeline.currentTime, eqSettings);
  }, [timeline.clips, dawEngine, engine.eqSettings]);

  // Start DAW playback with timeline sync
  const startDAWPlayback = useCallback(async () => {
    if (timeline.clips.length === 0) {
      toast.info('No clips to play. Add audio first.');
      return;
    }

    await dawEngine.initialize();
    
    const clipUrlMap = timeline.getClipUrlMap();
    const eqSettings = {
      lowCut: engine.eqSettings?.lowCutEnabled ?? true,
      boxyGain: engine.eqSettings?.weight ?? -0.5,
      presenceGain: engine.eqSettings?.presence ?? 3,
      airGain: engine.eqSettings?.air ?? 1
    };
    
    await dawEngine.startPlayback(timeline.clips, clipUrlMap, timeline.currentTime, eqSettings);
    dawSyncActiveRef.current = true;
    timeline.setIsPlaying(true);
    
    // Also start atmosphere and frequencies
    if (!engine.isInitialized) await engine.initialize();
    engine.startSolfeggio(healingFreq);
    engine.startBinaural(200, brainwaveFreq);
    if (engine.atmosphereLayer.source && !engine.atmosphereLayer.isPlaying) {
      engine.toggleAtmospherePlay();
    }
    
    toast.success('DAW Playback: Quantum Sync Active');
  }, [dawEngine, engine, timeline, healingFreq, brainwaveFreq]);

  // Stop DAW playback
  const stopDAWPlayback = useCallback(() => {
    dawEngine.stopPlayback();
    dawSyncActiveRef.current = false;
    timeline.setIsPlaying(false);
    stopAll();
  }, [dawEngine, timeline, stopAll]);

  // Handle offline export - fast rendering using OfflineAudioContext
  const handleExport = useCallback(async () => {
    if (!engine.isInitialized) {
      toast.error('Please initialize the engine first');
      return;
    }

    setExportResult(null);
    
    // Get atmosphere URL for the active style (use exportInput.directUrl for actual URL)
    const atmosphereUrl = engine.atmosphereLayer.exportInput?.directUrl;
    const neuralUrl = engine.neuralLayer.exportInput?.directUrl || engine.neuralLayer.source;

    // Convert engine DSP to offline renderer format (with null safety)
    const dspSettings = {
      reverb: engine.dsp?.reverb?.enabled ? engine.dsp.reverb.wet : 0,
      delay: engine.dsp?.delay?.enabled ? engine.dsp.delay.time : 0,
      warmth: engine.dsp?.warmth?.enabled ? engine.dsp.warmth.drive : 0
    };

    const result = await offlineExport.exportMeditation({
      durationSeconds: exportDuration,
      neuralAudioUrl: neuralUrl && /^https?:\/\//i.test(neuralUrl) ? neuralUrl : undefined,
      atmosphereAudioUrl: atmosphereUrl && /^https?:\/\//i.test(atmosphereUrl) ? atmosphereUrl : undefined,
      solfeggioHz: engine.frequencies?.solfeggio?.enabled ? healingFreq : undefined,
      solfeggioVolume: engine.solfeggioVolume ?? 0.5,
      binauralCarrierHz: 200,
      binauralBeatHz: engine.frequencies?.binaural?.enabled ? brainwaveFreq : undefined,
      binauralVolume: engine.binauralVolume ?? 0.5,
      dsp: dspSettings,
      masterVolume: engine.masterVolume ?? 0.8
    });

    if (result) {
      setExportResult({
        blob: result.blob,
        format: result.format,
        url: result.url
      });
      toast.success(`Meditation rendered as ${result.format.toUpperCase()}`);
    }
  }, [engine, offlineExport, exportDuration, healingFreq, brainwaveFreq]);

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

  // Handle YouTube extracted audio
  const handleYouTubeAudio = useCallback((url: string, title: string) => {
    engine.loadNeuralSource(url);
    // Add clip to timeline
    const audio = new Audio(url);
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('loadedmetadata', () => {
      timeline.addClip(title, audio.duration);
      timeline.setDuration(Math.max(audio.duration + 30, 300));
    });
    audio.load();
    toast.success(`Loaded: ${title}`);
  }, [engine, timeline]);

  // Add clip to timeline when neural source is loaded
  const handleNeuralSourceLoad = useCallback(async (file: File): Promise<boolean> => {
    const result = await engine.loadNeuralSource(file);
    
    // Get audio duration and add to timeline with waveform extraction
    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      // Pass the file for waveform extraction
      timeline.addClip(file.name, audio.duration, file);
      timeline.setDuration(Math.max(audio.duration + 30, 300));
      neuralAudioRef.current = audio;
    });
    
    audio.load();
    return result;
  }, [engine, timeline]);

  // Auto-load atmosphere when style changes (plays sound immediately for feedback)
  useEffect(() => {
    const loadAndPlayAtmosphere = async () => {
      if (!engine.isInitialized) {
        await engine.initialize();
      }
      await engine.loadAtmosphere(activeStyle);
      // Auto-play the atmosphere briefly to give audio feedback
      if (!engine.atmosphereLayer.isPlaying && engine.atmosphereLayer.source) {
        engine.toggleAtmospherePlay();
        toast.success(`Loaded: ${activeStyle} atmosphere`);
      }
    };
    
    loadAndPlayAtmosphere();
  }, [activeStyle]);

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
    engine.frequencies.binaural.enabled ||
    dawEngine.isPlaying;

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

        {/* DAW Transport Bar */}
        <div className="mb-4">
          <DAWTransportBar
            isPlaying={timeline.isPlaying || dawEngine.isPlaying}
            currentTime={timeline.currentTime}
            duration={timeline.duration}
            onPlayPause={() => {
              if (timeline.isPlaying || dawEngine.isPlaying) {
                stopDAWPlayback();
              } else {
                startDAWPlayback();
              }
            }}
            onStop={() => {
              stopDAWPlayback();
              timeline.stop();
            }}
            onSeek={(time) => {
              timeline.seek(time);
              // Re-sync clips at new position if playing
              if (dawEngine.isPlaying) {
                const clipUrlMap = timeline.getClipUrlMap();
                const eqSettings = {
                  lowCut: engine.eqSettings?.lowCutEnabled ?? true,
                  boxyGain: engine.eqSettings?.weight ?? -0.5,
                  presenceGain: engine.eqSettings?.presence ?? 3,
                  airGain: engine.eqSettings?.air ?? 1
                };
                dawEngine.syncClips(timeline.clips, clipUrlMap, time, eqSettings, true);
              }
            }}
            onRewind={timeline.rewind}
            onForward={timeline.forward}
            onSkipStart={timeline.skipStart}
            onSkipEnd={timeline.skipEnd}
            isLooping={timeline.isLooping}
            onLoopToggle={timeline.toggleLoop}
            zoom={timeline.zoom}
            onZoomChange={timeline.setZoom}
            isScissorMode={timeline.isScissorMode}
            onScissorToggle={timeline.toggleScissorMode}
            hasUnsavedChanges={timeline.hasUnsavedChanges}
            onUndo={timeline.undo}
          />
        </div>

        {/* Clip Timeline / Quantum Scissor Editor */}
        {showTimeline && timeline.clips.length > 0 && (
          <div className="mb-6">
            <ClipTimeline
              clips={timeline.clips}
              currentTime={timeline.currentTime}
              duration={timeline.duration}
              zoom={timeline.zoom}
              isScissorMode={timeline.isScissorMode}
              selectedClipId={timeline.selectedClipId}
              onClipSelect={timeline.selectClip}
              onClipDelete={timeline.deleteClip}
              onClipCut={timeline.cutClip}
              onClipMove={timeline.moveClip}
              onClipTrim={timeline.trimClip}
              onClipMute={timeline.muteClip}
              onClipLock={timeline.lockClip}
              onClipDuplicate={timeline.duplicateClip}
              onSeek={timeline.seek}
            />
          </div>
        )}

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
            disabled={!engine.isInitialized || offlineExport.progress.isExporting}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            {offlineExport.progress.isExporting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Zap className="w-5 h-5 mr-2" />
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
                onLoadFile={handleNeuralSourceLoad}
                onLoadUrl={(url) => engine.loadNeuralSource(url)}
                onTogglePlay={engine.toggleNeuralPlay}
                onVolumeChange={engine.updateNeuralVolume}
              />
              <YouTubeLinker onAudioExtracted={handleYouTubeAudio} />
            </CardContent>
          </Card>
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
