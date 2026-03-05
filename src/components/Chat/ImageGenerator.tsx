import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, X } from 'lucide-react';

interface ImageGeneratorProps {
  onGenerateImage: (prompt: string) => void;
  isGenerating: boolean;
}

export function ImageGenerator({ onGenerateImage, isGenerating }: ImageGeneratorProps) {
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const handleGenerateImage = () => {
    if (imagePrompt.trim()) {
      onGenerateImage(imagePrompt.trim());
      setImagePrompt('');
      setShowImageInput(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerateImage();
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {showImageInput ? (
        <div className="flex space-x-2">
          <Input
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the image you want to generate..."
            className="flex-1"
            disabled={isGenerating}
          />
          <Button
            onClick={handleGenerateImage}
            disabled={!imagePrompt.trim() || isGenerating}
            size="icon"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => {
              setShowImageInput(false);
              setImagePrompt('');
            }}
            variant="outline"
            size="icon"
            disabled={isGenerating}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setShowImageInput(true)}
          variant="outline"
          size="sm"
          className="self-start"
          disabled={isGenerating}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Image
        </Button>
      )}
    </div>
  );
}
