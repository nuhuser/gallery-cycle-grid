import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ResumeCategory {
  id: string;
  name: string;
  resume_url: string;
}

const ResumePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch resume categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['resume-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resume_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ResumeCategory[];
    },
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, file }: { name: string; file: File }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(`resumes/${fileName}`, file);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(`resumes/${fileName}`);
      
      // Insert category
      const { data, error } = await supabase
        .from('resume_categories')
        .insert({
          name,
          resume_url: urlData.publicUrl,
          user_id: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-categories'] });
      setNewCategoryName('');
      setNewResumeFile(null);
      setIsDialogOpen(false);
      toast.success('Resume category added');
    },
    onError: (error) => {
      toast.error('Failed to add category: ' + error.message);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resume_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-categories'] });
      setSelectedCategory(null);
      toast.success('Category deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !newResumeFile) {
      toast.error('Please provide a category name and resume file');
      return;
    }
    
    setIsUploading(true);
    await addCategoryMutation.mutateAsync({ name: newCategoryName, file: newResumeFile });
    setIsUploading(false);
  };

  const selectedResume = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="flex min-h-[calc(100vh-64px)] pt-16">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-muted/30 p-6 flex flex-col">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portfolio</span>
          </Link>
          
          <h2 className="font-bold text-lg mb-4">Resume Categories</h2>
          
          <nav className="flex-1 space-y-2">
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">No categories yet</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              ))
            )}
          </nav>
          
          {/* Add Category Button (Admin only) */}
          {user && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-4 w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Resume Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Software Engineering"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resume-file">Resume PDF</Label>
                    <Input
                      id="resume-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewResumeFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button 
                    onClick={handleAddCategory} 
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading...' : 'Add Category'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-8">
          {selectedResume ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{selectedResume.name} Resume</h1>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href={selectedResume.resume_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                  {user && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteCategoryMutation.mutate(selectedResume.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              
              {/* PDF Viewer */}
              <div className="flex-1 bg-muted rounded-lg overflow-hidden">
                <iframe
                  src={selectedResume.resume_url}
                  className="w-full h-full min-h-[600px]"
                  title={`${selectedResume.name} Resume`}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a resume category to view</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResumePage;
