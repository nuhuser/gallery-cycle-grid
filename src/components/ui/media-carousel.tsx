import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  name?: string;
}

interface MediaCarouselProps {
  items: MediaItem[];
  className?: string;
  aspectRatio?: string;
  showControls?: boolean;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  items,
  className,
  aspectRatio = "16/9",
  showControls = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = items[currentIndex];
  const isVideo = currentItem?.type === 'video';

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
    setIsPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => setIsPlaying(false);

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentIndex]);

  if (!items.length) return null;

  return (
    <div className={cn("relative group", className)}>
      {/* Main Media Display */}
      <div 
        className="relative overflow-hidden rounded-lg bg-muted"
        style={{ aspectRatio }}
      >
        {isVideo ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
              onClick={togglePlayPause}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="bg-background/80 hover:bg-background/90"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <img
            src={currentItem.url}
            alt={currentItem.name || `Media ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Navigation Arrows */}
        {showControls && items.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Media Counter */}
        {items.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-background/80 text-foreground px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {showControls && items.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsPlaying(false);
              }}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-primary"
                  : "border-transparent hover:border-border"
              )}
            >
              {item.type === 'video' ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                    <Play className="h-3 w-3 text-white" />
                  </div>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};