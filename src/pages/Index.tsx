import { HeroFrame } from '@/components/HeroFrame';
import { DatabasePhotoGrid } from '@/components/DatabasePhotoGrid';
import { FeaturedPhotoGrid } from '@/components/FeaturedPhotoGrid';
import { Navigation } from '@/components/Navigation';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left side - Name and intro */}
          <div className="space-y-8 animate-slide-up">
            <div>
              <h1 className="heading-display">
                Nuh Ali
              </h1>
              <p className="text-xl text-muted-foreground mt-10 max-w-2xl leading-relaxed">
                A curated collection of visual narratives, design explorations, and creative endeavors.
              </p>
            </div>
          </div>

          {/* Right side - Hero cycling frame */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <HeroFrame />
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section id="work" className="py-20">
        <div className="mb-16">
          <h2 className="heading-large mb-6">Projects</h2>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Exploring the intersection of form, function, and visual storytelling across multiple disciplines.
          </p>
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <DatabasePhotoGrid />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold mb-4 text-sm">Get in Touch</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Available for collaborations and new projects.
            </p>
            <a 
              href="mailto:hello@example.com" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 font-bold text-sm"
            >
              hello@example.com
            </a>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              © 2024 Creative Portfolio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Admin Access Button */}
      <div className="fixed bottom-6 right-6">
        <Link to="/admin">
          <Button
            variant="secondary"
            size="icon"
            className="w-12 h-12 rounded-full shadow-elegant hover:shadow-frame transition-all duration-300"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
