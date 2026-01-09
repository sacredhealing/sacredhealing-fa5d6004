import React, { useState, useEffect } from 'react';
import { Play, Pause, Settings, TrendingUp, TrendingDown, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  category: string;
  risk_level: string;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  is_premium: boolean;
  price_usd: number;
  subscription_price_usd: number;
  created_by: string | null;
}

interface Subscription {
  id: string;
  strategy_id: string;
  connection_id: string | null;
  subscription_type: 'copy' | 'signal_only' | 'full_access';
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  copy_percentage: number;
  lot_multiplier: number;
  max_lot_size: number | null;
  total_profit_loss: number;
  total_trades: number;
  mql_strategies: Strategy;
  user_bot_connections: {
    connection_name: string;
    platform: string;
  } | null;
}

const StrategySubscriptions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  
  const [formData, setFormData] = useState({
    strategy_id: '',
    connection_id: '',
    subscription_type: 'copy' as const,
    copy_percentage: '100',
    lot_multiplier: '1.0',
    max_lot_size: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch available strategies (public or user's own)
      const { data: strategiesData, error: strategiesError } = await (supabase as any)
        .from('mql_strategies')
        .select('*')
        .or(`is_public.eq.true,created_by.eq.${user.id}`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (strategiesError) throw strategiesError;
      setStrategies((strategiesData || []) as Strategy[]);

      // Fetch user's subscriptions
      const { data: subsData, error: subsError } = await (supabase as any)
        .from('user_strategy_subscriptions')
        .select(`
          *,
          mql_strategies(*),
          user_bot_connections(connection_name, platform)
        `)
        .eq('user_id', user.id)
        .order('subscribed_at', { ascending: false });

      if (subsError) throw subsError;
      setSubscriptions((subsData || []) as Subscription[]);

      // Fetch user's connections
      const { data: connData, error: connError } = await (supabase as any)
        .from('user_bot_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (connError) throw connError;
      setConnections(connData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load strategies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !formData.strategy_id || !formData.connection_id) {
      toast({
        title: 'Error',
        description: 'Please select a strategy and connection',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Check if strategy is premium and requires payment
      const strategy = strategies.find(s => s.id === formData.strategy_id);
      if (strategy?.is_premium && strategy.subscription_price_usd > 0) {
        // TODO: Integrate with payment system
        toast({
          title: 'Premium Strategy',
          description: 'This strategy requires a subscription. Payment integration coming soon.',
        });
        return;
      }

      const { error } = await (supabase as any)
        .from('user_strategy_subscriptions')
        .insert({
          user_id: user.id,
          strategy_id: formData.strategy_id,
          connection_id: formData.connection_id,
          subscription_type: formData.subscription_type,
          copy_percentage: parseFloat(formData.copy_percentage),
          lot_multiplier: parseFloat(formData.lot_multiplier),
          max_lot_size: formData.max_lot_size ? parseFloat(formData.max_lot_size) : null,
          status: 'active',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Successfully subscribed to strategy',
      });

      setIsDialogOpen(false);
      setFormData({
        strategy_id: '',
        connection_id: '',
        subscription_type: 'copy',
        copy_percentage: '100',
        lot_multiplier: '1.0',
        max_lot_size: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to subscribe',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (subscription: Subscription) => {
    const newStatus = subscription.status === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await (supabase as any)
        .from('user_strategy_subscriptions')
        .update({ status: newStatus })
        .eq('id', subscription.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Subscription ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const { error } = await (supabase as any)
        .from('user_strategy_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subscription cancelled',
      });

      fetchData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading strategies...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Strategy Subscriptions</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData({
                strategy_id: '',
                connection_id: '',
                subscription_type: 'copy',
                copy_percentage: '100',
                lot_multiplier: '1.0',
                max_lot_size: '',
              });
            }}>
              <Play className="w-4 h-4 mr-2" />
              Subscribe to Strategy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subscribe to Strategy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Strategy</Label>
                <Select
                  value={formData.strategy_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, strategy_id: value });
                    const strategy = strategies.find(s => s.id === value);
                    setSelectedStrategy(strategy || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        {strategy.name}
                        {strategy.is_premium && <Badge className="ml-2">Premium</Badge>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStrategy && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>{selectedStrategy.description}</p>
                    <div className="flex gap-4 mt-2">
                      <span>Win Rate: {selectedStrategy.win_rate}%</span>
                      <span>Profit Factor: {selectedStrategy.profit_factor}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Connection</Label>
                <Select
                  value={formData.connection_id}
                  onValueChange={(value) => setFormData({ ...formData, connection_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((conn) => (
                      <SelectItem key={conn.id} value={conn.id}>
                        {conn.connection_name} ({conn.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Copy Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.copy_percentage}
                  onChange={(e) => setFormData({ ...formData, copy_percentage: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Percentage of signals to copy (0-100)
                </p>
              </div>

              <div>
                <Label>Lot Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.lot_multiplier}
                  onChange={(e) => setFormData({ ...formData, lot_multiplier: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Multiply lot size by this factor
                </p>
              </div>

              <div>
                <Label>Max Lot Size (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.max_lot_size}
                  onChange={(e) => setFormData({ ...formData, max_lot_size: e.target.value })}
                  placeholder="Leave empty for no limit"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubscribe}>
                  Subscribe
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active subscriptions. Subscribe to a strategy to start copy trading.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => {
            const strategy = subscription.mql_strategies;
            const isActive = subscription.status === 'active';
            const isProfitable = subscription.total_profit_loss > 0;

            return (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {strategy.name}
                        {strategy.is_premium && (
                          <Badge variant="default">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                        <Badge variant={isActive ? 'default' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {subscription.user_bot_connections?.connection_name || 'No connection'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(subscription)}
                      >
                        {isActive ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(subscription.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Trades</p>
                      <p className="text-lg font-semibold">{subscription.total_trades}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">P/L</p>
                      <p className={`text-lg font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfitable ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                        ${subscription.total_profit_loss.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Copy %</p>
                      <p className="text-lg font-semibold">{subscription.copy_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lot Multiplier</p>
                      <p className="text-lg font-semibold">{subscription.lot_multiplier}x</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Strategy Win Rate</span>
                      <span className="font-semibold">{strategy.win_rate}%</span>
                    </div>
                    <Progress value={strategy.win_rate} className="h-2" />
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

export default StrategySubscriptions;

