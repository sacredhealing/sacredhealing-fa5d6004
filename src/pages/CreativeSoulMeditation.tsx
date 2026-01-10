import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Music, Upload, Youtube, Link as LinkIcon, Download, Loader2, Sparkles, ArrowLeft, Play, Wand2, Radio, Headphones, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  const [style, setStyle] = useState('ocean');
  const [freq, setFreq] = useState('432');
  const [binaural, setBinaural] = useState(true);
  const [bpmMatch, setBpmMatch] = useState(true);
  const [variants, setVariants] = useState(3);
  const [keepMusicStem, setKeepMusicStem] = useState(true);
  
  // State management
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [demoUsed, setDemoUsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

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
    try {
      const { data, error } = await supabase.functions.invoke('convert-meditation-audio', {
        body: {
          mode: 'demo', // Use mode: "demo" for demo generation
          payload: {
            files: [], // Demo doesn't process files
            youtube_links: youtubeLinks || undefined,
            urls: urls || undefined,
            style,
            freq: parseInt(freq),
            binaural,
            bpm_match: bpmMatch,
            variants: 1, // Demo: only 1 variant
            keep_music_stem: keepMusicStem,
          },
        },
      });

      if (error) {
        console.error('Demo generation error:', error);
        toast.error(error.message || 'Failed to generate demo. Please try again.');
        return;
      }

      // Check for success: false in response body
      if (data && data.success === false) {
        console.error('Demo generation failed:', data.error);
        toast.error(data.error || 'Failed to generate demo. Please try again.');
        if (data.error?.includes('Demo already used')) {
          setDemoUsed(true);
        }
        return;
      }

      if (data && data.success) {
        setDemoUsed(true);
        if (data.job_id) {
          toast.success(`Demo generation queued! Job ID: ${data.job_id.substring(0, 8)}...`);
        } else {
          toast.success('Demo generation complete! Purchase to unlock full features.');
        }
        // Store job_id if provided (for future polling)
        if (data.job_id) {
          console.log('Demo job_id:', data.job_id);
        }
      }
    } catch (error: any) {
      console.error('Demo generation error:', error);
      toast.error(error.message || 'Failed to generate demo. Please try again.');
    } finally {
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
          mode: 'paid', // Use mode: "paid" for full generation
          payload: {
            files: uploadedFileUrls,
            user_music: uploadedMusicUrls,
            youtube_links: youtubeLinks || undefined,
            urls: urls || undefined,
            style,
            freq: parseInt(freq),
            binaural,
            bpm_match: bpmMatch,
            variants,
            keep_music_stem: keepMusicStem,
          },
        },
      });

      if (error) {
        console.error('Generation error:', error);
        toast.error(error.message || 'Failed to generate audio. Please try again.');
        return;
      }

      // Check for success: false in response body
      if (data && data.success === false) {
        console.error('Generation failed:', data.error);
        toast.error(data.error || 'Failed to generate audio. Please try again.');
        return;
      }

      if (data && data.success) {
        if (data.job_id) {
          toast.success(`Generation queued! Job ID: ${data.job_id.substring(0, 8)}... Processing will begin shortly.`);
        } else {
          toast.success('Audio generation complete!');
        }
        // Store job_id if provided (for future polling)
        if (data.job_id) {
          console.log('Paid job_id:', data.job_id);
        }
        // If files are returned directly (not queued), set them
        if (data.files && Array.isArray(data.files)) {
          setGeneratedFiles(data.files);
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate audio. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const refQuery = affiliateId ? `?ref=${affiliateId}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50 pb-24">
      {/* BUILD MARKER - PROOF OF DEPLOY */}
      <div className="bg-yellow-500/20 border-b border-yellow-500/50 px-4 py-2 text-center">
        <span className="text-xs font-mono text-yellow-600 dark:text-yellow-400">
          BUILD_MARKER: MED9K3M2X
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
                <Label htmlFor="style" className="cursor-pointer">Meditation Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger id="style" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ocean">Ocean</SelectItem>
                    <SelectItem value="forest">Forest</SelectItem>
                    <SelectItem value="shaman">Shamanic</SelectItem>
                    <SelectItem value="indian">Indian</SelectItem>
                    <SelectItem value="relaxing">Relaxing</SelectItem>
                    <SelectItem value="mystic">Mystic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="freq" className="cursor-pointer">Frequency (Hz)</Label>
                <Select value={freq} onValueChange={setFreq}>
                  <SelectTrigger id="freq" className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="432">432Hz (Nature's Frequency)</SelectItem>
                    <SelectItem value="528">528Hz (Love Frequency)</SelectItem>
                    <SelectItem value="440">440Hz (Standard)</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="binaural"
                  checked={binaural}
                  onCheckedChange={(checked) => setBinaural(checked === true)}
                  className="cursor-pointer"
                />
                <Label htmlFor="binaural" className="cursor-pointer">Binaural Beats</Label>
              </div>

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

