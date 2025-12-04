import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Upload, Mail, FileAudio, Loader2, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MasteringServiceProps {
  onSuccess?: () => void;
}

const MasteringService: React.FC<MasteringServiceProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'bundle' | null>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const packages = [
    {
      id: 'single' as const,
      name: t('mastering.singleTrack'),
      price: '€147',
      description: t('mastering.singleDesc'),
      tracks: 1
    },
    {
      id: 'bundle' as const,
      name: t('mastering.bundleTracks'),
      price: '€397',
      description: t('mastering.bundleDesc'),
      tracks: 3
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const maxTracks = selectedPackage === 'bundle' ? 3 : 1;
    
    if (selectedFiles.length > maxTracks) {
      toast.error(`You can only upload ${maxTracks} file(s) for this package`);
      return;
    }

    // Validate file types
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];
    const invalidFiles = selectedFiles.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error('Please upload only WAV or MP3 files');
      return;
    }

    setFiles(selectedFiles);
  };

  const uploadFiles = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error } = await supabase.storage
        .from('mastering-uploads')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}`);
      }

      uploadedUrls.push(filePath);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }
    if (!contactEmail) {
      toast.error('Please enter your email address');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload at least one audio file');
      return;
    }

    const maxTracks = selectedPackage === 'bundle' ? 3 : 1;
    if (files.length > maxTracks) {
      toast.error(`Maximum ${maxTracks} file(s) allowed for this package`);
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to continue');
        return;
      }

      // Upload files first
      setUploading(true);
      const fileUrls = await uploadFiles(user.id);
      setUploading(false);

      // Create checkout session
      const response = await supabase.functions.invoke('create-mastering-checkout', {
        body: {
          packageType: selectedPackage,
          contactEmail,
          notes,
          fileUrls
        }
      });

      if (response.error) throw response.error;

      const { url } = response.data;
      if (url) {
        window.open(url, '_blank');
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="mb-8 animate-slide-up">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/20 via-primary/10 to-accent/20 border border-border/50 p-6">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0">
              <Music className="text-secondary" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">
                {t('mastering.title')}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {t('mastering.subtitle')}
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border/30">
            <div className="flex gap-3">
              <Info className="text-primary shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-foreground/80">
                <p className="font-medium mb-2">{t('mastering.infoTitle')}</p>
                <p className="text-muted-foreground">
                  {t('mastering.infoDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Package Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-secondary bg-secondary/10 ring-2 ring-secondary/30'
                    : 'border-border/50 bg-muted/20 hover:border-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-foreground">{pkg.name}</span>
                  <span className="text-lg font-bold text-secondary">{pkg.price}</span>
                </div>
                <p className="text-xs text-muted-foreground">{pkg.description}</p>
                {selectedPackage === pkg.id && (
                  <CheckCircle2 className="text-secondary mt-2" size={18} />
                )}
              </button>
            ))}
          </div>

          {selectedPackage && (
            <div className="space-y-4 animate-fade-in">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Mail className="inline mr-2" size={14} />
                  {t('mastering.emailLabel')}
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <FileAudio className="inline mr-2" size={14} />
                  {t('mastering.uploadLabel')}
                </label>
                <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-secondary/50 transition-colors">
                  <input
                    type="file"
                    accept=".wav,.mp3,audio/wav,audio/mpeg"
                    multiple={selectedPackage === 'bundle'}
                    onChange={handleFileChange}
                    className="hidden"
                    id="music-upload"
                  />
                  <label htmlFor="music-upload" className="cursor-pointer">
                    <Upload className="mx-auto text-muted-foreground mb-2" size={32} />
                    <p className="text-sm text-muted-foreground">
                      {selectedPackage === 'bundle' ? t('mastering.uploadUpTo3') : t('mastering.upload1File')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('mastering.wavOrMp3')}
                    </p>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="text-accent" size={14} />
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('mastering.specialInstructions')}
                </label>
                <Textarea
                  placeholder={t('mastering.instructionsPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-background/50 min-h-[80px]"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !contactEmail || files.length === 0}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {uploading ? t('mastering.uploading') : t('mastering.processing')}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" size={18} />
                    {t('mastering.proceedToPayment')}
                  </>
                )}
              </Button>

              {/* How it works */}
              <div className="bg-muted/20 rounded-xl p-4 border border-border/30">
                <h4 className="font-medium text-foreground text-sm mb-3">{t('mastering.howItWorks')}</h4>
                <ol className="text-xs text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                    <span>{t('mastering.step1')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                    <span>{t('mastering.step2')}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                    <span>{t('mastering.step3')}</span>
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MasteringService;
