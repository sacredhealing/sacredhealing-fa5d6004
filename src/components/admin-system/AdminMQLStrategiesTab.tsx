import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Code, TrendingUp, TrendingDown, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MQLStrategy {
  id: string;
  name: string;
  description: string | null;
  version: string;
  mql_version: 'MQL4' | 'MQL5';
  mql_code: string | null;
  mql_file_url: string | null;
  default_parameters: Record<string, any>;
  author: string | null;
  category: string;
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  total_trades: number;
  win_rate: number;
  profit_factor: number;
  max_drawdown: number;
  average_win: number;
  average_loss: number;
  is_active: boolean;
  is_public: boolean;
  is_premium: boolean;
  price_usd: number;
  subscription_price_usd: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const AdminMQLStrategiesTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<MQLStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<MQLStrategy | null>(null);
  const [viewingCode, setViewingCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0',
    mql_version: 'MQL5' as 'MQL4' | 'MQL5',
    mql_code: '',
    mql_file_url: '',
    author: '',
    category: 'copy_trading',
    risk_level: 'medium' as 'low' | 'medium' | 'high' | 'very_high',
    is_active: true,
    is_public: false,
    is_premium: false,
    price_usd: '0',
    subscription_price_usd: '0',
    default_parameters: '{}',
  });

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('mql_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies((data || []) as MQLStrategy[]);
    } catch (error) {
      console.error('Error fetching strategies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load strategies',
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
      let defaultParams = {};
      try {
        defaultParams = JSON.parse(formData.default_parameters);
      } catch {
        defaultParams = {};
      }

      const strategyData = {
        name: formData.name,
        description: formData.description || null,
        version: formData.version,
        mql_version: formData.mql_version,
        mql_code: formData.mql_code || null,
        mql_file_url: formData.mql_file_url || null,
        default_parameters: defaultParams,
        author: formData.author || null,
        category: formData.category,
        risk_level: formData.risk_level,
        is_active: formData.is_active,
        is_public: formData.is_public,
        is_premium: formData.is_premium,
        price_usd: parseFloat(formData.price_usd) || 0,
        subscription_price_usd: parseFloat(formData.subscription_price_usd) || 0,
        created_by: editingStrategy ? undefined : user.id,
      };

      if (editingStrategy) {
        const { error } = await (supabase as any)
          .from('mql_strategies')
          .update(strategyData)
          .eq('id', editingStrategy.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Strategy updated successfully',
        });
      } else {
        const { error } = await (supabase as any)
          .from('mql_strategies')
          .insert(strategyData);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Strategy created successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingStrategy(null);
      resetForm();
      fetchStrategies();
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save strategy',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (strategy: MQLStrategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description || '',
      version: strategy.version,
      mql_version: strategy.mql_version as 'MQL4' | 'MQL5',
      mql_code: strategy.mql_code || '',
      mql_file_url: strategy.mql_file_url || '',
      author: strategy.author || '',
      category: strategy.category,
      risk_level: strategy.risk_level as 'low' | 'medium' | 'high' | 'very_high',
      is_active: strategy.is_active,
      is_public: strategy.is_public,
      is_premium: strategy.is_premium,
      price_usd: strategy.price_usd.toString(),
      subscription_price_usd: strategy.subscription_price_usd.toString(),
      default_parameters: JSON.stringify(strategy.default_parameters, null, 2),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) return;

    try {
      const { error } = await (supabase as any)
        .from('mql_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Strategy deleted successfully',
      });
      fetchStrategies();
    } catch (error) {
      console.error('Error deleting strategy:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete strategy',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      version: '1.0',
      mql_version: 'MQL5',
      mql_code: '',
      mql_file_url: '',
      author: '',
      category: 'copy_trading',
      risk_level: 'medium',
      is_active: true,
      is_public: false,
      is_premium: false,
      price_usd: '0',
      subscription_price_usd: '0',
      default_parameters: '{}',
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-600';
      case 'medium': return 'bg-yellow-600';
      case 'high': return 'bg-orange-600';
      case 'very_high': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading strategies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MQL Strategies</h2>
          <p className="text-muted-foreground">Manage Expert Advisor strategies for copy trading</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingStrategy(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStrategy ? 'Edit Strategy' : 'Create MQL Strategy'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="code">MQL Code</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label>Strategy Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Shreem Brzee Scalper"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Strategy description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Version</Label>
                      <Input
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0"
                      />
                    </div>

                    <div>
                      <Label>MQL Version</Label>
                      <Select
                        value={formData.mql_version}
                        onValueChange={(value: any) => setFormData({ ...formData, mql_version: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MQL4">MQL4</SelectItem>
                          <SelectItem value="MQL5">MQL5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scalping">Scalping</SelectItem>
                          <SelectItem value="swing">Swing</SelectItem>
                          <SelectItem value="trend_following">Trend Following</SelectItem>
                          <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                          <SelectItem value="arbitrage">Arbitrage</SelectItem>
                          <SelectItem value="copy_trading">Copy Trading</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Risk Level</Label>
                      <Select
                        value={formData.risk_level}
                        onValueChange={(value: any) => setFormData({ ...formData, risk_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="very_high">Very High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Author</Label>
                    <Input
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Strategy author name"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  <div>
                    <Label>MQL Code</Label>
                    <Textarea
                      value={formData.mql_code}
                      onChange={(e) => setFormData({ ...formData, mql_code: e.target.value })}
                      placeholder="Paste MQL4/MQL5 code here..."
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label>MQL File URL (Alternative)</Label>
                    <Input
                      value={formData.mql_file_url}
                      onChange={(e) => setFormData({ ...formData, mql_file_url: e.target.value })}
                      placeholder="https://example.com/strategy.mq5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If code is stored externally, provide URL
                    </p>
                  </div>

                  <div>
                    <Label>Default Parameters (JSON)</Label>
                    <Textarea
                      value={formData.default_parameters}
                      onChange={(e) => setFormData({ ...formData, default_parameters: e.target.value })}
                      placeholder='{"lot_size": 0.01, "stop_loss": 50, "take_profit": 100}'
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Active</Label>
                        <p className="text-xs text-muted-foreground">Strategy is active and can generate signals</p>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Public</Label>
                        <p className="text-xs text-muted-foreground">Strategy is visible to all users</p>
                      </div>
                      <Switch
                        checked={formData.is_public}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Premium</Label>
                        <p className="text-xs text-muted-foreground">Strategy requires subscription</p>
                      </div>
                      <Switch
                        checked={formData.is_premium}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                      />
                    </div>
                  </div>

                  {formData.is_premium && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label>One-time Price (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price_usd}
                          onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Monthly Subscription (USD)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.subscription_price_usd}
                          onChange={(e) => setFormData({ ...formData, subscription_price_usd: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStrategy ? 'Update' : 'Create'} Strategy
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {strategies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No strategies yet. Create your first MQL strategy to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {strategy.name}
                      <Badge className={getRiskColor(strategy.risk_level)}>
                        {strategy.risk_level}
                      </Badge>
                      {strategy.is_premium && (
                        <Badge variant="default">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {strategy.is_public && (
                        <Badge variant="secondary">Public</Badge>
                      )}
                      {!strategy.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {strategy.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {strategy.mql_code && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingCode(strategy.mql_code || null)}
                      >
                        <Code className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(strategy)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(strategy.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-lg font-semibold">{strategy.win_rate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit Factor</p>
                    <p className="text-lg font-semibold">{strategy.profit_factor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="text-lg font-semibold">{strategy.total_trades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-lg font-semibold">{strategy.max_drawdown}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Code Viewer Dialog */}
      <Dialog open={viewingCode !== null} onOpenChange={(open) => !open && setViewingCode(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>MQL Code</DialogTitle>
          </DialogHeader>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
            {viewingCode}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMQLStrategiesTab;

