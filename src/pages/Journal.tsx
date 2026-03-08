import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Save, Calendar, Smile, Sparkles } from 'lucide-react';
import { useJournal } from '@/hooks/useJournal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Journal: React.FC = () => {
  const { t } = useTranslation();
  const { entries, todayEntry, isLoading, createEntry, updateEntry } = useJournal();

  const moodEmojis = [
    { value: 1, emoji: '😔', label: t('journal.moodLow') },
    { value: 2, emoji: '😐', label: t('journal.moodOkay') },
    { value: 3, emoji: '🙂', label: t('journal.moodGood') },
    { value: 4, emoji: '😊', label: t('journal.moodGreat') },
    { value: 5, emoji: '🌟', label: t('journal.moodAmazing') },
  ];
  
  const [content, setContent] = useState(todayEntry?.content || '');
  const [mood, setMood] = useState<number | null>(todayEntry?.mood || null);
  const [gratitude, setGratitude] = useState<string[]>(
    todayEntry?.gratitude_items || ['', '', '']
  );

  const handleSave = async () => {
    const filledGratitude = gratitude.filter(g => g.trim() !== '');
    
    if (todayEntry) {
      await updateEntry.mutateAsync({
        id: todayEntry.id,
        content,
        mood: mood || undefined,
        gratitudeItems: filledGratitude.length > 0 ? filledGratitude : undefined,
      });
    } else {
      await createEntry.mutateAsync({
        content,
        mood: mood || undefined,
        gratitudeItems: filledGratitude.length > 0 ? filledGratitude : undefined,
        prompt: "What are you grateful for today?",
      });
    }
  };

  const updateGratitude = (index: number, value: string) => {
    const updated = [...gratitude];
    updated[index] = value;
    setGratitude(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen px-4 pt-6 pb-24">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl mb-4" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <header className="mb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {t('journal.title')}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {t('journal.subtitle')}
        </p>
      </header>

      {/* Today's Entry */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Mood Selector */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Smile className="w-4 h-4" />
            {t('journal.howFeeling')}
          </h3>
          <div className="flex justify-between">
            {moodEmojis.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                  mood === m.value 
                    ? 'bg-primary/20 scale-110' 
                    : 'hover:bg-muted/50'
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Gratitude */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            {t('journal.gratitude')}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {t('journal.gratitudePrompt')}
          </p>
          <div className="space-y-2">
            {[0, 1, 2].map((index) => (
              <Input
                key={index}
                placeholder={t('journal.gratitudePlaceholder', { num: index + 1 })}
                value={gratitude[index] || ''}
                onChange={(e) => updateGratitude(index, e.target.value)}
                className="bg-muted/30"
              />
            ))}
          </div>
        </Card>

        {/* Journal Entry */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {t('journal.todaysReflection')}
          </h3>
          <Textarea
            placeholder={t('journal.writePlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] bg-muted/30 resize-none"
          />
        </Card>

        <Button
          onClick={handleSave}
          className="w-full"
          variant="spiritual"
          size="lg"
          disabled={createEntry.isPending || updateEntry.isPending || (!content.trim() && !mood)}
        >
          <Save className="w-4 h-4 mr-2" />
          {todayEntry ? t('journal.updateEntry') : t('journal.saveEntry')}
        </Button>
      </motion.div>

      {/* Past Entries */}
      {entries.length > 0 && (
        <div className="mt-8">
          <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
            {t('journal.pastEntries')}
          </h2>
          <div className="space-y-3">
            {entries.slice(0, 7).map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.entry_date), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  {entry.mood && (
                    <span className="text-lg">
                      {moodEmojis.find(m => m.value === entry.mood)?.emoji}
                    </span>
                  )}
                </div>
                {entry.content && (
                  <p className="text-sm text-foreground line-clamp-2">
                    {entry.content}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;