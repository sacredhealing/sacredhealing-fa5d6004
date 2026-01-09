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

  const fetchAvailableTools = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('creative_tools')
        .select('*')
        .eq('is_active', true)
        .order('price_eur', { ascending: true });

      if (error) {
        console.error('Error fetching available tools:', error);
        // Set empty array on error so UI can handle it gracefully
        setAvailableTools([]);
        return;
      }
      
      console.log('[useCreativeTools] Fetched tools:', data?.length || 0);
      setAvailableTools(data || []);
    } catch (error) {
      console.error('Error fetching available tools:', error);
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
        .order('featured_order', { ascending: true, nullsLast: true })
        .order('featured_start_date', { ascending: false, nullsLast: true })
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
      const { data, error } = await supabase
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
    return userTools.some(access => access.tool.slug === toolSlug);
  }, [userTools]);

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
  };
};

