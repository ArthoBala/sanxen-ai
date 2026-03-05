
import { useState, useEffect } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface MediaRendererProps {
  url: string;
  alt?: string;
  className?: string;
}

export function MediaRenderer({ url, alt = "Media content", className = "" }: MediaRendererProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Function to detect media type from URL
  const detectMediaType = (url: string): 'image' | 'video' | 'unknown' => {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i;
    
    if (imageExtensions.test(url)) return 'image';
    if (videoExtensions.test(url)) return 'video';
    if (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('vimeo.com') || url.includes('dailymotion.com')) {
      return 'video';
    }
    if (url.startsWith('blob:') || url.startsWith('data:image/')) return 'image';
    if (url.startsWith('data:video/')) return 'video';
    return 'image';
  };

  useEffect(() => {
    const detected = detectMediaType(url);
    setMediaType(detected);
    setIsLoading(false);
  }, [url]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    if (mediaType === 'image') {
      setMediaType('video');
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleVideoError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Border and glowing color by type
  const neonBorder =
    mediaType === 'image'
      ? 'border-4 border-cyan-400 shadow-[0_0_32px_4px_rgba(34,211,238,0.8)]'
      : 'border-4 border-purple-500 shadow-[0_0_32px_4px_rgba(168,85,247,0.8)]';

  // Animated ring and pulsing
  const animatedRing =
    mediaType === 'image'
      ? 'animate-neon border-cyan-400'
      : 'animate-neonPulse border-purple-500';

  if (hasError) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-pink-400 font-bold underline animate-bounce hover:scale-110 transition-transform duration-300"
      >
        Failed to load media. Click to open.
      </a>
    );
  }

  if (isLoading) {
    return (
      <div className={`max-w-md relative ${className}`}>
        <AspectRatio ratio={16 / 9} className="bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center">
          <div className="loading-shimmer w-full h-full absolute top-0 left-0 rounded-2xl z-10 animate-coolShimmer"></div>
          <div className="w-full h-full flex items-center justify-center bg-gray-900/80 rounded-2xl">
            <span className="text-cyan-400 font-semibold animate-pulse text-lg">Loading cool media...</span>
          </div>
        </AspectRatio>
      </div>
    );
  }

  return (
    <div
      className={`
        max-w-md mx-auto relative group transition-transform duration-500 cursor-pointer
        hover:scale-105 hover:shadow-2xl
        ${neonBorder} rounded-2xl
        ${animatedRing}
        ${className}
      `}
      style={{ animationIterationCount: 'infinite' }}
    >
      <span
        className={`
          pointer-events-none absolute inset-0 rounded-2xl z-20
          ${mediaType === 'image'
            ? 'animate-glow-blue'
            : 'animate-glow-purple'}
        `}
      />
      <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-2xl">
        {mediaType === 'image' ? (
          <img
            src={url}
            alt={alt}
            className="w-full h-full object-cover rounded-2xl z-10 transition-transform duration-500 group-hover:rotate-1 group-hover:scale-110"
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <video
            src={url}
            className="w-full h-full object-cover rounded-2xl z-10 transition-transform duration-500 group-hover:rotate-[-2deg] group-hover:scale-105"
            controls
            muted
            preload="metadata"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            loop
            autoPlay={false}
          />
        )}
      </AspectRatio>
      <span
        className="
          pointer-events-none absolute -inset-1 rounded-2xl border border-transparent
          bg-gradient-to-tr from-cyan-400 via-indigo-600 to-purple-500 opacity-70 blur-md
          group-hover:blur-lg group-hover:opacity-100 transition-all duration-500 z-0
        "
      />
    </div>
  );
}

/* Add custom keyframes and classes to /src/index.css:

@layer utilities {
  @keyframes neon {
    0%, 100% { box-shadow: 0 0 32px 4px #22d3ee, 0 0 64px 8px #818cf8; }
    50% { box-shadow: 0 0 48px 10px #38bdf8, 0 0 80px 16px #a5b4fc; }
  }
  @keyframes neonPulse {
    0%, 100% { box-shadow: 0 0 32px 6px #a855f7, 0 0 64px 12px #818cf8; }
    50% { box-shadow: 0 0 48px 14px #c084fc, 0 0 80px 24px #d8b4fe; }
  }
  @keyframes coolShimmer {
    0%, 100% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes glow-blue {
    0%, 100% { box-shadow: 0 0 24px 8px #67e8f9; }
    50% { box-shadow: 0 0 40px 12px #818cf8; }
  }
  @keyframes glow-purple {
    0%, 100% { box-shadow: 0 0 24px 8px #a78bfa; }
    50% { box-shadow: 0 0 40px 12px #a855f7; }
  }
  .animate-neon { animation: neon 2s linear infinite; }
  .animate-neonPulse { animation: neonPulse 2.2s linear infinite; }
  .animate-glow-blue { animation: glow-blue 2s ease-in-out infinite; }
  .animate-glow-purple { animation: glow-purple 2.2s ease-in-out infinite; }
  .animate-coolShimmer { animation: coolShimmer 1.5s infinite linear; background: linear-gradient(90deg, #18181b 0%, #9333ea 40%, #22d3ee 60%, #18181b 100%); background-size: 200% 100%;}
}
*/

