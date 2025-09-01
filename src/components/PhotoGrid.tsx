import React, { useState } from 'react';
import { Lightbox } from '@/components/ui/lightbox';
import grid1 from '@/assets/grid-1.jpg';
import grid2 from '@/assets/grid-2.jpg';
import grid3 from '@/assets/grid-3.jpg';
import grid4 from '@/assets/grid-4.jpg';
import grid5 from '@/assets/grid-5.jpg';
import grid6 from '@/assets/grid-6.jpg';

const gridItems = [
  {
    src: grid1,
    title: 'Product Design',
    category: 'Industrial'
  },
  {
    src: grid2,
    title: 'Fashion Forward',
    category: 'Photography'
  },
  {
    src: grid3,
    title: 'Digital Patterns',
    category: 'Graphic Design'
  },
  {
    src: grid4,
    title: 'Typography Study',
    category: 'Branding'
  },
  {
    src: grid5,
    title: 'Gallery Space',
    category: 'Installation'
  },
  {
    src: grid6,
    title: 'Brand Identity',
    category: 'Packaging'
  }
];

export const PhotoGrid = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2">
        {gridItems.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer group overflow-hidden"
            onClick={() => handleImageClick(index)}
          >
            <img
              src={item.src}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Subtle hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
          </div>
        ))}
      </div>
      
      <Lightbox
        images={gridItems.map(item => item.src)}
        initialIndex={selectedImageIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};