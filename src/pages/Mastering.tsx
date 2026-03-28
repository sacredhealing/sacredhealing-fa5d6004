import React, { useState, useMemo } from 'react';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const Mastering: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'bundle'>('single');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const packages = useMemo(
    () => ({
      single: {
        name: t('mastering.singleTrack', '1 Track'),
        price: 147,
        desc: t('mastering.singleDesc', 'One song, beat, or meditation professionally mastered'),
      },
      bundle: {
        name: t('mastering.bundleTracks', '3 Tracks Bundle'),
        price: 397,
        desc: t('mastering.bundleDesc', 'Three tracks professionally mastered (save €44!)'),
      },
    }),
    [t]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const maxFiles = selectedPackage === 'single' ? 1 : 3;
    setFiles(selected.slice(0, maxFiles));
  };

  const handleSubmit = async () => {
    if (!email || files.length === 0) {
      toast({
        title: t('mastering.toastMissingTitle', 'Missing info'),
        description: t('mastering.toastMissingDesc', 'Please add your email and at least one file.'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mastering-checkout', {
        body: { packageType: selectedPackage, email, notes, trackCount: files.length },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: t('common.error', 'Error'), description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadSectionLabel =
    selectedPackage === 'single'
      ? t('mastering.uploadFilesLabelSingle', 'Upload files (1 file)')
      : t('mastering.uploadFilesLabelBundle', 'Upload files (up to 3 files)');

  return (
    <div className="min-h-screen px-4 pt-6 pb-32">
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/music')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold">
            {t('mastering.title', 'Professional Music Mastering')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('mastering.subtitle', '23 years of music production & mixing experience')}
          </p>
        </div>
      </header>

      <div className="bg-muted/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          {t(
            'mastering.infoDesc',
            'Send me your WAV or MP3 file and I will master and mix it for you. Perfect for your meditation, new beat, or song you want to release in high quality.'
          )}
        </p>
      </div>

      {/* Package Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.entries(packages) as [keyof typeof packages, (typeof packages)['single']][]).map(([key, pkg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSelectedPackage(key)}
            className={`p-4 rounded-lg border text-left ${selectedPackage === key ? 'border-primary bg-primary/10' : 'border-border bg-muted/20'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm">{pkg.name}</span>
              <span className="text-primary font-bold">€{pkg.price}</span>
            </div>
            <p className="text-xs text-muted-foreground">{pkg.desc}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {t('mastering.emailLabel', 'Your Email (for delivery)')}
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('mastering.emailPlaceholder', 'your@email.com')}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{uploadSectionLabel}</label>
          <label className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
            <input
              type="file"
              accept="audio/*"
              multiple={selectedPackage === 'bundle'}
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload size={18} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {files.length > 0 ? files.map((f) => f.name).join(', ') : t('mastering.dropzoneEmpty', 'WAV or MP3 files')}
            </span>
          </label>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {t('mastering.specialInstructions', 'Special Instructions (optional)')}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('mastering.instructionsPlaceholder', 'Any specific requirements or preferences for your mastering...')}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            t('mastering.payCta', {
              defaultValue: 'Pay {{amount}}',
              amount: `€${packages[selectedPackage].price}`,
            })
          )}
        </Button>
      </div>
    </div>
  );
};

export default Mastering;
