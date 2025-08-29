import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Star, Eye, Layout } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  date: string;
  cover_image: string;
  hover_image: string;
  category: string;
  images: string[];
  files: any[];
  is_featured: boolean;
  slug: string;
}

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onEdit, onDelete }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No projects yet</h3>
        <p className="text-muted-foreground">Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="group relative">
          <CardHeader className="pb-4">
            {project.cover_image && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                <img
                  src={project.cover_image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Action buttons overlay */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => window.open(`/project/${project.slug}`, '_blank')}
                    className="h-8 w-8 bg-background/80 hover:bg-background/90"
                    title="View Project"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => window.open(`/project/${project.slug}/edit-layout`, '_blank')}
                    className="h-8 w-8 bg-background/80 hover:bg-background/90"
                    title="Edit Layout"
                  >
                    <Layout className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onEdit(project)}
                    className="h-8 w-8 bg-background/80 hover:bg-background/90"
                    title="Edit Project"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(project.id)}
                    className="h-8 w-8 bg-destructive/80 hover:bg-destructive/90"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {project.title}
                  {project.is_featured && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </CardTitle>
                {project.category && (
                  <Badge variant="secondary" className="mt-2">
                    {project.category}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {project.description}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{new Date(project.date).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <span>{project.images?.length || 0} images</span>
                <span>•</span>
                <span>{project.files?.length || 0} files</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};