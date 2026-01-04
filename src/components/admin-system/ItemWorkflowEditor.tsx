import { useState } from 'react';
import { Plus, X, Settings2 } from 'lucide-react';
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
}

const ItemWorkflowEditor = ({
  itemId,
  itemType,
  currentWorkflow,
  templateStages,
  onWorkflowUpdate,
}: ItemWorkflowEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newStageKey, setNewStageKey] = useState('');
  const [newStageLabel, setNewStageLabel] = useState('');
  const [localWorkflow, setLocalWorkflow] = useState<Record<string, boolean>>({});
  const [customStages, setCustomStages] = useState<{ key: string; label: string }[]>([]);

  const openEditor = () => {
    setLocalWorkflow({ ...currentWorkflow });
    
    // Identify custom stages (not in template)
    const templateKeys = templateStages.map(s => s.key);
    const customKeys = Object.keys(currentWorkflow).filter(k => !templateKeys.includes(k));
    setCustomStages(customKeys.map(k => ({ key: k, label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })));
    
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
    setNewStageKey('');
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

  const handleSave = async () => {
    await onWorkflowUpdate(localWorkflow);
    setIsOpen(false);
    toast.success('Workflow updated');
  };

  // Combine template stages with custom stages
  const allStages = [
    ...templateStages,
    ...customStages.filter(cs => !templateStages.find(ts => ts.key === cs.key))
  ];

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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Customize Workflow for this {itemType}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Current Workflow Stages</Label>
              <div className="mt-2 space-y-2">
                {allStages.map(stage => {
                  const isTemplate = templateStages.find(ts => ts.key === stage.key);
                  const isCustom = !isTemplate;
                  const stageLabel = isTemplate ? stage.label : customStages.find(cs => cs.key === stage.key)?.label || stage.key;
                  
                  return (
                    <div
                      key={stage.key}
                      className="flex items-center justify-between p-2 border rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{stageLabel}</span>
                        {isCustom && (
                          <Badge variant="secondary" className="text-xs">Custom</Badge>
                        )}
                      </div>
                      {isCustom && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCustomStage(stage.key)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4">
              <Label className="text-sm font-medium">Add Custom Stage</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add a unique workflow step for this specific {itemType}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Stage name (e.g., Special Review)"
                  value={newStageLabel}
                  onChange={(e) => setNewStageLabel(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddCustomStage} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ItemWorkflowEditor;
