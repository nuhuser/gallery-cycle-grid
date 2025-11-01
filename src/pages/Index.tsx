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
      
      {/* Fullscreen Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Logo centered */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
          <h1 className="text-3xl md:text-4xl font-bold text-white mix-blend-difference">
            Nuh Ali
          </h1>
        </div>

        {/* Fullscreen Hero Frame */}
        <div className="absolute inset-0">
          <HeroFrame />
        </div>
      </section>

      {/* Main Content Container */}
      <div className="w-full">
        {/* Projects Grid Section */}
        <section id="projects" className="relative bg-background py-20">
          <div className="mb-16 px-8">
            <h2 className="heading-large mb-6 text-left">Projects</h2>
          </div>
        
        <div className="animate-slide-up px-8" style={{ animationDelay: '400ms' }}>
          <DatabasePhotoGrid />
        </div>
        </section>

        {/* Work Experience Section */}
        <section id="work" className="relative bg-background py-20 border-t border-border/50">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="heading-large mb-12 text-left">Work Experience</h2>
            <div className="space-y-8">
              <p className="text-muted-foreground">Work experience content coming soon.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer id="contact" className="max-w-7xl mx-auto px-8 py-12 border-t border-border/50">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold mb-4 text-sm">Get in Touch</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Available for collaborations and new projects.
            </p>
            <ul> 
            <li>
             <a 
              href="anewtakegear@gmail.com" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 font-bold text-sm"
            >
              anewtakegear@gmail.com
            </a>
             </li>
               <li>
             <a 
              href="https://www.instagram.com/nana0.687/" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 font-bold text-sm"
            >
              @nana.0687
            </a>
             </li>
                  <li>
             <a 
              href="www.linkedin.com/in/nuh-ali" 
              className="text-foreground hover:text-hero-accent transition-colors duration-300 font-bold text-sm"
            >
              LinkedIn
            </a>
             </li>
              </ul>
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
