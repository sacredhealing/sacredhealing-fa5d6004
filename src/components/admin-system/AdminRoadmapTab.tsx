import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Target, DollarSign, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface RoadmapTask {
  id: string;
  phase: number;
  category: 'Content' | 'Product' | 'Community' | 'Monetization';
  title: string;
  description: string | null;
  target_location: string;
  status: 'pending' | 'in_progress' | 'completed';
  auto_complete_on_upload: boolean;
  completed_at: string | null;
  order_index: number;
}

const AdminRoadmapTab: React.FC = () => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<string>('all');
  const [tasks, setTasks] = useState<RoadmapTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [phase, category]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_system_tasks')
        .select('*')
        .eq('phase', phase)
        .order('order_index', { ascending: true });

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roadmap tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('admin_system_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task status updated',
      });

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Content':
        return FileText;
      case 'Product':
        return Target;
      case 'Community':
        return Users;
      case 'Monetization':
        return DollarSign;
      default:
        return Circle;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Content':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'Product':
        return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'Community':
        return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'Monetization':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const phaseStats = {
    1: {
      total: tasks.filter(t => t.phase === 1).length,
      completed: tasks.filter(t => t.phase === 1 && t.status === 'completed').length,
    },
    2: {
      total: tasks.filter(t => t.phase === 2).length,
      completed: tasks.filter(t => t.phase === 2 && t.status === 'completed').length,
    },
    3: {
      total: tasks.filter(t => t.phase === 3).length,
      completed: tasks.filter(t => t.phase === 3 && t.status === 'completed').length,
    },
  };

  const currentPhaseStats = phaseStats[phase];
  const progressPercentage = currentPhaseStats.total > 0
    ? (currentPhaseStats.completed / currentPhaseStats.total) * 100
    : 0;

  if (loading) {
    return <div className="text-center py-8">Loading roadmap...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">🧭 Sacred Healing — 90-Day Master Roadmap</h2>
        <p className="text-muted-foreground">Track your content creation journey, one task at a time</p>
      </div>

      {/* Phase Selector */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((p) => {
          const stats = phaseStats[p as 1 | 2 | 3];
          const phaseProgress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
          
          return (
            <button
              key={p}
              onClick={() => setPhase(p as 1 | 2 | 3)}
              className={cn(
                'px-6 py-3 rounded-xl border-2 transition-all text-left flex-1 min-w-[200px]',
                phase === p
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Phase {p}</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completed}/{stats.total}
                </span>
              </div>
              <Progress value={phaseProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {p === 1 && 'Foundation (Days 1-30)'}
                {p === 2 && 'Transformation (Days 31-60)'}
                {p === 3 && 'Mastery & Scale (Days 61-90)'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Content">Content</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="Community">Community</SelectItem>
            <SelectItem value="Monetization">Monetization</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Phase {phase} Progress:</span>
            <span className="font-semibold text-foreground">
              {currentPhaseStats.completed} / {currentPhaseStats.total} completed
            </span>
            <span className="text-primary">
              ({progressPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No tasks found for this phase and category.
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => {
            const CategoryIcon = getCategoryIcon(task.category);

            return (
              <Card
                key={task.id}
                className={cn(
                  'p-4 border transition-all',
                  task.status === 'completed' && 'opacity-75 bg-muted/30',
                  task.status === 'in_progress' && 'ring-2 ring-primary/20'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      'p-2 rounded-lg border',
                      getCategoryColor(task.category)
                    )}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <Badge className={cn('text-xs', getStatusColor(task.status))}>
                          {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {task.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                          {task.status}
                        </Badge>
                        {task.auto_complete_on_upload && (
                          <Badge variant="outline" className="text-xs">
                            Auto-complete
                          </Badge>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Target:</span> {task.target_location}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {task.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      >
                        Start
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'pending')}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminRoadmapTab;

