import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TrackReflectionProps {
  trackId: string;
  existingRating?: number;
  existingReflection?: string;
  onSave?: () => void;
}

export const TrackReflection: React.FC<TrackReflectionProps> = ({
  trackId,
  existingRating = 0,
  existingReflection = '',
  onSave,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reflection, setReflection] = useState(existingReflection);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to rate tracks');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('track_ratings')
        .upsert({
          user_id: user.id,
          track_id: trackId,
          rating,
          reflection: reflection.trim() || null,
        }, { onConflict: 'user_id,track_id' });

      if (error) throw error;

      toast.success('Reflection saved');
      onSave?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-muted/20 border-border/50 p-5">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Your Reflection</h3>
      
      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={`transition-colors ${
                star <= (hoveredRating || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating === 1 && 'Not for me'}
            {rating === 2 && 'It was okay'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Really enjoyed it'}
            {rating === 5 && 'Transformative'}
          </span>
        )}
      </div>

      {/* Reflection Text */}
      <Textarea
        placeholder="How did this track make you feel? Any insights or experiences to note..."
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="bg-background/50 border-border/50 mb-3 min-h-[80px]"
      />

      <Button 
        onClick={handleSave} 
        disabled={isSaving || rating === 0}
        className="w-full gap-2"
      >
        <Send size={16} />
        {isSaving ? 'Saving...' : 'Save Reflection'}
      </Button>
    </Card>
  );
};
