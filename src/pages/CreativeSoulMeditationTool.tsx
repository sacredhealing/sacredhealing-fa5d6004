import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Volume2, Headphones, Power, Eye, Waves, Activity } from 'lucide-react';
import { useSoulMeditateEngine } from '@/hooks/useSoulMeditateEngine';
import SpectralVisualizer from '@/components/soulmeditate/SpectralVisualizer';
import NeuralSourceInput from '@/components/soulmeditate/NeuralSourceInput';
import AtmosphereSelector from '@/components/soulmeditate/AtmosphereSelector';
import FrequencyPanel from '@/components/soulmeditate/FrequencyPanel';
import DSPMasteringRack from '@/components/soulmeditate/DSPMasteringRack';
import SpectralInsights from '@/components/soulmeditate/SpectralInsights';

type VisualizerMode = 'bars' | 'wave' | 'radial';

export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const engine = useSoulMeditateEngine();
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  const handleInitialize = async () => {
    await engine.initialize();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                SoulMeditate
              </h1>
              <p className="text-sm text-white/50">Neural Healing & Frequency Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!engine.isInitialized ? (
              <Button
                onClick={handleInitialize}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Power className="w-4 h-4 mr-2" />
                Initialize Engine
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
                    className="w-24 [&_[role=slider]]:bg-white"
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
              <div className="flex gap-1">
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
              height={180}
            />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sources */}
          <div className="space-y-6">
            <NeuralSourceInput
              layer={engine.neuralLayer}
              onLoadFile={engine.loadNeuralSource}
              onLoadUrl={engine.loadNeuralSource}
              onTogglePlay={engine.toggleNeuralPlay}
              onVolumeChange={engine.updateNeuralVolume}
            />
            <AtmosphereSelector
              layer={engine.atmosphereLayer}
              atmosphereLibrary={engine.ATMOSPHERE_LIBRARY}
              onSelect={engine.loadAtmosphere}
              onTogglePlay={engine.toggleAtmospherePlay}
              onVolumeChange={engine.updateAtmosphereVolume}
            />
          </div>

          {/* Center Column - Frequencies & DSP */}
          <div className="space-y-6">
            <FrequencyPanel
              frequencies={engine.frequencies}
              volume={engine.frequencyVolume}
              solfeggioList={engine.SOLFEGGIO_FREQUENCIES}
              binauralList={engine.BINAURAL_PRESETS}
              onStartSolfeggio={engine.startSolfeggio}
              onStopSolfeggio={engine.stopSolfeggio}
              onStartBinaural={engine.startBinaural}
              onStopBinaural={engine.stopBinaural}
              onVolumeChange={engine.updateFrequencyVolume}
            />
            <DSPMasteringRack
              dsp={engine.dsp}
              onUpdate={engine.updateDSP}
            />
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            <SpectralInsights
              frequencies={engine.frequencies}
              dsp={engine.dsp}
              atmosphereId={engine.atmosphereLayer.source}
              neuralSource={engine.neuralLayer.source}
            />

            {/* Headphone notice */}
            {engine.frequencies.binaural.enabled && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <Headphones className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium text-white/90">Stereo Headphones Required</p>
                    <p className="text-xs text-white/60">Binaural beats require left/right ear separation</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
