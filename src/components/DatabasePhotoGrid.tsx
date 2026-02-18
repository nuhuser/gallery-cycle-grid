import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  date: string;
  cover_image: string;
  hover_image: string;
  category: string;
  images: string[];
  files: any;
  is_featured: boolean;
  slug: string;
  project_type: string;
}

interface DatabasePhotoGridProps {
  projectType?: 'project' | 'work';
}

export const DatabasePhotoGrid = ({ projectType = 'project' }: DatabasePhotoGridProps) => {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_type', projectType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [projectType]);

  const preloadProjectPage = (slug: string) => {
    // Preload the project page for instant navigation
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/project/${slug}`;
    document.head.appendChild(link);
  };


  if (projects.length === 0 && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No {projectType === 'work' ? 'work experience' : 'projects'} yet.</p>
      </div>
    );
  }


  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {projects.map((project, index) => (
        <Link
          key={project.id}
          to={`/project/${project.slug}`}
          className="photo-grid-item group cursor-pointer"
          style={{ animationDelay: `${index * 100}ms` }}
          onMouseEnter={() => {
            setHoveredProject(project.id);
            preloadProjectPage(project.slug);
          }}
          onMouseLeave={() => setHoveredProject(null)}
        >
          <img
            src={hoveredProject === project.id && project.hover_image 
              ? project.hover_image 
              : project.cover_image
            }
            alt={project.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="text-center text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h4 className="font-semibold text-sm mb-1">{project.title}</h4>
              <p className="text-xs text-white/80 mb-1">{project.category}</p>
              <p className="text-xs text-white/60">
                {typeof project.date === 'string' && project.date.match(/^\d{4}-\d{2}-\d{2}$/) 
                  ? new Date(project.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short'
                    })
                  : project.date
                }
              </p>
            </div>
          </div>
        </Link>
      ))}
      
      {/* Add Project Button - only visible to authenticated admins */}
      {isAuthenticated && (
        <div className="photo-grid-item group cursor-pointer border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors duration-300 flex items-center justify-center">
          <Link
            to="/admin/dashboard"
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Add Project</span>
          </Link>
        </div>
      )}
    </div>
  );
};