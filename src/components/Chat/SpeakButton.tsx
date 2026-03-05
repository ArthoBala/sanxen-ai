
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { voiceService } from '@/services/voiceService';
import { toast } from '@/hooks/use-toast';

interface SpeakButtonProps {
  text: string;
  disabled?: boolean;
}

export function SpeakButton({ text, disabled = false }: SpeakButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    // Clean text for speech but preserve readability of special characters
    const cleanText = text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Convert **bold** to plain text
      .replace(/\*(.*?)\*/g, '$1') // Convert *italic* to plain text
      .replace(/`(.*?)`/g, '$1') // Convert `code` to plain text
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\|/g, ' ') // Replace pipes with spaces for table readability
      .replace(/[-]{3,}/g, '') // Remove markdown horizontal rules
      .replace(/[_]{3,}/g, '') // Remove markdown horizontal rules with underscores
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (!cleanText) {
      toast({
        title: 'Nothing to speak',
        description: 'This message has no text content to speak.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSpeaking(true);
      await voiceService.speak(cleanText);
      setIsSpeaking(false);
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
      toast({
        title: 'Speech failed',
        description: 'Could not speak the message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const support = voiceService.isSupported();
  
  if (!support.speechSynthesis) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSpeak}
      disabled={disabled}
      className="h-6 w-6 p-0 opacity-50 hover:opacity-100 transition-all duration-300"
      title={isSpeaking ? "Stop speaking" : "Speak this message"}
    >
      {isSpeaking ? (
        <VolumeX className="w-3 h-3" />
      ) : (
        <Volume2 className="w-3 h-3" />
      )}
    </Button>
  );
}
