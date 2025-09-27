import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { ContentBlockData } from './ContentBlock';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { extractVideoUrl } from '@/utils/videoUtils';

interface BlockEditorProps {
  block: ContentBlockData;
  projectImages?: string[];
  projectFiles?: any[];
  onSave: (block: ContentBlockData) => void;
  onCancel: () => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  projectImages = [],
  projectFiles = [],
  onSave,
  onCancel
}) => {
  const [editedBlock, setEditedBlock] = useState<ContentBlockData>(block);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `layouts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      setEditedBlock(prev => ({
        ...prev,
        url: data.publicUrl
      }));

      toast.success(`${type === 'image' ? 'Image' : 'Video'} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    onSave(editedBlock);
  };

  const getAvailableMedia = () => {
    const images = projectImages.map(url => ({ url, type: 'image' }));
    const videos = projectFiles
      .filter(file => file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i))
      .map(file => ({ url: file.url, type: 'video', name: file.name }));
    return [...images, ...videos];
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit {block.type} Block</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>

      {/* Size and Alignment Controls */}
      {(block.type === 'text' || block.type === 'image' || block.type === 'video' || block.type === 'photo-grid') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Size</Label>
            <Select
              value={editedBlock.size || 'medium'}
              onValueChange={(value) => setEditedBlock(prev => ({ ...prev, size: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="full">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Alignment</Label>
            <Select
              value={editedBlock.alignment || 'center'}
              onValueChange={(value) => setEditedBlock(prev => ({ ...prev, alignment: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Type-specific editors */}
      {block.type === 'text' && (
        <div>
          <Label>Content</Label>
          <RichTextEditor
            value={editedBlock.content || ''}
            onChange={(content) => setEditedBlock(prev => ({ ...prev, content }))}
            placeholder="Enter your text content..."
          />
        </div>
      )}

      {(block.type === 'image' || block.type === 'video') && (
        <div className="space-y-4">
          {/* Media Selection */}
          <div>
            <Label>Select from Project Media</Label>
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
              {getAvailableMedia().map((media, index) => (
                <button
                  key={index}
                  onClick={() => setEditedBlock(prev => ({ ...prev, url: media.url }))}
                  className={`aspect-square rounded overflow-hidden border-2 ${
                    editedBlock.url === media.url ? 'border-primary' : 'border-border hover:border-border/60'
                  }`}
                >
                  {media.type === 'image' ? (
                    <img src={media.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label>Or Upload New {block.type}</Label>
            <Input
              type="file"
              accept={block.type === 'image' ? 'image/*' : 'video/*'}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file, block.type as 'image' | 'video');
                }
              }}
              disabled={uploading}
            />
          </div>

          {/* URL Input */}
          <div>
            <Label>Or Enter URL{block.type === 'video' ? ' (supports Google Drive, Google Photos, YouTube, Vimeo)' : ''}</Label>
            <Input
              value={editedBlock.url || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (block.type === 'video') {
                  const processedUrl = extractVideoUrl(inputValue);
                  setEditedBlock(prev => ({ ...prev, url: processedUrl || inputValue }));
                } else {
                  setEditedBlock(prev => ({ ...prev, url: inputValue }));
                }
              }}
              placeholder={
                block.type === 'video' 
                  ? 'Paste Google Drive/Photos link, YouTube, Vimeo, or direct video URL...'
                  : `Enter ${block.type} URL...`
              }
            />
            {block.type === 'video' && editedBlock.url?.includes('photos.google.com') && (
              <p className="text-xs text-muted-foreground mt-1">
                Note: Google Photos links may require public sharing to work properly.
              </p>
            )}
          </div>

          {/* Caption */}
          <div>
            <Label>Caption (optional)</Label>
            <Textarea
              value={editedBlock.caption || ''}
              onChange={(e) => setEditedBlock(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Add a caption..."
              rows={2}
            />
          </div>

          {/* Alt text for images */}
          {block.type === 'image' && (
            <div>
              <Label>Alt Text</Label>
              <Input
                value={editedBlock.alt || ''}
                onChange={(e) => setEditedBlock(prev => ({ ...prev, alt: e.target.value }))}
                placeholder="Describe the image for accessibility..."
              />
            </div>
          )}
        </div>
      )}

      {block.type === 'photo-grid' && (
        <div className="space-y-4">
          {/* Grid Columns (for photo-grid) */}
          {block.type === 'photo-grid' && (
            <div>
              <Label>Grid Columns</Label>
              <Select
                value={editedBlock.gridColumns?.toString() || '3'}
                onValueChange={(value) => setEditedBlock(prev => ({ ...prev, gridColumns: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Images Selection */}
          <div>
            <Label>Select Images from Project</Label>
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
              {projectImages.map((imageUrl, index) => {
                const isSelected = editedBlock.images?.some(img => img.url === imageUrl);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      const currentImages = editedBlock.images || [];
                      if (isSelected) {
                        // Remove image
                        setEditedBlock(prev => ({
                          ...prev,
                          images: currentImages.filter(img => img.url !== imageUrl)
                        }));
                      } else {
                        // Add image
                        setEditedBlock(prev => ({
                          ...prev,
                          images: [...currentImages, { url: imageUrl, alt: '', caption: '' }]
                        }));
                      }
                    }}
                    className={`aspect-square rounded overflow-hidden border-2 ${
                      isSelected ? 'border-primary' : 'border-border hover:border-border/60'
                    }`}
                  >
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit selected images */}
          {editedBlock.images && editedBlock.images.length > 0 && (
            <div>
              <Label>Edit Image Details</Label>
              <div className="space-y-3 mt-2 max-h-64 overflow-y-auto">
                {editedBlock.images.map((img, index) => (
                  <div key={index} className="border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={img.url} alt="" className="w-12 h-12 object-cover rounded" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditedBlock(prev => ({
                            ...prev,
                            images: prev.images?.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Alt text"
                      value={img.alt || ''}
                      onChange={(e) => {
                        const newImages = [...(editedBlock.images || [])];
                        newImages[index] = { ...newImages[index], alt: e.target.value };
                        setEditedBlock(prev => ({ ...prev, images: newImages }));
                      }}
                    />
                    <Input
                      placeholder="Caption"
                      value={img.caption || ''}
                      onChange={(e) => {
                        const newImages = [...(editedBlock.images || [])];
                        newImages[index] = { ...newImages[index], caption: e.target.value };
                        setEditedBlock(prev => ({ ...prev, images: newImages }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {block.type === 'spacer' && (
        <div>
          <Label>Height (pixels)</Label>
          <Input
            type="number"
            value={editedBlock.content || '40'}
            onChange={(e) => setEditedBlock(prev => ({ ...prev, content: e.target.value }))}
            min="10"
            max="200"
          />
        </div>
      )}
    </div>
  );
};