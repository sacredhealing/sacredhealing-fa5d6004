import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Progress } from '@/components/ui/progress';

interface Trade {
  id: string;
  trade_ticket: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  profit_loss: number;
  profit_loss_usd: number;
  status: 'open' | 'closed' | 'pending' | 'cancelled' | 'rejected';
  opened_at: string;
  closed_at: string | null;
  duration_seconds: number | null;
  mql_strategies: {
    name: string;
  } | null;
}

interface PerformanceStats {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_profit_loss: number;
  total_profit: number;
  total_loss: number;
  profit_factor: number;
  average_win: number;
  average_loss: number;
  max_drawdown: number;
}

const TradingDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    symbol: 'all',
    strategy: 'all',
    period: '30',
  });

  useEffect(() => {
    if (user) {
      fetchTrades();
      fetchStats();
    }
  }, [user, filter]);

  const fetchTrades = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('mql_trades')
        .select(`
          *,
          mql_strategies(name)
        `)
        .eq('user_id', user.id)
        .order('opened_at', { ascending: false })
        .limit(100);

      if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      if (filter.symbol !== 'all') {
        query = query.eq('symbol', filter.symbol);
      }

      if (filter.strategy !== 'all') {
        query = query.eq('strategy_id', filter.strategy);
      }

      // Apply period filter
      if (filter.period !== 'all') {
        const days = parseInt(filter.period);
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = query.gte('opened_at', date.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trades',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: tradesData, error } = await supabase
        .from('mql_trades')
        .select('profit_loss, profit_loss_usd, status')
        .eq('user_id', user.id)
        .eq('status', 'closed');

      if (error) throw error;

      const closedTrades = tradesData || [];
      const winningTrades = closedTrades.filter(t => t.profit_loss > 0);
      const losingTrades = closedTrades.filter(t => t.profit_loss < 0);

      const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0);
      const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0));
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit;

      const averageWin = winningTrades.length > 0
        ? totalProfit / winningTrades.length
        : 0;
      const averageLoss = losingTrades.length > 0
        ? totalLoss / losingTrades.length
        : 0;

      setStats({
        total_trades: closedTrades.length,
        winning_trades: winningTrades.length,
        losing_trades: losingTrades.length,
        win_rate: closedTrades.length > 0
          ? (winningTrades.length / closedTrades.length) * 100
          : 0,
        total_profit_loss: closedTrades.reduce((sum, t) => sum + (t.profit_loss_usd || 0), 0),
        total_profit: totalProfit,
        total_loss: totalLoss,
        profit_factor: profitFactor,
        average_win: averageWin,
        average_loss: averageLoss,
        max_drawdown: 0, // TODO: Calculate from performance analytics
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-600';
      case 'closed': return 'bg-gray-600';
      case 'pending': return 'bg-yellow-600';
      case 'cancelled': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !stats) {
    return <div className="text-center py-8">Loading trading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Trading Dashboard</h2>
        <div className="flex gap-2">
          <Select
            value={filter.period}
            onValueChange={(value) => setFilter({ ...filter, period: value })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total P/L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {stats.total_profit_loss >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className={`text-2xl font-bold ${stats.total_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats.total_profit_loss.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <span className="text-2xl font-bold">{stats.win_rate.toFixed(1)}%</span>
                <Progress value={stats.win_rate} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winning_trades}W / {stats.losing_trades}L
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Profit Factor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.profit_factor.toFixed(2)}</span>
              <p className="text-xs text-muted-foreground mt-1">
                Avg Win: ${stats.average_win.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.total_trades}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winning_trades} winning
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Trades</CardTitle>
            <div className="flex gap-2">
              <Select
                value={filter.status}
                onValueChange={(value) => setFilter({ ...filter, status: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No trades found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Ticket</th>
                    <th className="text-left p-2 text-sm font-medium">Symbol</th>
                    <th className="text-left p-2 text-sm font-medium">Type</th>
                    <th className="text-left p-2 text-sm font-medium">Entry</th>
                    <th className="text-left p-2 text-sm font-medium">Exit</th>
                    <th className="text-left p-2 text-sm font-medium">Lot Size</th>
                    <th className="text-left p-2 text-sm font-medium">P/L</th>
                    <th className="text-left p-2 text-sm font-medium">Duration</th>
                    <th className="text-left p-2 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm font-mono">{trade.trade_ticket}</td>
                      <td className="p-2 text-sm">{trade.symbol}</td>
                      <td className="p-2">
                        <Badge variant={trade.trade_type === 'buy' ? 'default' : 'secondary'}>
                          {trade.trade_type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-2 text-sm">{trade.entry_price.toFixed(5)}</td>
                      <td className="p-2 text-sm">
                        {trade.exit_price ? trade.exit_price.toFixed(5) : '-'}
                      </td>
                      <td className="p-2 text-sm">{trade.lot_size}</td>
                      <td className={`p-2 text-sm font-semibold ${trade.profit_loss_usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${trade.profit_loss_usd.toFixed(2)}
                      </td>
                      <td className="p-2 text-sm">{formatDuration(trade.duration_seconds)}</td>
                      <td className="p-2">
                        <Badge className={getStatusColor(trade.status)}>
                          {trade.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingDashboard;

