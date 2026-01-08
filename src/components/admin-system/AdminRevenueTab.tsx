import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, DollarSign, CreditCard, RefreshCw, CloudDownload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RevenueRecord {
  id: string;
  product_type: string;
  product_name: string | null;
  amount_usd: number;
  amount_shc: number | null;
  payment_method: string;
  customer_email: string | null;
  notes: string | null;
  created_at: string;
}

interface MonthlyCost {
  id: string;
  name: string;
  amount: number;
  category: string | null;
}

const PRODUCT_TYPES = [
  'meditation',
  'music',
  'course',
  'session',
  'shop',
  'healing',
  'transformation',
  'stargate',
  'affirmation',
  'mastering',
  'pregnancy',
  'certification',
  'membership',
  'other'
];

const PAYMENT_METHODS = ['stripe', 'shc', 'bank', 'cash', 'other'];

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
];

const AdminRevenueTab = () => {
  const [records, setRecords] = useState<RevenueRecord[]>([]);
  const [costs, setCosts] = useState<MonthlyCost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [newRecord, setNewRecord] = useState({
    product_type: '',
    product_name: '',
    amount_usd: '',
    amount_shc: '',
    payment_method: 'stripe',
    customer_email: '',
    notes: ''
  });

  const handleStripeSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to sync');
        return;
      }

      const { data, error } = await supabase.functions.invoke('backfill-stripe-revenue', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast.success(data.message || 'Stripe sync complete');
      fetchData();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync with Stripe');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch revenue records
      const { data: revenueData, error: revenueError } = await supabase
        .from('revenue_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (revenueError) throw revenueError;
      setRecords(revenueData || []);

      // Fetch monthly costs
      const { data: costsData, error: costsError } = await supabase
        .from('monthly_costs')
        .select('*');

      if (costsError) throw costsError;
      setCosts(costsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRecord = async () => {
    if (!newRecord.product_type || !newRecord.amount_usd) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase.from('revenue_records').insert({
        product_type: newRecord.product_type,
        product_name: newRecord.product_name || null,
        amount_usd: parseFloat(newRecord.amount_usd),
        amount_shc: newRecord.amount_shc ? parseInt(newRecord.amount_shc) : null,
        payment_method: newRecord.payment_method,
        customer_email: newRecord.customer_email || null,
        notes: newRecord.notes || null
      });

      if (error) throw error;

      toast.success('Revenue record added');
      setIsAddDialogOpen(false);
      setNewRecord({
        product_type: '',
        product_name: '',
        amount_usd: '',
        amount_shc: '',
        payment_method: 'stripe',
        customer_email: '',
        notes: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding record:', error);
      toast.error('Failed to add revenue record');
    }
  };

  // Calculate filtered records based on date range
  const getFilteredRecords = () => {
    const now = new Date();
    const daysAgo = parseInt(dateRange);
    
    if (dateRange === 'all') return records;
    
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return records.filter(r => new Date(r.created_at) >= cutoffDate);
  };

  const filteredRecords = getFilteredRecords();

  // Calculate totals
  const totalRevenue = filteredRecords.reduce((sum, r) => sum + Number(r.amount_usd), 0);
  const totalCosts = costs.reduce((sum, c) => sum + Number(c.amount), 0);
  const netProfit = totalRevenue - totalCosts;

  // Get this month's revenue
  const thisMonthRevenue = records.filter(r => {
    const recordDate = new Date(r.created_at);
    const now = new Date();
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  }).reduce((sum, r) => sum + Number(r.amount_usd), 0);

  // Revenue by product type for pie chart
  const revenueByType = filteredRecords.reduce((acc, r) => {
    const type = r.product_type;
    acc[type] = (acc[type] || 0) + Number(r.amount_usd);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(revenueByType).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Monthly trend data
  const monthlyTrend = records.reduce((acc, r) => {
    const date = new Date(r.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + Number(r.amount_usd);
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.entries(monthlyTrend)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, revenue]) => ({
      month: format(new Date(month + '-01'), 'MMM'),
      revenue
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange === 'all' ? 'All time' : `Last ${dateRange} days`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current month revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Costs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">${totalCosts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Recurring monthly costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
              ${netProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Costs (Monthly)</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>

        <Button variant="secondary" size="sm" onClick={handleStripeSync} disabled={isSyncing}>
          <CloudDownload className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Stripe'}
        </Button>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Revenue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Revenue Record</DialogTitle>
              <DialogDescription>
                Manually add a revenue record for tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Product Type *</Label>
                <Select 
                  value={newRecord.product_type} 
                  onValueChange={(v) => setNewRecord({ ...newRecord, product_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input 
                  placeholder="e.g. Monthly Stargate Membership"
                  value={newRecord.product_name}
                  onChange={(e) => setNewRecord({ ...newRecord, product_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (USD) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRecord.amount_usd}
                    onChange={(e) => setNewRecord({ ...newRecord, amount_usd: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount (SHC)</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={newRecord.amount_shc}
                    onChange={(e) => setNewRecord({ ...newRecord, amount_shc: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={newRecord.payment_method} 
                  onValueChange={(v) => setNewRecord({ ...newRecord, payment_method: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input 
                  type="email"
                  placeholder="customer@example.com"
                  value={newRecord.customer_email}
                  onChange={(e) => setNewRecord({ ...newRecord, customer_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Additional notes..."
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                />
              </div>

              <Button onClick={handleAddRecord} className="w-full">
                Add Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Category</CardTitle>
            <CardDescription>Distribution across product types</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ payload }) => {
                        if (payload && payload[0]) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{payload[0].name}</p>
                              <p className="text-primary">${Number(payload[0].value).toFixed(2)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No revenue data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Trend</CardTitle>
            <CardDescription>Revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <ChartTooltip 
                      content={({ payload }) => {
                        if (payload && payload[0]) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{payload[0].payload.month}</p>
                              <p className="text-primary">${Number(payload[0].value).toFixed(2)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No trend data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <CardDescription>
            {filteredRecords.length} records in selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No revenue records yet. Add your first record to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Customer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.slice(0, 20).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm">
                        {format(new Date(record.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.product_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {record.product_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        ${Number(record.amount_usd).toFixed(2)}
                        {record.amount_shc && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({record.amount_shc} SHC)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.payment_method}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.customer_email || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenueTab;
