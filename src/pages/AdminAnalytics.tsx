import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  RefreshCw,
  ArrowRight,
  Flame,
  Target,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';
import { BackButton } from '@/components/layout/BackButton';

const COLORS = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899'];

const AdminAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { data, loading, error, refetch } = useAnalytics();

  if (loading) {
    return (
      <div className="min-h-screen p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Error loading analytics: {error}</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  if (!data) return null;

  const funnelData = [
    { name: 'Total Users', value: data.conversionFunnel.totalUsers, fill: COLORS[0] },
    { name: 'Trial Users', value: data.conversionFunnel.trialUsers, fill: COLORS[1] },
    { name: 'Paid Users', value: data.conversionFunnel.paidUsers, fill: COLORS[2] },
  ];

  const retentionData = [
    { name: 'D1', rate: Number(data.retention.d1.rate), cohort: data.retention.d1.cohortSize },
    { name: 'D7', rate: Number(data.retention.d7.rate), cohort: data.retention.d7.cohortSize },
    { name: 'D30', rate: Number(data.retention.d30.rate), cohort: data.retention.d30.cohortSize },
  ];

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(data.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-muted-foreground">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.summary.totalUsers.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-sm text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground">€{data.summary.totalRevenue}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-muted-foreground">ARPU</span>
            </div>
            <p className="text-2xl font-bold text-foreground">€{data.summary.overallArpu}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-muted-foreground">Paid Users</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{data.summary.paidUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Conversion Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            {funnelData.map((item, index) => (
              <React.Fragment key={item.name}>
                <div className="text-center">
                  <p className="text-3xl font-bold" style={{ color: item.fill }}>
                    {item.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.name}</p>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="flex flex-col items-center">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    <Badge variant="outline" className="mt-1 text-xs">
                      {index === 0 ? data.conversionFunnel.freeToTrialRate : data.conversionFunnel.trialToPaidRate}%
                    </Badge>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Conversion</span>
              <span className="font-medium">{data.conversionFunnel.overallConversion}%</span>
            </div>
            <Progress value={Number(data.conversionFunnel.overallConversion)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Retention Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Retention Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" unit="%" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value: number) => [`${value}%`, 'Retention Rate']}
                />
                <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {retentionData.map((item) => (
              <div key={item.name} className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-bold text-foreground">{item.rate}%</p>
                <p className="text-xs text-muted-foreground">{item.name} Retention</p>
                <p className="text-xs text-muted-foreground">({item.cohort} users)</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DAU Timeline */}
      {data.dauTimeline.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Daily Active Users (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dauTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ARPU by Tier */}
      {data.arpuByTier.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              ARPU by Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.arpuByTier.map((tier, index) => (
                <div key={tier.slug} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium text-foreground">{tier.name}</p>
                      <p className="text-xs text-muted-foreground">{tier.userCount} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">€{tier.arpu}</p>
                    <p className="text-xs text-muted-foreground">€{tier.totalRevenue} total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Churn & Upgrade */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Churn & Upgrade Rates (30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-sm text-muted-foreground">Churn Rate</span>
              </div>
              <p className="text-2xl font-bold text-red-400">{data.churnUpgrade.churnRate}%</p>
              <p className="text-xs text-muted-foreground">{data.churnUpgrade.churned30d} users churned</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm text-muted-foreground">Upgrade Rate</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{data.churnUpgrade.upgradeRate}%</p>
              <p className="text-xs text-muted-foreground">{data.churnUpgrade.upgraded30d} users upgraded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Meditations */}
      {data.topMeditations.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top Meditations (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topMeditations.map((meditation, index) => (
                <div key={meditation.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </span>
                    <span className="text-foreground">{meditation.title}</span>
                  </div>
                  <Badge variant="secondary">{meditation.count} sessions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
              <p className="text-3xl font-bold text-purple-400">{data.summary.totalMeditations.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Meditations</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-3xl font-bold text-amber-400">{data.summary.totalMantras.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Mantras</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
