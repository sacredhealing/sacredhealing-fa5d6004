import { useState } from 'react';
import { Plus, X, Settings2, Check, Circle, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { WorkflowStage } from '@/hooks/useWorkflowTemplates';
import { toast } from 'sonner';

interface ItemWorkflowEditorProps {
  itemId: string;
  itemType: 'project' | 'music' | 'song' | 'course';
  currentWorkflow: Record<string, boolean>;
  templateStages: WorkflowStage[];
  onWorkflowUpdate: (updatedWorkflow: Record<string, boolean>) => Promise<void>;
  onRefresh?: () => void;
}

const ItemWorkflowEditor = ({
  itemId,
  itemType,
  currentWorkflow,
  templateStages,
  onWorkflowUpdate,
  onRefresh,
}: ItemWorkflowEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newStageLabel, setNewStageLabel] = useState('');
  const [localWorkflow, setLocalWorkflow] = useState<Record<string, boolean>>({});
  const [customStages, setCustomStages] = useState<{ key: string; label: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const openEditor = () => {
    setLocalWorkflow({ ...currentWorkflow });
    
    // Identify custom stages (keys in currentWorkflow but not in template)
    const templateKeys = templateStages.map(s => s.key);
    const customKeys = Object.keys(currentWorkflow).filter(k => !templateKeys.includes(k));
    setCustomStages(customKeys.map(k => ({ 
      key: k, 
      label: k.replace(/^custom_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) 
    })));
    
    setIsOpen(true);
  };

  const handleAddCustomStage = () => {
    if (!newStageLabel.trim()) {
      toast.error('Please enter a stage name');
      return;
    }

    const sanitizedKey = `custom_${newStageLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
    
    if (localWorkflow[sanitizedKey] !== undefined) {
      toast.error('A stage with this name already exists');
      return;
    }

    setLocalWorkflow(prev => ({ ...prev, [sanitizedKey]: false }));
    setCustomStages(prev => [...prev, { key: sanitizedKey, label: newStageLabel.trim() }]);
    setNewStageLabel('');
    toast.success('Custom stage added');
  };

  const handleRemoveCustomStage = (stageKey: string) => {
    setLocalWorkflow(prev => {
      const updated = { ...prev };
      delete updated[stageKey];
      return updated;
    });
    setCustomStages(prev => prev.filter(s => s.key !== stageKey));
    toast.success('Stage removed');
  };

  const handleToggleStage = (stageKey: string) => {
    setLocalWorkflow(prev => ({
      ...prev,
      [stageKey]: !prev[stageKey]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onWorkflowUpdate(localWorkflow);
      setIsOpen(false);
      toast.success('Workflow updated');
      onRefresh?.();
    } catch (error) {
      toast.error('Failed to update workflow');
    } finally {
      setIsSaving(false);
    }
  };

  // Combine template stages with custom stages for display
  const allStages = [
    ...templateStages.map(s => ({ key: s.key, label: s.label, isCustom: false })),
    ...customStages.filter(cs => !templateStages.find(ts => ts.key === cs.key)).map(cs => ({ ...cs, isCustom: true }))
  ];

  const calculateProgress = () => {
    const stageKeys = allStages.map(s => s.key);
    const completedCount = stageKeys.filter(key => localWorkflow[key]).length;
    return stageKeys.length > 0 ? Math.round((completedCount / stageKeys.length) * 100) : 0;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={openEditor}
        className="gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Edit Workflow
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Customize Workflow
              <Badge variant="outline" className="capitalize">{itemType}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Progress indicator */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all" 
                  style={{ width: `${calculateProgress()}%` }} 
                />
              </div>
              <span className="text-sm font-medium">{calculateProgress()}%</span>
            </div>

            {/* Workflow Stages */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Workflow Stages</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Click stages to toggle completion. Template stages shown with custom stages marked.
              </p>
              <div className="space-y-2">
                {allStages.map(stage => {
                  const isChecked = localWorkflow[stage.key];
                  
                  return (
                    <div
                      key={stage.key}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => handleToggleStage(stage.key)}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">{stage.label}</span>
                        {stage.isCustom && (
                          <Badge variant="secondary" className="text-xs">Custom</Badge>
                        )}
                      </div>
                      {stage.isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomStage(stage.key);
                          }}
                          className="h-6 w-6 p-0 hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
                
                {allStages.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    No workflow stages defined.
                  </p>
                )}
              </div>
            </div>

            {/* Add Custom Stage */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Add Custom Stage</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add a unique workflow step for this specific {itemType}. Custom stages only affect this item.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Stage name (e.g., Special Review)"
                  value={newStageLabel}
                  onChange={(e) => setNewStageLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomStage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddCustomStage} size="sm" variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemWorkflowEditor;
