import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useCreativeTools } from "@/hooks/useCreativeTools";
import { toast } from "sonner";
import { 
  Music, 
  Waves, 
  Volume2, 
  Sparkles, 
  Settings, 
  Play, 
  ChevronDown,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Headphones
} from "lucide-react";

// ---------- Types ----------
type MeditationStyle =
  | "indian"
  | "shamanic"
  | "mystic"
  | "tibetan"
  | "sufi"
  | "zen"
  | "nature"
  | "ocean"
  | "sound_bath"
  | "chakra"
  | "higher_consciousness"
  | "relaxing"
  | "forest"
  | "breath_focus"
  | "kundalini";

type NoiseMode = "voice_clean" | "aggressive";
type ProcessingMode = "BINAURAL" | "TONE_TUNING";

// ---------- Style mapping ----------
const STYLE_PRESETS: Record<
  MeditationStyle,
  {
    label: string;
    description: string;
    defaultBpm: number;
    bpmRange: [number, number];
    musicTags: string[];
    soundLayers: string[];
    recommendedTuningHz?: number;
    icon: string;
  }
> = {
  indian: {
    label: "Indian (Vedic)",
    description: "Mantras, tanpura drones, temple bells",
    defaultBpm: 60,
    bpmRange: [52, 68],
    musicTags: ["tanpura", "indian drone", "temple bells", "vedic", "harmonium"],
    soundLayers: ["tanpura_drone", "temple_bells", "soft_air"],
    recommendedTuningHz: 432,
    icon: "🕉️",
  },
  shamanic: {
    label: "Shamanic",
    description: "Frame drums, rattles, tribal rhythms",
    defaultBpm: 72,
    bpmRange: [65, 85],
    musicTags: ["shaman drum", "frame drum", "rattle", "tribal", "earth"],
    soundLayers: ["shaman_drums_soft", "rattles_soft", "forest_ambience"],
    icon: "🪘",
  },
  mystic: {
    label: "Mystic",
    description: "Etheric pads, choirs, cosmic textures",
    defaultBpm: 58,
    bpmRange: [45, 70],
    musicTags: ["ethereal pad", "choir pad", "cosmic", "ambient", "mystic"],
    soundLayers: ["choir_pad", "wind_soft", "space_texture"],
    recommendedTuningHz: 528,
    icon: "✨",
  },
  tibetan: {
    label: "Tibetan",
    description: "Singing bowls, long horns, overtone chanting",
    defaultBpm: 55,
    bpmRange: [40, 65],
    musicTags: ["tibetan bowl", "singing bowl", "overtone", "gong"],
    soundLayers: ["tibetan_bowls", "overtone_pad", "soft_air"],
    recommendedTuningHz: 432,
    icon: "🔔",
  },
  sufi: {
    label: "Sufi",
    description: "Whirling rhythms, ney flute, heart devotion",
    defaultBpm: 70,
    bpmRange: [60, 90],
    musicTags: ["ney flute", "sufi", "frame drum", "devotional"],
    soundLayers: ["ney_flute_soft", "frame_drums_soft", "warm_room"],
    icon: "💫",
  },
  zen: {
    label: "Zen (Japanese)",
    description: "Minimal ambience, breath awareness",
    defaultBpm: 50,
    bpmRange: [40, 60],
    musicTags: ["zen", "minimal ambient", "shakuhachi", "temple"],
    soundLayers: ["minimal_air", "soft_room", "gentle_wind"],
    icon: "🎋",
  },
  nature: {
    label: "Nature Healing",
    description: "Forest, birds, wind, water",
    defaultBpm: 54,
    bpmRange: [45, 65],
    musicTags: ["nature ambient", "soft pad", "healing"],
    soundLayers: ["forest_ambience", "birds_soft", "wind_soft"],
    icon: "🌿",
  },
  ocean: {
    label: "Ocean / Water",
    description: "Waves, flowing water, deep calming",
    defaultBpm: 52,
    bpmRange: [42, 62],
    musicTags: ["ocean waves", "water", "calm pad"],
    soundLayers: ["ocean_waves", "rain_soft", "sub_pad"],
    recommendedTuningHz: 432,
    icon: "🌊",
  },
  sound_bath: {
    label: "Sound Bath",
    description: "Gongs, crystal bowls, harmonic overtones",
    defaultBpm: 48,
    bpmRange: [35, 58],
    musicTags: ["crystal bowl", "gong", "sound bath", "overtone"],
    soundLayers: ["crystal_bowls", "gong_soft", "overtone_pad"],
    recommendedTuningHz: 528,
    icon: "🎵",
  },
  chakra: {
    label: "Chakra Balancing",
    description: "Layered tones for each chakra",
    defaultBpm: 56,
    bpmRange: [45, 70],
    musicTags: ["chakra", "healing tones", "ambient pad"],
    soundLayers: ["chakra_tones", "soft_air", "warm_pad"],
    recommendedTuningHz: 528,
    icon: "🔮",
  },
  higher_consciousness: {
    label: "Higher Consciousness",
    description: "Cosmic tones, transcendence",
    defaultBpm: 46,
    bpmRange: [35, 55],
    musicTags: ["cosmic", "transcend", "space ambient", "choir"],
    soundLayers: ["space_texture", "choir_pad", "deep_sub"],
    recommendedTuningHz: 963,
    icon: "🌌",
  },
  relaxing: {
    label: "Relaxing",
    description: "Gentle ambient, stress relief",
    defaultBpm: 58,
    bpmRange: [50, 75],
    musicTags: ["relax", "ambient", "soft pad", "calm"],
    soundLayers: ["pink_noise_soft", "warm_pad", "soft_wind"],
    recommendedTuningHz: 432,
    icon: "😌",
  },
  forest: {
    label: "Forest",
    description: "Birdsong, rustling leaves, natural calm",
    defaultBpm: 54,
    bpmRange: [45, 65],
    musicTags: ["forest ambient", "handpan", "soft pad"],
    soundLayers: ["forest_ambience", "handpan_soft", "wind_soft"],
    icon: "🌲",
  },
  breath_focus: {
    label: "Breath Focus",
    description: "Breath cues, minimal ambience",
    defaultBpm: 60,
    bpmRange: [50, 70],
    musicTags: ["minimal ambient", "breath", "calm"],
    soundLayers: ["soft_room", "gentle_air", "breath_cue_soft"],
    icon: "🌬️",
  },
  kundalini: {
    label: "Kundalini Energy",
    description: "Rising energy, drone + subtle pulses",
    defaultBpm: 66,
    bpmRange: [55, 80],
    musicTags: ["kundalini", "drone", "pulse", "tanpura"],
    soundLayers: ["tanpura_drone", "pulse_soft", "warm_pad"],
    recommendedTuningHz: 528,
    icon: "🐍",
  },
};

// ---------- Frequency presets ----------
const FREQUENCIES = [
  { hz: 174, label: "174 Hz – Deep Relaxation", color: "bg-red-500" },
  { hz: 285, label: "285 Hz – Physical Healing", color: "bg-orange-500" },
  { hz: 396, label: "396 Hz – Emotional Release", color: "bg-yellow-500" },
  { hz: 417, label: "417 Hz – Transformation", color: "bg-green-500" },
  { hz: 432, label: "432 Hz – Natural Harmony", color: "bg-teal-500" },
  { hz: 444, label: "444 Hz – Heart Coherence", color: "bg-emerald-500" },
  { hz: 528, label: "528 Hz – Love & Renewal", color: "bg-cyan-500" },
  { hz: 639, label: "639 Hz – Connection", color: "bg-blue-500" },
  { hz: 741, label: "741 Hz – Clarity", color: "bg-indigo-500" },
  { hz: 852, label: "852 Hz – Awakening", color: "bg-violet-500" },
  { hz: 963, label: "963 Hz – Higher Consciousness", color: "bg-purple-500" },
];

// Brainwave/Binaural beat Hz
const BINAURAL_BEATS = [
  { hz: 4, label: "4 Hz – Delta (Deep Sleep)", description: "Deep restorative sleep" },
  { hz: 6, label: "6 Hz – Theta (Meditation)", description: "Deep meditation & creativity" },
  { hz: 8, label: "8 Hz – Alpha (Calm)", description: "Relaxed alertness" },
  { hz: 10, label: "10 Hz – Focus (Presence)", description: "Enhanced focus & presence" },
];

export default function CreativeSoulMeditationTool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { hasAccess, isLoading: accessLoading } = useCreativeTools();

  // Inputs
  const [youtubeUrls, setYoutubeUrls] = useState("");
  const [directUrls, setDirectUrls] = useState("");

  // Style selection
  const [style, setStyle] = useState<MeditationStyle>("indian");
  const stylePreset = useMemo(() => STYLE_PRESETS[style], [style]);

  // Frequency tuning
  const [tuningHz, setTuningHz] = useState(stylePreset.recommendedTuningHz ?? 432);

  // Binaural
  const [binauralEnabled, setBinauralEnabled] = useState(true);
  const [binauralBeatHz, setBinauralBeatHz] = useState(6);
  const [binauralCarrierHz, setBinauralCarrierHz] = useState(200);

  // BPM match
  const [bpmMatchEnabled, setBpmMatchEnabled] = useState(true);
  const [targetBpm, setTargetBpm] = useState(stylePreset.defaultBpm);

  // Noise reduction
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(true);
  const [noiseMode, setNoiseMode] = useState<NoiseMode>("voice_clean");
  const [noiseStrength, setNoiseStrength] = useState<"low" | "medium" | "high">("medium");

  // Mastering
  const [masteringEnabled, setMasteringEnabled] = useState(true);
  const [masteringPreset, setMasteringPreset] = useState("meditation_warm");

  // Auto music selection
  const [autoMusicEnabled, setAutoMusicEnabled] = useState(true);
  const [musicSource, setMusicSource] = useState<"splice" | "library" | "none">("splice");

  // Misc
  const [keepOriginalMusic, setKeepOriginalMusic] = useState(false);
  const [variants, setVariants] = useState(3);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sync BPM/tuning to style
  useEffect(() => {
    setTargetBpm(stylePreset.defaultBpm);
    if (stylePreset.recommendedTuningHz) setTuningHz(stylePreset.recommendedTuningHz);
  }, [style, stylePreset.defaultBpm, stylePreset.recommendedTuningHz]);

  // Build payload
  const buildPayload = () => {
    const yt = youtubeUrls.split(",").map((s) => s.trim()).filter(Boolean);
    const direct = directUrls.split(",").map((s) => s.trim()).filter(Boolean);

    return {
      youtube_urls: yt,
      direct_urls: direct,
      meditation_style: style,
      music_tags: stylePreset.musicTags,
      sound_layers: stylePreset.soundLayers,
      frequency_hz: tuningHz,
      processing_mode: "TONE_TUNING" as ProcessingMode,
      binaural_enabled: binauralEnabled,
      binaural_beat_hz: binauralBeatHz,
      binaural_carrier_hz: binauralCarrierHz,
      bpm_match_enabled: bpmMatchEnabled,
      target_bpm: targetBpm,
      bpm_range: stylePreset.bpmRange,
      noise_reduction_enabled: noiseReductionEnabled,
      noise_reduction_mode: noiseMode,
      noise_reduction_strength: noiseStrength,
      mastering_enabled: masteringEnabled,
      mastering_preset: masteringPreset,
      auto_music_enabled: autoMusicEnabled,
      music_source: musicSource,
      keep_original_music: keepOriginalMusic,
      variants: Math.max(1, Math.min(5, variants)),
    };
  };

  // Call Edge Function
  const handleGenerate = async (mode: "demo" | "paid") => {
    setBusy(true);
    setErrorMsg("");
    setResult(null);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const uid = sess.session?.user?.id;

      if (!token || !uid) {
        toast.error("Please sign in first");
        setErrorMsg("Please sign in first.");
        setBusy(false);
        return;
      }

      const payload = buildPayload();

      const { data, error } = await supabase.functions.invoke("convert-meditation-audio", {
        body: {
          mode,
          user_id: uid,
          payload,
        },
      });

      if (error) {
        setErrorMsg(error.message || "Failed to process");
        toast.error(error.message || "Failed to process");
        return;
      }

      if (data?.error) {
        setErrorMsg(data.error);
        toast.error(data.error);
        return;
      }

      setResult(data);
      toast.success(mode === "demo" ? "Demo generation started!" : "Processing started!");
    } catch (e: any) {
      setErrorMsg(e?.message || String(e));
      toast.error(e?.message || "An error occurred");
    } finally {
      setBusy(false);
    }
  };

  const canAccess = isAdmin || hasAccess;

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600/20 via-background to-violet-500/10 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" onClick={() => navigate('/creative-soul/store')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
            {canAccess && (
              <Badge className="bg-green-600 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
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
                Creative Soul Meditation Tool
              </h1>
              <p className="text-muted-foreground">
                Transform audio into sacred meditation experiences with AI-powered processing
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Access Status */}
        {!canAccess && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-200">Premium Feature</p>
                <p className="text-sm text-muted-foreground">
                  Purchase Creative Soul Studio to unlock full generation capabilities.
                  Demo mode available for testing.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audio Input */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Audio Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>YouTube URLs (comma separated)</Label>
                <Textarea
                  value={youtubeUrls}
                  onChange={(e) => setYoutubeUrls(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... , https://youtu.be/..."
                  className="bg-background/50 min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Direct Audio URLs (comma separated)</Label>
                <Textarea
                  value={directUrls}
                  onChange={(e) => setDirectUrls(e.target.value)}
                  placeholder="https://example.com/audio.mp3 , https://..."
                  className="bg-background/50 min-h-[80px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meditation Style Selection */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Meditation Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(Object.keys(STYLE_PRESETS) as MeditationStyle[]).map((key) => {
                const preset = STYLE_PRESETS[key];
                const isSelected = style === key;
                return (
                  <button
                    key={key}
                    onClick={() => setStyle(key)}
                    className={`text-left p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                      isSelected
                        ? "border-primary bg-primary/20 shadow-lg shadow-primary/20"
                        : "border-border/50 bg-background/30 hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{preset.icon}</div>
                    <div className="font-medium text-sm">{preset.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {preset.description}
                    </div>
                    {isSelected && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {preset.musicTags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Frequency & Binaural Settings */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Frequency Tuning */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-primary" />
                Healing Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={tuningHz.toString()} onValueChange={(v) => setTuningHz(Number(v))}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.hz} value={f.hz.toString()}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${f.color}`} />
                        {f.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Audio will be retuned to resonate with the selected healing frequency.
              </p>
            </CardContent>
          </Card>

          {/* Binaural Beats */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                Binaural Beats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="binaural-enabled"
                  checked={binauralEnabled}
                  onCheckedChange={(c) => setBinauralEnabled(c === true)}
                />
                <Label htmlFor="binaural-enabled">Enable binaural beats</Label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Brainwave Target</Label>
                  <Select
                    value={binauralBeatHz.toString()}
                    onValueChange={(v) => setBinauralBeatHz(Number(v))}
                    disabled={!binauralEnabled}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BINAURAL_BEATS.map((b) => (
                        <SelectItem key={b.hz} value={b.hz.toString()}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Carrier Frequency (Hz)</Label>
                  <Input
                    type="number"
                    value={binauralCarrierHz}
                    onChange={(e) => setBinauralCarrierHz(Number(e.target.value))}
                    disabled={!binauralEnabled}
                    className="bg-background/50"
                    min={100}
                    max={500}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Settings */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Advanced Settings
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {/* Noise Reduction */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="noise-enabled"
                      checked={noiseReductionEnabled}
                      onCheckedChange={(c) => setNoiseReductionEnabled(c === true)}
                    />
                    <Label htmlFor="noise-enabled" className="font-medium">Noise Reduction</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div className="space-y-2">
                      <Label className="text-xs">Mode</Label>
                      <Select
                        value={noiseMode}
                        onValueChange={(v) => setNoiseMode(v as NoiseMode)}
                        disabled={!noiseReductionEnabled}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="voice_clean">Voice Clean (Safe)</SelectItem>
                          <SelectItem value="aggressive">Aggressive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Strength</Label>
                      <Select
                        value={noiseStrength}
                        onValueChange={(v) => setNoiseStrength(v as "low" | "medium" | "high")}
                        disabled={!noiseReductionEnabled}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* BPM Matching */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="bpm-enabled"
                      checked={bpmMatchEnabled}
                      onCheckedChange={(c) => setBpmMatchEnabled(c === true)}
                    />
                    <Label htmlFor="bpm-enabled" className="font-medium">BPM Matching</Label>
                  </div>
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center gap-4">
                      <Label className="text-xs w-24">Target: {targetBpm} BPM</Label>
                      <Slider
                        value={[targetBpm]}
                        onValueChange={([v]) => setTargetBpm(v)}
                        min={stylePreset.bpmRange[0]}
                        max={stylePreset.bpmRange[1]}
                        step={1}
                        disabled={!bpmMatchEnabled}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Style range: {stylePreset.bpmRange[0]}–{stylePreset.bpmRange[1]} BPM
                    </p>
                  </div>
                </div>

                {/* Music Source */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="music-enabled"
                      checked={autoMusicEnabled}
                      onCheckedChange={(c) => setAutoMusicEnabled(c === true)}
                    />
                    <Label htmlFor="music-enabled" className="font-medium">Auto Music Selection</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div className="space-y-2">
                      <Label className="text-xs">Source</Label>
                      <Select
                        value={musicSource}
                        onValueChange={(v) => setMusicSource(v as "splice" | "library" | "none")}
                        disabled={!autoMusicEnabled}
                      >
                        <SelectTrigger className="bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="splice">Splice</SelectItem>
                          <SelectItem value="library">Internal Library</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end pb-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="keep-original"
                          checked={keepOriginalMusic}
                          onCheckedChange={(c) => setKeepOriginalMusic(c === true)}
                        />
                        <Label htmlFor="keep-original" className="text-xs">Keep original music</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mastering */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="mastering-enabled"
                      checked={masteringEnabled}
                      onCheckedChange={(c) => setMasteringEnabled(c === true)}
                    />
                    <Label htmlFor="mastering-enabled" className="font-medium">LANDR Mastering</Label>
                  </div>
                  <div className="pl-6 space-y-2">
                    <Label className="text-xs">Preset</Label>
                    <Input
                      value={masteringPreset}
                      onChange={(e) => setMasteringPreset(e.target.value)}
                      disabled={!masteringEnabled}
                      className="bg-background/50"
                      placeholder="meditation_warm"
                    />
                  </div>
                </div>

                {/* Variants */}
                <div className="space-y-2">
                  <Label className="font-medium">Output Variants</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[variants]}
                      onValueChange={([v]) => setVariants(v)}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-8">{variants}</span>
                  </div>
                </div>

                {/* Payload Preview */}
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      Show Worker Payload
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="mt-2 p-3 bg-background/80 rounded-lg text-xs overflow-auto max-h-64">
                      {JSON.stringify(buildPayload(), null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Action Buttons */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleGenerate("demo")}
                disabled={busy || !user}
                className="min-w-[160px]"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Demo (1x Free)
              </Button>
              <Button
                size="lg"
                onClick={() => handleGenerate("paid")}
                disabled={busy || !canAccess || !user}
                className="min-w-[160px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Full
              </Button>
            </div>
            {!user && (
              <p className="text-center text-sm text-muted-foreground mt-3">
                Please sign in to use the meditation tool
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {errorMsg && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{errorMsg}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-500/50 bg-green-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <CheckCircle className="h-5 w-5" />
                Processing Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-3 bg-background/80 rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Waves className="w-5 h-5 text-pink-400" />
            <span className="text-sm font-medium">11 Healing Frequencies</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium">15 Meditation Styles</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Headphones className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">Binaural Beats</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-medium">Noise Reduction</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Settings className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">BPM Matching</span>
          </div>
          <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-3">
            <Music className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">LANDR Mastering</span>
          </div>
        </div>
      </div>
    </div>
  );
}
