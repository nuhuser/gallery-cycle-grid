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

// Embed iframe dynamically
function embedIframe(
  targetElementId: string,
  sourceUrl: string,
  width: string = '100%',
  height: string = '400px',
  title: string = 'Embedded Content'
) {
  const targetElement = document.getElementById(targetElementId);
  if (!targetElement) {
    console.error(`Target element with ID "${targetElementId}" not found.`);
    return;
  }

  // Remove previous iframe
  targetElement.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.src = sourceUrl;
  iframe.width = width;
  iframe.height = height;
  iframe.title = title;
  iframe.frameBorder = '0';
  iframe.allowFullscreen = true;
  iframe.allow = 'autoplay; encrypted-media; clipboard-write; picture-in-picture; web-share';

  targetElement.appendChild(iframe);
}

// VideoBlock renders iframe dynamically
const VideoBlock: React.FC<{ iframeSrc: string; width?: string; height?: string; title?: string }> = ({
  iframeSrc,
  width = '100%',
  height = '400px',
  title = 'Embedded Content',
}) => {
  const targetId = `video-block-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (iframeSrc) {
      embedIframe(targetId, iframeSrc, width, height, title);
    }
  }, [iframeSrc, width, height, title]);

  return <div id={targetId} className="w-full rounded-xl shadow-md overflow-hidden" />;
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

  const getAvailableMedia = () =>
    projectImages.map(url => ({ url, type: 'image' as const }));

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
      {(block.type === 'text' || block.type === 'image' || block.type === 'video') && (
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

      {/* Video Block */}
      {block.type === 'video' && (
        <div className="space-y-4">
          <Label>Embed Video (Paste iframe src URL)</Label>
          <Input
            value={editedBlock.iframeSrc || ''}
            onChange={e => setEditedBlock(prev => ({ ...prev, iframeSrc: e.target.value }))}
            placeholder="https://www.youtube.com/embed/VIDEO_ID"
          />

          {editedBlock.iframeSrc && (
            <VideoBlock
              iframeSrc={editedBlock.iframeSrc}
              width="100%"
              height="480px"
              title="Embedded Video"
            />
          )}

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
    </div>
  );
};
