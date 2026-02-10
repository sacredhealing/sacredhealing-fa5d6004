import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Radio, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatListItem from './ChatListItem';
import AdminGoLive from '../AdminGoLive';

export type ChatTab = 'guide' | 'channels' | 'feed' | 'circles' | 'messages';

interface ChatContact {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  isBot?: boolean;
}

interface ChatSidebarProps {
  activeTab: ChatTab;
  onTabChange: (tab: ChatTab) => void;
  contacts: ChatContact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onNewMessage?: () => void;
  isLoading?: boolean;
  /** When true, do not show the large welcome block when list is empty (content is in main area). */
  hideWelcomeBlock?: boolean;
}

const ChatSidebar = ({
  activeTab,
  onTabChange,
  contacts,
  activeContactId,
  onSelectContact,
  onNewMessage,
  isLoading = false,
  hideWelcomeBlock = false,
}: ChatSidebarProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [search, setSearch] = useState('');

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: ChatTab; label: string }[] = [
    { id: 'guide', label: 'Start here' },
    { id: 'channels', label: 'Spaces' },
    { id: 'feed', label: 'Reflections' },
    { id: 'circles', label: 'Groups' },
    { id: 'messages', label: 'Messages' },
  ];

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] border-r border-[hsl(var(--border))] w-full md:w-[350px] shrink-0">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-foreground">
            {t('community.title')}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/live-recordings')}
              className="text-xs bg-muted/50 hover:bg-muted px-2 py-1 h-auto"
            >
              <Radio className="h-3 w-3 mr-1.5 text-primary animate-pulse" />
              Live
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder={t('community.searchUsers', 'Search users...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50 border-border focus:border-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-2 py-2 border-b border-border text-sm text-muted-foreground font-medium overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          search ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-center">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 opacity-50" />
              </div>
              <p>No results found</p>
            </div>
          ) : hideWelcomeBlock ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Content is in the main area.
            </div>
          ) : (
            <div className="p-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white font-semibold">
                  Welcome — you can just listen here
                </div>
                <div className="mt-1 text-sm text-white/60">
                  Many people come here quietly at first.
                  You don’t need to post anything.
                  You can simply read, breathe, or share when ready.
                </div>
                <button
                  onClick={() => onTabChange('feed')}
                  className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:opacity-90 transition"
                >
                  Read today&apos;s reflections
                </button>
              </div>
            </div>
          )
        ) : (
          filteredContacts.map((contact) => (
            <ChatListItem
              key={contact.id}
              id={contact.id}
              name={contact.name}
              avatar={contact.avatar}
              lastMessage={contact.lastMessage}
              lastMessageTime={contact.lastMessageTime}
              unreadCount={contact.unreadCount}
              isOnline={contact.isOnline}
              isBot={contact.isBot}
              isActive={activeContactId === contact.id}
              onClick={() => onSelectContact(contact.id)}
            />
          ))
        )}
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="p-4 space-y-2">
        {isAdmin && <AdminGoLive />}
        {activeTab === 'messages' && onNewMessage && (
          <Button
            onClick={onNewMessage}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('community.newMessage', 'New Message')}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
