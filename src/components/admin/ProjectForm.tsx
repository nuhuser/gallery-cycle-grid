import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from './FileUpload';
import { toast } from 'sonner';
import { X, Upload } from 'lucide-react';

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

interface ProjectFormProps {
  project?: Project | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    date: project?.date || new Date().toISOString().split('T')[0],
    category: project?.category || '',
    is_featured: project?.is_featured || false,
  });
  const [coverImage, setCoverImage] = useState<string>(project?.cover_image || '');
  const [hoverImage, setHoverImage] = useState<string>(project?.hover_image || '');
  const [images, setImages] = useState<string[]>(project?.images || []);
  const [files, setFiles] = useState<any[]>(project?.files || []);
  const [loading, setLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hoverInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('project-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'hover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const url = await uploadFile(file, type === 'cover' ? 'covers' : 'hovers');
      
      if (type === 'cover') {
        setCoverImage(url);
      } else {
        setHoverImage(url);
      }
      
      toast.success(`${type === 'cover' ? 'Cover' : 'Hover'} image uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        cover_image: coverImage,
        hover_image: hoverImage,
        images,
        files,
        user_id: '00000000-0000-0000-0000-000000000000', // Placeholder for public projects
      };

      if (project) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);
        if (error) throw error;
        toast.success('Project updated successfully');
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([projectData]);
        if (error) throw error;
        toast.success('Project created successfully');
      }

      onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project ? 'Edit Project' : 'Create New Project'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Project title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                placeholder="e.g., Architecture, Digital Art"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Project description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
              />
              <Label htmlFor="featured">Featured Project</Label>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => coverInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Cover
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'cover')}
                className="hidden"
              />
              {coverImage && (
                <div className="flex items-center gap-2">
                  <img src={coverImage} alt="Cover" className="w-16 h-16 object-cover rounded" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverImage('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Hover Image Upload */}
          <div className="space-y-2">
            <Label>Hover Image</Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => hoverInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Hover Image
              </Button>
              <input
                ref={hoverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'hover')}
                className="hidden"
              />
              {hoverImage && (
                <div className="flex items-center gap-2">
                  <img src={hoverImage} alt="Hover" className="w-16 h-16 object-cover rounded" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHoverImage('')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* File Upload Component */}
          <FileUpload
            images={images}
            files={files}
            onImagesChange={setImages}
            onFilesChange={setFiles}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Project'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};