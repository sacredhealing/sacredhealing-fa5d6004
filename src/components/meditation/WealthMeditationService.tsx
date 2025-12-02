import React, { useState } from 'react';
import { Sparkles, Upload, Loader2, Check, Zap, Heart, DollarSign, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WealthMeditationService: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size must be under 100MB');
      return;
    }
    
    setVoiceFile(file);
    toast.success('Voice file selected');
  };

  const uploadVoiceFile = async (): Promise<string | null> => {
    if (!voiceFile || !user) return null;
    
    setUploadingVoice(true);
    try {
      const fileExt = voiceFile.name.split('.').pop();
      const fileName = `wealth-meditation/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('meditations')
        .upload(fileName, voiceFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('meditations')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload voice file');
      return null;
    } finally {
      setUploadingVoice(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to purchase');
      return;
    }

    if (!voiceFile) {
      toast.error('Please upload your voice recording with the 108 affirmations');
      return;
    }

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const voiceFileUrl = await uploadVoiceFile();
      if (!voiceFileUrl) {
        throw new Error('Failed to upload voice file');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-wealth-meditation-checkout', {
        body: { 
          voiceFileUrl,
          email,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        setIsOpen(false);
        toast.success('Redirecting to checkout...');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to process purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Featured Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-orange-500/20 border border-yellow-500/30 p-6 animate-slide-up">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mb-3">
            ✨ Wealth Activation
          </Badge>
          
          <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
            108 Wealth Reprogramming Meditation
          </h3>
          
          <p className="text-foreground/80 mb-4 leading-relaxed">
            Activate abundance. Rewire your subconscious. Step into the wealth you're meant for.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-yellow-400 flex items-center gap-2">
                <Zap size={16} /> What it does:
              </h4>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• Reprograms your mind for success</li>
                <li>• Clears money blocks</li>
                <li>• Raises vibration with 528/639 Hz</li>
                <li>• Strengthens confidence & self-worth</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-amber-400 flex items-center gap-2">
                <Star size={16} /> What's inside:
              </h4>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• 108 powerful money-affirmations</li>
                <li>• Deep theta subconscious activation</li>
                <li>• Energetic alignment + neuroprogramming</li>
                <li>• Your voice transformed to studio-quality</li>
              </ul>
            </div>
          </div>

          <div className="bg-background/30 rounded-lg p-4 mb-5 border border-border/50">
            <h4 className="font-semibold text-sm text-orange-400 flex items-center gap-2 mb-2">
              <Heart size={16} /> For you if you want to:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-foreground/70">
              <span>• Attract more money & opportunities</span>
              <span>• Break old financial patterns</span>
              <span>• Feel calmer & more abundant</span>
              <span>• Manifest faster with less effort</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div>
              <span className="text-3xl font-heading font-bold text-gradient-gold">€147</span>
              <span className="text-muted-foreground text-sm ml-2">one-time</span>
            </div>
          </div>

          <Button 
            onClick={() => setIsOpen(true)} 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
          >
            <DollarSign size={18} className="mr-2" />
            Activate My Wealth Codes
          </Button>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">108 Wealth Reprogramming Meditation</DialogTitle>
            <DialogDescription>
              Transform your voice into a professional wealth activation meditation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* How it works */}
            <div className="space-y-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-500" />
                How it works:
              </h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Record yourself reading all 108 affirmations (any quality is fine!)</li>
                <li>Upload your recording below</li>
                <li>Complete checkout</li>
                <li>Receive the 108 affirmations via email</li>
                <li>I transform your voice into a professional, frequency-infused wealth meditation</li>
                <li>Your personalized meditation is delivered within 5-7 days</li>
              </ol>
            </div>

            {/* Voice Upload */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Upload Your Voice Recording *
              </h4>
              <p className="text-sm text-muted-foreground">
                Record yourself reading the 108 affirmations. Don't worry about audio quality — I'll transform it into studio-quality sound!
              </p>
              <label className="flex items-center gap-2 p-4 rounded-lg border border-dashed border-border hover:border-yellow-500/50 cursor-pointer transition-all bg-muted/20">
                <Upload size={24} className="text-muted-foreground" />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {voiceFile ? voiceFile.name : 'Click to upload your voice recording'}
                  </span>
                  <p className="text-xs text-muted-foreground">MP3, WAV, M4A up to 100MB</p>
                </div>
                {voiceFile && <Check size={20} className="text-green-500" />}
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleVoiceUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Email */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Email Address *
              </h4>
              <p className="text-sm text-muted-foreground">
                We'll send the 108 affirmations and your completed meditation to this email.
              </p>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* What you get */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="font-semibold text-sm">What you'll receive:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  All 108 wealth affirmations (Swedish) via email
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Your personalized wealth meditation (5-7 days)
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  528Hz & 639Hz frequency infusion
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  Professional studio-quality audio
                </li>
              </ul>
            </div>

            {/* Price & Purchase */}
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-gradient-gold">€147</span>
              </div>
              
              <Button
                onClick={handlePurchase}
                disabled={!voiceFile || !email || isLoading || !isAuthenticated || uploadingVoice}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isLoading || uploadingVoice ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {uploadingVoice ? 'Uploading voice...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    Continue to Payment
                  </>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-center text-muted-foreground">
                  Please sign in to purchase
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WealthMeditationService;
