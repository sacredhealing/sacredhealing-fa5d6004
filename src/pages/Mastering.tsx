import React, { useState } from 'react';
import { ArrowLeft, Music, Upload, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Mastering: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'bundle'>('single');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const packages = {
    single: { name: '1 Track', price: 147, desc: 'One song, beat, or meditation professionally mastered' },
    bundle: { name: '3 Tracks Bundle', price: 397, desc: 'Three tracks professionally mastered (save €44!)' }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const maxFiles = selectedPackage === 'single' ? 1 : 3;
    setFiles(selected.slice(0, maxFiles));
  };

  const handleSubmit = async () => {
    if (!email || files.length === 0) {
      toast({ title: 'Missing info', description: 'Please add email and files', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-mastering-checkout', {
        body: { packageType: selectedPackage, email, notes, trackCount: files.length }
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-6 pb-32">
      <header className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/music')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-xl font-heading font-bold">Professional Music Mastering</h1>
          <p className="text-sm text-muted-foreground">23 years of music production & mixing experience</p>
        </div>
      </header>

      <div className="bg-muted/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Send me your WAV or MP3 file and I will master and mix it for you. Perfect for your meditation, new beat, or song you want to release in high quality.
        </p>
      </div>

      {/* Package Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(Object.entries(packages) as [keyof typeof packages, typeof packages.single][]).map(([key, pkg]) => (
          <button
            key={key}
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
          <label className="text-sm text-muted-foreground mb-1 block">Email for delivery</label>
          <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Upload files ({selectedPackage === 'single' ? '1 file' : 'up to 3 files'})
          </label>
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
              {files.length > 0 ? files.map(f => f.name).join(', ') : 'WAV or MP3 files'}
            </span>
          </label>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Notes (optional)</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any specific requirements..." rows={3} />
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Pay €{packages[selectedPackage].price}</>}
        </Button>
      </div>
    </div>
  );
};

export default Mastering;
