import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { ProjectList } from '@/components/admin/ProjectList';
import { toast } from 'sonner';
import { Plus, LogOut } from 'lucide-react';

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

const AdminDashboard = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin');
      return;
    }
    fetchProjects();
  }, [isAuthenticated, navigate]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const handleProjectSaved = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    fetchProjects();
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button 
              onClick={() => setShowProjectForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {showProjectForm ? (
          <ProjectForm
            project={editingProject}
            onSave={handleProjectSaved}
            onCancel={() => {
              setShowProjectForm(false);
              setEditingProject(null);
            }}
          />
        ) : (
          <ProjectList
            projects={projects}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;