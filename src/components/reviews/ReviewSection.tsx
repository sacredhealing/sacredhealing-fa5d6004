import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, MessageSquare, Gift, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface ReviewSectionProps {
  contentType: 'course' | 'video' | 'healing' | 'meditation' | 'music';
  contentId: string;
  contentTitle?: string;
}

const StarRating: React.FC<{ 
  rating: number; 
  onSelect?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
}> = ({ rating, onSelect, size = 16, interactive = false }) => {
  const [hovered, setHovered] = useState(0);
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          onClick={() => onSelect?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
        >
          <Star
            size={size}
            className={`${
              star <= (hovered || rating)
                ? 'fill-accent text-accent'
                : 'text-muted-foreground/30'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  contentType,
  contentId,
  contentTitle
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reviews, isLoading, userReview, averageRating, reviewCount, submitReview, deleteReview } = useReviews(contentType, contentId);
  
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setIsSubmitting(true);
    const success = await submitReview(rating, comment, title);
    if (success) {
      setShowForm(false);
      setRating(5);
      setTitle('');
      setComment('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with rating summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="font-heading font-semibold text-foreground">
            {t('reviews.title')}
          </h3>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StarRating rating={Math.round(averageRating)} size={14} />
              <span>({averageRating.toFixed(1)}) · {reviewCount} {t('reviews.reviews')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reward Banner */}
      {user && !userReview && (
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Gift className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{t('reviews.earnReward')}</p>
                <p className="text-sm text-muted-foreground">{t('reviews.rewardDescription')}</p>
              </div>
              <Button 
                size="sm"
                className="bg-[#00F2FE] text-black font-extrabold hover:bg-[#00D4E0] shadow-[0_0_20px_rgba(0,242,254,0.4)] border-0"
                onClick={() => setShowForm(true)}
              >
                {t('reviews.writeReview')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showForm && !userReview && (
        <Card className="bg-card/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('reviews.writeReview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">{t('reviews.yourRating')}</label>
                <StarRating rating={rating} onSelect={setRating} size={24} interactive />
              </div>
              
              <Input
                placeholder={t('reviews.titlePlaceholder')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
              
              <Textarea
                placeholder={t('reviews.commentPlaceholder')}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="bg-background/50"
                required
              />
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || !comment.trim()}>
                  {isSubmitting ? t('common.loading') : t('reviews.submit')}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* User's existing review */}
      {userReview && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="py-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">{t('reviews.yourReview')}</span>
                <StarRating rating={userReview.rating} size={14} />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteReview(userReview.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
            {userReview.title && (
              <p className="font-medium text-foreground mb-1">{userReview.title}</p>
            )}
            <p className="text-sm text-muted-foreground">{userReview.comment}</p>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : reviews.length === 0 ? (
        <Card className="bg-card/30 border-border/30">
          <CardContent className="py-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">{t('reviews.noReviews')}</p>
            {user && !userReview && (
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => setShowForm(true)}
              >
                {t('reviews.beFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews
            .filter(r => r.id !== userReview?.id)
            .map((review) => (
            <Card key={review.id} className="bg-card/30 border-border/30">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {t('reviews.anonymous')}
                      </span>
                      <StarRating rating={review.rating} size={12} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {review.title && (
                      <p className="font-medium text-foreground text-sm mb-1">{review.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA for non-logged in users */}
      {!user && (
        <Card className="bg-muted/20 border-border/30">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">{t('reviews.signInToReview')}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/auth'}>
              {t('auth.signIn')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
