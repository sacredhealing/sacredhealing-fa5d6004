import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Music, Mic, FileText, Loader2, Check, Upload, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ServiceBannerRow } from '@/components/ui/service-banner-row';

interface CustomMeditationCreationProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const CustomMeditationCreation: React.FC<CustomMeditationCreationProps> = ({ open: controlledOpen, onOpenChange, hideTrigger }) => {
  const { t } = useTranslation();

  const frequencies = [
    { id: '432hz', label: '432 Hz', description: t('meditationCreation.freq432') },
    { id: '528hz', label: '528 Hz', description: t('meditationCreation.freq528') },
    { id: '639hz', label: '639 Hz', description: t('meditationCreation.freq639') },
    { id: '741hz', label: '741 Hz', description: t('meditationCreation.freq741') },
  ];

  const soundTypes = [
    { id: 'indian', label: t('meditationCreation.soundIndian'), description: t('meditationCreation.soundIndianDesc') },
    { id: 'shamanic', label: t('meditationCreation.soundShamanic'), description: t('meditationCreation.soundShamanicDesc') },
    { id: 'cosmic', label: t('meditationCreation.soundCosmic'), description: t('meditationCreation.soundCosmicDesc') },
    { id: 'relaxed', label: t('meditationCreation.soundRelaxed'), description: t('meditationCreation.soundRelaxedDesc') },
    { id: 'nature', label: t('meditationCreation.soundNature'), description: t('meditationCreation.soundNatureDesc') },
  ];

  const packages = [
    {
      id: 'single',
      name: t('meditationCreation.singlePackage'),
      price: 97,
      description: t('meditationCreation.singleDesc'),
      popular: false,
    },
    {
      id: 'triple',
      name: t('meditationCreation.triplePackage'),
      price: 197,
      originalPrice: 291,
      description: t('meditationCreation.tripleDesc'),
      popular: true,
      savings: '€94',
    },
  ];

  const { user, isAuthenticated } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? (v: boolean) => onOpenChange?.(v) : setInternalOpen;
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
      {!hideTrigger && (
        <ServiceBannerRow
          icon={Music}
          title={t('meditationCreation.title')}
          subtitle={t('meditationCreation.badge')}
          onCtaClick={() => setIsOpen(true)}
          accentColor="amber"
          variant="sanctuary"
          priceAboveTitle="€97–€197"
        />
      )}

      {/* Booking Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">{t('meditationCreation.dialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('meditationCreation.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Package Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('meditationCreation.selectPackage')}
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
                              <Badge className="bg-amber-500/20 text-amber-400 text-xs">{t('meditationCreation.bestValue')}</Badge>
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
                {t('meditationCreation.selectFrequency')}
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
                {t('meditationCreation.selectSoundStyle')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {soundTypes.map((sound) => (
                  <button
                    key={sound.id}
                    type="button"
                    className={`p-3 rounded-lg border text-left transition-all flex-1 min-w-[140px] ${
                      selectedSoundType === sound.id
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                    onClick={() => setSelectedSoundType(sound.id)}
                  >
                    <div className="font-semibold text-sm">{sound.label}</div>
                    <div className="text-xs text-muted-foreground">{sound.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Description */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('meditationCreation.customDetails')}
              </h4>
              <Textarea
                placeholder={t('meditationCreation.customPlaceholder')}
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
                      {t('meditationCreation.addVoice')}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {t('meditationCreation.voiceMixDesc')}
                    </p>
                  </div>
                </div>
              </div>
              
              {includeVoiceAddon && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t('meditationCreation.voiceQualityNote')}
                  </p>
                  <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary/50 cursor-pointer transition-all">
                    <Upload size={20} className="text-muted-foreground" />
                    <span className="text-sm">
                      {voiceFile ? voiceFile.name : t('meditationCreation.uploadVoice')}
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
                  <h4 className="font-semibold text-sm">{t('meditationCreation.ownershipTitle')}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('meditationCreation.ownershipDesc')}
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>{t('meditationCreation.ownership1')}</li>
                    <li>{t('meditationCreation.ownership2')}</li>
                    <li>{t('meditationCreation.ownership3')}</li>
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
                  {t('meditationCreation.agreeContract')}
                </label>
              </div>
            </div>

            {/* Total & Book Button */}
            <div className="space-y-4 pt-4 border-t border-border">
              {selectedPackage && (
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>{t('meditationCreation.total')}</span>
                  <span className="text-gradient-gold">€{totalPrice}</span>
                </div>
              )}
              
              <Button
                onClick={handleBooking}
                disabled={!selectedPackage || !selectedFrequency || !selectedSoundType || !contractSigned || isLoading || !isAuthenticated}
                className="w-full bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700"
              >
                {isLoading || uploadingVoice ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    {uploadingVoice ? t('meditationCreation.uploading') : t('meditationCreation.processing')}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    {t('meditationCreation.continuePayment')}
                  </>
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-center text-muted-foreground">
                  {t('meditationCreation.signInRequired')}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomMeditationCreation;
