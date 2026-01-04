import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface MonthlyCost {
  id: string;
  name: string;
  amount: number;
  category: string;
  notes: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'hosting', label: 'Hosting & Infrastructure' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'tools', label: 'Tools & Software' },
  { value: 'services', label: 'Services' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'general', label: 'General' },
];

const AdminMonthlyCostsTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<MonthlyCost | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'general',
    notes: '',
  });

  const { data: costs = [], isLoading } = useQuery({
    queryKey: ['monthly-costs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_costs')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as MonthlyCost[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: { name: string; amount: number; category: string; notes: string }) => {
      const { error } = await supabase
        .from('monthly_costs')
        .insert([{
          name: data.name,
          amount: data.amount,
          category: data.category,
          notes: data.notes || null,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-costs'] });
      toast.success('Cost added successfully');
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to add cost');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; amount: number; category: string; notes: string }) => {
      const { error } = await supabase
        .from('monthly_costs')
        .update({
          name: data.name,
          amount: data.amount,
          category: data.category,
          notes: data.notes || null,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-costs'] });
      toast.success('Cost updated successfully');
      resetForm();
      setEditingCost(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update cost');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('monthly_costs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-costs'] });
      toast.success('Cost deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete cost');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', amount: '', category: 'general', notes: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (editingCost) {
      updateMutation.mutate({
        id: editingCost.id,
        name: formData.name,
        amount,
        category: formData.category,
        notes: formData.notes,
      });
    } else {
      addMutation.mutate({
        name: formData.name,
        amount,
        category: formData.category,
        notes: formData.notes,
      });
    }
  };

  const handleEdit = (cost: MonthlyCost) => {
    setEditingCost(cost);
    setFormData({
      name: cost.name,
      amount: cost.amount.toString(),
      category: cost.category,
      notes: cost.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setEditingCost(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingCost(null);
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      deleteMutation.mutate(id);
    }
  };

  const totalCost = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  const costsByCategory = costs.reduce((acc, cost) => {
    if (!acc[cost.category]) {
      acc[cost.category] = [];
    }
    acc[cost.category].push(cost);
    return acc;
  }, {} as Record<string, MonthlyCost[]>);

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  };

  // Form JSX rendered inline to avoid remounting on state changes
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cost-name">Name</Label>
        <Input
          id="cost-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Supabase Pro"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost-amount">Amount (€/month)</Label>
        <Input
          id="cost-amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost-category">Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost-notes">Notes (optional)</Label>
        <Textarea
          id="cost-notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {editingCost ? 'Update' : 'Add'} Cost
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDialogOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading costs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Total Monthly Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">
            €{totalCost.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {costs.length} expense{costs.length !== 1 ? 's' : ''} tracked
          </p>
        </CardContent>
      </Card>

      {/* Single controlled dialog for add/edit */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCost ? 'Edit Cost' : 'Add New Cost'}</DialogTitle>
            <DialogDescription>
              {editingCost ? 'Update this expense.' : 'Add a new monthly expense to track.'}
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      {/* Add New Cost */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Monthly Expenses</CardTitle>
              <CardDescription>Track your recurring business costs</CardDescription>
            </div>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Cost
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No costs tracked yet</p>
              <p className="text-sm">Click "Add Cost" to start tracking your expenses</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(costsByCategory).map(([category, categoryCosts]) => (
                <div key={category}>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                    {getCategoryLabel(category)} ({categoryCosts.length})
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryCosts.map((cost) => (
                        <TableRow key={cost.id}>
                          <TableCell className="font-medium">{cost.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {cost.notes || '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            €{Number(cost.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(cost)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(cost.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={2} className="font-medium">
                          Subtotal
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          €{categoryCosts.reduce((sum, c) => sum + Number(c.amount), 0).toFixed(2)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMonthlyCostsTab;
