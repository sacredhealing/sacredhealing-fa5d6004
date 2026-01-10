import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Sparkles, Download, FileText, Image as ImageIcon, Loader2, ArrowLeft, Wand2, Play, Youtube, Languages, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreativeTools } from '@/hooks/useCreativeTools';
import { useAdminRole } from '@/hooks/useAdminRole';
import { convertYouTubeToMP3, convertVoiceToText } from '@/utils/audioConversion';
import { toast } from 'sonner';

export default function CreativeSoulTool() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [searchParams] = useSearchParams();
  const { hasAccess, refetch } = useCreativeTools();
  const [transcribedText, setTranscribedText] = useState('');
  const [ideas, setIdeas] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [demoActive, setDemoActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  
  // YouTube processing states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessingYoutube, setIsProcessingYoutube] = useState(false);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const [translationLanguage, setTranslationLanguage] = useState('es'); // Default: Spanish
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Check access from database (not URL params) - Admins have full access
  const hasToolAccess = user && (isAdmin || hasAccess('creative-soul-studio'));

  // Demo data
  const demoText = "This is a demo transcription of your voice.";
  const demoIdeas = "1. Write a self-healing journal\n2. Create a digital vision board\n3. Design a meditation poster";
  const demoImage = "https://via.placeholder.com/400x400.png?text=Demo+Image";
  const demoPDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  // Check for affiliate code and verify access from database
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setAffiliateId(ref);
      localStorage.setItem('creative_soul_affiliate', ref);
    } else {
      const stored = localStorage.getItem('creative_soul_affiliate');
      if (stored) setAffiliateId(stored);
    }

    // Poll for access updates (webhook may have just processed payment)
    if (user) {
      refetch();
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      
      // Stop polling after 2 minutes
      setTimeout(() => clearInterval(interval), 120000);
      
      return () => clearInterval(interval);
    }
  }, [searchParams, user, refetch]);

  // Demo/Admin Access
  const handleDemoAccess = () => setDemoActive(true);

  // Stripe Checkout
  const handlePurchase = async () => {
    if (!user) {
      toast.info('Please sign in to purchase creative tools');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-creative-tool-checkout', {
        body: { 
          toolSlug: 'creative-soul-studio',
          ...(affiliateId && { affiliateId })
        }
      });

      if (error) {
        console.error('Checkout function error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      const errorMessage = err.message || err.error?.message || 'Failed to initiate payment. Please ensure you are signed in and try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        // Use demo data if in demo mode, otherwise transcribe (admins and paid users)
        if (demoActive) {
          setTranscribedText(demoText);
          toast.info('Demo mode: Using sample transcription');
        } else if (hasToolAccess) {
          await transcribeAudio(blob);
        } else {
          setTranscribedText(demoText);
          toast.info('Demo mode: Using sample transcription. Purchase to unlock full features.');
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
      toast.info('Recording started...');
    } catch (error: any) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone. Please grant permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      toast.info('Recording stopped. Transcribing...');
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      // Use utility function with proper error handling
      const result = await convertVoiceToText(audioBlob);

      // Check status code - only 200 is success
      if (result.status === 200 && result.text) {
        setTranscribedText(result.text);
        toast.success(result.message || 'Audio transcribed successfully!');
      } else {
        // Handle error with proper status code
        const errorMessage = result.error || 'Failed to transcribe audio';
        toast.error(errorMessage);
        console.error('[transcribeAudio] Error:', result.status, errorMessage);
      }
    } catch (error: any) {
      console.error('[transcribeAudio] Exception:', error);
      toast.error(error?.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateIdeas = async () => {
    if (!transcribedText.trim()) {
      toast.error('Please record or enter text first');
      return;
    }

    // Use demo data if in demo mode
    if (demoActive) {
      setIdeas(demoIdeas);
      toast.info('Demo mode: Using sample ideas');
      return;
    }
    
    // Check access for real generation
    if (!hasToolAccess) {
      setIdeas(demoIdeas);
      toast.info('Demo mode: Using sample ideas. Purchase to unlock full features.');
      return;
    }

    setIsGeneratingIdeas(true);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-ideas', {
        body: {
          text: transcribedText,
        },
      });

      if (error) {
        console.error('Ideas function error:', error);
        throw new Error(error.message || 'Failed to generate ideas');
      }

      if (data?.ideas) {
        setIdeas(data.ideas);
        toast.success('Creative ideas generated!');
      } else {
        throw new Error('No ideas generated');
      }
    } catch (error: any) {
      console.error('Idea generation error:', error);
      toast.error(error?.message || 'Failed to generate ideas. Please try again.');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const generateImage = async () => {
    const promptText = ideas || transcribedText;
    if (!promptText.trim()) {
      toast.error('Please generate ideas or enter text first');
      return;
    }

    // Use demo data if in demo mode
    if (demoActive) {
      setGeneratedImages([demoImage]);
      toast.info('Demo mode: Using sample image');
      return;
    }
    
    // Check access for real generation
    if (!hasToolAccess) {
      setGeneratedImages([demoImage]);
      toast.info('Demo mode: Using sample image. Purchase to unlock full features.');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-image', {
        body: {
          prompt: promptText,
        },
      });

      if (error) {
        console.error('Image function error:', error);
        throw new Error(error.message || 'Failed to generate image');
      }

      if (data?.imageUrl) {
        setGeneratedImages([...generatedImages, data.imageUrl]);
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image generated');
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error?.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generatePDF = async () => {
    const content = ideas || transcribedText;
    if (!content.trim()) {
      toast.error('Please generate ideas or enter text first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-pdf', {
        body: {
          text: content,
        },
      });

      if (error) {
        console.error('PDF function error:', error);
        throw new Error(error.message || 'Failed to generate PDF');
      }

      if (data?.pdfUrl || data?.pdfBase64) {
        // Download PDF
        const link = document.createElement('a');
        if (data.pdfUrl) {
          link.href = data.pdfUrl;
        } else {
          link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        }
        link.download = `creative-soul-${Date.now()}.pdf`;
        link.click();
        toast.success('PDF downloaded!');
      } else {
        throw new Error('No PDF generated');
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(error?.message || 'Failed to generate PDF. Please try again.');
    }
  };

  // YouTube to MP3 conversion with proper error handling
  const handleYoutubeConvert = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (demoActive || !hasToolAccess) {
      toast.info('Demo mode: Using sample data. Purchase to unlock full YouTube conversion.');
      // Simulate demo conversion
      setTimeout(() => {
        setMp3Url('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        setTranscribedText('Demo transcription from YouTube video...');
        toast.success('Demo conversion complete!');
      }, 2000);
      return;
    }

    setIsProcessingYoutube(true);
    try {
      // Step 1: Convert YouTube to MP3 using utility function with proper status codes
      const conversionResult = await convertYouTubeToMP3(youtubeUrl);

      // Check status code - only 200 is success
      if (conversionResult.status === 200 && conversionResult.url) {
        setMp3Url(conversionResult.url);
        toast.success(conversionResult.message || 'YouTube video converted to MP3!');
        
        // Step 2: Auto-transcribe if audio base64 is available
        // Note: This would require the Edge Function to return audioBase64
        // For now, we'll skip auto-transcription from YouTube conversion
        // Users can manually transcribe after downloading the MP3
      } else {
        // Handle error with proper status code
        const errorMessage = conversionResult.error || 'Failed to convert YouTube video';
        toast.error(errorMessage);
        console.error('[handleYoutubeConvert] Error:', conversionResult.status, errorMessage);
      }
    } catch (error: any) {
      console.error('[handleYoutubeConvert] Exception:', error);
      toast.error(error?.message || 'Failed to convert YouTube video. Please try again.');
    } finally {
      setIsProcessingYoutube(false);
    }
  };

  // Translate text
  const handleTranslate = async () => {
    const textToTranslate = translatedText || transcribedText;
    if (!textToTranslate.trim()) {
      toast.error('Please transcribe or enter text first');
      return;
    }

    if (demoActive || !hasToolAccess) {
      setTranslatedText(`[Demo Translation to ${translationLanguage}] ${textToTranslate}`);
      toast.info('Demo mode: Using sample translation. Purchase to unlock full translation.');
      return;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-translate', {
        body: {
          text: textToTranslate,
          targetLanguage: translationLanguage,
        },
      });

      if (error) throw error;

      if (data?.translatedText) {
        setTranslatedText(data.translatedText);
        toast.success(`Text translated to ${translationLanguage.toUpperCase()}!`);
      } else {
        throw new Error('No translation returned');
      }
    } catch (error: any) {
      console.error('Translation error:', error);
      toast.error(error?.message || 'Failed to translate text. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500/20 via-background to-pink-500/10 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/creative-soul')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Creative Soul
            </Button>
            
            {!hasToolAccess && !isAdmin && (
              <div className="flex gap-2">
                {!user && (
                  <Button
                    onClick={handleDemoAccess}
                    variant="outline"
                    size="sm"
                    className="border-purple-600 text-purple-600"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try Demo
                  </Button>
                )}
                <Button
                  onClick={handlePurchase}
                  size="sm"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Unlock (€19.99)'
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Creative Soul Studio
              </h1>
              <p className="text-muted-foreground">
                Transform your voice into creative ideas, images, and documents
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* YouTube Video Converter */}
        <Card className="border-2 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              YouTube Video Converter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Paste YouTube video URL here..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full"
                disabled={isProcessingYoutube || !hasToolAccess}
              />
              <Button
                onClick={handleYoutubeConvert}
                disabled={isProcessingYoutube || !youtubeUrl.trim() || !hasToolAccess}
                size="lg"
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                {isProcessingYoutube ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Video...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Convert to MP3 & Process
                  </>
                )}
              </Button>
              {mp3Url && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2">MP3 Ready!</p>
                  <audio controls src={mp3Url} className="w-full" />
                  <Button
                    onClick={() => window.open(mp3Url, '_blank')}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download MP3
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voice Recorder */}
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Voice to Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                size="lg"
                className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>

              {isTranscribing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Transcribing...</span>
                </div>
              )}

              {isRecording && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  Recording...
                </Badge>
              )}
            </div>

            <Textarea
              placeholder="Or type your creative idea here... (or paste transcription from YouTube conversion above)"
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              className="min-h-[120px]"
            />
              {!hasToolAccess && !demoActive && (
                <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded border border-yellow-200">
                  💡 Purchase full access to unlock YouTube conversion, translation, and all features
                </div>
              )}
          </CardContent>
        </Card>

        {/* Translation */}
        {(transcribedText || translatedText) && (
          <Card className="border-2 border-indigo-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-indigo-500" />
                Translation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Select value={translationLanguage} onValueChange={setTranslationLanguage}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleTranslate}
                  disabled={isTranslating || !transcribedText.trim() || !hasToolAccess}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      Translate
                    </>
                  )}
                </Button>
              </div>
              {translatedText && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-800 mb-2">Translated Text ({translationLanguage.toUpperCase()}):</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{translatedText}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Idea Generator */}
        {transcribedText && (
          <Card className="border-2 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-blue-500" />
                Creative Ideas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateIdeas}
                disabled={isGeneratingIdeas || !transcribedText.trim()}
                size="lg"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isGeneratingIdeas ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Creative Ideas
                  </>
                )}
              </Button>

              {ideas && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="whitespace-pre-wrap text-foreground">{ideas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Output Options */}
        {(ideas || transcribedText) && (
          <Card className="border-2 border-purple-500/30">
            <CardHeader>
              <CardTitle>Generate Output</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={generateImage}
                  disabled={isGeneratingImage}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>

                {hasToolAccess && (
                  <>
                    <Button
                      onClick={generatePDF}
                      variant="outline"
                      size="lg"
                      className="w-full"
                      disabled={!ideas && !transcribedText && !translatedText}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export as PDF
                    </Button>
                    {(mp3Url || transcribedText) && (
                      <div className="text-xs text-muted-foreground text-center">
                        💡 PDF will include: {transcribedText && 'Transcription'} {translatedText && 'Translation'} {ideas && 'Ideas'}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Generated Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generatedImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={imgUrl}
                          alt={`Generated ${idx + 1}`}
                          className="w-full rounded-lg border border-border"
                        />
                        <a
                          href={imgUrl}
                          download={`creative-soul-image-${idx + 1}.png`}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button size="sm" variant="secondary">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Tip:</strong> Record your voice or type your ideas, then generate creative content, images, or PDF documents.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

