
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MediaRenderer } from './MediaRenderer';
import { SpeakButton } from './SpeakButton';
import { MarkdownRenderer } from './MarkdownRenderer';
import { WebSearchDisplay } from './WebSearchDisplay';
import { TypewriterText } from './TypewriterText';
import { ThinkingAnimation } from './ThinkingAnimation';
import { User, Bot } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  imageUrl?: string;
  mediaFile?: File;
  media_url?: string;
  media_type?: string;
  type?: 'text_response' | 'image_generation';
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isTyping?: boolean;
  showTypewriter?: boolean;
  onTypewriterComplete?: () => void;
}

export function ChatMessage({ message, isTyping = false, showTypewriter = false, onTypewriterComplete }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (message.isTyping || isTyping) {
    return <ThinkingAnimation className="mb-6" />;
  }

  const renderMessageContent = () => {
    // Check if message contains web search results
    const hasWebSearch = message.content.includes('**Summary**:') || 
                        message.content.includes('**Search Results**:') || 
                        message.content.includes('**Wikipedia**:');

    let webSearchContent = '';
    let mainContent = message.content;

    if (hasWebSearch && message.role === 'assistant') {
      // Extract web search portion (everything with ** formatting)
      const searchPattern = /(\*\*(?:Summary|Search Results|Wikipedia|Source|Definition|Related Information|Quick Answer|Read more)\*\*:.*?)(?=\n\n(?!\*\*)|$)/gs;
      const searchMatches = message.content.match(searchPattern);
      
      if (searchMatches) {
        webSearchContent = searchMatches.join('\n\n');
        // Remove search content from main content
        mainContent = message.content.replace(searchPattern, '').trim();
        // Clean up any remaining markdown formatting at the start
        mainContent = mainContent.replace(/^\*\*.*?\*\*:\s*/s, '').trim();
      }
    }

    if (showTypewriter && message.role === 'assistant') {
      return <TypewriterText text={mainContent} onComplete={onTypewriterComplete} renderWithMarkdown={true} />;
    }

    return (
      <div className="space-y-3">
        <WebSearchDisplay searchResults={webSearchContent} isVisible={!!webSearchContent} />
        <div className="prose prose-sm prose-invert max-w-none break-words">
          <MarkdownRenderer content={mainContent} />
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full group mb-6`}>
      <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <Avatar className="w-8 h-8 flex-shrink-0 mt-1 bg-[#1f1f1f] border border-white/10">
          <AvatarFallback className="bg-transparent text-zinc-200">
            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={`min-w-0 flex-1 ${
          isUser 
            ? 'bg-[#2f2f2f] text-zinc-100 rounded-2xl px-4 py-3 ml-12 border border-white/10' 
            : 'bg-[#141414] text-zinc-100 rounded-2xl px-4 py-3 mr-12 border border-white/10'
        }`}>
          
          {/* Show uploaded media for user messages */}
          {message.media_url && message.role === 'user' && (
            <div className="mb-3">
              <MediaRenderer 
                url={message.media_url} 
                alt="Uploaded media" 
              />
            </div>
          )}
          
          {/* Show generated image for assistant messages */}
          {message.role === 'assistant' && message.type === 'image_generation' && (message.imageUrl || message.media_url) && (
            <div className="mb-3">
              <img 
                src={message.imageUrl || message.media_url} 
                alt="Generated image" 
                className="max-w-full h-auto rounded-xl shadow-lg border border-border"
                style={{ maxWidth: '100%', maxHeight: '300px' }}
              />
            </div>
          )}
          
          {renderMessageContent()}
          
          {!isUser && message.content && (
            <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <SpeakButton text={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
