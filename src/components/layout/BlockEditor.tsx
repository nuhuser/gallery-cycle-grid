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

interface BlockEditorProps {
  block: ContentBlockData;
  projectImages?: string[];
  onSave: (block: ContentBlockData) => void;
  onCancel: () => void;
}

const VideoBlock: React.FC<{ url: string; poster?: string }> = ({ url, poster }) => {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const getYouTubeID = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname === '/watch') return u.searchParams.get('v') || '';
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
      }
      if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    } catch {}
    return '';
  };

  const youTubeID = isYouTube ? getYouTubeID(url) : '';

  return (
    <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-md">
      {isYouTube && youTubeID ? (
        <iframe
          width="100%"
          height="480"
          src={`https://www.youtube.com/embed/${youTubeID}?autoplay=1&loop=1&playlist=${youTubeID}&controls=0&modestbranding=1&showinfo=0&rel=0&mute=1&disablekb=1&iv_load_policy=3`}
          frameBorder="0"
          allow="autoplay; fullscreen"
          allowFullScreen
          className="w-full h-full object-cover rounded-xl"
        ></iframe>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Video URL not recognized. Only YouTube links are supported.
        </p>
      )}
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  projectImages = [],
  onSave,
  onCancel
}) => {
  const [editedBlock, setEditedBlock] = useState<ContentBlockData>(block);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  const handleFileUpload = async (file: File, fileType: 'image' | 'poster' = 'image') => {
    setUploading(true);
    try {
      // Upload image to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('project-media')
        .upload(fileName, file);

      if (error) throw error;

      const publicUrl = supabase.storage.from('project-media').getPublicUrl(data.path).publicUrl;

      if (fileType === 'poster') {
        setEditedBlock(prev => ({ ...prev, poster: publicUrl }));
      } else {
        setEditedBlock(prev => ({ ...prev, url: publicUrl }));
      }

      toast.success(`${fileType === 'poster' ? 'Poster' : 'Image'} uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => onSave(editedBlock);

  const getAvailableMedia = () => projectImages.map(url => ({ url, type: 'image' as const }));

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

      {block.type === 'image' && (
        <div className="space-y-4">
          <div>
            <Label>Select from Project Images</Label>
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
              {getAvailableMedia().map((media, index) => (
                <button
                  key={index}
                  onClick={() => setEditedBlock(prev => ({ ...prev, url: media.url }))}
                  className={`aspect-square rounded overflow-hidden border-2 ${
                    editedBlock.url === media.url ? 'border-primary' : 'border-border hover:border-border/60'
                  }`}
                >
                  <img src={media.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Or Upload New Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={uploading}
            />
          </div>

          <div>
            <Label>Or Enter URL</Label>
            <Input
              value={editedBlock.url || ''}
              onChange={(e) => setEditedBlock(prev => ({ ...prev, url: e.target.value }))}
              placeholder="Enter image URL..."
            />
          </div>

          <div>
            <Label>Caption (optional)</Label>
            <Textarea
              value={editedBlock.caption || ''}
              onChange={(e) => setEditedBlock(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Add a caption..."
              rows={2}
            />
          </div>

          <div>
            <Label>Alt Text</Label>
            <Input
              value={editedBlock.alt || ''}
              onChange={(e) => setEditedBlock(prev => ({ ...prev, alt: e.target.value }))}
              placeholder="Describe the image for accessibility..."
            />
          </div>
        </div>
      )}

      {block.type === 'video' && (
        <div className="space-y-4">
          <div>
            <Label>Video URL (YouTube)</Label>
            <Input
              type="url"
              placeholder="Paste a YouTube video link"
              value={editedBlock.url || ''}
              onChange={(e) => setEditedBlock(prev => ({ ...prev, url: e.target.value }))}
            />
            <VideoBlock url={editedBlock.url || ''} poster={editedBlock.poster} />
          </div>

          <div>
            <Label>Poster Image (Optional)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'poster')}
              disabled={uploading}
            />
            {editedBlock.poster && (
              <img src={editedBlock.poster} alt="Poster" className="mt-2 w-full max-h-32 object-cover rounded" />
            )}
          </div>

          <div>
            <Label>Caption (optional)</Label>
            <Textarea
              value={editedBlock.caption || ''}
              onChange={(e) => setEditedBlock(prev => ({ ...prev, caption: e.target.value }))}
              placeholder="Add a caption..."
              rows={2}
            />
          </div>
        </div>
      )}

      {block.type === 'photo-grid' && (
        <div className="space-y-4">
          <div>
            <Label>Grid Columns</Label>
            <Select
              value={editedBlock.gridColumns?.toString() || '3'}
              onValueChange={(value) => setEditedBlock(prev => ({ ...prev, gridColumns: parseInt(value) }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Columns</SelectItem>
                <SelectItem value="3">3 Columns</SelectItem>
                <SelectItem value="4">4 Columns</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                        setEditedBlock(prev => ({
                          ...prev,
                          images: currentImages.filter(img => img.url !== imageUrl)
                        }));
                      } else {
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
                        onClick={() => setEditedBlock(prev => ({
                          ...prev,
                          images: prev.images?.filter((_, i) => i !== index)
                        }))}
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
