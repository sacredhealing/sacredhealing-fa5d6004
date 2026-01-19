import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CreativeTool {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_eur: number;
  workspace_url: string;
  tool_type: string;
  icon_name: string | null;
  is_featured?: boolean;
  featured_action_text?: string | null;
  featured_order?: number | null;
  featured_start_date?: string | null;
  featured_end_date?: string | null;
  promo_text?: string | null;
  promo_discount_percent?: number | null;
}

export interface UserToolAccess {
  id: string;
  user_id: string;
  tool_id: string;
  purchased_at: string;
  access_granted_at: string;
  tool: CreativeTool;
}

export interface FeaturedTool extends CreativeTool {
  is_featured: boolean;
  featured_action_text: string | null;
  featured_order: number | null;
}

export const useCreativeTools = () => {
  const { user } = useAuth();
  const [availableTools, setAvailableTools] = useState<CreativeTool[]>([]);
  const [featuredTool, setFeaturedTool] = useState<FeaturedTool | null>(null);
  const [userTools, setUserTools] = useState<UserToolAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setIsAdmin(data === true);
    };
    checkAdminRole();
  }, [user]);

  const fetchAvailableTools = useCallback(async () => {
    try {
      console.log('[useCreativeTools] Fetching tools...');
      
      // First, try without auth to see if RLS is the issue
      const { data, error } = await supabase
        .from('creative_tools')
        .select('*')
        .eq('is_active', true)
        .order('price_eur', { ascending: true });

      if (error) {
        console.error('[useCreativeTools] Error fetching available tools:', error);
        console.error('[useCreativeTools] Error details:', JSON.stringify(error, null, 2));
        // Set empty array on error so UI can handle it gracefully
        setAvailableTools([]);
        return;
      }
      
      console.log('[useCreativeTools] Fetched tools:', data?.length || 0, data);
      setAvailableTools(data || []);
      
      if (!data || data.length === 0) {
        console.warn('[useCreativeTools] No tools found in database. Make sure migrations have been run.');
      }
    } catch (error) {
      console.error('[useCreativeTools] Exception fetching available tools:', error);
      setAvailableTools([]);
    }
  }, []);

  const fetchFeaturedTool = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      
      // Query for active featured tool (within date range if dates are set)
      let query = supabase
        .from('creative_tools')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true);

      // Filter by date range if dates are set
      // Tool is active if:
      // - No dates set (always active when featured)
      // - OR today is between start and end dates
      query = query.or(
        `featured_start_date.is.null,featured_end_date.is.null,` +
        `and(featured_start_date.lte.${today},featured_end_date.gte.${today})`
      );

      const { data, error } = await query
        .order('featured_order', { ascending: true })
        .order('featured_start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setFeaturedTool(data ? (data as FeaturedTool) : null);
    } catch (error) {
      console.error('Error fetching featured tool:', error);
    }
  }, []);

  const fetchUserTools = useCallback(async () => {
    if (!user) {
      setUserTools([]);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('creative_tool_access')
        .select(`
          *,
          tool:creative_tools(*)
        `)
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include the tool object
      const toolsWithAccess = (data || []).map((access: any) => ({
        ...access,
        tool: access.tool,
      }));
      
      setUserTools(toolsWithAccess);
    } catch (error) {
      console.error('Error fetching user tools:', error);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchAvailableTools(), fetchFeaturedTool(), fetchUserTools()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchAvailableTools, fetchFeaturedTool, fetchUserTools]);

  const hasAccess = useCallback((toolSlug: string) => {
    // Admins have access to all tools
    if (isAdmin) return true;
    return userTools.some(access => access.tool.slug === toolSlug);
  }, [userTools, isAdmin]);

  const refetch = useCallback(() => {
    fetchUserTools();
  }, [fetchUserTools]);

  return {
    availableTools,
    featuredTool,
    userTools,
    isLoading,
    hasAccess,
    refetch,
    isAdmin,
  };
};

