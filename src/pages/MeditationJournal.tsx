import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Feather, Sparkles, Send, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useJournal } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const MEDITATION_PROMPT = "What did your soul hear in the silence?";

const MeditationJournal: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createEntry, entries, isLoading: entriesLoading } = useJournal();
  
  const [reflection, setReflection] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Get intention from URL params if passed from meditation
  const intention = searchParams.get('intention');

  // Check if user already has an entry for today with this prompt
  const todaysMeditationEntry = entries.find(e => {
    const isToday = new Date(e.entry_date).toDateString() === new Date().toDateString();
    return isToday && e.prompt === MEDITATION_PROMPT;
  });

  useEffect(() => {
    if (todaysMeditationEntry) {
      setReflection(todaysMeditationEntry.content || '');
      setIsSaved(true);
    }
  }, [todaysMeditationEntry]);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save your reflection');
      return;
    }
    
    if (!reflection.trim()) {
      toast.error('Please write something before saving');
      return;
    }

    if (reflection.length > 5000) {
      toast.error('Reflection is too long (max 5000 characters)');
      return;
    }

    setIsSaving(true);
    try {
      await createEntry.mutateAsync({
        content: reflection.trim(),
        prompt: MEDITATION_PROMPT,
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving reflection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Parchment Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            linear-gradient(180deg, 
              hsl(35, 30%, 15%) 0%, 
              hsl(35, 35%, 12%) 50%, 
              hsl(35, 25%, 10%) 100%
            )
          `,
        }}
      />
      
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col px-4 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="text-amber-200/70 hover:text-amber-200 hover:bg-amber-900/20"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-2 text-amber-200/60 text-sm">
            <BookOpen size={16} />
            <span>Soul Journal</span>
          </div>
        </motion.header>

        {/* Parchment Scroll */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          {/* Scroll Top Edge */}
          <div 
            className="h-8 rounded-t-3xl relative"
            style={{
              background: 'linear-gradient(180deg, hsl(35, 40%, 35%) 0%, hsl(35, 35%, 25%) 100%)',
              boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {/* Scroll rod decoration */}
            <div className="absolute left-4 right-4 top-2 h-4 rounded-full bg-gradient-to-b from-amber-700/60 to-amber-900/60" />
          </div>
          
          {/* Main Parchment */}
          <div 
            className="flex-1 px-6 py-8 relative"
            style={{
              background: `
                linear-gradient(90deg, 
                  hsl(40, 40%, 85%) 0%, 
                  hsl(42, 45%, 90%) 5%,
                  hsl(43, 50%, 92%) 50%, 
                  hsl(42, 45%, 90%) 95%,
                  hsl(40, 40%, 85%) 100%
                )
              `,
              boxShadow: 'inset 4px 0 12px rgba(0,0,0,0.15), inset -4px 0 12px rgba(0,0,0,0.15)',
            }}
          >
            {/* Paper texture */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Quill decoration */}
            <motion.div 
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute -top-2 right-6"
            >
              <Feather className="w-8 h-8 text-amber-800/60 transform rotate-45" />
            </motion.div>

            {/* Intention badge (if passed from meditation) */}
            <AnimatePresence>
              {intention && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 text-amber-900/80 text-sm"
                >
                  <Sparkles size={14} />
                  <span className="capitalize">Intention: {intention}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-6"
            >
              <h1 
                className="text-2xl md:text-3xl font-heading font-bold text-amber-900/90 leading-relaxed"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {MEDITATION_PROMPT}
              </h1>
              <div className="mt-2 w-24 h-0.5 bg-gradient-to-r from-amber-700/40 to-transparent" />
            </motion.div>

            {/* Text area */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative"
            >
              {entriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-amber-700 animate-spin" />
                </div>
              ) : (
                <Textarea
                  value={reflection}
                  onChange={(e) => {
                    setReflection(e.target.value);
                    if (isSaved) setIsSaved(false);
                  }}
                  placeholder="Let your thoughts flow like ink across parchment..."
                  className="min-h-[250px] bg-transparent border-none shadow-none resize-none text-amber-900/85 placeholder:text-amber-700/40 text-lg leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.9',
                  }}
                  maxLength={5000}
                  disabled={isSaving}
                />
              )}
              
              {/* Character count */}
              <div className="absolute bottom-2 right-2 text-xs text-amber-700/40">
                {reflection.length}/5000
              </div>
            </motion.div>

            {/* Saved indicator */}
            <AnimatePresence>
              {isSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-emerald-700/80 text-sm mt-4"
                >
                  <Sparkles size={14} />
                  <span>Your reflection has been preserved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Scroll Bottom Edge */}
          <div 
            className="h-8 rounded-b-3xl relative"
            style={{
              background: 'linear-gradient(0deg, hsl(35, 40%, 35%) 0%, hsl(35, 35%, 25%) 100%)',
              boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.3), 0 -2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {/* Scroll rod decoration */}
            <div className="absolute left-4 right-4 bottom-2 h-4 rounded-full bg-gradient-to-t from-amber-700/60 to-amber-900/60" />
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 flex justify-center"
        >
          <Button
            onClick={handleSave}
            disabled={isSaving || !reflection.trim() || isSaved}
            className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-full shadow-lg shadow-amber-900/30 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Seal Your Reflection
              </>
            )}
          </Button>
        </motion.div>

        {/* Past reflections hint */}
        {entries.filter(e => e.prompt === MEDITATION_PROMPT).length > 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-amber-200/40 text-sm mt-4"
          >
            You have {entries.filter(e => e.prompt === MEDITATION_PROMPT).length} meditation reflections
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default MeditationJournal;
