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

// VideoBlock now renders raw iframe code with responsive scaling and YouTube autoplay/loop/mute
const VideoBlock: React.FC<{ iframeCode: string }> = ({ iframeCode }) => {
  if (!iframeCode || iframeCode.trim() === '') {
    return <p className="text-center text-sm text-muted-foreground">Paste your iframe code above.</p>;
  }

  // Extract original width and height
  const widthMatch = iframeCode.match(/width="(\d+)"/);
  const heightMatch = iframeCode.match(/height="(\d+)"/);

  const width = widthMatch ? parseInt(widthMatch[1], 10) : 560;
  const height = heightMatch ? parseInt(heightMatch[1], 10) : 315;

  const aspectRatio = width / height;

  // Auto-modify YouTube iframe for loop/mute/autoplay
  const modifiedIframeCode = iframeCode.replace(
    /<iframe\s+([^>]*src="https:\/\/www\.youtube\.com\/embed\/([^"?]+)[^"]*")([^>]*)>/,
    (_match, pre, videoId, post) =>
      `<iframe ${pre}?autoplay=1&loop=1&mute=1&playlist=${videoId}" ${post}>`
  );

  return (
    <div
      className="relative w-full mx-auto overflow-hidden rounded-xl shadow-md"
      style={{ paddingTop: `${100 / aspectRatio}%`, position: 'relative' }}
    >
      <div
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        dangerouslySetInnerHTML={{ __html: modifiedIframeCode }}
      />
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  projectImages = [],
  onSave,
  onCancel,
}) => {
  const [editedBlock, setEditedBlock] = useState<ContentBlockData>(block);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setEditedBlock(block);
  }, [block]);

  const handleFileUpload = async (file: File, fileType: 'image' | 'poster' = 'image') => {
    setUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from('project-media')
        .upload(`${Date.now()}-${file.name}`, file);

      if (error) throw error;

      const url = supabase.storage.from('project-media').getPublicUrl(data.path).publicUrl;

      if (fileType === 'poster') {
        setEditedBlock(prev => ({ ...prev, poster: url }));
      } else {
        setEditedBlock(prev => ({ ...prev, url }));
      }

      toast.success(`${fileType === 'poster' ? 'Poster' : 'Image'} uploaded successfully`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => onSave(editedBlock);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit {block.type} Block</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>

      {/* Size & Alignment */}
      {(block.type === 'text' || block.type === 'image' || block.type === 'video' || block.type === 'photo-grid') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Size</Label>
            <Select
              value={editedBlock.size || 'medium'}
              onValueChange={value => setEditedBlock(prev => ({ ...prev, size: value as any }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
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
              onValueChange={value => setEditedBlock(prev => ({ ...prev, alignment: value as any }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Text Block */}
      {block.type === 'text' && (
        <div>
          <Label>Content</Label>
          <RichTextEditor
            value={editedBlock.content || ''}
            onChange={content => setEditedBlock(prev => ({ ...prev, content }))}
            placeholder="Enter your text content..."
          />
        </div>
      )}

      {/* Image Block */}
      {block.type === 'image' && (
        <div className="space-y-4">
          <Label>Select from Project Images</Label>
          <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
            {projectImages.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setEditedBlock(prev => ({ ...prev, url }))}
                className={`aspect-square rounded overflow-hidden border-2 ${
                  editedBlock.url === url ? 'border-primary' : 'border-border hover:border-border/60'
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <Label>Or Upload New Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            disabled={uploading}
          />

          <Label>Caption (optional)</Label>
          <Textarea
            value={editedBlock.caption || ''}
            onChange={e => setEditedBlock(prev => ({ ...prev, caption: e.target.value }))}
            rows={2}
          />

          <Label>Alt Text</Label>
          <Input
            value={editedBlock.alt || ''}
            onChange={e => setEditedBlock(prev => ({ ...prev, alt: e.target.value }))}
            placeholder="Describe the image for accessibility..."
          />
        </div>
      )}

      {/* Video Block (iframe embed) */}
      {block.type === 'video' && (
        <div className="space-y-4">
          <Label>Embed Video (Paste iframe code)</Label>
          <Textarea
            value={editedBlock.iframeCode || ''}
            onChange={e => setEditedBlock(prev => ({ ...prev, iframeCode: e.target.value }))}
            placeholder='Paste iframe embed code here, e.g. <iframe src="..."></iframe>'
            rows={6}
            className="w-full font-mono"
          />

          <VideoBlock iframeCode={editedBlock.iframeCode || ''} />

          <Label>Poster Image (Optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'poster')}
            disabled={uploading}
          />
          {editedBlock.poster && (
            <img src={editedBlock.poster} alt="Poster" className="mt-2 w-full max-h-32 object-cover rounded" />
          )}

          <Label>Caption (optional)</Label>
          <Textarea
            value={editedBlock.caption || ''}
            onChange={e => setEditedBlock(prev => ({ ...prev, caption: e.target.value }))}
            rows={2}
          />
        </div>
      )}

      {/* Photo Grid */}
      {block.type === 'photo-grid' && (
        <div className="space-y-4">
          <Label>Grid Columns</Label>
          <Select
            value={editedBlock.gridColumns?.toString() || '3'}
            onValueChange={value => setEditedBlock(prev => ({ ...prev, gridColumns: parseInt(value) }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>

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
                        images: currentImages.filter(img => img.url !== imageUrl),
                      }));
                    } else {
                      setEditedBlock(prev => ({
                        ...prev,
                        images: [...currentImages, { url: imageUrl, alt: '', caption: '' }],
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
      )}

      {/* Spacer */}
      {block.type === 'spacer' && (
        <div>
          <Label>Height (pixels)</Label>
          <Input
            type="number"
            value={editedBlock.content || '40'}
            onChange={e => setEditedBlock(prev => ({ ...prev, content: e.target.value }))}
            min="10"
            max="200"
          />
        </div>
      )}
    </div>
  );
};
