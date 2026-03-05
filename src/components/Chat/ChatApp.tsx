
import { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatInterface } from './ChatInterface';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu, X, Plus } from 'lucide-react';

export function ChatApp() {
  const [currentChatId, setCurrentChatId] = useState<string | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  const handleNewChat = () => {
    setCurrentChatId(undefined);
    setRefreshKey(prev => prev + 1);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  
  const handleChatCreated = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-2 h-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 p-0"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <h1 className="text-base font-semibold truncate">Sanxen AI</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'relative flex-shrink-0'
        }
      `}>
        <ChatSidebar
          key={`sidebar-${refreshKey}`}
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <div className="md:hidden h-12 flex-shrink-0" />
        <div className="flex-1 min-h-0">
          <ChatInterface
            key={`chat-${refreshKey}`}
            chatId={currentChatId}
            onChatCreated={handleChatCreated}
          />
        </div>
      </div>
    </div>
  );
}
