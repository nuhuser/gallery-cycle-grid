import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from './FileUpload';
import { ImageDropZone } from './ImageDropZone';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { validateTitle, validateDescription, validateCategory, validateImageFile, sanitizeInputForSubmit, formatCategory } from '@/utils/validation';
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
  files: any[];
  is_featured: boolean;
  slug: string;
  logo_url: string;
  logo_link: string;
  project_type: string;
}

interface CompanyOption {
  name: string;
  logo_url: string;
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
    company: project?.company || '',
    is_featured: project?.is_featured || false,
    logo_link: project?.logo_link || '',
    project_type: project?.project_type || 'project',
  });
  const [coverImage, setCoverImage] = useState<string>(project?.cover_image || '');
  const [hoverImage, setHoverImage] = useState<string>(project?.hover_image || '');
  const [logoImage, setLogoImage] = useState<string>(project?.logo_url || '');
  const [images, setImages] = useState<string[]>(project?.images || []);
  const [files, setFiles] = useState<any[]>(project?.files || []);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hoverInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('company, logo_url')
        .not('company', 'is', null)
        .not('company', 'eq', '')
        .not('logo_url', 'is', null)
        .not('logo_url', 'eq', '');
      
      if (!error && data) {
        // Get unique companies with their logos
        const uniqueCompanies = data.reduce((acc: CompanyOption[], item) => {
          const existing = acc.find(c => c.name === item.company);
          if (!existing) {
            acc.push({ name: item.company, logo_url: item.logo_url });
          }
          return acc;
        }, []);
        setCompanies(uniqueCompanies);
      }
    };

    fetchCompanies();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    // Store the value directly without sanitization during typing
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If company is selected from dropdown, auto-populate logo
    if (field === 'company' && typeof value === 'string') {
      const selectedCompany = companies.find(c => c.name === value);
      if (selectedCompany && selectedCompany.logo_url) {
        setLogoImage(selectedCompany.logo_url);
      }
    }
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
        title: sanitizeInputForSubmit(formData.title),
        description: formData.description, // Don't sanitize rich text description
        date: sanitizeInputForSubmit(formData.date),
        category: formatCategory(sanitizeInputForSubmit(formData.category)),
        company: formData.company ? sanitizeInputForSubmit(formData.company) : null,
        logo_link: formData.logo_link ? sanitizeInputForSubmit(formData.logo_link) : '',
        is_featured: formData.is_featured,
        project_type: formData.project_type,
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="space-y-2">
                <Select value={formData.company} onValueChange={(value) => handleInputChange('company', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing company or type new" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.name} value={company.name}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Or type new company name"
                />
              </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="project_type">Display In</Label>
              <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Projects Section</SelectItem>
                  <SelectItem value="work">Work Experience Section</SelectItem>
                </SelectContent>
              </Select>
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