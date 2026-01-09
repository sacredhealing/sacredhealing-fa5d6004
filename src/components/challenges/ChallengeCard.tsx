import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Trophy, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  is_premium: boolean;
  shc_reward: number;
  participant_count?: number;
  user_progress?: number;
  user_joined?: boolean;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin?: (challengeId: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onJoin,
}) => {
  const isActive = new Date(challenge.start_date) <= new Date() && new Date(challenge.end_date) >= new Date();
  const isUpcoming = new Date(challenge.start_date) > new Date();
  const isPast = new Date(challenge.end_date) < new Date();

  const getStatus = () => {
    if (isPast) return { label: 'Completed', color: 'bg-gray-500' };
    if (isUpcoming) return { label: 'Upcoming', color: 'bg-blue-500' };
    return { label: 'Active', color: 'bg-green-500' };
  };

  const status = getStatus();

  return (
    <Card className="p-4 rounded-xl border border-border/50 hover:border-primary/50 transition-colors">
      <CardContent className="p-0 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {challenge.title}
              </h3>
              {challenge.is_premium && (
                <Badge variant="default" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              <Badge className={cn("text-xs text-white", status.color)}>
                {status.label}
              </Badge>
            </div>
            {challenge.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {challenge.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{challenge.duration_days} days</span>
          </div>
          {challenge.participant_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{challenge.participant_count} participants</span>
            </div>
          )}
          {challenge.shc_reward > 0 && (
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>+{challenge.shc_reward} SHC</span>
            </div>
          )}
        </div>

        {challenge.user_joined && challenge.user_progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Your Progress</span>
              <span className="font-medium">{challenge.user_progress}%</span>
            </div>
            <Progress value={challenge.user_progress} className="h-2" />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {challenge.user_joined ? (
            <Link to={`/challenges/${challenge.id}`} className="flex-1">
              <Button className="w-full" variant="default">
                Continue Challenge
              </Button>
            </Link>
          ) : (
            <Button
              className="flex-1"
              onClick={() => onJoin?.(challenge.id)}
              disabled={isPast || challenge.is_premium}
            >
              {isPast ? 'Ended' : challenge.is_premium ? 'Premium Required' : 'Join Challenge'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

