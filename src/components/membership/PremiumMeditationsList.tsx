import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, Clock, Loader2, Mic } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useMembership } from '@/hooks/useMembership';
import { useMembershipTier } from '@/features/membership/useMembershipTier';
import { AccessTag } from '@/features/membership/AccessTag';
import { hasTierAccess } from '@/features/membership/tier';

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
}

const PREMIUM_MEDITATIONS_REQUIRED = 'monthly' as const;

const PremiumMeditationsList: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = useMembership();
  const tier = useMembershipTier();
  const hasAccess = hasTierAccess(tier, PREMIUM_MEDITATIONS_REQUIRED);
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all premium meditations (recorded)
      const { data: medsData, error: medsError } = await supabase
        .from('meditations')
        .select('*')
        .eq('is_premium', true)
        .order('created_at', { ascending: false });

      if (medsError) throw medsError;
      setMeditations(medsData || []);

      // Fetch all premium meditation tasks (unrecorded)
      const { data: tasksData, error: tasksError } = await (supabase as any)
        .from('content_tasks')
        .select('*')
        .eq('access_level', 'premium')
        .in('category', ['meditation', 'daily_ritual', 'path', 'premium_healing'])
        .in('status', ['not_recorded', 'recorded'])
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching premium meditations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      daily_ritual: 'Daily Ritual',
      path: 'Spiritual Path',
      premium_healing: 'Premium Healing',
      course: 'Course',
      meditation: 'Meditation',
    };
    return labels[category] || category;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      daily_ritual: '✅',
      path: '🪷',
      premium_healing: '🌙',
      course: '🎓',
      meditation: '🧘',
    };
    return emojis[category] || '📝';
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
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Sparkles className="w-5 h-5 text-primary" />
          Premium Meditations Library
          <AccessTag userTier={tier} requiredTier={PREMIUM_MEDITATIONS_REQUIRED} />
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {totalMeditations} total meditations
        </p>
        {!hasAccess && (
          <button
            type="button"
            className="mt-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black w-full sm:w-auto"
            onClick={() => navigate('/membership')}
          >
            Upgrade
          </button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recorded Premium Meditations */}
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{meditation.title}</p>
                      {!isPremium && (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {meditation.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meditation.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  {!isPremium && (
                    <Badge variant="secondary" className="text-xs">
                      Premium
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unrecorded Premium Meditations */}
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
                      <span className="text-xs">{getCategoryEmoji(task.category)}</span>
                      <p className="font-medium text-muted-foreground">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(task.category)}
                      </Badge>
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
            <p>No premium meditations yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumMeditationsList;

