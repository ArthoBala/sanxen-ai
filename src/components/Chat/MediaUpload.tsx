
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image, Video, X } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface MediaUploadProps {
  onMediaSelect: (file: File) => void;
  onRemoveMedia: () => void;
  selectedMedia: File | null;
}

export function MediaUpload({ onMediaSelect, onRemoveMedia, selectedMedia }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Create preview URL when media is selected
  useEffect(() => {
    if (selectedMedia) {
      const url = URL.createObjectURL(selectedMedia);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedMedia]);

  // Handle paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) {
          onMediaSelect(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onMediaSelect]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onMediaSelect(file);
      } else {
        alert('Please select an image or video file');
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = () => {
    onRemoveMedia();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const mediaFile = files.find(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (mediaFile) {
      onMediaSelect(mediaFile);
    }
  };

  return (
    <div 
      className={`flex flex-col space-y-2 ${isDragOver ? 'opacity-50' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {selectedMedia && previewUrl ? (
        <div className="relative bg-gray-100 rounded-lg p-2 max-w-md animate-fadeIn">
          <div className="relative w-full">
            {selectedMedia.type.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="rounded-md object-contain w-full max-h-64"
                style={{ aspectRatio: 'auto' }}
              />
            ) : (
              <video
                src={previewUrl}
                className="rounded-md object-contain w-full max-h-64"
                controls
                muted
                preload="metadata"
                style={{ aspectRatio: 'auto' }}
              />
            )}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              {selectedMedia.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-blue-500" />
              ) : (
                <Video className="w-4 h-4 text-purple-500" />
              )}
              <span className="text-sm text-gray-700 max-w-40 truncate">
                {selectedMedia.name}
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleRemoveMedia}
              className="h-6 w-6 hover:bg-red-100 hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={triggerFileInput}
            className={`h-10 px-3 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-500/10' : ''
            }`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
          <span className="text-xs text-gray-500">Images & Videos • Copy/Paste or Drag & Drop</span>
        </div>
      )}
    </div>
  );
}
