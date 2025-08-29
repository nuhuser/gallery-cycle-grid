import { useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, FileText, Box } from 'lucide-react';

interface FileUploadProps {
  images: string[];
  files: any[];
  onImagesChange: (images: string[]) => void;
  onFilesChange: (files: any[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  images,
  files,
  onImagesChange,
  onFilesChange
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('project-files')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    try {
      const uploadPromises = Array.from(selectedFiles).map(file => 
        uploadFile(file, 'images')
      );
      
      const uploadedUrls = await Promise.all(uploadPromises);
      onImagesChange([...images, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        const url = await uploadFile(file, 'documents');
        return {
          name: file.name,
          url,
          type: file.type,
          size: file.size
        };
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      onFilesChange([...files, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileIcon = (file: any) => {
    if (file.type?.includes('pdf')) return <FileText className="w-8 h-8" />;
    if (file.name?.toLowerCase().includes('.stl') || file.name?.toLowerCase().includes('.obj')) {
      return <Box className="w-8 h-8" />;
    }
    return <FileText className="w-8 h-8" />;
  };

  return (
    <div className="space-y-6">
      {/* Image Gallery Upload */}
      <div className="space-y-4">
        <Label>Project Images</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Images
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Project image ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <Label>Additional Files (PDF, STL, OBJ, etc.)</Label>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.stl,.obj,.doc,.docx,.txt"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded">
                <div className="flex items-center gap-3">
                  {getFileIcon(file)}
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};