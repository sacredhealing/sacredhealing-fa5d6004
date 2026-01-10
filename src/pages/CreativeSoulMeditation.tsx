import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Music, Upload, Youtube, Link as LinkIcon, Download, Loader2, Sparkles, ArrowLeft, Play, Wand2, Radio, Headphones, Zap, Crown, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PaymentOptions } from '@/components/creative-soul/PaymentOptions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSHCBalance } from '@/hooks/useSHCBalance';
import { useAdminRole } from '@/hooks/useAdminRole';
import { toast } from 'sonner';

interface GeneratedFile {
  id: string;
  name: string;
  url: string;
  type: 'final' | 'stem' | 'variant';
  variantNumber?: number;
}

interface JobStatus {
  job_id: string;
  action: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * RULES:
 * - If freq < 20 => Brainwave frequency (binaural beats / amplitude modulation), NOT pitch-tuning.
 * - If freq >= 20 => Audible tone tuning target (pitch-shift / retune / tone layer), NOT binaural.
 * - Frequency selection should auto-pick a style + sound palette that fits conversion & meditation expectations.
 */

type ProcessingMode = "BINAURAL" | "TONE_TUNING";

type SoundLayer =
  | "ocean_waves"
  | "forest_ambience"
  | "rain_soft"
  | "wind_soft"
  | "tibetan_bowls"
  | "handpan"
  | "shaman_drums_soft"
  | "indian_flute_soft"
  | "choir_pad"
  | "brown_noise_soft"
  | "pink_noise_soft"
  | "silence";

type FrequencyPreset = {
  value: number;
  label: string;
  intentTags: string[];
  mode: ProcessingMode;
  defaultStyle: string;
  soundLayers: SoundLayer[];
};

const FREQUENCY_PRESETS: FrequencyPreset[] = [
  // Solfeggio / audible tone tuning
  {
    value: 174,
    label: "174 Hz – Deep Relaxation & Grounding",
    intentTags: ["grounding", "safety", "relaxation"],
    mode: "TONE_TUNING",
    defaultStyle: "nature-healing",
    soundLayers: ["forest_ambience", "wind_soft", "tibetan_bowls"],
  },
  {
    value: 285,
    label: "285 Hz – Physical Healing Support",
    intentTags: ["healing", "restoration", "body"],
    mode: "TONE_TUNING",
    defaultStyle: "ocean-water",
    soundLayers: ["pink_noise_soft", "handpan", "tibetan_bowls"],
  },
  {
    value: 396,
    label: "396 Hz – Emotional Release",
    intentTags: ["release", "fear", "emotions"],
    mode: "TONE_TUNING",
    defaultStyle: "shamanic",
    soundLayers: ["shaman_drums_soft", "forest_ambience", "tibetan_bowls"],
  },
  {
    value: 417,
    label: "417 Hz – Transformation & Change",
    intentTags: ["change", "transformation", "reset"],
    mode: "TONE_TUNING",
    defaultStyle: "mystic",
    soundLayers: ["choir_pad", "wind_soft", "tibetan_bowls"],
  },
  {
    value: 432,
    label: "432 Hz – Natural Harmony",
    intentTags: ["balance", "harmony", "calm"],
    mode: "TONE_TUNING",
    defaultStyle: "ocean-water",
    soundLayers: ["ocean_waves", "rain_soft", "handpan"],
  },
  {
    value: 444,
    label: "444 Hz – Heart Coherence",
    intentTags: ["heart", "compassion", "coherence"],
    mode: "TONE_TUNING",
    defaultStyle: "ocean-water",
    soundLayers: ["handpan", "ocean_waves", "tibetan_bowls"],
  },
  {
    value: 528,
    label: "528 Hz – Love & Renewal",
    intentTags: ["love", "renewal", "uplift"],
    mode: "TONE_TUNING",
    defaultStyle: "mystic",
    soundLayers: ["choir_pad", "handpan", "rain_soft"],
  },
  {
    value: 639,
    label: "639 Hz – Connection & Balance",
    intentTags: ["relationships", "connection", "balance"],
    mode: "TONE_TUNING",
    defaultStyle: "indian-vedic",
    soundLayers: ["indian_flute_soft", "forest_ambience", "tibetan_bowls"],
  },
  {
    value: 741,
    label: "741 Hz – Clarity & Intuition",
    intentTags: ["clarity", "intuition", "focus"],
    mode: "TONE_TUNING",
    defaultStyle: "nature-healing",
    soundLayers: ["forest_ambience", "wind_soft", "handpan"],
  },
  {
    value: 852,
    label: "852 Hz – Spiritual Awakening",
    intentTags: ["spiritual", "awakening", "insight"],
    mode: "TONE_TUNING",
    defaultStyle: "mystic",
    soundLayers: ["choir_pad", "wind_soft", "tibetan_bowls"],
  },
  {
    value: 963,
    label: "963 Hz – Higher Consciousness",
    intentTags: ["higher", "consciousness", "transcend"],
    mode: "TONE_TUNING",
    defaultStyle: "higher-consciousness",
    soundLayers: ["choir_pad", "brown_noise_soft", "tibetan_bowls"],
  },
  // Brainwave / binaural (inaudible as tone; use binaural beat / modulation)
  {
    value: 4,
    label: "4 Hz – Deep Sleep (Delta)",
    intentTags: ["sleep", "deep sleep", "delta"],
    mode: "BINAURAL",
    defaultStyle: "sleep-delta",
    soundLayers: ["ocean_waves", "brown_noise_soft", "rain_soft"],
  },
  {
    value: 6,
    label: "6 Hz – Theta Meditation",
    intentTags: ["theta", "meditation", "dreamy"],
    mode: "BINAURAL",
    defaultStyle: "mystic",
    soundLayers: ["choir_pad", "pink_noise_soft", "tibetan_bowls"],
  },
  {
    value: 8,
    label: "8 Hz – Alpha Calm",
    intentTags: ["calm", "alpha", "relax"],
    mode: "BINAURAL",
    defaultStyle: "nature-healing",
    soundLayers: ["forest_ambience", "wind_soft", "pink_noise_soft"],
  },
  {
    value: 10,
    label: "10 Hz – Focus & Presence",
    intentTags: ["focus", "presence", "clarity"],
    mode: "BINAURAL",
    defaultStyle: "ocean-water",
    soundLayers: ["pink_noise_soft", "handpan", "wind_soft"],
  },
];

function getPreset(freq: number): FrequencyPreset {
  return FREQUENCY_PRESETS.find((p) => p.value === freq) ?? FREQUENCY_PRESETS.find((p) => p.value === 432)!;
}

export default function CreativeSoulMeditation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { balance, refreshBalance } = useSHCBalance();
  const [searchParams] = useSearchParams();
  
  // File inputs
  const [files, setFiles] = useState<File[]>([]);
  const [userMusic, setUserMusic] = useState<File[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState('');
  const [urls, setUrls] = useState('');
  
  // Generation options
  const [freq, setFreq] = useState<number>(432);
  const [style, setStyle] = useState('ocean-water');
  const [soundLayers, setSoundLayers] = useState<SoundLayer[]>(['ocean_waves', 'rain_soft', 'handpan']);
  const [overrideStyle, setOverrideStyle] = useState(false);
  const [overrideLayers, setOverrideLayers] = useState(false);
  const [bpmMatch, setBpmMatch] = useState(true);
  const [variants, setVariants] = useState(3);
  const [keepMusicStem, setKeepMusicStem] = useState(true);

  // Get frequency preset
  const preset = useMemo(() => getPreset(freq), [freq]);

  // Auto-update style and layers when frequency changes (unless overridden)
  useEffect(() => {
    if (!overrideStyle) {
      setStyle(preset.defaultStyle);
    }
    if (!overrideLayers) {
      setSoundLayers(preset.soundLayers);
    }
  }, [preset, overrideStyle, overrideLayers]);
  
  // State management
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [demoUsed, setDemoUsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  // Job polling state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for affiliate code
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem('creative_soul_meditation_affiliate', ref);
    } else {
      const stored = localStorage.getItem('creative_soul_meditation_affiliate');
      if (stored) setAffiliateId(stored);
    }
  }, [searchParams]);

  // Check access and demo status
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Admins have full access
      if (isAdmin) {
        setHasAccess(true);
        return;
      }

      try {
        // Check if user has purchased access
        const { data: access } = await (supabase as any)
          .from('creative_tool_access')
          .select('*, tool:creative_tools!inner(slug)')
          .eq('user_id', user.id)
          .eq('tool.slug', 'creative-soul-meditation')
          .maybeSingle();

        if (access) {
          setHasAccess(true);
        } else {
          // Check if demo was used
          const { data: demo } = await (supabase as any)
            .from('meditation_audio_demos')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (demo) {
            setDemoUsed(true);
          }
        }
      } catch (error) {
        console.error('Error checking access:', error);
      }
    };

    checkAccess();
  }, [user, isAdmin]);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-job-status', {
        body: { job_id: jobId },
      });

      if (error) {
        console.error('Job status poll error:', error);
        return;
      }

      if (data?.success && data?.job) {
        const job = data.job as JobStatus;
        setJobStatus(job);

        if (job.status === 'completed') {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsGenerating(false);
          toast.success('Audio generation complete!');
          
          // If we have a result URL, add it to generated files
          if (job.result_url) {
            setGeneratedFiles([{
              id: jobId,
              name: `Meditation Audio - ${style}`,
              url: job.result_url,
              type: 'final',
            }]);
          }
        } else if (job.status === 'failed') {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsGenerating(false);
          toast.error(job.error_message || 'Generation failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Job status poll error:', err);
    }
  }, [style]);

  // Start polling when we have an active job
  useEffect(() => {
    if (activeJobId && isGenerating) {
      // Initial poll
      pollJobStatus(activeJobId);
      
      // Set up interval (every 3 seconds)
      pollingIntervalRef.current = setInterval(() => {
        pollJobStatus(activeJobId);
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeJobId, isGenerating, pollJobStatus]);

  // Cancel job polling
  const cancelPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setActiveJobId(null);
    setJobStatus(null);
    setIsGenerating(false);
    toast.info('Stopped monitoring job. Processing may continue in background.');
  };

  // Handle demo generation
  const handleGenerateDemo = async () => {
    if (demoUsed && !hasAccess) {
      toast.error('Demo already used. Please purchase full access to continue.');
      return;
    }

    if (!user) {
      toast.info('Please sign in to try the demo');
      navigate('/auth');
      return;
    }

    setIsGenerating(true);
    setJobStatus(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('convert-meditation-audio', {
        body: {
          mode: 'demo',
          frequency_hz: preset.value,
          processing_mode: preset.mode, // "BINAURAL" or "TONE_TUNING"
          meditation_style: style,
          sound_layers: soundLayers,
          duration: 10,
          variants: 1,
        },
      });

      if (error) {
        console.error('Demo generation error:', error);
        toast.error(error.message || 'Failed to generate demo. Please try again.');
        setIsGenerating(false);
        return;
      }

      if (data && data.success === false) {
        console.error('Demo generation failed:', data.error);
        toast.error(data.error || 'Failed to generate demo. Please try again.');
        if (data.error?.includes('Demo already used')) {
          setDemoUsed(true);
        }
        setIsGenerating(false);
        return;
      }

      if (data && data.success) {
        setDemoUsed(true);
        if (data.job_id) {
          toast.success(`Demo generation started! Tracking job...`);
          setActiveJobId(data.job_id);
          // isGenerating stays true while polling
        } else {
          toast.success('Demo generation complete!');
          setIsGenerating(false);
        }
      }
    } catch (error: any) {
      console.error('Demo generation error:', error);
      toast.error(error.message || 'Failed to generate demo. Please try again.');
      setIsGenerating(false);
    }
  };

  // Handle full generation
  const handleGenerate = async () => {
    if (!hasAccess) {
      toast.error('Please purchase full access to use all features');
      return;
    }

    if (!files.length && !youtubeLinks && !urls && !userMusic.length) {
      toast.error('Please provide audio files, YouTube links, or URLs');
      return;
    }

    setIsGenerating(true);
    setJobStatus(null);
    
    try {
      // Upload files if any
      const uploadedFileUrls: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const fileName = `meditation-input/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('audio')
            .getPublicUrl(fileName);
          uploadedFileUrls.push(publicUrl);
        }
      }

      // Upload user music if any
      const uploadedMusicUrls: string[] = [];
      if (userMusic.length > 0) {
        for (const file of userMusic) {
          const fileExt = file.name.split('.').pop();
          const fileName = `user-music/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('audio')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('audio')
            .getPublicUrl(fileName);
          uploadedMusicUrls.push(publicUrl);
        }
      }

      const { data, error } = await supabase.functions.invoke('convert-meditation-audio', {
        body: {
          mode: 'paid',
          frequency_hz: preset.value,
          processing_mode: preset.mode, // "BINAURAL" or "TONE_TUNING"
          meditation_style: style,
          sound_layers: soundLayers,
          duration: 30,
          audioUrl: uploadedFileUrls[0] || uploadedMusicUrls[0] || youtubeLinks?.split(',')[0] || urls?.split(',')[0],
          variants,
          bpm_match: bpmMatch,
          keep_music_stem: keepMusicStem,
        },
      });

      if (error) {
        console.error('Generation error:', error);
        toast.error(error.message || 'Failed to generate audio. Please try again.');
        setIsGenerating(false);
        return;
      }

      if (data && data.success === false) {
        console.error('Generation failed:', data.error);
        toast.error(data.error || 'Failed to generate audio. Please try again.');
        setIsGenerating(false);
        return;
      }

      if (data && data.success) {
        if (data.job_id) {
          toast.success(`Generation started! Tracking job...`);
          setActiveJobId(data.job_id);
          // isGenerating stays true while polling
        } else {
          toast.success('Audio generation complete!');
          setIsGenerating(false);
        }
        
        // If files are returned directly (not queued), set them
        if (data.files && Array.isArray(data.files)) {
          setGeneratedFiles(data.files);
          setIsGenerating(false);
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate audio. Please try again.');
      setIsGenerating(false);
    }
  };

  const refQuery = affiliateId ? `?ref=${affiliateId}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50 pb-24">
      {/* BUILD MARKER - PROOF OF DEPLOY */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/50 px-4 py-2 text-center">
        <span className="text-xs font-mono text-yellow-600 dark:text-yellow-400">
          BUILD_MARKER: MED15TYPES_15FREQS_V2
        </span>
      </div>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/20 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Creative Soul Meditation</h1>
              <p className="text-purple-100">Transform any audio into high-quality meditation tracks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Demo Notice */}
        {!hasAccess && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-center text-amber-800">
                <strong>Try the one free demo</strong> before purchase. Upload audio or paste a YouTube link!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Audio Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="audio-upload" className="cursor-pointer">Upload Audio Files</Label>
              <Input
                id="audio-upload"
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.m4a"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="mt-2 cursor-pointer"
              />
              {files.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {files.length} file(s) selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="music-upload" className="cursor-pointer">Upload Your Own Music (Optional)</Label>
              <Input
                id="music-upload"
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.m4a"
                onChange={(e) => setUserMusic(Array.from(e.target.files || []))}
                className="mt-2 cursor-pointer"
              />
              {userMusic.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {userMusic.length} music file(s) selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="youtube" className="flex items-center gap-2 cursor-pointer">
                <Youtube className="w-4 h-4 text-red-500" />
                YouTube URLs (comma separated)
              </Label>
              <Input
                id="youtube"
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeLinks}
                onChange={(e) => setYoutubeLinks(e.target.value)}
                className="mt-2 cursor-pointer"
              />
            </div>

            <div>
              <Label htmlFor="urls" className="flex items-center gap-2 cursor-pointer">
                <LinkIcon className="w-4 h-4" />
                Direct Audio URLs (comma separated)
              </Label>
              <Input
                id="urls"
                type="text"
                placeholder="https://example.com/audio.mp3"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="mt-2 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Options Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Generation Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="style" className="cursor-pointer">🧘‍♂️ Meditation / Healing Audio Type</Label>
                  <label className="text-xs flex items-center gap-2 cursor-pointer text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={overrideStyle}
                      onChange={(e) => setOverrideStyle(e.target.checked)}
                      className="cursor-pointer"
                    />
                    Override auto-style
                  </label>
                </div>
                <Select 
                  value={style} 
                  onValueChange={(val) => {
                    setStyle(val);
                    setOverrideStyle(true);
                  }}
                  disabled={!overrideStyle}
                >
                  <SelectTrigger id="style" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indian-vedic">Indian (Vedic) - Mantras, tanpura drones, temple bells, ancient resonance</SelectItem>
                    <SelectItem value="shamanic">Shamanic - Frame drums, rattles, tribal rhythms, journeying soundscapes</SelectItem>
                    <SelectItem value="mystic">Mystic - Etheric pads, choirs, cosmic textures, deep spiritual tones</SelectItem>
                    <SelectItem value="tibetan">Tibetan - Singing bowls, long horns, overtone chanting</SelectItem>
                    <SelectItem value="sufi">Sufi - Whirling rhythms, ney flute, heart-centered devotion</SelectItem>
                    <SelectItem value="zen">Zen (Japanese) - Minimal ambience, breath awareness, temple bells</SelectItem>
                    <SelectItem value="nature-healing">Nature Healing - Forest, birds, wind, water, grounding soundscapes</SelectItem>
                    <SelectItem value="ocean-water">Ocean / Water - Waves, flowing water, deep calming rhythms</SelectItem>
                    <SelectItem value="sound-bath">Sound Bath - Gongs, crystal bowls, harmonic overtones</SelectItem>
                    <SelectItem value="chakra-balancing">Chakra Balancing - Layered tones aligned to each chakra center</SelectItem>
                    <SelectItem value="breathwork">Breathwork - Pulsing rhythms guiding inhale/exhale cycles</SelectItem>
                    <SelectItem value="sleep-delta">Sleep / Delta Healing - Ultra-calm textures, slow binaural pulses</SelectItem>
                    <SelectItem value="affirmation-healing">Affirmation Healing - Clean voice-forward mixes with supportive music</SelectItem>
                    <SelectItem value="plant-medicine">Plant Medicine (Ceremonial) - Deep tribal ambience, ceremonial pacing</SelectItem>
                    <SelectItem value="higher-consciousness">Higher Consciousness / Cosmic - Galactic drones, expansive frequencies, awakening themes</SelectItem>
                  </SelectContent>
                </Select>
                {!overrideStyle && (
                  <p className="text-xs mt-2 text-muted-foreground">
                    Auto-selected from frequency: <b>{preset.defaultStyle}</b>
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="freq" className="cursor-pointer">Frequency (Hz) - Healing & Meditation</Label>
                <Select 
                  value={freq.toString()} 
                  onValueChange={(val) => {
                    const newFreq = Number(val);
                    setFreq(newFreq);
                    // Reset overrides when frequency changes
                    setOverrideStyle(false);
                    setOverrideLayers(false);
                  }}
                >
                  <SelectTrigger id="freq" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value.toString()}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs mt-2 text-muted-foreground">
                  {preset.mode === "BINAURAL"
                    ? "⚡ This frequency will be applied as binaural beats (brainwave), not pitch tuning."
                    : "🎵 This frequency will tune the audio tone (pitch/tuning), not binaural beats."}
                </p>
              </div>

              <div>
                <Label htmlFor="variants" className="cursor-pointer">Number of Variants (1-5)</Label>
                <Input
                  id="variants"
                  type="number"
                  min="1"
                  max="5"
                  value={variants}
                  onChange={(e) => setVariants(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                  className="cursor-pointer"
                  disabled={!hasAccess}
                />
                {!hasAccess && (
                  <p className="text-xs text-muted-foreground mt-1">Demo: 1 variant only</p>
                )}
              </div>
            </div>

            {/* Sound Layers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="cursor-pointer">Sound Matching Layers</Label>
                <label className="text-xs flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={overrideLayers}
                    onChange={(e) => setOverrideLayers(e.target.checked)}
                    className="cursor-pointer"
                  />
                  Override auto-layers
                </label>
              </div>
              <div className="border rounded p-3 space-y-2 max-h-48 overflow-y-auto">
                {(() => {
                  const allLayers: SoundLayer[] = [
                    "ocean_waves", "forest_ambience", "rain_soft", "wind_soft",
                    "tibetan_bowls", "handpan", "shaman_drums_soft", "indian_flute_soft",
                    "choir_pad", "brown_noise_soft", "pink_noise_soft", "silence"
                  ];
                  const displayLayers = overrideLayers ? allLayers : soundLayers;
                  
                  return displayLayers.map((layer) => {
                    const checked = soundLayers.includes(layer);
                    const labels: Record<SoundLayer, string> = {
                      ocean_waves: "Ocean Waves",
                      forest_ambience: "Forest Ambience",
                      rain_soft: "Soft Rain",
                      wind_soft: "Soft Wind",
                      tibetan_bowls: "Tibetan Bowls",
                      handpan: "Handpan",
                      shaman_drums_soft: "Shamanic Drums (Soft)",
                      indian_flute_soft: "Indian Flute (Soft)",
                      choir_pad: "Choir Pad",
                      brown_noise_soft: "Brown Noise (Soft)",
                      pink_noise_soft: "Pink Noise (Soft)",
                      silence: "Silence"
                    };

                    if (!overrideLayers) {
                      return (
                        <div key={layer} className="text-sm py-1 text-muted-foreground">
                          ✓ {labels[layer]}
                        </div>
                      );
                    }

                    return (
                      <label key={layer} className="flex items-center gap-2 py-1 cursor-pointer text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSoundLayers([...soundLayers, layer]);
                            } else {
                              setSoundLayers(soundLayers.filter((l) => l !== layer));
                            }
                            setOverrideLayers(true);
                          }}
                        />
                        {labels[layer]}
                      </label>
                    );
                  });
                })()}
              </div>
              {!overrideLayers && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Layers are matched to the chosen frequency for best meditation feel.
                </p>
              )}
            </div>

            <div className="space-y-3">

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bpm"
                  checked={bpmMatch}
                  onCheckedChange={(checked) => setBpmMatch(checked === true)}
                  className="cursor-pointer"
                />
                <Label htmlFor="bpm" className="cursor-pointer">Match BPM</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keep-stem"
                  checked={keepMusicStem}
                  onCheckedChange={(checked) => setKeepMusicStem(checked === true)}
                  className="cursor-pointer"
                />
                <Label htmlFor="keep-stem" className="cursor-pointer">Keep Original Music Stem</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          {!hasAccess && (
            <Button
              onClick={handleGenerateDemo}
              disabled={isGenerating || (demoUsed && !hasAccess)}
              className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {demoUsed ? 'Demo Used - Purchase Required' : 'Generate Demo (Free)'}
                </>
              )}
            </Button>
          )}

          {hasAccess && (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!files.length && !youtubeLinks && !urls && !userMusic.length)}
              className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Full Audio
                </>
              )}
            </Button>
          )}

          {!hasAccess && (
            <PaymentOptions affiliateId={affiliateId} />
          )}
        </div>

        {/* Job Progress Card */}
        {(isGenerating || jobStatus) && activeJobId && (
          <Card className="border-purple-300 bg-purple-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  {jobStatus?.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : jobStatus?.status === 'failed' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  )}
                  <span>
                    {jobStatus?.status === 'queued' && 'Queued...'}
                    {jobStatus?.status === 'processing' && 'Processing Audio...'}
                    {jobStatus?.status === 'completed' && 'Generation Complete!'}
                    {jobStatus?.status === 'failed' && 'Generation Failed'}
                    {!jobStatus && 'Initializing...'}
                  </span>
                </div>
                {jobStatus?.status !== 'completed' && jobStatus?.status !== 'failed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelPolling}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Stop Tracking
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress 
                value={jobStatus?.progress ?? 0} 
                className="h-2"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Job: {activeJobId.substring(0, 8)}...</span>
                <span>{jobStatus?.progress ?? 0}%</span>
              </div>
              {jobStatus?.error_message && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {jobStatus.error_message}
                </p>
              )}
              {jobStatus?.status === 'queued' && (
                <p className="text-sm text-muted-foreground">
                  Your job is in the queue. Processing will begin shortly...
                </p>
              )}
              {jobStatus?.status === 'processing' && (
                <p className="text-sm text-muted-foreground">
                  Applying {style} style with {freq}Hz frequency tuning...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generated Files */}
        {generatedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Generated Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Radio className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {file.type === 'final' ? 'Final Audio' : file.type === 'stem' ? 'Stem' : `Variant ${file.variantNumber}`}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="cursor-pointer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coins Display */}
        {balance && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold">Your Sacred Healing Coins:</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{balance.balance || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Purchase unlocks 1000 coins instantly!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

