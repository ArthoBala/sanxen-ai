import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { VoiceControls } from './VoiceControls';
import { SettingsModal } from './SettingsModal';
import { TypewriterText } from './TypewriterText';
import { ThinkingAnimation } from './ThinkingAnimation';
import { api } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { voiceService } from '@/services/voiceService';

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
  showTypewriter?: boolean;
  showThinking?: boolean;
}

interface ChatInterfaceProps {
  chatId?: string;
  onChatCreated: (chatId: string) => void;
}

interface UsageResponse {
  success: boolean;
  current_count: number;
  daily_limit: number;
  plan: string;
  remaining: number;
  message?: string;
}

type UsageSuccessJson = {
  success: true;
  current_count: number;
  daily_limit: number;
  plan: string;
  remaining: number;
};
type UsageErrorJson = {
  success: false;
  message: string;
};
type UsageJson = UsageSuccessJson | UsageErrorJson;

function isPlainObject(value: any): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUsageSuccess(data: any): data is UsageSuccessJson {
  return (
    isPlainObject(data) &&
    data.success === true &&
    typeof data.current_count === "number" &&
    typeof data.daily_limit === "number" &&
    typeof data.plan === "string" &&
    typeof data.remaining === "number"
  );
}

function isUsageError(data: any): data is UsageErrorJson {
  return (
    isPlainObject(data) &&
    data.success === false &&
    typeof data.message === "string"
  );
}

export function ChatInterface({ chatId, onChatCreated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false);
  const [inputAnimating, setInputAnimating] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const { user } = useAuth();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isNewChat = !chatId && messages.length === 0;

  useEffect(() => {
    if (chatId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const detectLanguage = (text: string): string => {
    if (!text || !text.trim()) {
      return 'English';
    }

    const arabicPattern = /[\u0600-\u06FF]/;
    const chinesePattern = /[\u4e00-\u9fff]/;
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanPattern = /[\uac00-\ud7af]/;
    const russianPattern = /[\u0400-\u04FF]/;
    const hindiPattern = /[\u0900-\u097F]/;
    const thaiPattern = /[\u0E00-\u0E7F]/;
    const hebrewPattern = /[\u0590-\u05FF]/;
    const greekPattern = /[\u0370-\u03FF]/;
    
    if (arabicPattern.test(text)) return 'Arabic';
    if (chinesePattern.test(text)) return 'Chinese';
    if (japanesePattern.test(text)) return 'Japanese';
    if (koreanPattern.test(text)) return 'Korean';
    if (russianPattern.test(text)) return 'Russian';
    if (hindiPattern.test(text)) return 'Hindi';
    if (thaiPattern.test(text)) return 'Thai';
    if (hebrewPattern.test(text)) return 'Hebrew';
    if (greekPattern.test(text)) return 'Greek';

    const spanishPattern = /\b(el|la|los|de|en|un|para|por|que|es|está|pero|como|muy|todo|bien)\b/i;
    if (spanishPattern.test(text)) return 'Spanish';

    const frenchPattern = /\b(le|la|les|de|un|une|pour|avec|par|que|est|sont|mais|comme|muito|tout|bien)\b/i;
    if (frenchPattern.test(text)) return 'French';

    const germanPattern = /\b(der|die|das|und|ist|ein|eine|zu|mit|auf|dass|nicht|wie|auch|nur|schon)\b/i;
    if (germanPattern.test(text)) return 'German';

    const italianPattern = /\b(il|la|le|un|una|di|che|è|sono|ma|come|molti|tutto|ben)\b/i;
    if (italianPattern.test(text)) return 'Italian';

    const portuguesePattern = /\b(o|a|os|as|de|em|um|uma|para|por|que|é|está|mas|como|muito|bem)\b/i;
    if (portuguesePattern.test(text)) return 'Portuguese';

    return 'English';
  };

  const loadMessages = async () => {
    if (!chatId) return;
    
    setIsLoading(true);
    try {
      console.log('Loading messages for chat:', chatId);
      const data = await api.get(`/messages?chatId=${encodeURIComponent(chatId)}`);
      const mappedMessages = data?.map((msg: any) => ({
        ...msg,
        imageUrl: (msg.type === 'image_generation' && msg.media_url) ? msg.media_url : undefined
      })) as Message[] || [];
      setMessages(mappedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const checkUsage = async (feature: string = 'chat'): Promise<UsageResponse> => {
    try {
      const data = await api.post('/usage/get', {
        userId: user?.id,
        featureType: feature
      });
      if (data && typeof data === 'object' && data !== null && 'success' in data && data.success) {
        const usageData = data as any;
        return {
          success: true,
          current_count: usageData.current_count || 0,
          daily_limit: usageData.daily_limit || 0,
          plan: usageData.plan || 'free',
          remaining: usageData.remaining || 0
        };
      } else {
        return {
          success: false,
          current_count: 0,
          daily_limit: 0,
          plan: 'free',
          remaining: 0,
          message: 'Unable to check usage limits'
        };
      }
    } catch (error) {
      console.error('Usage check error:', error);
      return {
        success: false,
        current_count: 0,
        daily_limit: 0,
        plan: 'free',
        remaining: 0,
        message: 'Unable to check usage limits'
      };
    }
  };

  const saveAssistantMessage = async (assistantMessage: Message, currentChatId: string) => {
    try {
      await api.post('/messages', {
        chat_id: currentChatId,
        role: assistantMessage.role,
        content: assistantMessage.content,
        created_at: assistantMessage.created_at,
        type: assistantMessage.type,
        media_url: assistantMessage.imageUrl
      });
    } catch (error) {
      console.error("Error saving assistant message:", error);
    }
  };

  const processTextMessage = async (userMessage: Message, currentChatId: string, options?: { enableReasoning?: boolean; enableSearch?: boolean }) => {
    let typingId: string | null = null;
    try {
      console.log('Processing text message...');
      setIsGenerating(true);
      setShowThinking(true);

      const usage = await checkUsage('text_generation');
      if (!usage.success || usage.remaining <= 0) {
        toast({
          title: "Usage Limit Reached",
          description: usage.message || "You have reached your daily limit. Please upgrade your plan.",
          variant: "destructive",
        });
        return;
      }

      typingId = `typing-${Date.now()}`;
      const typingMessage: Message = {
        id: typingId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        isTyping: true,
      };
      addMessage(typingMessage);
      setTypingMessageId(typingId);

      const existingMessages = await api.get(`/messages?chatId=${encodeURIComponent(currentChatId)}`);

      console.log('Conversation history:', existingMessages);

      const conversationHistory = existingMessages?.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      const detectedLanguage = detectLanguage(userMessage.content);

      console.log('Calling edge function with:', {
        message: userMessage.content,
        conversationHistory: conversationHistory.length,
        detectedLanguage
      });

      const data = await api.post('/ai/chat', {
        message: userMessage.content,
        conversationHistory,
        detectedLanguage,
        enableReasoning: options?.enableReasoning || false,
        enableSearch: options?.enableSearch || false
      }, { timeoutMs: 20000 });

      console.log('AI response received:', data);

      // Clear thinking and typing immediately when response arrives
      setShowThinking(false);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== typingId));
      setTypingMessageId(null);

      const responseText = typeof data?.response === 'string' && data.response.trim()
        ? data.response
        : "I'm having trouble generating a response right now.";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
        created_at: new Date().toISOString(),
        type: data.type || 'text_response',
        showTypewriter: true,
      };

      addMessage(assistantMessage);
      await saveAssistantMessage(assistantMessage, currentChatId);

      // Clear typewriter after completion and update message
      const handleTypewriterComplete = () => {
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, showTypewriter: false }
              : msg
          )
        );
      };

      // Set a timeout as fallback in case onComplete doesn't fire
      setTimeout(handleTypewriterComplete, Math.min(responseText.length * 25, 4000));

    } catch (error) {
      console.error("Error processing text message:", error);
      toast({
        title: "Send Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== typingId));
      setTypingMessageId(null);
    } finally {
      setIsGenerating(false);
      setShowThinking(false);
    }
  };

  const saveUserMessage = async (userMessage: Message, currentChatId: string, mediaFile: File | null = null) => {
    try {
      let media_url = null;
      let media_type = null;

      if (mediaFile) {
        console.log('Media upload not implemented, skipping');
      }

      console.log('Saving user message to database...');
      await api.post('/messages', {
        chat_id: currentChatId,
        role: userMessage.role,
        content: userMessage.content,
        created_at: userMessage.created_at,
        media_url,
        media_type,
      });
      console.log('User message saved successfully');
      
      return { media_url, media_type };
    } catch (error) {
      console.error("Error saving user message to database:", error);
      throw error;
    }
  };

  const handleSendMessage = async (content: string, mediaFile: File | null = null, options?: { enableReasoning?: boolean; enableSearch?: boolean }) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to send messages.",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim() && !mediaFile) {
      toast({
        title: "Empty message",
        description: "Please enter a message or select a media file to send.",
        variant: "destructive",
      });
      return;
    }

    console.log('handleSendMessage called with:', { content, mediaFile, chatId });

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
      created_at: new Date().toISOString(),
      mediaFile: mediaFile,
    };

    addMessage(userMessage);

    let currentChatId = chatId;
    
    try {
      if (!currentChatId) {
        console.log('Creating new chat...');
        const newChat = await api.post('/chats', {
          userId: user.id,
          title: content.substring(0, 50) + (content.length > 50 ? '...' : '') || 'New Chat',
        });
        currentChatId = newChat.id;
        console.log('New chat created with ID:', currentChatId);
        onChatCreated(currentChatId);
      }

      console.log('Saving user message...');
      const mediaData = await saveUserMessage(userMessage, currentChatId, mediaFile);

      if (mediaData.media_url && mediaData.media_type) {
        console.log('Processing media with URL:', mediaData.media_url);
        // For now, just process as text message since media analysis needs more work
        await processTextMessage(userMessage, currentChatId, options);
      } else {
        await processTextMessage(userMessage, currentChatId, options);
      }

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    // Image generation logic here
  };

  const handleVoiceInput = (text: string) => {
    handleSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0b0c] text-zinc-100 overflow-hidden">
      {showSettings && (
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
      
      {isNewChat ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full min-h-screen">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="text-center mb-12 space-y-6">
              <h1 className="text-5xl sm:text-6xl font-normal text-foreground animate-fadeIn">
                What can I help with?
              </h1>
            </div>

            <div className="w-full max-w-3xl animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <ChatInput
                onSendMessage={handleSendMessage}
                onGenerateImage={handleGenerateImage}
                disabled={isLoading || isGenerating}
                isGenerating={isGenerating}
                isNewChat={isNewChat}
                isVoiceModeEnabled={isVoiceModeEnabled}
                onToggleVoiceMode={() => setIsVoiceModeEnabled(!isVoiceModeEnabled)}
                onVoiceInput={handleVoiceInput}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto py-6 space-y-6">
              {isLoading && messages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isTyping={message.isTyping || false}
                    showTypewriter={message.showTypewriter}
                    onTypewriterComplete={() => {
                      if (message.showTypewriter) {
                        setMessages(prevMessages => 
                          prevMessages.map(msg => 
                            msg.id === message.id 
                              ? { ...msg, showTypewriter: false }
                              : msg
                          )
                        );
                      }
                    }}
                  />
                ))
              )}
              
              {showThinking && !typingMessageId && (
                <ThinkingAnimation />
              )}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background border-t border-border">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                onSendMessage={handleSendMessage}
                onGenerateImage={handleGenerateImage}
                disabled={isLoading || isGenerating}
                isGenerating={isGenerating}
                isNewChat={false}
                isVoiceModeEnabled={isVoiceModeEnabled}
                onToggleVoiceMode={() => setIsVoiceModeEnabled(!isVoiceModeEnabled)}
                onVoiceInput={handleVoiceInput}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
