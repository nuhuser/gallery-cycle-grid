import { HeroFrame } from '@/components/HeroFrame';
import { PhotoGrid } from '@/components/PhotoGrid';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Name and intro */}
          <div className="space-y-8 animate-slide-up">
            <div>
              <h1 className="heading-display">
                Nuh Ali
              </h1>
              <p className="text-lg text-muted-foreground mt-8 max-w-lg leading-relaxed">
                A curated collection of visual narratives, design explorations, and creative endeavors.
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">
                Currently Featured
              </div>
              <div className="space-y-3">
                <h3 className="heading-large">Selected Works 2024</h3>
                <p className="text-base text-muted-foreground">
                  Architecture • Digital Art • Interior Design
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Hero cycling frame */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <HeroFrame />
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section id="work" className="py-16">
        <div className="mb-12">
          <h2 className="heading-large mb-4">Recent Projects</h2>
          <p className="text-muted-foreground max-w-2xl">
            Exploring the intersection of form, function, and visual storytelling across multiple disciplines.
          </p>
        </div>
        
        <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <PhotoGrid />
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
    </div>
  );
};

export default Index;
