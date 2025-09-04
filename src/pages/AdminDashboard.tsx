import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { ProjectList } from '@/components/admin/ProjectList';
import { toast } from 'sonner';
import { Plus, LogOut, Home, ArrowLeft } from 'lucide-react';
import { logAdminAction, AUDIT_ACTIONS } from '@/utils/auditLog';

interface Project {
  id: string;
  title: string;
  description: string;
  date: string;
  cover_image: string;
  hover_image: string;
  category: string;
  company: string;
  images: string[];
  files: any;
  is_featured: boolean;
  slug: string;
  logo_url: string;
  logo_link: string;
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
    
    // Log admin dashboard access
    logAdminAction(AUDIT_ACTIONS.ADMIN_ACCESS, 'dashboard');
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
    // Log logout action before actually logging out
    await logAdminAction(AUDIT_ACTIONS.USER_LOGOUT, 'user');
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
      const projectToDelete = projects.find(p => p.id === projectId);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      // Log deletion action
      await logAdminAction(AUDIT_ACTIONS.PROJECT_DELETE, 'project', projectId, {
        title: projectToDelete?.title,
        category: projectToDelete?.category,
      });
      
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
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              View Site
            </Button>
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
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowProjectForm(false);
                setEditingProject(null);
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Projects
            </Button>
            <ProjectForm
              project={editingProject}
              onSave={handleProjectSaved}
              onCancel={() => {
                setShowProjectForm(false);
                setEditingProject(null);
              }}
            />
          </div>
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