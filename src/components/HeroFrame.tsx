import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';

interface Project {
  id: string;
  title: string;
  category: string;
  cover_image: string;
  hover_image?: string;
  slug: string;
}

const fallbackImages = [
  {
    src: hero1,
    title: 'Architectural Studies',
    category: 'Photography'
  },
  {
    src: hero2,
    title: 'Abstract Compositions',
    category: 'Digital Art'
  },
  {
    src: hero3,
    title: 'Interior Spaces',
    category: 'Design'
  }
];

export const HeroFrame = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [heroImages, setHeroImages] = useState(fallbackImages);

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, category, cover_image, hover_image, slug')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      if (data && data.length > 0) {
        const projectImages = data.map(project => ({
          src: project.hover_image || project.cover_image,
          title: project.title,
          category: project.category || 'Portfolio'
        }));
        setHeroImages(projectImages);
        setFeaturedProjects(data);
      }
    } catch (error) {
      console.error('Error fetching featured projects:', error);
      // Keep fallback images if fetch fails
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  const currentImage = heroImages[currentIndex];

  return (
    <div className="w-full h-full relative group">
      <div className="w-full h-full relative">
        <img
          src={currentImage.src}
          alt={currentImage.title}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
        />
        
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
        
        <div className="absolute bottom-8 left-8 transform transition-transform duration-500">
          <h3 className="text-white text-3xl md:text-4xl font-semibold mb-2 drop-shadow-lg">
            {currentImage.title}
          </h3>
          <p className="text-white/90 text-lg font-medium drop-shadow-lg">
            {currentImage.category}
          </p>
        </div>

        {/* Cycling indicators */}
        <div className="absolute bottom-8 right-8 flex space-x-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white scale-125'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};