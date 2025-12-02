import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Review {
  id: string;
  user_id: string;
  content_type: string;
  content_id: string;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_purchase: boolean;
  reward_claimed: boolean;
  reward_amount: number;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export const useReviews = (contentType: string, contentId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReviews = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('reviews' as any)
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      const reviewsData = (data || []) as unknown as Review[];
      setReviews(reviewsData);
      
      // Find user's review if logged in
      if (user) {
        const myReview = reviewsData.find((r) => r.user_id === user.id);
        setUserReview(myReview || null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (contentType && contentId) {
      fetchReviews();
    }
  }, [contentType, contentId, user]);

  const submitReview = async (rating: number, comment: string, title?: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to leave a review",
        variant: "destructive"
      });
      return false;
    }

    if (userReview) {
      toast({
        title: "Already reviewed",
        description: "You have already reviewed this content",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Insert the review
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews' as any)
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          rating,
          title: title || null,
          comment,
          reward_claimed: true,
          reward_amount: 1000
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Award 1000 SHC to user
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('balance, total_earned')
        .eq('user_id', user.id)
        .single();

      if (!balanceError && balanceData) {
        await supabase
          .from('user_balances')
          .update({
            balance: (balanceData as any).balance + 1000,
            total_earned: (balanceData as any).total_earned + 1000
          })
          .eq('user_id', user.id);

        // Record the transaction
        await supabase
          .from('shc_transactions' as any)
          .insert({
            user_id: user.id,
            type: 'earned',
            amount: 1000,
            description: `Review reward for ${contentType}`,
            status: 'completed'
          });
      }

      toast({
        title: "Review submitted! 🎉",
        description: "You earned 1000 SHC for your review!",
      });

      await fetchReviews();
      return true;
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews' as any)
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Review deleted",
        description: "Your review has been removed"
      });

      await fetchReviews();
      return true;
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive"
      });
      return false;
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length 
    : 0;

  return {
    reviews,
    isLoading,
    userReview,
    averageRating,
    reviewCount: reviews.length,
    submitReview,
    deleteReview,
    refetch: fetchReviews
  };
};
