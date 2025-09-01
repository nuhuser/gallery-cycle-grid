import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!isOpen || !images.length) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center bg-white",
      className
    )}>
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 z-20 hover:bg-gray-100 rounded-full w-10 h-10"
        onClick={onClose}
      >
        <X className="h-5 w-5 text-gray-600" />
      </Button>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 hover:bg-gray-100 rounded-full w-12 h-12"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 hover:bg-gray-100 rounded-full w-12 h-12"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6 text-gray-600" />
          </Button>
        </>
      )}

      {/* Main Content Area - Centered */}
      <div className="absolute inset-0 flex items-center justify-center p-16">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />
      </div>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};