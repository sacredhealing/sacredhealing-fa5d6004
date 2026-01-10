import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

interface BotConnection {
  id: string;
  connection_name: string;
  platform: 'MT4' | 'MT5' | 'cTrader' | 'solana' | 'other';
  broker_name: string | null;
  account_number: string | null;
  account_type: 'demo' | 'live' | 'cent' | null;
  is_active: boolean;
  is_verified: boolean;
  last_connected_at: string | null;
  account_balance: number;
  account_equity: number;
  account_currency: string;
  created_at: string;
}

const BotConnectionsManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<BotConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<BotConnection | null>(null);
  
  const [formData, setFormData] = useState({
    connection_name: '',
    platform: 'MT5' as 'MT4' | 'MT5' | 'cTrader' | 'solana' | 'other',
    broker_name: '',
    account_number: '',
    account_type: 'demo' as 'demo' | 'live' | 'cent',
    api_key: '',
    api_secret: '',
    server_name: '',
    max_lot_size: '',
    max_daily_loss: '',
    max_daily_trades: '',
    risk_per_trade_percent: '1.0',
  });

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_bot_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections((data || []) as BotConnection[]);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const connectionData = {
        user_id: user.id,
        connection_name: formData.connection_name,
        platform: formData.platform,
        broker_name: formData.broker_name || null,
        account_number: formData.account_number || null,
        account_type: formData.account_type,
        api_key: formData.api_key || null, // In production, encrypt this
        api_secret: formData.api_secret || null, // In production, encrypt this
        server_name: formData.server_name || null,
        max_lot_size: formData.max_lot_size ? parseFloat(formData.max_lot_size) : null,
        max_daily_loss: formData.max_daily_loss ? parseFloat(formData.max_daily_loss) : null,
        max_daily_trades: formData.max_daily_trades ? parseInt(formData.max_daily_trades) : null,
        risk_per_trade_percent: formData.risk_per_trade_percent ? parseFloat(formData.risk_per_trade_percent) : 1.0,
      };

      if (editingConnection) {
        const { error } = await (supabase as any)
          .from('user_bot_connections')
          .update(connectionData)
          .eq('id', editingConnection.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Connection updated successfully',
        });
      } else {
        const { error } = await (supabase as any)
          .from('user_bot_connections')
          .insert(connectionData);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Connection added successfully',
        });
      }

      setIsDialogOpen(false);
      setEditingConnection(null);
      resetForm();
      fetchConnections();
    } catch (error) {
      console.error('Error saving connection:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save connection',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (connection: BotConnection) => {
    setEditingConnection(connection);
    setFormData({
      connection_name: connection.connection_name,
      platform: connection.platform as 'MT4' | 'MT5' | 'cTrader' | 'solana' | 'other',
      broker_name: connection.broker_name || '',
      account_number: connection.account_number || '',
      account_type: (connection.account_type || 'demo') as 'demo' | 'live' | 'cent',
      api_key: '', // Don't show existing API keys for security
      api_secret: '',
      server_name: '',
      max_lot_size: '',
      max_daily_loss: '',
      max_daily_trades: '',
      risk_per_trade_percent: '1.0',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;

    try {
      const { error } = await (supabase as any)
        .from('user_bot_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Connection deleted successfully',
      });
      fetchConnections();
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete connection',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (connection: BotConnection) => {
    try {
      const { error } = await (supabase as any)
        .from('user_bot_connections')
        .update({ is_active: !connection.is_active })
        .eq('id', connection.id);

      if (error) throw error;
      fetchConnections();
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast({
        title: 'Error',
        description: 'Failed to update connection',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      connection_name: '',
      platform: 'MT5',
      broker_name: '',
      account_number: '',
      account_type: 'demo',
      api_key: '',
      api_secret: '',
      server_name: '',
      max_lot_size: '',
      max_daily_loss: '',
      max_daily_trades: '',
      risk_per_trade_percent: '1.0',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading connections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bot Connections</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingConnection(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? 'Edit Connection' : 'Add Bot Connection'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Connection Name</Label>
                <Input
                  value={formData.connection_name}
                  onChange={(e) => setFormData({ ...formData, connection_name: e.target.value })}
                  required
                  placeholder="My MT5 Account"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value: any) => setFormData({ ...formData, platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MT4">MT4</SelectItem>
                      <SelectItem value="MT5">MT5</SelectItem>
                      <SelectItem value="cTrader">cTrader</SelectItem>
                      <SelectItem value="solana">Solana</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Account Type</Label>
                  <Select
                    value={formData.account_type}
                    onValueChange={(value: any) => setFormData({ ...formData, account_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="cent">Cent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Broker Name</Label>
                <Input
                  value={formData.broker_name}
                  onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
                  placeholder="e.g., IC Markets"
                />
              </div>

              <div>
                <Label>Account Number</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="12345678"
                />
              </div>

              {(formData.platform === 'MT4' || formData.platform === 'MT5' as any) && (
                <div>
                  <Label>Server Name</Label>
                  <Input
                    value={formData.server_name}
                    onChange={(e) => setFormData({ ...formData, server_name: e.target.value })}
                    placeholder="ICMarkets-Demo"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>API Key (Optional)</Label>
                  <Input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>

                <div>
                  <Label>API Secret (Optional)</Label>
                  <Input
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="Leave empty to keep existing"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Risk Management</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Lot Size</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_lot_size}
                      onChange={(e) => setFormData({ ...formData, max_lot_size: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>

                  <div>
                    <Label>Max Daily Loss (USD)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.max_daily_loss}
                      onChange={(e) => setFormData({ ...formData, max_daily_loss: e.target.value })}
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <Label>Max Daily Trades</Label>
                    <Input
                      type="number"
                      value={formData.max_daily_trades}
                      onChange={(e) => setFormData({ ...formData, max_daily_trades: e.target.value })}
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <Label>Risk Per Trade (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.risk_per_trade_percent}
                      onChange={(e) => setFormData({ ...formData, risk_per_trade_percent: e.target.value })}
                      placeholder="1.0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingConnection ? 'Update' : 'Create'} Connection
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No bot connections yet. Add your first connection to start copy trading.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {connection.connection_name}
                      {connection.is_active ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {connection.platform} • {connection.broker_name || 'No broker'} • {connection.account_type || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(connection)}
                    >
                      {connection.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(connection)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(connection.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-semibold">
                      {connection.account_balance.toFixed(2)} {connection.account_currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Equity</p>
                    <p className="font-semibold">
                      {connection.account_equity.toFixed(2)} {connection.account_currency}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Connected</p>
                    <p className="font-semibold">
                      {connection.last_connected_at
                        ? new Date(connection.last_connected_at).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotConnectionsManager;

