import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WorkflowStage {
  key: string;
  label: string;
  order_index: number;
}

export interface WorkflowTemplate {
  id: string;
  content_type: string;
  stages: WorkflowStage[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Default fallback templates in case database is empty
const FALLBACK_TEMPLATES: Record<string, WorkflowStage[]> = {
  music: [
    { key: 'idea', label: 'Idea', order_index: 0 },
    { key: 'arrangement', label: 'Arrangement', order_index: 1 },
    { key: 'mix', label: 'Mix', order_index: 2 },
    { key: 'master', label: 'Master', order_index: 3 },
    { key: 'cover', label: 'Cover', order_index: 4 },
    { key: 'release', label: 'Release', order_index: 5 },
  ],
  song: [
    { key: 'idea', label: 'Idea', order_index: 0 },
    { key: 'arrangement', label: 'Arrangement', order_index: 1 },
    { key: 'mix', label: 'Mix', order_index: 2 },
    { key: 'master', label: 'Master', order_index: 3 },
    { key: 'cover', label: 'Cover', order_index: 4 },
    { key: 'release', label: 'Release', order_index: 5 },
  ],
  course: [
    { key: 'idea', label: 'Idea', order_index: 0 },
    { key: 'arrangement', label: 'Arrangement', order_index: 1 },
    { key: 'pdf_text', label: 'PDF Text', order_index: 2 },
    { key: 'videos', label: 'Videos', order_index: 3 },
    { key: 'cover', label: 'Cover', order_index: 4 },
    { key: 'description', label: 'Description', order_index: 5 },
  ],
  project: [
    { key: 'idea', label: 'Idea', order_index: 0 },
    { key: 'finished_coding', label: 'Finished Coding', order_index: 1 },
    { key: 'integrated_into_app', label: 'Integrated into the App', order_index: 2 },
    { key: 'released_into_app', label: 'Released into the App', order_index: 3 },
  ],
};

export const useWorkflowTemplates = (contentType?: string) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    try {
      let query = supabase.from('workflow_templates').select('*');
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      
      const { data, error } = await query.order('content_type', { ascending: true });

      if (error) throw error;
      
      // Parse stages JSONB
      const parsed = (data || []).map(t => ({
        ...t,
        stages: Array.isArray(t.stages) 
          ? (t.stages as unknown as WorkflowStage[]).sort((a, b) => a.order_index - b.order_index)
          : []
      })) as WorkflowTemplate[];
      
      setTemplates(parsed);
    } catch (error) {
      console.error('Failed to fetch workflow templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [contentType]);

  // Get workflow stages for a specific content type
  const getStagesForType = (type: string): WorkflowStage[] => {
    const template = templates.find(t => t.content_type === type && t.is_default);
    if (template) {
      return template.stages;
    }
    return FALLBACK_TEMPLATES[type] || [];
  };

  // Create default workflow object from stages
  const createDefaultWorkflow = (type: string): Record<string, boolean> => {
    const stages = getStagesForType(type);
    return stages.reduce((acc, stage) => {
      acc[stage.key] = false;
      return acc;
    }, {} as Record<string, boolean>);
  };

  // Merge existing workflow with new template (preserves completed stages)
  const mergeWorkflow = (
    existing: Record<string, boolean>,
    type: string
  ): Record<string, boolean> => {
    const stages = getStagesForType(type);
    const merged: Record<string, boolean> = {};
    
    stages.forEach(stage => {
      // Keep existing value if it exists, otherwise default to false
      merged[stage.key] = existing[stage.key] ?? false;
    });
    
    return merged;
  };

  // Add a new stage to a template
  const addStage = async (templateId: string, newStage: Omit<WorkflowStage, 'order_index'>) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    const maxOrder = Math.max(...template.stages.map(s => s.order_index), -1);
    const updatedStages = [
      ...template.stages,
      { ...newStage, order_index: maxOrder + 1 }
    ];

    const { error } = await supabase
      .from('workflow_templates')
      .update({ stages: JSON.parse(JSON.stringify(updatedStages)) })
      .eq('id', templateId);

    if (error) {
      toast.error('Failed to add workflow stage');
      return false;
    }

    toast.success('Workflow stage added');
    await fetchTemplates();
    return true;
  };

  // Remove a stage from a template
  const removeStage = async (templateId: string, stageKey: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    const updatedStages = template.stages
      .filter(s => s.key !== stageKey)
      .map((s, index) => ({ ...s, order_index: index }));

    const { error } = await supabase
      .from('workflow_templates')
      .update({ stages: JSON.parse(JSON.stringify(updatedStages)) })
      .eq('id', templateId);

    if (error) {
      toast.error('Failed to remove workflow stage');
      return false;
    }

    toast.success('Workflow stage removed');
    await fetchTemplates();
    return true;
  };

  // Rename a stage in a template
  const renameStage = async (templateId: string, stageKey: string, newLabel: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    const updatedStages = template.stages.map(s => 
      s.key === stageKey ? { ...s, label: newLabel } : s
    );

    const { error } = await supabase
      .from('workflow_templates')
      .update({ stages: JSON.parse(JSON.stringify(updatedStages)) })
      .eq('id', templateId);

    if (error) {
      toast.error('Failed to rename workflow stage');
      return false;
    }

    toast.success('Workflow stage renamed');
    await fetchTemplates();
    return true;
  };

  // Update entire stages array
  const updateStages = async (templateId: string, stages: WorkflowStage[]) => {
    const { error } = await supabase
      .from('workflow_templates')
      .update({ stages: JSON.parse(JSON.stringify(stages)) })
      .eq('id', templateId);

    if (error) {
      toast.error('Failed to update workflow stages');
      return false;
    }

    toast.success('Workflow updated');
    await fetchTemplates();
    return true;
  };

  return {
    templates,
    loading,
    fetchTemplates,
    getStagesForType,
    createDefaultWorkflow,
    mergeWorkflow,
    addStage,
    removeStage,
    renameStage,
    updateStages,
  };
};
