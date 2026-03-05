import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { voiceService } from '@/services/voiceService';
import { toast } from '@/hooks/use-toast';

interface VoiceControlsProps {
  isVoiceModeEnabled: boolean;
  onToggleVoiceMode: () => void;
  onVoiceInput: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceControls({ 
  isVoiceModeEnabled, 
  onToggleVoiceMode, 
  onVoiceInput,
  disabled = false,
  className = "",
}: VoiceControlsProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');

  useEffect(() => {
    if (!isVoiceModeEnabled && isListening) {
      handleStopListening();
    }
  }, [isVoiceModeEnabled, isListening]);

  const handleToggleVoiceMode = () => {
    const support = voiceService.isSupported();
    
    if (!support.speechRecognition || !support.speechSynthesis) {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support voice features.',
        variant: 'destructive',
      });
      return;
    }

    if (isVoiceModeEnabled && isListening) {
      handleStopListening();
    }
    
    onToggleVoiceMode();
  };

  const handleStartListening = async () => {
    try {
      await voiceService.startListening(
        (text, isFinal) => {
          if (isFinal) {
            setInterimText('');
            if (text.trim()) {
              onVoiceInput(text.trim());
            }
            setIsListening(false);
          } else {
            setInterimText(text);
          }
        },
        (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          setInterimText('');
          toast({
            title: 'Voice input error',
            description: 'Could not process voice input. Please try again.',
            variant: 'destructive',
          });
        }
      );
      setIsListening(true);
    } catch (error) {
      console.error('Failed to start listening:', error);
      toast({
        title: 'Voice input failed',
        description: 'Could not start voice input. Please check microphone permissions.',
        variant: 'destructive',
      });
    }
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
    setInterimText('');
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Loop animation: apply animate-pulse, or a custom animation */}
      <Button
        variant={isVoiceModeEnabled ? "default" : "outline"}
        size="icon"
        onClick={handleToggleVoiceMode}
        disabled={disabled}
        className="transition-all duration-300 hover:scale-110 animate-[pulse_2s_infinite]"
        title={isVoiceModeEnabled ? "Disable voice mode" : "Enable voice mode"}
      >
        <Volume2 className="w-4 h-4" />
      </Button>

      {isVoiceModeEnabled && (
        <Button
          variant={isListening ? "destructive" : "secondary"}
          size="icon"
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={disabled}
          className="transition-all duration-300 hover:scale-110"
          title={isListening ? "Stop listening" : "Start speaking"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      )}

      {interimText && (
        <div className="text-sm text-gray-500 italic">
          Listening: {interimText}
        </div>
      )}
    </div>
  );
}
