import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, User, Sparkles, Heart, Brain, Music, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SessionType {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface SessionPackage {
  id: string;
  name: string;
  description: string;
  session_count: number;
  price_eur: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  spiritual: <Sparkles className="w-5 h-5" />,
  healing: <Heart className="w-5 h-5" />,
  men: <Shield className="w-5 h-5" />,
};

const PrivateSessions: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [packages, setPackages] = useState<SessionPackage[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('adam');
  const [notes, setNotes] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [typesRes, packagesRes] = await Promise.all([
        supabase.from('session_types').select('*').order('order_index'),
        supabase.from('session_packages').select('*').order('order_index')
      ]);

      if (typesRes.data) setSessionTypes(typesRes.data);
      if (packagesRes.data) setPackages(packagesRes.data);
    } catch (error) {
      console.error('Error fetching session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to book a session');
      navigate('/auth');
      return;
    }

    if (!selectedType || !selectedPackage) {
      toast.error('Please select a session type and package');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('session_bookings').insert({
        user_id: user!.id,
        session_type_id: selectedType,
        package_id: selectedPackage,
        practitioner: selectedPractitioner,
        notes,
        contact_email: contactEmail,
        status: 'pending'
      });

      if (error) throw error;

      toast.success('Session booked! We will contact you shortly to schedule your session.');
      setNotes('');
      setSelectedType('');
      setSelectedPackage('');
    } catch (error: any) {
      console.error('Error booking session:', error);
      toast.error('Failed to book session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPackageData = packages.find(p => p.id === selectedPackage);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 pb-32">
      {/* Header */}
      <header className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          Private Sessions
        </h1>
        <p className="text-muted-foreground">
          Book a transformative 1-on-1 session with Adam or Laila
        </p>
      </header>

      {/* Practitioners */}
      <Card className="mb-6 animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Choose Your Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPractitioner} onValueChange={setSelectedPractitioner} className="grid grid-cols-2 gap-4">
            <div>
              <RadioGroupItem value="adam" id="adam" className="peer sr-only" />
              <Label
                htmlFor="adam"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-healing flex items-center justify-center mb-2">
                  <User size={32} className="text-foreground" />
                </div>
                <span className="font-heading font-semibold">Adam</span>
                <span className="text-xs text-muted-foreground">Spiritual Guide</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="laila" id="laila" className="peer sr-only" />
              <Label
                htmlFor="laila"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-card flex items-center justify-center mb-2">
                  <User size={32} className="text-foreground" />
                </div>
                <span className="font-heading font-semibold">Laila</span>
                <span className="text-xs text-muted-foreground">Healing Practitioner</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Session Types */}
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles size={20} />
            Select Session Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedType} onValueChange={setSelectedType} className="space-y-3">
            {sessionTypes.map((type) => (
              <div key={type.id}>
                <RadioGroupItem value={type.id} id={type.id} className="peer sr-only" />
                <Label
                  htmlFor={type.id}
                  className="flex items-start gap-3 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    type.category === 'healing' ? 'bg-pink-500/20 text-pink-400' :
                    type.category === 'men' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {categoryIcons[type.category] || <Sparkles className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="font-heading font-semibold block">{type.name}</span>
                    <span className="text-sm text-muted-foreground">{type.description}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Packages */}
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Choose Package
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-3">
            {packages.map((pkg) => (
              <div key={pkg.id}>
                <RadioGroupItem value={pkg.id} id={pkg.id} className="peer sr-only" />
                <Label
                  htmlFor={pkg.id}
                  className="flex items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent/50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div>
                    <span className="font-heading font-semibold block">{pkg.name}</span>
                    <span className="text-sm text-muted-foreground">{pkg.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-heading font-bold text-gradient-gold">€{pkg.price_eur}</span>
                    {pkg.session_count > 1 && (
                      <span className="text-xs text-muted-foreground block">
                        €{(pkg.price_eur / pkg.session_count).toFixed(0)}/session
                      </span>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Contact & Notes */}
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <CardTitle>Your Details</CardTitle>
          <CardDescription>We'll contact you to schedule your session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tell us about your goals or any specific concerns..."
              className="mt-1 min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Book Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleBookSession}
          disabled={!selectedType || !selectedPackage || isSubmitting}
          className="w-full h-14 text-lg font-heading"
          variant="gold"
        >
          {isSubmitting ? 'Booking...' : selectedPackageData ? `Book for €${selectedPackageData.price_eur}` : 'Select options to book'}
        </Button>
      </div>
    </div>
  );
};

export default PrivateSessions;
