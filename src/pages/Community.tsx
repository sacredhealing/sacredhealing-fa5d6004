import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Mail } from 'lucide-react';
import CommunityFeed from '@/components/community/CommunityFeed';
import ChatRooms from '@/components/community/ChatRooms';
import PrivateMessages from '@/components/community/PrivateMessages';

const Community = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="p-4 pb-24 min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t('community.title')}</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{t('community.feed')}</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('community.chatRooms')}</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">{t('community.messages')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <CommunityFeed />
        </TabsContent>

        <TabsContent value="chat">
          <ChatRooms />
        </TabsContent>

        <TabsContent value="messages">
          <PrivateMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Community;
