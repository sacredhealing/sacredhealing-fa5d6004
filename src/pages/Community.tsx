import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useCommunity, useAllUsers } from '@/hooks/useCommunity';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { ChatSidebar, ChatContainer, EmptyState, type ChatTab } from '@/components/community/chat';
import CommunityFeed from '@/components/community/CommunityFeed';
import SacredCircles from '@/components/community/SacredCircles';
import CommunityChannels from '@/components/community/CommunityChannels';
import { formatDistanceToNow } from 'date-fns';

const TAB_FROM_PARAM: Record<string, ChatTab> = {
  spaces: 'channels',
  reflections: 'feed',
  groups: 'circles',
};

const Community = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { conversations, isLoading: convLoading } = useCommunity();

  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam && TAB_FROM_PARAM[tabParam]) ? TAB_FROM_PARAM[tabParam] : 'feed';
  const [activeTab, setActiveTab] = useState<ChatTab>(initialTab);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newChatUser, setNewChatUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // Build contact list based on tab
  const getContacts = () => {
    if (activeTab === 'messages') {
      return conversations.map(c => ({
        id: c.user_id,
            name: c.full_name || t('community.anonymous'),
        avatar: c.avatar_url,
        lastMessage: c.last_message,
        lastMessageTime: formatDistanceToNow(new Date(c.last_message_time), { addSuffix: true }),
        unreadCount: c.unread_count,
        isOnline: true
      }));
    }

    return [];
  };

  const contacts = getContacts();

  const handleSelectContact = (id: string) => {
    setSelectedContactId(id);
    if (window.innerWidth < 768) {
      setShowMobileSidebar(false);
    }
  };

  const handleBack = () => {
    setSelectedContactId(null);
    setShowMobileSidebar(true);
  };

  const handleTabChange = (tab: ChatTab) => {
    setActiveTab(tab);
    setSelectedContactId(null);
    setShowMobileSidebar(true);
  };

  const handleNewMessageSelect = async (userId: string) => {
    // Fetch the user's profile to get name and avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .eq('user_id', userId)
      .single();
    
    if (profile) {
      setNewChatUser({
        id: profile.user_id,
        name: profile.full_name || t('community.anonymous'),
        avatar: profile.avatar_url
      });
    }
    
    setSelectedContactId(userId);
    setIsNewChatOpen(false);
    if (window.innerWidth < 768) {
      setShowMobileSidebar(false);
    }
  };

  // Find selected contact info - use newChatUser if contact not in list
  const selectedContact = contacts.find(c => c.id === selectedContactId) || 
    (newChatUser && newChatUser.id === selectedContactId ? { ...newChatUser, unreadCount: 0, isOnline: true } : null);

  // Render non-chat content for certain tabs
  const renderTabContent = () => {
    if (activeTab === 'feed') return <CommunityFeed />;
    if (activeTab === 'circles') return <SacredCircles />;
    if (activeTab === 'channels') return <CommunityChannels />;
    return null;
  };

  const tabContent = renderTabContent();

  // For non-chat tabs, render content in main area
  // Mobile: single column with top tab bar. Desktop: left rail + main content.
  if (tabContent) {
    return (
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {/* Mobile Tab Bar - top on mobile only */}
        <div className="md:hidden shrink-0 border-b border-border bg-background z-20">
          <div className="flex justify-around py-2">
            {(['channels', 'feed', 'circles', 'messages'] as const).map((tab) => {
              const label =
                tab === 'channels'
                  ? t('community.spaces')
                  : tab === 'feed'
                  ? t('community.reflections')
                  : tab === 'circles'
                  ? t('community.groups')
                  : t('community.messages');
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex flex-col items-center px-2 py-1.5 text-xs min-w-0 ${
                    activeTab === tab ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {tab === 'channels' && '📢'}
                  {tab === 'feed' && '📝'}
                  {tab === 'circles' && '⭕'}
                  {tab === 'messages' && '💬'}
                  <span className="mt-0.5">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Left rail - hidden on mobile, search + tabs on desktop */}
        <div className="hidden md:flex h-full w-auto md:w-[350px] shrink-0 z-20">
          <ChatSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            contacts={[]}
            activeContactId={null}
            onSelectContact={() => {}}
            isLoading={false}
            hideWelcomeBlock
          />
        </div>

        {/* Main Content - always visible for content tabs */}
        <div className="flex flex-col flex-1 min-h-0 overflow-auto p-4">
          {tabContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex h-full w-full md:w-auto z-20`}>
        <ChatSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          contacts={contacts}
          activeContactId={selectedContactId}
          onSelectContact={handleSelectContact}
          onNewMessage={activeTab === 'messages' ? () => setIsNewChatOpen(true) : undefined}
          isLoading={convLoading}
        />
      </div>

      {/* Mobile Tab Bar - visible when sidebar is showing on mobile */}
      {showMobileSidebar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-30">
          <div className="flex justify-around py-2">
            {(['channels', 'feed', 'circles', 'messages'] as const).map((tab) => {
              const label =
                tab === 'channels'
                  ? 'Spaces'
                  : tab === 'feed'
                  ? 'Reflections'
                  : tab === 'circles'
                  ? 'Groups'
                  : 'Messages';
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex flex-col items-center px-3 py-1 text-xs ${
                    activeTab === tab ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {tab === 'channels' && '📢'}
                  {tab === 'feed' && '📝'}
                  {tab === 'circles' && '⭕'}
                  {tab === 'messages' && '💬'}
                  <span className="mt-1">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full z-10`}>
        {selectedContact ? (
          <ChatContainer
            partnerId={selectedContact.id}
            partnerName={selectedContact.name}
            partnerAvatar={selectedContact.avatar}
            isBot={(selectedContact as any).isBot}
            isOnline={selectedContact.isOnline}
            onBack={handleBack}
            showBackOnDesktop={false}
          />
        ) : (
          <EmptyState
            title={t('community.selectConversation')}
            description={t('community.selectConversationDesc')}
          />
        )}
      </div>

      {/* New Message Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('community.selectUser', 'Select a user')}</DialogTitle>
          </DialogHeader>
          <UserSelector onSelect={handleNewMessageSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// User selector for new DM
const UserSelector = ({ onSelect }: { onSelect: (userId: string) => void }) => {
  const { t } = useTranslation();
  const { users, isLoading } = useAllUsers();
  const [search, setSearch] = useState('');

  const filteredUsers = search.trim()
    ? users.filter(
        (u) => u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
               u.bio?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div className="space-y-4 pt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('community.searchUsers', 'Search users...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {search.trim() ? t('community.noUsersFound') : t('community.noOtherUsersAvailable')}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => onSelect(user.user_id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{user.full_name || t('community.anonymous')}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Community;
