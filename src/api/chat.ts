
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { chatId, message, media_url, media_type, userId } = req.body;

    if (!message && !media_url) {
      return res.status(400).json({ error: 'Message or media is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Detect language from message
    const detectLanguage = (text: string): string => {
      const arabicPattern = /[\u0600-\u06FF]/;
      const chinesePattern = /[\u4e00-\u9fff]/;
      const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
      const koreanPattern = /[\uac00-\ud7af]/;
      const russianPattern = /[\u0400-\u04FF]/;
      const hindiPattern = /[\u0900-\u097F]/;
      
      if (arabicPattern.test(text)) return 'Arabic';
      if (chinesePattern.test(text)) return 'Chinese';
      if (japanesePattern.test(text)) return 'Japanese';
      if (koreanPattern.test(text)) return 'Korean';
      if (russianPattern.test(text)) return 'Russian';
      if (hindiPattern.test(text)) return 'Hindi';
      
      // European language detection
      const spanishPattern = /\b(el|la|los|de|en|un|para|por|que|es|está|pero|como|muy|todo|bien)\b/i;
      if (spanishPattern.test(text)) return 'Spanish';
      
      const frenchPattern = /\b(le|la|les|de|un|une|pour|avec|par|que|est|sont|mais|comme|très|tout|bien)\b/i;
      if (frenchPattern.test(text)) return 'French';
      
      const germanPattern = /\b(der|die|das|und|ist|ein|eine|zu|mit|auf|dass|nicht|wie|auch|nur|schon)\b/i;
      if (germanPattern.test(text)) return 'German';
      
      return 'English';
    };

    const detectedLanguage = detectLanguage(message || '');

    // Create or get chat
    let currentChatId = chatId;
    if (!currentChatId) {
      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat:', chatError);
        return res.status(500).json({ error: 'Failed to create chat' });
      }

      currentChatId = newChat.id;
    }

    // Get conversation history
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true });

    const conversationHistory = existingMessages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('chat-ai', {
      body: {
        message,
        media: media_url ? await fetch(media_url).then(r => r.arrayBuffer()).then(buffer => Buffer.from(buffer).toString('base64')) : null,
        mediaType: media_type,
        conversationHistory,
        detectedLanguage
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      return res.status(500).json({ error: 'Failed to get AI response' });
    }

    // Create assistant message
    const assistantMessage = {
      id: crypto.randomUUID(),
      chat_id: currentChatId,
      role: 'assistant',
      content: data.response,
      created_at: new Date().toISOString(),
      type: data.type || 'text_response',
      media_url: data.imageUrl || null,
      media_type: data.imageUrl ? 'image/png' : null,
    };

    return res.status(200).json({
      message: assistantMessage,
      chatId: currentChatId
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
