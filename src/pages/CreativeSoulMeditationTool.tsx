import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Headphones, ArrowLeft, Upload, Play, Pause, Music, Layers, 
  Sparkles, Heart, Split, Wand2, Download, Loader2, Check,
  Volume2, Settings, FileAudio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useCreativeTools } from '@/hooks/useCreativeTools';
import { toast } from 'sonner';

const meditationStyles = [
  { id: 'indian', name: 'Indian (Vedic)', description: 'Mantras, tanpura drones, temple bells' },
  { id: 'shamanic', name: 'Shamanic', description: 'Frame drums, rattles, tribal rhythms' },
  { id: 'mystic', name: 'Mystic', description: 'Etheric pads, choirs, cosmic textures' },
  { id: 'tibetan', name: 'Tibetan', description: 'Singing bowls, long horns, overtone chanting' },
  { id: 'sufi', name: 'Sufi', description: 'Whirling rhythms, ney flute, heart-centered devotion' },
  { id: 'zen', name: 'Zen (Japanese)', description: 'Minimal ambience, breath awareness' },
  { id: 'nature', name: 'Nature Healing', description: 'Forest, birds, wind, water' },
  { id: 'ocean', name: 'Ocean / Water', description: 'Waves, flowing water, deep calming' },
  { id: 'sound-bath', name: 'Sound Bath', description: 'Gongs, crystal bowls, harmonic overtones' },
  { id: 'chakra', name: 'Chakra Balancing', description: 'Layered tones for each chakra' },
  { id: 'higher', name: 'Higher Consciousness', description: 'Cosmic tones, transcendence' },
  { id: 'relaxing', name: 'Relaxing', description: 'Gentle ambient, stress relief' },
  { id: 'forest', name: 'Forest', description: 'Birdsong, rustling leaves, natural grounding' },
  { id: 'breath', name: 'Breath Focus', description: 'Minimal, breath-guiding cues' },
  { id: 'kundalini', name: 'Kundalini Energy', description: 'Rising energy, activation tones' },
];

const healingFrequencies = [
  { hz: 174, name: 'Deep Relaxation & Grounding', color: 'from-red-500 to-red-600' },
  { hz: 285, name: 'Physical Healing Support', color: 'from-orange-500 to-orange-600' },
  { hz: 396, name: 'Emotional Release & Liberation', color: 'from-yellow-500 to-yellow-600' },
  { hz: 417, name: 'Transformation & Change', color: 'from-lime-500 to-lime-600' },
  { hz: 432, name: 'Universal Harmony & DNA Repair', color: 'from-green-500 to-green-600' },
  { hz: 444, name: 'Love Frequency & Heart Coherence', color: 'from-emerald-500 to-emerald-600' },
  { hz: 528, name: 'Miracle Tone & DNA Activation', color: 'from-teal-500 to-teal-600' },
  { hz: 639, name: 'Connection & Relationships', color: 'from-cyan-500 to-cyan-600' },
  { hz: 741, name: 'Intuition & Problem Solving', color: 'from-blue-500 to-blue-600' },
  { hz: 777, name: 'Spiritual Awakening & Luck', color: 'from-indigo-500 to-indigo-600' },
  { hz: 852, name: 'Third Eye Activation', color: 'from-purple-500 to-purple-600' },
  { hz: 888, name: 'Abundance & Prosperity', color: 'from-violet-500 to-violet-600' },
  { hz: 936, name: 'Pineal Gland Activation', color: 'from-fuchsia-500 to-fuchsia-600' },
  { hz: 963, name: 'Crown Chakra & Divine Connection', color: 'from-pink-500 to-pink-600' },
  { hz: 999, name: 'Highest Consciousness & Completion', color: 'from-rose-500 to-rose-600' },
];

const binauralBeats = [
  { name: 'Delta (0.5-4 Hz)', description: 'Deep sleep, healing', value: 'delta' },
  { name: 'Theta (4-8 Hz)', description: 'Meditation, creativity', value: 'theta' },
  { name: 'Alpha (8-12 Hz)', description: 'Relaxation, calm focus', value: 'alpha' },
  { name: 'Beta (12-30 Hz)', description: 'Alertness, concentration', value: 'beta' },
  { name: 'Gamma (30-100 Hz)', description: 'Peak awareness, insight', value: 'gamma' },
];

export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { hasAccess } = useCreativeTools();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);
  
  // Settings
  const [selectedStyle, setSelectedStyle] = useState('peaceful');
  const [selectedFrequency, setSelectedFrequency] = useState<number | null>(528);
  const [selectedBinaural, setSelectedBinaural] = useState('theta');
  const [enableStemSeparation, setEnableStemSeparation] = useState(false);
  const [enableMultiVariant, setEnableMultiVariant] = useState(false);
  const [volumeMix, setVolumeMix] = useState([70]); // Original audio volume
  const [frequencyIntensity, setFrequencyIntensity] = useState([50]);
  
  const hasToolAccess = user && (isAdmin || hasAccess('creative-soul-meditation'));

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      toast.success(`Uploaded: ${file.name}`);
    }
  };

  const handleProcessAudio = async () => {
    if (!uploadedFile) {
      toast.error('Please upload an audio file first');
      return;
    }

    if (!hasToolAccess) {
      toast.info('Purchase access to process audio with AI');
      navigate('/creative-soul/store');
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing (in real implementation, this would call an edge function)
    setTimeout(() => {
      setProcessedAudioUrl(audioUrl);
      setIsProcessing(false);
      toast.success('Audio processed successfully!');
    }, 3000);
  };

  const handleDownload = () => {
    if (processedAudioUrl) {
      const link = document.createElement('a');
      link.href = processedAudioUrl;
      link.download = `meditation-${selectedStyle}-${Date.now()}.mp3`;
      link.click();
      toast.success('Download started!');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600/20 via-background to-violet-500/10 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/creative-soul/store')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
            
            {hasToolAccess && (
              <Badge className="bg-green-600 text-white">
                <Check className="w-3 h-3 mr-1" />
                Full Access
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Creative Soul Meditation
              </h1>
              <p className="text-muted-foreground">
                Transform any audio into high-quality meditation tracks
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upload Section */}
        <Card className="border-2 border-purple-500/30 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" />
              Upload Audio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-500/40 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5 transition-all"
            >
              {uploadedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <FileAudio className="w-12 h-12 text-purple-400" />
                  <p className="font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-purple-400/60" />
                  <p className="font-medium text-muted-foreground">Drop audio file here or click to upload</p>
                  <p className="text-sm text-muted-foreground">Supports MP3, WAV, FLAC, OGG</p>
                </div>
              )}
            </div>

            {audioUrl && (
              <div className="flex items-center gap-4 p-4 bg-purple-500/10 rounded-lg">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="rounded-full"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1">
                  <div className="h-2 bg-purple-500/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
                  </div>
                </div>
                <Volume2 className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <Card className="border-purple-500/20 bg-card/50 backdrop-blur">
          <CardContent className="p-0">
            <Tabs defaultValue="style" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
                <TabsTrigger value="style" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-6 py-3">
                  <Layers className="w-4 h-4 mr-2" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="frequency" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-6 py-3">
                  <Heart className="w-4 h-4 mr-2" />
                  Frequency
                </TabsTrigger>
                <TabsTrigger value="binaural" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-6 py-3">
                  <Headphones className="w-4 h-4 mr-2" />
                  Binaural
                </TabsTrigger>
                <TabsTrigger value="advanced" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-transparent px-6 py-3">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="p-6">
                <h3 className="text-lg font-semibold mb-4">Choose Meditation Style</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {meditationStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedStyle === style.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      }`}
                    >
                      <p className="font-medium text-foreground">{style.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="frequency" className="p-6">
                <h3 className="text-lg font-semibold mb-4">Healing Frequencies (Solfeggio)</h3>
                <div className="grid grid-cols-3 gap-3">
                  {healingFrequencies.map((freq) => (
                    <button
                      key={freq.hz}
                      onClick={() => setSelectedFrequency(freq.hz)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedFrequency === freq.hz
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      }`}
                    >
                      <div className={`w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br ${freq.color} flex items-center justify-center`}>
                        <span className="text-xs font-bold text-white">{freq.hz}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{freq.name}</p>
                      <p className="text-xs text-muted-foreground">{freq.hz} Hz</p>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 space-y-4">
                  <Label>Frequency Intensity</Label>
                  <Slider
                    value={frequencyIntensity}
                    onValueChange={setFrequencyIntensity}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground text-right">{frequencyIntensity[0]}%</p>
                </div>
              </TabsContent>

              <TabsContent value="binaural" className="p-6">
                <h3 className="text-lg font-semibold mb-4">Binaural Beats</h3>
                <div className="space-y-3">
                  {binauralBeats.map((beat) => (
                    <button
                      key={beat.value}
                      onClick={() => setSelectedBinaural(beat.value)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        selectedBinaural === beat.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-border hover:border-purple-500/50 hover:bg-purple-500/5'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground">{beat.name}</p>
                        <p className="text-sm text-muted-foreground">{beat.description}</p>
                      </div>
                      {selectedBinaural === beat.value && (
                        <Check className="w-5 h-5 text-purple-500" />
                      )}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Stem Separation</Label>
                    <p className="text-sm text-muted-foreground">Isolate vocals, drums, bass, and other instruments</p>
                  </div>
                  <Switch
                    checked={enableStemSeparation}
                    onCheckedChange={setEnableStemSeparation}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Multi-Variant Output</Label>
                    <p className="text-sm text-muted-foreground">Generate multiple versions with different settings</p>
                  </div>
                  <Switch
                    checked={enableMultiVariant}
                    onCheckedChange={setEnableMultiVariant}
                  />
                </div>
                
                <div className="space-y-4">
                  <Label>Original Audio Mix Level</Label>
                  <Slider
                    value={volumeMix}
                    onValueChange={setVolumeMix}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground text-right">{volumeMix[0]}% original / {100 - volumeMix[0]}% meditation layer</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Process Button */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-400" />
                  Ready to Transform
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Style: {meditationStyles.find(s => s.id === selectedStyle)?.name} • 
                  Frequency: {selectedFrequency} Hz • 
                  Binaural: {binauralBeats.find(b => b.value === selectedBinaural)?.name}
                </p>
              </div>
              
              <Button
                onClick={handleProcessAudio}
                disabled={!uploadedFile || isProcessing}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Transform Audio
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        {processedAudioUrl && (
          <Card className="border-2 border-green-500/30 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Check className="w-5 h-5" />
                Meditation Track Ready
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-green-500 text-green-500"
                >
                  <Play className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">3:45</span>
              </div>
              
              <Button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Meditation Track
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="text-sm font-medium">Healing Frequencies</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Layers className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">15 Meditation Styles</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Headphones className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">Binaural Beats</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Split className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">Stem Separation</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">Multi-Variant</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Music className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">High-Quality Output</span>
          </div>
        </div>
      </div>
    </div>
  );
}
