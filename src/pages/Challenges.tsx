import React from 'react';
import { Trophy } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { Card, CardContent } from '@/components/ui/card';

const Challenges: React.FC = () => {
  const { challenges, isLoading, joinChallenge } = useChallenges();

  return (
    <div className="min-h-screen px-4 pt-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Challenges</h1>
              <p className="text-sm text-muted-foreground">Practice together with the community</p>
            </div>
          </div>
        </div>

        {/* Challenges List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <CardContent className="p-0">
                  <div className="animate-pulse space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No challenges available at this time.</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for new group journeys!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {challenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onJoin={joinChallenge}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenges;

