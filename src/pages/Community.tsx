import { useState, useEffect } from 'react';
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

interface GuideInfo {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { conversations, isLoading: convLoading } = useCommunity();
  
  const [activeTab, setActiveTab] = useState<ChatTab>('guide');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newChatUser, setNewChatUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [guideInfo, setGuideInfo] = useState<GuideInfo | null>(null);
  const [adminConversations, setAdminConversations] = useState<any[]>([]);

  // Fetch guide (first admin) for regular users
  useEffect(() => {
    const fetchGuide = async () => {
      if (isAdmin) return;
      
      // First get admin user_ids from user_roles
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1);
      
      if (!adminRoles || adminRoles.length === 0) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .eq('user_id', adminRoles[0].user_id)
        .single();
      
      if (profile) {
        setGuideInfo(profile as GuideInfo);
      }
    };
    
    fetchGuide();
  }, [isAdmin]);

  // For admins - fetch all user conversations
  useEffect(() => {
    const fetchAdminConversations = async () => {
      if (!isAdmin) return;

      // Get admin user_ids from user_roles table
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      const adminIds = new Set((adminRoles || []).map((a) => a.user_id));

      const { data: messages } = await supabase
        .from('private_messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
        .order('created_at', { ascending: false });

      const userConvs = new Map<string, { lastMessage: string; lastTime: string; unread: number }>();

      (messages || []).forEach((msg: any) => {
        const isAdminSender = adminIds.has(msg.sender_id);
        const isAdminReceiver = adminIds.has(msg.receiver_id);
        
        if (isAdminSender !== isAdminReceiver) {
          const nonAdminId = isAdminSender ? msg.receiver_id : msg.sender_id;
          if (!userConvs.has(nonAdminId)) {
            userConvs.set(nonAdminId, {
              lastMessage: msg.content,
              lastTime: msg.created_at,
              unread: 0
            });
          }
          const conv = userConvs.get(nonAdminId)!;
          if (!msg.is_read && !isAdminSender) {
            conv.unread++;
          }
        }
      });

      const userIds = Array.from(userConvs.keys());
      if (userIds.length === 0) {
        setAdminConversations([]);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const convList = userIds.map(uid => {
        const conv = userConvs.get(uid)!;
        const profile = profileMap.get(uid);
        return {
          id: uid,
          name: profile?.full_name || 'Anonymous User',
          avatar: profile?.avatar_url || null,
          lastMessage: conv.lastMessage,
          lastMessageTime: formatDistanceToNow(new Date(conv.lastTime), { addSuffix: true }),
          unreadCount: conv.unread,
          isOnline: true
        };
      });

      convList.sort((a, b) => b.unreadCount - a.unreadCount);
      setAdminConversations(convList);
    };

    fetchAdminConversations();
  }, [isAdmin]);

  // Build contact list based on tab
  const getContacts = () => {
    if (activeTab === 'guide') {
      if (isAdmin) {
        // Admin sees list of user conversations
        return adminConversations;
      } else if (guideInfo) {
        // User sees guide
        return [{
          id: guideInfo.user_id,
          name: 'Sacred Guide',
          avatar: guideInfo.avatar_url,
          lastMessage: 'Free support available 24/7',
          unreadCount: 0,
          isOnline: true,
          isBot: true
        }];
      }
      return [];
    }
    
    if (activeTab === 'messages') {
      return conversations.map(c => ({
        id: c.user_id,
        name: c.full_name || 'Anonymous',
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
        name: profile.full_name || 'Anonymous',
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
  if (tabContent) {
    return (
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar - always visible on desktop */}
        <div className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex h-full w-full md:w-auto z-20`}>
          <ChatSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            contacts={[]}
            activeContactId={null}
            onSelectContact={() => {}}
            isLoading={false}
          />
        </div>

        {/* Main Content */}
        <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full overflow-auto p-4 pb-24`}>
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

      {/* Main Chat Area */}
      <div className={`${!showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full z-10`}>
        {selectedContact ? (
          <ChatContainer
            partnerId={selectedContact.id}
            partnerName={selectedContact.name}
            partnerAvatar={selectedContact.avatar}
            isBot={selectedContact.isBot}
            isOnline={selectedContact.isOnline}
            onBack={handleBack}
            showBackOnDesktop={isAdmin && activeTab === 'guide'}
          />
        ) : (
          <EmptyState
            title={activeTab === 'guide' 
              ? (isAdmin ? 'Select a user conversation' : 'Chat with a Guide')
              : 'Select a conversation'
            }
            description={activeTab === 'guide' && !isAdmin
              ? 'Get free spiritual guidance and support 24/7'
              : 'Choose a contact from the list to start chatting'
            }
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
            {search.trim() ? t('community.noUsersFound') : 'No other users available yet'}
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
                <span className="font-medium text-foreground">{user.full_name || 'Anonymous'}</span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default Community;
