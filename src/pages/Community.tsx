import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Mail, Heart, Radio, Sparkles, Megaphone } from 'lucide-react';
import CommunityFeed from '@/components/community/CommunityFeed';
import SacredCircles from '@/components/community/SacredCircles';
import PrivateMessages from '@/components/community/PrivateMessages';
import SupportCircle from '@/components/community/SupportCircle';
import GuideChat from '@/components/community/GuideChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Community = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('guide');

  return (
    <div className="p-4 pb-24 min-h-screen">
      {/* Header */}
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

      {/* Quick Action: Chat with Guide - Always visible at top */}
      {activeTab !== 'guide' && (
        <Card 
          className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors"
          onClick={() => setActiveTab('guide')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Chat with a Guide</h3>
              <p className="text-sm text-muted-foreground">Free support available 24/7</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="guide" className="flex items-center gap-1 px-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Guide</span>
          </TabsTrigger>
          <TabsTrigger value="feed" className="flex items-center gap-1 px-2">
            <Megaphone className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="circles" className="flex items-center gap-1 px-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Circles</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-1 px-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Support</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-1 px-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">DMs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guide">
          <GuideChat />
        </TabsContent>

        <TabsContent value="feed">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="circles">
          <SacredCircles />
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
