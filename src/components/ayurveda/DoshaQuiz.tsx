import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { AyurvedaUserProfile } from '@/lib/ayurvedaTypes';

interface DoshaQuizProps {
  onComplete: (profile: AyurvedaUserProfile) => void;
  isLoading: boolean;
}

export const DoshaQuiz: React.FC<DoshaQuizProps> = ({ onComplete, isLoading }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AyurvedaUserProfile>({
    name: '',
    birthDate: '',
    birthTime: '',
    location: '',
    currentChallenge: '',
    personalityTraits: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-8 text-3xl font-serif text-foreground">Consulting the Sages...</h2>
        <p className="text-muted-foreground mt-2">Mapping your Prakriti and personality with sacred AI wisdom.</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-3xl mx-auto bg-card p-8 md:p-16 rounded-3xl shadow-2xl border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="text-center mb-12">
        <div className="flex justify-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full transition-colors ${step === 1 ? 'bg-emerald-600' : 'bg-emerald-100'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${step === 2 ? 'bg-emerald-600' : 'bg-emerald-100'}`} />
        </div>
        <h2 className="text-4xl font-serif text-foreground mb-2">
          {step === 1 ? "Sacred Beginnings" : "Inner Reflection"}
        </h2>
        <p className="text-muted-foreground">
          {step === 1 ? "Tell us about your arrival in this world." : "How do you navigate your life situations?"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 ? (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</Label>
              <Input 
                required
                type="text" 
                className="mt-2 bg-muted/30 border-border rounded-2xl px-6 py-4 h-auto text-lg"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Your sacred name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Birth Date</Label>
                <Input 
                  required
                  type="date" 
                  className="mt-2 bg-muted/30 border-border rounded-2xl px-6 py-4 h-auto"
                  value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Birth Time</Label>
                <Input 
                  required
                  type="time" 
                  className="mt-2 bg-muted/30 border-border rounded-2xl px-6 py-4 h-auto"
                  value={formData.birthTime}
                  onChange={e => setFormData({...formData, birthTime: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Residence</Label>
              <Input 
                required
                type="text" 
                className="mt-2 bg-muted/30 border-border rounded-2xl px-6 py-4 h-auto text-lg"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="City, Country"
              />
            </div>

            <Button 
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-6 rounded-2xl text-lg"
              disabled={!formData.name || !formData.birthDate || !formData.birthTime || !formData.location}
            >
              Continue to Inner Soul <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Describe Your Personality</Label>
              <Textarea 
                required
                rows={3}
                className="mt-2 bg-muted/30 border-border rounded-2xl px-6 py-4 text-lg resize-none"
                value={formData.personalityTraits}
                onChange={e => setFormData({...formData, personalityTraits: e.target.value})}
                placeholder="e.g. Creative but anxious, disciplined but rigid, social but overwhelmed..."
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Life Challenges</Label>
              <Textarea 
                required
                rows={3}
                className="mt-2 bg-muted/30 border-border rounded-2xl px-6 py-4 text-lg resize-none"
                value={formData.currentChallenge}
                onChange={e => setFormData({...formData, currentChallenge: e.target.value})}
                placeholder="e.g. High work stress, sleep issues, relationship tension, digestive problems..."
              />
            </div>

            <div className="flex gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 py-6 rounded-2xl"
              >
                <ArrowLeft className="mr-2 w-5 h-5" /> Back
              </Button>
              <Button 
                type="submit"
                className="flex-[2] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-6 rounded-2xl"
                disabled={!formData.personalityTraits || !formData.currentChallenge}
              >
                Reveal My Healing Blueprint <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </form>
    </motion.div>
  );
};