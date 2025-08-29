import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, FileText, Box, CloudUpload, Image as ImageIcon } from 'lucide-react';
import { validateImageFile } from '@/utils/validation';
import { logAdminAction, AUDIT_ACTIONS } from '@/utils/auditLog';

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'images' | 'files' | null>(null);

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

  const validateFiles = (files: FileList, type: 'images' | 'files'): File[] => {
    const validFiles: File[] = [];
    // No file count or size limits for drag and drop

    Array.from(files).forEach((file) => {
      if (type === 'images') {
        const validationError = validateImageFile(file);
        if (validationError) {
          toast.error(`${file.name}: ${validationError}`);
          return;
        }
      } else {
        // Validate other file types - now including video
        const allowedTypes = [
          'application/pdf', 'text/plain', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'
        ];
        
        const allowedExtensions = ['.stl', '.obj', '.3ds', '.fbx', '.dae', '.mp4', '.webm', '.mov', '.avi'];
        const hasAllowedExtension = allowedExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (!allowedTypes.includes(file.type) && !hasAllowedExtension) {
          toast.error(`${file.name}: File type not supported`);
          return;
        }
      }
      validFiles.push(file);
    });

    return validFiles;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const validFiles = validateFiles(selectedFiles, 'images');
    if (validFiles.length === 0) return;

    try {
      const uploadPromises = validFiles.map(file => uploadFile(file, 'images'));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      onImagesChange([...images, ...uploadedUrls]);
      
      // Log file uploads
      await logAdminAction(AUDIT_ACTIONS.FILE_UPLOAD, 'images', undefined, {
        file_count: uploadedUrls.length,
        file_names: validFiles.map(f => f.name),
      });
      
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const validFiles = validateFiles(selectedFiles, 'files');
    if (validFiles.length === 0) return;

    try {
      const uploadPromises = validFiles.map(async (file) => {
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
      
      // Log file uploads
      await logAdminAction(AUDIT_ACTIONS.FILE_UPLOAD, 'documents', undefined, {
        file_count: uploadedFiles.length,
        file_names: validFiles.map(f => f.name),
      });
      
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  // Drag and Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent, type: 'images' | 'files') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
      setDragType(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, type: 'images' | 'files') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragType(null);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const validFiles = validateFiles(droppedFiles, type);
    if (validFiles.length === 0) return;

    try {
      if (type === 'images') {
        const uploadPromises = validFiles.map(file => uploadFile(file, 'images'));
        const uploadedUrls = await Promise.all(uploadPromises);
        onImagesChange([...images, ...uploadedUrls]);
        
        await logAdminAction(AUDIT_ACTIONS.FILE_UPLOAD, 'images', undefined, {
          file_count: uploadedUrls.length,
          file_names: validFiles.map(f => f.name),
          upload_method: 'drag_drop',
        });
        
        toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
      } else {
        const uploadPromises = validFiles.map(async (file) => {
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
        
        await logAdminAction(AUDIT_ACTIONS.FILE_UPLOAD, 'documents', undefined, {
          file_count: uploadedFiles.length,
          file_names: validFiles.map(f => f.name),
          upload_method: 'drag_drop',
        });
        
        toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    }
  }, [images, files, onImagesChange, onFilesChange]);

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
      {/* Image Gallery Upload with Drag & Drop */}
      <div className="space-y-4">
        <Label>Project Images</Label>
        
        {/* Drag & Drop Zone for Images */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging && dragType === 'images' 
              ? 'border-primary bg-primary/5 scale-102' 
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }
          `}
          onDragEnter={(e) => handleDragEnter(e, 'images')}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'images')}
          onClick={() => imageInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            {isDragging && dragType === 'images' ? (
              <CloudUpload className="w-12 h-12 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {isDragging && dragType === 'images' 
                  ? 'Drop images here' 
                  : 'Upload Project Images'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPEG, PNG, WebP, GIF (max 10MB each)
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                imageInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4" />
              Browse Images
            </Button>
          </div>
          
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
                  className="w-full h-24 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Upload with Drag & Drop */}
      <div className="space-y-4">
        <Label>Additional Files (PDF, STL, OBJ, etc.)</Label>
        
        {/* Drag & Drop Zone for Files */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragging && dragType === 'files' 
              ? 'border-primary bg-primary/5 scale-102' 
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }
          `}
          onDragEnter={(e) => handleDragEnter(e, 'files')}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'files')}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            {isDragging && dragType === 'files' ? (
              <CloudUpload className="w-12 h-12 text-primary animate-bounce" />
            ) : (
              <FileText className="w-12 h-12 text-muted-foreground" />
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {isDragging && dragType === 'files' 
                  ? 'Drop files here' 
                  : 'Upload Additional Files'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: PDF, DOC, STL, OBJ, TXT, MP4, WEBM, MOV, AVI
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4" />
              Browse Files
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.stl,.obj,.doc,.docx,.txt,.3ds,.fbx,.dae,.mp4,.webm,.mov,.avi"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
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
                  className="text-muted-foreground hover:text-destructive"
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