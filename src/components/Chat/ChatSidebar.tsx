import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Settings, LogOut, User, MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/integrations/api/client';
import { SettingsModal } from './SettingsModal';
import { NotificationDropdown } from './NotificationDropdown';
import { PromptGalleryModal } from './PromptGalleryModal';
import { ExamplesModal } from './ExamplesModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Chat {
  id: string;
  title: string;
  created_at: string;
}

interface ChatSidebarProps {
  currentChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatSidebar({ currentChatId, onChatSelect, onNewChat }: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showPromptGallery, setShowPromptGallery] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    if (!user) return;

    try {
      const data = await api.get(`/chats?userId=${encodeURIComponent(user.id)}`);
      setChats(data || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    // Force a refresh of the chat list to show any new chats
    loadChats();
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      await api.delete(`/messages?chatId=${encodeURIComponent(chatId)}`);
      await api.delete(`/chats/${chatId}`);
    } catch (error) {
      console.error('Error deleting chat:', error);
      return;
    }

    if (currentChatId === chatId) {
      onNewChat();
    }

    loadChats();
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;

    try {
      await api.patch(`/chats/${chatId}`, { title: newTitle.trim() });
    } catch (error) {
      console.error('Error renaming chat:', error);
      return;
    }

    setEditingChat(null);
    setNewChatTitle('');
    loadChats();
  };

  const openRenameDialog = (chat: Chat) => {
    setEditingChat(chat.id);
    setNewChatTitle(chat.title);
  };

  return (
    <>
      {/* Prompt Gallery Modal */}
      <PromptGalleryModal open={showPromptGallery} onClose={() => setShowPromptGallery(false)} />
      {/* Examples Modal */}
      <ExamplesModal open={showExamples} onClose={() => setShowExamples(false)} />

      <div className="w-full max-w-72 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <Button
            onClick={handleNewChat}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Library Section */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center justify-center rounded-lg bg-sidebar-accent w-8 h-8">
              <svg width="16" height="16" fill="none">
                <rect width="12" height="12" rx="4" fill="currentColor" x="2" y="2" opacity="0.8" />
              </svg>
            </span>
            <span className="text-sm font-medium text-sidebar-foreground">Library</span>
          </div>
          <ul className="flex flex-col gap-1">
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-left text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                onClick={() => setShowPromptGallery(true)}
              >
                <span className="w-2 h-2 rounded-full bg-sidebar-foreground/60" />
                <span>Prompt Gallery</span>
              </Button>
            </li>
            <li>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-left text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
                onClick={() => setShowExamples(true)}
              >
                <span className="w-2 h-2 rounded-full bg-sidebar-foreground/60" />
                <span>Explore Examples</span>
              </Button>
            </li>
          </ul>
        </div>
        <div className="px-4">
          <div className="h-px bg-sidebar-border"></div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1 px-4 pt-2 overflow-y-auto z-10">
          <div className="flex flex-col gap-2">
            {chats.map((chat) => (
              <div key={chat.id} className="relative group">
                <Button
                  onClick={() => onChatSelect(chat.id)}
                  variant={currentChatId === chat.id ? "secondary" : "ghost"}
                  className={`w-full py-3 pl-4 pr-12 rounded-lg justify-start text-left transition-all duration-200
                    ${currentChatId === chat.id
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }
                  `}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span className="truncate">{chat.title}</span>
                </Button>
                {/* Three-dot menu */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="w-48 bg-popover border-border text-popover-foreground"
                    >
                      <DropdownMenuItem
                        onClick={() => openRenameDialog(chat)}
                        className="text-foreground hover:bg-accent focus:bg-accent"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rename chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteChat(chat.id)}
                        className="text-destructive hover:bg-accent focus:bg-accent"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email}
              </p>
            </div>
            <NotificationDropdown />
          </div>
          <div className="space-y-1">
            <Button
              onClick={() => setShowSettings(true)}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Rename Chat Dialog */}
      <Dialog open={editingChat !== null} onOpenChange={() => setEditingChat(null)}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename Chat</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder="Enter new chat name"
              className="bg-input border-border text-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingChat) {
                  handleRenameChat(editingChat, newChatTitle);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingChat(null)}
              className="border-border text-muted-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={() => editingChat && handleRenameChat(editingChat, newChatTitle)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
