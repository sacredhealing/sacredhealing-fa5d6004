import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Wind, Loader2, GripVertical, Save, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BreathingPattern {
  id: string;
  name: string;
  description: string | null;
  inhale: number;
  hold: number;
  exhale: number;
  hold_out: number;
  cycles: number;
  order_index: number;
  is_active: boolean;
}

const AdminBreathing: React.FC = () => {
  const navigate = useNavigate();
  const [patterns, setPatterns] = useState<BreathingPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    inhale: 4,
    hold: 4,
    exhale: 4,
    hold_out: 0,
    cycles: 4,
  });

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    const { data, error } = await supabase
      .from('breathing_patterns')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching patterns:', error);
      toast.error('Failed to load patterns');
    } else {
      setPatterns(data || []);
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error('Please enter a name');
      return;
    }

    const maxOrder = Math.max(...patterns.map(p => p.order_index), -1);

    const { error } = await supabase
      .from('breathing_patterns')
      .insert({
        name: formData.name,
        description: formData.description || null,
        inhale: formData.inhale,
        hold: formData.hold,
        exhale: formData.exhale,
        hold_out: formData.hold_out,
        cycles: formData.cycles,
        order_index: maxOrder + 1,
      });

    if (error) {
      toast.error('Failed to add pattern');
      console.error(error);
    } else {
      toast.success('Pattern added');
      setFormData({ name: '', description: '', inhale: 4, hold: 4, exhale: 4, hold_out: 0, cycles: 4 });
      setShowAddForm(false);
      fetchPatterns();
    }
  };

  const handleUpdate = async (pattern: BreathingPattern) => {
    const { error } = await supabase
      .from('breathing_patterns')
      .update({
        name: pattern.name,
        description: pattern.description,
        inhale: pattern.inhale,
        hold: pattern.hold,
        exhale: pattern.exhale,
        hold_out: pattern.hold_out,
        cycles: pattern.cycles,
        is_active: pattern.is_active,
      })
      .eq('id', pattern.id);

    if (error) {
      toast.error('Failed to update pattern');
      console.error(error);
    } else {
      toast.success('Pattern updated');
      setEditingId(null);
      fetchPatterns();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return;

    const { error } = await supabase
      .from('breathing_patterns')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete pattern');
      console.error(error);
    } else {
      toast.success('Pattern deleted');
      fetchPatterns();
    }
  };

  const handleToggleActive = async (pattern: BreathingPattern) => {
    const { error } = await supabase
      .from('breathing_patterns')
      .update({ is_active: !pattern.is_active })
      .eq('id', pattern.id);

    if (error) {
      toast.error('Failed to update pattern');
    } else {
      fetchPatterns();
    }
  };

  const movePattern = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= patterns.length) return;

    const updates = [
      { id: patterns[index].id, order_index: patterns[newIndex].order_index },
      { id: patterns[newIndex].id, order_index: patterns[index].order_index },
    ];

    for (const update of updates) {
      await supabase
        .from('breathing_patterns')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    fetchPatterns();
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Breathing Exercises</h1>
            <p className="text-muted-foreground">Manage breathing patterns</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Pattern
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-lg">Add New Pattern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Box Breathing"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Cycles</label>
                  <Input
                    type="number"
                    value={formData.cycles}
                    onChange={(e) => setFormData({ ...formData, cycles: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="A calming technique..."
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Inhale (sec)</label>
                  <Input
                    type="number"
                    value={formData.inhale}
                    onChange={(e) => setFormData({ ...formData, inhale: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Hold (sec)</label>
                  <Input
                    type="number"
                    value={formData.hold}
                    onChange={(e) => setFormData({ ...formData, hold: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Exhale (sec)</label>
                  <Input
                    type="number"
                    value={formData.exhale}
                    onChange={(e) => setFormData({ ...formData, exhale: parseInt(e.target.value) || 0 })}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Hold Out (sec)</label>
                  <Input
                    type="number"
                    value={formData.hold_out}
                    onChange={(e) => setFormData({ ...formData, hold_out: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pattern
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patterns List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : patterns.length === 0 ? (
          <Card className="p-8 text-center">
            <Wind className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No breathing patterns yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {patterns.map((pattern, index) => (
              <Card 
                key={pattern.id} 
                className={`${!pattern.is_active ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-4">
                  {editingId === pattern.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          value={pattern.name}
                          onChange={(e) => setPatterns(patterns.map(p => 
                            p.id === pattern.id ? { ...p, name: e.target.value } : p
                          ))}
                          placeholder="Name"
                        />
                        <Input
                          type="number"
                          value={pattern.cycles}
                          onChange={(e) => setPatterns(patterns.map(p => 
                            p.id === pattern.id ? { ...p, cycles: parseInt(e.target.value) || 0 } : p
                          ))}
                          min="1"
                        />
                      </div>
                      <Input
                        value={pattern.description || ''}
                        onChange={(e) => setPatterns(patterns.map(p => 
                          p.id === pattern.id ? { ...p, description: e.target.value } : p
                        ))}
                        placeholder="Description"
                      />
                      <div className="grid grid-cols-4 gap-4">
                        <Input
                          type="number"
                          value={pattern.inhale}
                          onChange={(e) => setPatterns(patterns.map(p => 
                            p.id === pattern.id ? { ...p, inhale: parseInt(e.target.value) || 0 } : p
                          ))}
                        />
                        <Input
                          type="number"
                          value={pattern.hold}
                          onChange={(e) => setPatterns(patterns.map(p => 
                            p.id === pattern.id ? { ...p, hold: parseInt(e.target.value) || 0 } : p
                          ))}
                        />
                        <Input
                          type="number"
                          value={pattern.exhale}
                          onChange={(e) => setPatterns(patterns.map(p => 
                            p.id === pattern.id ? { ...p, exhale: parseInt(e.target.value) || 0 } : p
                          ))}
                        />
                        <Input
                          type="number"
                          value={pattern.hold_out}
                          onChange={(e) => setPatterns(patterns.map(p => 
                            p.id === pattern.id ? { ...p, hold_out: parseInt(e.target.value) || 0 } : p
                          ))}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => { setEditingId(null); fetchPatterns(); }}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleUpdate(pattern)}>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePattern(index, 'up')} disabled={index === 0}>
                          <GripVertical className="w-4 h-4 rotate-90" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => movePattern(index, 'down')} disabled={index === patterns.length - 1}>
                          <GripVertical className="w-4 h-4 rotate-90" />
                        </Button>
                      </div>
                      
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
                        <Wind className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{pattern.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{pattern.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pattern.inhale}-{pattern.hold}-{pattern.exhale}-{pattern.hold_out} • {pattern.cycles} cycles
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={pattern.is_active} 
                          onCheckedChange={() => handleToggleActive(pattern)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => setEditingId(pattern.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(pattern.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBreathing;