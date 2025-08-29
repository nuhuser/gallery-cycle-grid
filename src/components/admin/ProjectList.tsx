import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Star } from 'lucide-react';

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
        <Card key={project.id} className="group">
          <CardHeader>
            {project.cover_image && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img
                  src={project.cover_image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
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
                  <Badge variant="secondary" className="mt-1">
                    {project.category}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {project.description}
            </p>
            <div className="text-xs text-muted-foreground mb-4">
              {new Date(project.date).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
              <span>{project.images?.length || 0} images</span>
              <span>•</span>
              <span>{project.files?.length || 0} files</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(project)}
                className="flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(project.id)}
                className="flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};