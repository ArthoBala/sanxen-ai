
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus } from 'lucide-react';
import { MediaUpload } from './MediaUpload';
import { ImageGenerator } from './ImageGenerator';
import { VoiceControls } from './VoiceControls';
import { AdvancedControls } from './AdvancedControls';

interface ChatInputProps {
  onSendMessage: (message: string, media?: File, options?: { enableReasoning?: boolean; enableSearch?: boolean }) => void;
  onGenerateImage: (prompt: string) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  isNewChat?: boolean;
  isVoiceModeEnabled?: boolean;
  onToggleVoiceMode?: () => void;
  onVoiceInput?: (text: string) => void;
}

export function ChatInput({ 
  onSendMessage, 
  onGenerateImage, 
  disabled, 
  isGenerating, 
  isNewChat = false,
  isVoiceModeEnabled,
  onToggleVoiceMode,
  onVoiceInput
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [enableReasoning, setEnableReasoning] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);

  // Handle paste events for media
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));
    
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        setSelectedMedia(file);
        setShowMediaUpload(true);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || selectedMedia) && !disabled) {
      onSendMessage(message.trim(), selectedMedia || undefined, {
        enableReasoning,
        enableSearch
      });
      setMessage('');
      setSelectedMedia(null);
      setShowMediaUpload(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMediaSelect = (file: File) => {
    setSelectedMedia(file);
    setShowMediaUpload(false);
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handlePlusClick = () => {
    setShowMediaUpload(!showMediaUpload);
    setShowImageGenerator(false);
  };

  const handleToolsClick = () => {
    setShowImageGenerator(!showImageGenerator);
    setShowMediaUpload(false);
  };

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      {/* Media Upload Popup */}
      {showMediaUpload && (
        <div className="animate-fadeIn">
          <MediaUpload
            onMediaSelect={handleMediaSelect}
            onRemoveMedia={handleRemoveMedia}
            selectedMedia={selectedMedia}
          />
        </div>
      )}

      {/* Image Generator Popup */}
      {showImageGenerator && (
        <div className="animate-fadeIn">
          <ImageGenerator onGenerateImage={onGenerateImage} isGenerating={isGenerating || false} />
        </div>
      )}

      {/* Advanced Controls */}
      <AdvancedControls
        enableReasoning={enableReasoning}
        enableSearch={enableSearch}
        onReasoningToggle={setEnableReasoning}
        onSearchToggle={setEnableSearch}
      />

      {/* Media Preview when selected */}
      {selectedMedia && (
        <div className="animate-fadeIn">
          <MediaUpload
            onMediaSelect={handleMediaSelect}
            onRemoveMedia={handleRemoveMedia}
            selectedMedia={selectedMedia}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-end gap-3 p-4 bg-[#1f1f1f] rounded-2xl border border-white/10 shadow-lg">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handlePlusClick}
            className="h-8 w-8 flex-shrink-0 rounded-full hover:bg-white/10"
          >
            <Plus className="w-4 h-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isNewChat ? "Ask anything..." : "Message Sanxen AI..."}
              className="min-h-[24px] max-h-[120px] resize-none bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base placeholder:text-zinc-500"
              disabled={disabled}
              rows={1}
            />
          </div>

          {/* Voice Controls */}
          {isVoiceModeEnabled !== undefined && onToggleVoiceMode && onVoiceInput && (
            <VoiceControls
              isVoiceModeEnabled={isVoiceModeEnabled}
              onToggleVoiceMode={onToggleVoiceMode}
              onVoiceInput={onVoiceInput}
              disabled={disabled}
              className="flex-shrink-0"
            />
          )}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleToolsClick}
            className="hidden sm:flex flex-shrink-0 text-sm px-3 py-1.5 rounded-full hover:bg-white/10"
          >
            Tools
          </Button>

          <Button
            type="submit"
            size="icon"
            disabled={(!message.trim() && !selectedMedia) || disabled}
            className="h-8 w-8 flex-shrink-0 rounded-full bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-zinc-500"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
