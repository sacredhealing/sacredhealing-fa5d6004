import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mic, MicOff, Sparkles, Download, FileText, Image as ImageIcon, Loader2, ArrowLeft, Wand2, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreativeTools } from '@/hooks/useCreativeTools';
import { toast } from 'sonner';

export default function CreativeSoulTool() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Check access from database (not URL params)
  const hasToolAccess = user && hasAccess('creative-soul-studio');

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

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to initiate payment. Please try again.');
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
        // Use demo data if in demo mode or user doesn't have access, otherwise transcribe
        if (demoActive || !hasToolAccess) {
          setTranscribedText(demoText);
          toast.info('Demo mode: Using sample transcription');
        } else {
          await transcribeAudio(blob);
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
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const { data, error } = await supabase.functions.invoke('creative-soul-transcribe', {
        body: {
          audioBase64: base64Audio,
          mimeType: audioBlob.type,
        },
      });

      if (error) throw error;

      if (data?.text) {
        setTranscribedText(data.text);
        toast.success('Audio transcribed successfully!');
      } else {
        throw new Error('No transcription returned');
      }
    } catch (error: any) {
      console.error('Transcription error:', error);
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

    // Use demo data if in demo mode or user doesn't have access
    if (demoActive || !hasToolAccess) {
      setIdeas(demoIdeas);
      toast.info('Demo mode: Using sample ideas');
      return;
    }

    setIsGeneratingIdeas(true);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-ideas', {
        body: {
          text: transcribedText,
        },
      });

      if (error) throw error;

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

    // Use demo data if in demo mode or user doesn't have access
    if (demoActive || !hasToolAccess) {
      setGeneratedImages([demoImage]);
      toast.info('Demo mode: Using sample image');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('creative-soul-image', {
        body: {
          prompt: promptText,
        },
      });

      if (error) throw error;

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

      if (error) throw error;

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
            
            {!hasToolAccess && (
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
              placeholder="Or type your creative idea here..."
              value={transcribedText}
              onChange={(e) => setTranscribedText(e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>

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
                  <Button
                    onClick={generatePDF}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={!ideas && !transcribedText}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </Button>
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

