import { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useWorkflowTemplates, WorkflowStage } from '@/hooks/useWorkflowTemplates';
import { toast } from 'sonner';

const CONTENT_TYPE_LABELS: Record<string, string> = {
  music: 'Music Projects',
  song: 'Songs',
  course: 'Courses',
  project: 'General Projects',
};

const WorkflowTemplateManager = () => {
  const { templates, loading, addStage, removeStage, renameStage, updateStages } = useWorkflowTemplates();
  const [activeTab, setActiveTab] = useState('music');
  const [editingStage, setEditingStage] = useState<{ templateId: string; stage: WorkflowStage } | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStageKey, setNewStageKey] = useState('');
  const [newStageLabel, setNewStageLabel] = useState('');

  const activeTemplate = templates.find(t => t.content_type === activeTab && t.is_default);

  const handleAddStage = async () => {
    if (!activeTemplate || !newStageKey.trim() || !newStageLabel.trim()) {
      toast.error('Please enter both key and label');
      return;
    }

    // Validate key format (lowercase, underscores only)
    const sanitizedKey = newStageKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Check for duplicate keys
    if (activeTemplate.stages.some(s => s.key === sanitizedKey)) {
      toast.error('A stage with this key already exists');
      return;
    }

    const success = await addStage(activeTemplate.id, {
      key: sanitizedKey,
      label: newStageLabel.trim(),
    });

    if (success) {
      setAddDialogOpen(false);
      setNewStageKey('');
      setNewStageLabel('');
    }
  };

  const handleRemoveStage = async (stageKey: string) => {
    if (!activeTemplate) return;
    if (!confirm('Remove this workflow stage? This will not affect existing items.')) return;
    await removeStage(activeTemplate.id, stageKey);
  };

  const handleSaveRename = async () => {
    if (!editingStage || !newStageName.trim()) return;
    await renameStage(editingStage.templateId, editingStage.stage.key, newStageName.trim());
    setEditingStage(null);
    setNewStageName('');
  };

  const handleMoveStage = async (stageKey: string, direction: 'up' | 'down') => {
    if (!activeTemplate) return;

    const stages = [...activeTemplate.stages];
    const index = stages.findIndex(s => s.key === stageKey);
    
    if (direction === 'up' && index > 0) {
      [stages[index - 1], stages[index]] = [stages[index], stages[index - 1]];
    } else if (direction === 'down' && index < stages.length - 1) {
      [stages[index], stages[index + 1]] = [stages[index + 1], stages[index]];
    } else {
      return;
    }

    // Recalculate order_index
    const reordered = stages.map((s, i) => ({ ...s, order_index: i }));
    await updateStages(activeTemplate.id, reordered);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading workflow templates...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Templates</CardTitle>
        <CardDescription>
          Manage workflow stages for different content types. Changes apply to new items.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            {Object.entries(CONTENT_TYPE_LABELS).map(([key, label]) => (
              <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(CONTENT_TYPE_LABELS).map(contentType => (
            <TabsContent key={contentType} value={contentType}>
              {activeTemplate ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {activeTemplate.stages.length} workflow stages
                    </p>
                    <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stage
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {activeTemplate.stages.map((stage, index) => (
                      <div
                        key={stage.key}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleMoveStage(stage.key, 'up')}
                            disabled={index === 0}
                          >
                            <span className="text-xs">↑</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => handleMoveStage(stage.key, 'down')}
                            disabled={index === activeTemplate.stages.length - 1}
                          >
                            <span className="text-xs">↓</span>
                          </Button>
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium">{stage.label}</p>
                          <p className="text-xs text-muted-foreground">key: {stage.key}</p>
                        </div>

                        <Badge variant="outline">{index + 1}</Badge>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingStage({ templateId: activeTemplate.id, stage });
                            setNewStageName(stage.label);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStage(stage.key)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {activeTemplate.stages.length === 0 && (
                    <p className="text-center py-8 text-muted-foreground">
                      No workflow stages defined. Add one to get started.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No template found for this content type.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Add Stage Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Workflow Stage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Stage Label</Label>
                <Input
                  value={newStageLabel}
                  onChange={(e) => {
                    setNewStageLabel(e.target.value);
                    // Auto-generate key from label
                    setNewStageKey(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
                  }}
                  placeholder="e.g., Quality Check"
                />
              </div>
              <div>
                <Label>Stage Key (auto-generated)</Label>
                <Input
                  value={newStageKey}
                  onChange={(e) => setNewStageKey(e.target.value)}
                  placeholder="e.g., quality_check"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used internally. Lowercase letters, numbers, and underscores only.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddStage}>Add Stage</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Stage Dialog */}
        <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Workflow Stage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>New Label</Label>
                <Input
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Enter new label"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Key remains: {editingStage?.stage.key}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStage(null)}>Cancel</Button>
              <Button onClick={handleSaveRename}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default WorkflowTemplateManager;
