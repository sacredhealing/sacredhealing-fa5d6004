import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, TrendingUp, DollarSign, FileText, Languages, Music, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UsageStats {
  total_users: number;
  total_usage: number;
  total_revenue: number;
  usage_by_type: { action_type: string; count: number }[];
  recent_usage: Array<{
    id: string;
    user_id: string;
    action_type: string;
    created_at: string;
    metadata: any;
  }>;
}

export default function AdminCreativeSoulTab() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get total users with access
      const { data: usersWithAccess, error: usersError } = await supabase
        .from('creative_tool_access')
        .select('user_id', { count: 'exact' })
        .eq('tool.slug', 'creative-soul-studio');

      // Get total usage
      const { data: allUsage, error: usageError } = await supabase
        .from('creative_tool_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (usageError) throw usageError;

      // Get total revenue (from Stripe revenue tracking)
      const { data: revenue, error: revenueError } = await supabase
        .from('stripe_revenue')
        .select('amount')
        .eq('purchase_type', 'creative_tool');

      // Calculate stats
      const usageByType: Record<string, number> = {};
      (allUsage || []).forEach((usage: any) => {
        usageByType[usage.action_type] = (usageByType[usage.action_type] || 0) + 1;
      });

      const totalRevenue = (revenue || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

      setStats({
        total_users: usersWithAccess?.length || 0,
        total_usage: allUsage?.length || 0,
        total_revenue: totalRevenue,
        usage_by_type: Object.entries(usageByType).map(([type, count]) => ({
          action_type: type,
          count: count as number,
        })),
        recent_usage: (allUsage || []).slice(0, 20),
      });
    } catch (error) {
      console.error('Error fetching Creative Soul stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const actionIcons: Record<string, React.ElementType> = {
    transcribe: Music,
    translate: Languages,
    generate_ideas: Sparkles,
    generate_image: Sparkles,
    export_pdf: FileText,
    youtube_convert: Music,
  };

  const actionLabels: Record<string, string> = {
    transcribe: 'Transcription',
    translate: 'Translation',
    generate_ideas: 'Idea Generation',
    generate_image: 'Image Generation',
    export_pdf: 'PDF Export',
    youtube_convert: 'YouTube Convert',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Creative Soul Analytics</h2>
        <p className="text-muted-foreground">Monitor tool usage, revenue, and user activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">Users with Creative Soul access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_usage || 0}</div>
            <p className="text-xs text-muted-foreground">Total tool actions performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.total_revenue.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Revenue from Creative Soul</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Action Type</CardTitle>
          <CardDescription>Breakdown of tool features used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.usage_by_type.map((item) => {
              const Icon = actionIcons[item.action_type] || Sparkles;
              return (
                <div key={item.action_type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="font-medium">{actionLabels[item.action_type] || item.action_type}</span>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              );
            })}
            {(!stats?.usage_by_type || stats.usage_by_type.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No usage data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest tool usage across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.recent_usage.map((usage) => {
              const Icon = actionIcons[usage.action_type] || Sparkles;
              return (
                <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {actionLabels[usage.action_type] || usage.action_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(usage.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {usage.metadata?.target_language && (
                    <Badge variant="outline">{usage.metadata.target_language.toUpperCase()}</Badge>
                  )}
                </div>
              );
            })}
            {(!stats?.recent_usage || stats.recent_usage.length === 0) && (
              <p className="text-center text-muted-foreground py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

