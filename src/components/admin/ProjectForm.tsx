import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload } from './FileUpload';
import { ImageDropZone } from './ImageDropZone';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { validateTitle, validateDescription, validateCategory, validateImageFile, sanitizeInput } from '@/utils/validation';
import { logAdminAction, AUDIT_ACTIONS } from '@/utils/auditLog';

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
  logo_url: string;
  logo_link: string;
}

interface ProjectFormProps {
  project?: Project | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    date: project?.date || new Date().toISOString().split('T')[0],
    category: project?.category || '',
    is_featured: project?.is_featured || false,
    logo_link: project?.logo_link || '',
  });
  const [coverImage, setCoverImage] = useState<string>(project?.cover_image || '');
  const [hoverImage, setHoverImage] = useState<string>(project?.hover_image || '');
  const [logoImage, setLogoImage] = useState<string>(project?.logo_url || '');
  const [images, setImages] = useState<string[]>(project?.images || []);
  const [files, setFiles] = useState<any[]>(project?.files || []);
  const [loading, setLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hoverInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    // Sanitize string inputs (except for description which may contain HTML)
    const sanitizedValue = typeof value === 'string' && field !== 'description' 
      ? sanitizeInput(value) 
      : value;
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
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

  const handleImageUpload = async (file: File, type: 'cover' | 'hover' | 'logo') => {
    // Validate file before upload
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setLoading(true);
      const url = await uploadFile(file, type === 'cover' ? 'covers' : type === 'hover' ? 'hovers' : 'logos');
      
      if (type === 'cover') {
        setCoverImage(url);
      } else if (type === 'hover') {
        setHoverImage(url);
      } else {
        setLogoImage(url);
      }
      
      // Log file upload for audit
      await logAdminAction(AUDIT_ACTIONS.FILE_UPLOAD, 'image', undefined, {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        upload_type: type,
      });
      
      toast.success(`${type === 'cover' ? 'Cover' : type === 'hover' ? 'Hover' : 'Logo'} image uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const titleError = validateTitle(formData.title);
    if (titleError) {
      toast.error(titleError);
      return;
    }

    const descriptionError = validateDescription(formData.description);
    if (descriptionError) {
      toast.error(descriptionError);
      return;
    }

    const categoryError = validateCategory(formData.category);
    if (categoryError) {
      toast.error(categoryError);
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create projects');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        ...formData,
        cover_image: coverImage,
        hover_image: hoverImage,
        logo_url: logoImage,
        images,
        files,
        user_id: user.id, // Use the authenticated user's ID
      };

      if (project) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);
        if (error) throw error;
        
        // Log update action
        await logAdminAction(AUDIT_ACTIONS.PROJECT_UPDATE, 'project', project.id, {
          title: formData.title,
          category: formData.category,
          is_featured: formData.is_featured,
        });
        
        toast.success('Project updated successfully');
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([projectData])
          .select('id')
          .single();
        if (error) throw error;
        
        // Log creation action
        await logAdminAction(AUDIT_ACTIONS.PROJECT_CREATE, 'project', data.id, {
          title: formData.title,
          category: formData.category,
          is_featured: formData.is_featured,
        });
        
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
          {/* Project Logo Section */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/10">
            <div className="text-center">
              <Label className="text-lg font-semibold">Project Logo</Label>
              <p className="text-sm text-muted-foreground mt-1">Upload a logo that will appear at the top of your project page</p>
            </div>
            
            <ImageDropZone
              label="Logo Image"
              value={logoImage}
              onChange={setLogoImage}
              onFileSelect={(file) => handleImageUpload(file, 'logo')}
              loading={loading}
            />
            
            <div className="space-y-2">
              <Label htmlFor="logo_link">Logo Link (Optional)</Label>
              <Input
                id="logo_link"
                value={formData.logo_link}
                onChange={(e) => handleInputChange('logo_link', e.target.value)}
                placeholder="https://example.com (optional hyperlink for the logo)"
                type="url"
              />
            </div>
          </div>

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
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Project description with rich formatting..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="text"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                placeholder="e.g., Winter 2023, March 2024, Q1 2024"
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

          {/* Cover Image Upload with Drag & Drop */}
          <ImageDropZone
            label="Cover Image"
            value={coverImage}
            onChange={setCoverImage}
            onFileSelect={(file) => handleImageUpload(file, 'cover')}
            loading={loading}
          />

          {/* Hover Image Upload with Drag & Drop */}
          <ImageDropZone
            label="Hover Image"
            value={hoverImage}
            onChange={setHoverImage}
            onFileSelect={(file) => handleImageUpload(file, 'hover')}
            loading={loading}
          />

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