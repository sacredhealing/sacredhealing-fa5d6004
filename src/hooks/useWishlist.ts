import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlistIds(new Set());
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.id);

    if (data) {
      setWishlistIds(new Set(data.map((w) => w.product_id)));
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to save items');
      return false;
    }

    setLoading(true);
    const isInWishlist = wishlistIds.has(productId);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;

        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        toast.success('Removed from wishlist');
      } else {
        const { error } = await supabase
          .from('wishlists')
          .insert({ user_id: user.id, product_id: productId });

        if (error) throw error;

        setWishlistIds((prev) => new Set(prev).add(productId));
        toast.success('Added to wishlist');
      }
      return true;
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.has(productId);

  return {
    wishlistIds,
    toggleWishlist,
    isInWishlist,
    loading,
    wishlistCount: wishlistIds.size,
  };
};
