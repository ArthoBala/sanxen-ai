
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
 
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Image as ImageIcon, Palette } from "lucide-react";

interface PromptGalleryModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserImage {
  id: string;
  media_url: string;
  content: string;
  created_at: string;
  type: string;
}

export function PromptGalleryModal({ open, onClose }: PromptGalleryModalProps) {
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      loadUserImages();
    }
  }, [open, user]);

  const loadUserImages = async () => {
    setLoading(true);
    setUserImages([]);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-lg text-white border border-purple-500/30 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-6 border-b border-purple-400/20">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
            <Palette className="w-6 h-6 text-pink-400" />
            Your Image Gallery
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-2">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              <span className="ml-3 text-purple-200">Loading your images...</span>
            </div>
          ) : userImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ImageIcon className="w-16 h-16 text-purple-400 mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-purple-200 mb-2">No Images Yet</h3>
              <p className="text-purple-300 max-w-md">
                Start uploading images or generating them with AI to see them appear in your gallery!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              {userImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative bg-gradient-to-br from-purple-800/40 to-pink-800/40 backdrop-blur-sm rounded-3xl overflow-hidden border border-purple-400/20 hover:border-pink-400/40 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
                >
                  <div className="aspect-square overflow-hidden rounded-3xl">
                    <img
                      src={image.media_url}
                      alt={image.content || "User image"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 rounded-3xl"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      {image.type === 'image_generation' ? (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded-full text-xs font-medium">
                          <Palette className="w-3 h-3" />
                          AI Generated
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 px-2 py-1 rounded-full text-xs font-medium">
                          <ImageIcon className="w-3 h-3" />
                          Uploaded
                        </div>
                      )}
                    </div>
                    
                    {image.content && (
                      <p className="text-white text-sm line-clamp-2 mb-2 bg-black/40 backdrop-blur-sm rounded-2xl p-2">
                        {image.content}
                      </p>
                    )}
                    
                    <p className="text-purple-200 text-xs">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
