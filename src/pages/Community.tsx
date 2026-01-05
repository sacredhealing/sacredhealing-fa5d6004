import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Mail, Heart, Radio, Sparkles } from 'lucide-react';
import CommunityFeed from '@/components/community/CommunityFeed';
import SacredCircles from '@/components/community/SacredCircles';
import PrivateMessages from '@/components/community/PrivateMessages';
import SupportCircle from '@/components/community/SupportCircle';
import { Button } from '@/components/ui/button';

const Community = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('circles');

  return (
    <div className="p-4 pb-24 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('community.title')}</h1>
          <p className="text-sm text-muted-foreground">A shared space for presence, reflection, and connection</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/live-recordings')}
          className="flex items-center gap-2"
        >
          <Radio className="h-4 w-4" />
          <span className="hidden sm:inline">Live</span>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="circles" className="flex items-center gap-1 px-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Circles</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center gap-1 px-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{t('community.feed')}</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-1 px-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{t('community.support')}</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1 px-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">{t('community.messages')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="circles">
          <SacredCircles />
        </TabsContent>

        <TabsContent value="feed">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="support">
          <SupportCircle />
        </TabsContent>

        <TabsContent value="messages">
          <PrivateMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
