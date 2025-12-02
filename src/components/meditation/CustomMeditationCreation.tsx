import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Music, Mic, FileText, Loader2, Check, Upload, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const frequencies = [
  { id: '432hz', label: '432 Hz', description: 'Universal healing frequency' },
  { id: '528hz', label: '528 Hz', description: 'DNA repair & transformation' },
  { id: '639hz', label: '639 Hz', description: 'Connection & relationships' },
  { id: '741hz', label: '741 Hz', description: 'Intuition & awakening' },
];

const soundTypes = [
  { id: 'indian', label: 'Indian', description: 'Traditional spiritual sounds' },
  { id: 'shamanic', label: 'Shamanic', description: 'Primal earth rhythms' },
  { id: 'cosmic', label: 'Cosmic', description: 'Ethereal space ambience' },
  { id: 'relaxed', label: 'Relaxed', description: 'Gentle & soothing' },
  { id: 'nature', label: 'Nature', description: 'Natural soundscapes' },
];

const packages = [
  {
    id: 'single',
    name: 'Single Meditation',
    price: 97,
    description: '1 Custom Meditation',
    popular: false,
  },
  {
    id: 'triple',
    name: '3 Meditation Pack',
    price: 197,
    originalPrice: 291,
    description: '3 Custom Meditations',
    popular: true,
    savings: '€94',
  },
];

const CustomMeditationCreation: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'triple' | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string>('');
  const [selectedSoundType, setSelectedSoundType] = useState<string>('');
  const [customDescription, setCustomDescription] = useState('');
  const [includeVoiceAddon, setIncludeVoiceAddon] = useState(false);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [contractSigned, setContractSigned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const totalPrice = selectedPackage 
    ? packages.find(p => p.id === selectedPackage)!.price + (includeVoiceAddon ? 37 : 0)
    : 0;

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB');
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
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
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

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book');
      return;
    }

    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }

    if (!selectedFrequency) {
      toast.error('Please select a frequency');
      return;
    }

    if (!selectedSoundType) {
      toast.error('Please select a sound type');
      return;
    }

    if (!contractSigned) {
      toast.error('Please agree to the ownership contract');
      return;
    }

    if (includeVoiceAddon && !voiceFile) {
      toast.error('Please upload your voice recording');
      return;
    }

    setIsLoading(true);
    try {
      let voiceFileUrl = null;
      if (includeVoiceAddon && voiceFile) {
        voiceFileUrl = await uploadVoiceFile();
        if (!voiceFileUrl) {
          throw new Error('Failed to upload voice file');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-meditation-creation-checkout', {
        body: { 
          packageType: selectedPackage, 
          frequency: selectedFrequency,
          soundType: selectedSoundType,
          customDescription,
          includeVoiceAddon,
          voiceFileUrl,
          contractSigned,
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
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Featured Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600/30 via-purple-500/20 to-amber-800/30 border border-amber-500/30 p-6 animate-slide-up">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />
        
        <div className="relative">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-3">
            🎵 For Creators & Healers
          </Badge>
          
          <h3 className="text-2xl font-heading font-bold text-foreground mb-2">
            Custom Meditation Creation
          </h3>
          
          <p className="text-foreground/80 mb-4 leading-relaxed">
            Influencers, healers, mediums — get your own customized meditation for YouTube, Spotify, 
            workshops & more. Choose your frequency, sound style, and I create it for you. 
            All meditations are mastered in high quality, ready for release.
          </p>

          <div className="grid grid-cols-1 gap-2 mb-5">
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Radio size={16} className="text-purple-400" />
              <span>Choose frequency: 432hz, 528hz, 639hz, 741hz</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Music size={16} className="text-amber-400" />
              <span>Sound styles: Indian, Shamanic, Cosmic & more</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Mic size={16} className="text-purple-400" />
              <span>Voice addon available (+€37)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div>
              <span className="text-3xl font-heading font-bold text-gradient-gold">€97</span>
              <span className="text-muted-foreground text-sm ml-2">single</span>
            </div>
            <div className="text-muted-foreground">or</div>
            <div>
              <span className="text-3xl font-heading font-bold text-gradient-gold">€197</span>
              <span className="text-muted-foreground text-sm ml-2">for 3</span>
              <Badge variant="secondary" className="ml-2 bg-green-500/20 text-green-400 border-green-500/30">
                Save €94
              </Badge>
            </div>
          </div>

          <Button 
            onClick={() => setIsOpen(true)} 
            className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-semibold"
          >
            <Sparkles size={18} className="mr-2" />
            Create My Meditation
          </Button>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Create Your Custom Meditation</DialogTitle>
            <DialogDescription>
              Professional meditation creation for your brand
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 mt-4">
              {/* Package Selection */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Select Package
                </h4>
                <div className="grid gap-3">
                  {packages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedPackage === pkg.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPackage(pkg.id as 'single' | 'triple')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPackage === pkg.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedPackage === pkg.id && <Check size={12} className="text-primary-foreground" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{pkg.name}</span>
                              {pkg.popular && (
                                <Badge className="bg-amber-500/20 text-amber-400 text-xs">Best Value</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">€{pkg.price}</div>
                          {pkg.originalPrice && (
                            <div className="text-sm text-muted-foreground line-through">€{pkg.originalPrice}</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Select Frequency
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {frequencies.map((freq) => (
                    <Card
                      key={freq.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedFrequency === freq.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedFrequency(freq.id)}
                    >
                      <div className="font-semibold text-sm">{freq.label}</div>
                      <div className="text-xs text-muted-foreground">{freq.description}</div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sound Type Selection */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Select Sound Style
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {soundTypes.map((sound) => (
                    <Card
                      key={sound.id}
                      className={`p-3 cursor-pointer transition-all ${
                        selectedSoundType === sound.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedSoundType(sound.id)}
                    >
                      <div className="font-semibold text-sm">{sound.label}</div>
                      <div className="text-xs text-muted-foreground">{sound.description}</div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom Description */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Custom Details (Optional)
                </h4>
                <Textarea
                  placeholder="Describe exactly what you want the meditation sound to be... any specific instruments, moods, themes, or intentions..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Voice Addon */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="voiceAddon"
                      checked={includeVoiceAddon}
                      onCheckedChange={(checked) => setIncludeVoiceAddon(checked as boolean)}
                    />
                    <div>
                      <label htmlFor="voiceAddon" className="font-semibold cursor-pointer">
                        Add Your Voice (+€37)
                      </label>
                      <p className="text-sm text-muted-foreground">
                        I'll professionally mix your voice into the meditation
                      </p>
                    </div>
                  </div>
                </div>
                
                {includeVoiceAddon && (
                  <div className="mt-3">
                    <p className="text-sm text-muted-foreground mb-2">
                      Don't worry about audio quality — I can make a phone recording sound professional!
                    </p>
                    <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-all">
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-sm">
                        {voiceFile ? voiceFile.name : 'Upload your voice recording'}
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Contract */}
              <div className="space-y-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-amber-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Ownership Agreement</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      By purchasing, you agree to a 50/50 ownership split of the created meditation. 
                      This means:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>You own 50% of all streaming royalties</li>
                      <li>Sacred Healing Music (Adam Gil Lazaro) owns 50%</li>
                      <li>When uploading to DistroKid or any other distributor, you must add <strong>"Sacred Healing Music Adam Gil Lazaro"</strong> as a collaborator/co-owner</li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <Checkbox
                    id="contract"
                    checked={contractSigned}
                    onCheckedChange={(checked) => setContractSigned(checked as boolean)}
                  />
                  <label htmlFor="contract" className="text-sm cursor-pointer">
                    I agree to the 50/50 ownership agreement and will credit Sacred Healing Music Adam Gil Lazaro on all platforms
                  </label>
                </div>
              </div>

              {/* Total & Book Button */}
              <div className="space-y-4 pt-4 border-t border-border">
                {selectedPackage && (
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-gradient-gold">€{totalPrice}</span>
                  </div>
                )}
                
                <Button
                  onClick={handleBooking}
                  disabled={!selectedPackage || !selectedFrequency || !selectedSoundType || !contractSigned || isLoading || !isAuthenticated || uploadingVoice}
                  className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700"
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
                    Please sign in to create your meditation
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomMeditationCreation;
