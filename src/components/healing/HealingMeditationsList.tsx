import React, { useState, useEffect } from 'react';
import { Sparkles, Lock, Clock, Loader2, Mic, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMembership } from '@/hooks/useMembership';

interface Meditation {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  category: string;
  is_premium: boolean;
  audio_url: string | null;
  cover_image_url: string | null;
}

interface ContentTask {
  id: string;
  title: string;
  category: string;
  status: string;
  destination_path: string;
  length_target_minutes: number | null;
  access_level: string;
}

const HealingMeditationsList: React.FC = () => {
  const { isPremium } = useMembership();
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch healing-related meditations
      const { data: medsData, error: medsError } = await supabase
        .from('meditations')
        .select('*')
        .in('category', ['healing', 'premium_healing'])
        .order('created_at', { ascending: false });

      if (medsError) throw medsError;
      setMeditations(medsData || []);

      // Fetch healing audio tasks
      const { data: healingAudioData } = await supabase
        .from('healing_audio')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch premium healing tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('content_tasks')
        .select('*')
        .eq('category', 'premium_healing')
        .in('status', ['not_recorded', 'recorded'])
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching healing meditations:', error);
    } finally {
      setLoading(false);
    }
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

  const totalMeditations = meditations.length + tasks.length;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Healing Meditations Library
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {totalMeditations} healing meditations available
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recorded Meditations */}
        {meditations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Available Now ({meditations.length})
            </h3>
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
                          {meditation.duration_minutes} min
                        </span>
                        {meditation.is_premium && (
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
          </div>
        )}

        {/* Unrecorded Healing Meditations */}
        {tasks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Coming Soon ({tasks.length})
            </h3>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-dashed border-muted-foreground/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🌙</span>
                      <p className="font-medium text-muted-foreground">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {task.length_target_minutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.length_target_minutes} min
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {task.destination_path}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {task.status === 'recorded' ? 'Recorded' : 'Not Recorded'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalMeditations === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No healing meditations yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealingMeditationsList;

