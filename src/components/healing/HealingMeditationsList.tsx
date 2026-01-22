import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Loader2, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface HealingAudio {
  id: string;
  title: string;
  description: string | null;
  duration_seconds: number;
  category: string;
  is_free: boolean;
  audio_url: string;
  cover_image_url: string | null;
}

const HealingMeditationsList: React.FC = () => {
  const [meditations, setMeditations] = useState<HealingAudio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch healing audio from the healing_audio table (where admin uploads go)
      const { data, error } = await supabase
        .from('healing_audio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeditations(data || []);
    } catch (error) {
      console.error('Error fetching healing meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Healing Meditations Library
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {meditations.length} healing meditations available
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {meditations.length > 0 ? (
          <div className="space-y-2">
            {meditations.map((meditation) => (
              <div
                key={meditation.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {meditation.cover_image_url ? (
                    <img
                      src={meditation.cover_image_url}
                      alt={meditation.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{meditation.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {meditation.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(meditation.duration_seconds)}
                      </span>
                      {meditation.is_free ? (
                        <Badge variant="secondary" className="text-xs">
                          Free
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No healing meditations uploaded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealingMeditationsList;

