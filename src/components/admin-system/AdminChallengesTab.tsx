import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  is_premium: boolean;
  shc_reward: number;
  is_active: boolean;
  participant_count?: number;
}

const AdminChallengesTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challenge_type: 'practice',
    duration_days: '7',
    start_date: '',
    end_date: '',
    is_premium: false,
    shc_reward: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('challenges')
        .select(`
          *,
          challenge_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const challengesWithCounts = (data || []).map((challenge: any) => ({
        ...challenge,
        participant_count: challenge.challenge_participants?.[0]?.count || 0,
      }));

      setChallenges(challengesWithCounts as Challenge[]);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const challengeData = {
        title: formData.title,
        description: formData.description || null,
        challenge_type: formData.challenge_type,
        duration_days: parseInt(formData.duration_days),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_premium: formData.is_premium,
        shc_reward: parseInt(formData.shc_reward) || 0,
        is_active: formData.is_active,
        created_by: editingChallenge ? undefined : user.id,
      };

      if (editingChallenge) {
        const { error } = await (supabase as any)
          .from('challenges')
          .update(challengeData)
          .eq('id', editingChallenge.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Challenge updated successfully',
        });
      } else {
        const { error } = await (supabase as any)
          .from('challenges')
          .insert(challengeData);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Challenge created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingChallenge(null);
      resetForm();
      fetchChallenges();
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save challenge',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || '',
      challenge_type: challenge.challenge_type,
      duration_days: challenge.duration_days.toString(),
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      is_premium: challenge.is_premium,
      shc_reward: challenge.shc_reward.toString(),
      is_active: challenge.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const { error } = await (supabase as any)
        .from('challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Challenge deleted successfully',
      });
      fetchChallenges();
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete challenge',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      challenge_type: 'practice',
      duration_days: '7',
      start_date: '',
      end_date: '',
      is_premium: false,
      shc_reward: '0',
      is_active: true,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading challenges...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Challenges</h2>
          <p className="text-muted-foreground">Manage group journeys and challenges</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingChallenge(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="7-Day Inner Peace Challenge"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Practice together with the community..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Challenge Type</Label>
                  <Select
                    value={formData.challenge_type}
                    onValueChange={(value) => setFormData({ ...formData, challenge_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="practice">Practice</SelectItem>
                      <SelectItem value="meditation">Meditation</SelectItem>
                      <SelectItem value="healing">Healing</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Duration (Days)</Label>
                  <Input
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SHC Reward</Label>
                  <Input
                    type="number"
                    value={formData.shc_reward}
                    onChange={(e) => setFormData({ ...formData, shc_reward: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div>
                    <Label>Premium</Label>
                    <p className="text-xs text-muted-foreground">Requires premium membership</p>
                  </div>
                  <Switch
                    checked={formData.is_premium}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Challenge is visible to users</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingChallenge ? 'Update' : 'Create'} Challenge
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {challenges.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No challenges yet. Create your first challenge to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => {
            const isActive = new Date(challenge.start_date) <= new Date() && new Date(challenge.end_date) >= new Date();
            const isPast = new Date(challenge.end_date) < new Date();

            return (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {challenge.title}
                        {challenge.is_premium && (
                          <Badge variant="default">Premium</Badge>
                        )}
                        {!challenge.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                        <Badge variant={isPast ? 'secondary' : isActive ? 'default' : 'outline'}>
                          {isPast ? 'Past' : isActive ? 'Active' : 'Upcoming'}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {challenge.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(challenge)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(challenge.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Duration</p>
                      <p className="font-semibold">{challenge.duration_days} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Participants</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {challenge.participant_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-semibold">
                        {new Date(challenge.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reward</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        +{challenge.shc_reward} SHC
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminChallengesTab;

