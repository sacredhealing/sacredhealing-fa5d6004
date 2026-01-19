import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Heart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SocialShare } from '@/components/SocialShare';

const InviteFriends: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-heading font-semibold text-foreground">
            {t('dashboard.inviteFriends')}
          </h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Hero Section */}
        <Card className="p-6 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 border-primary/30">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/20">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">
              {t('dashboard.inviteFriends')}
            </h2>
            <p className="text-muted-foreground">
              {t('dashboard.inviteDescription')}
            </p>
          </div>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-muted/30 border-border/30">
            <div className="flex flex-col items-center text-center space-y-2">
              <Heart className="w-6 h-6 text-pink-500" />
              <p className="text-sm text-muted-foreground">Spread healing energy</p>
            </div>
          </Card>
          <Card className="p-4 bg-muted/30 border-border/30">
            <div className="flex flex-col items-center text-center space-y-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <p className="text-sm text-muted-foreground">Earn SHC rewards</p>
            </div>
          </Card>
        </div>

        {/* Social Share Buttons */}
        <Card className="p-6 bg-muted/30 border-border/30">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Share on Social Media
          </h3>
          <SocialShare 
            title="Sacred Healing App"
            text="Join me on Sacred Healing - Transform your spiritual journey and earn SHC tokens! 🧘‍♀️✨"
          />
        </Card>
      </div>
    </div>
  );
};

export default InviteFriends;
