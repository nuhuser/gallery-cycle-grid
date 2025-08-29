import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Download, Eye } from 'lucide-react';
import { ModelViewer } from '@/components/ModelViewer';
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
}

const ProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setProject(data);
      if (data?.cover_image) {
        setSelectedImage(data.cover_image);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const is3DFile = (file: any) => {
    return file.name?.toLowerCase().includes('.stl') || 
           file.name?.toLowerCase().includes('.obj') ||
           file.type?.includes('stl') ||
           file.type?.includes('obj');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Link to="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to projects
          </Link>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="heading-large">{project.title}</h1>
              {project.category && (
                <Badge variant="secondary">{project.category}</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(project.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
            
            {project.description && (
              <p className="text-muted-foreground max-w-3xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Image */}
          <div className="lg:col-span-2">
            {selectedImage && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedImage}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Gallery */}
            {project.images && project.images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {project.cover_image && (
                    <button
                      onClick={() => setSelectedImage(project.cover_image)}
                      className={`aspect-square rounded overflow-hidden ${
                        selectedImage === project.cover_image ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={project.cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </button>
                  )}
                  {project.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`aspect-square rounded overflow-hidden ${
                        selectedImage === image ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {project.files && project.files.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Project Files</h3>
                <div className="space-y-2">
                  {project.files.map((file: any, index: number) => (
                    <div key={index} className="border border-border rounded p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{file.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {is3DFile(file) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedImage(file.url)}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {is3DFile(file) && selectedImage === file.url && (
                        <div className="mt-4">
                          <ModelViewer modelUrl={file.url} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;