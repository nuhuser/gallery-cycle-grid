import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  name?: string;
  poster?: string;
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
  const [showLargeViewer, setShowLargeViewer] = useState(false);

  const currentItem = items[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  if (!items.length) return null;

  return (
    <div className={cn("relative group", className)}>
      {/* Large Viewer */}
      <div 
        className="relative bg-muted mb-4 cursor-pointer flex items-center justify-center"
        style={{ 
          aspectRatio: aspectRatio,
          minHeight: '300px',
          maxHeight: '70vh'
        }}
        onClick={() => setShowLargeViewer(true)}
      >
        {currentItem.type === 'video' ? (
          <video
            src={currentItem.url}
            poster={currentItem.poster}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="max-w-full max-h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={currentItem.url}
            alt={currentItem.name || `Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain hover:opacity-90 transition-opacity"
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

      {/* Lightbox */}
      {showLargeViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowLargeViewer(false)}
          />
          <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 z-20 bg-background/80 hover:bg-background/90"
              onClick={() => setShowLargeViewer(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {items.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background/90"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-background/80 hover:bg-background/90"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {currentItem.type === 'video' ? (
              <video
                src={currentItem.url}
                poster={currentItem.poster}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="max-w-[90vw] max-h-[60vh] object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={currentItem.url}
                alt={currentItem.name || `Image ${currentIndex + 1}`}
                className="max-w-[90vw] max-h-[60vh] object-contain"
              />
            )}
            
            {items.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 text-foreground px-3 py-1 rounded text-sm">
                {currentIndex + 1} / {items.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail Navigation */}
      {showControls && items.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
              }}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all duration-300 ease-out",
                index === currentIndex
                  ? "border-primary scale-110"
                  : "border-transparent hover:border-border hover:scale-105"
              )}
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  poster={item.poster}
                  className="w-full h-full object-cover"
                  muted
                />
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