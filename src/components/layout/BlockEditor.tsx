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
import { X, GripVertical, Plus, Trash2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const SortablePhotoGridItem: React.FC<{
  image: { url: string; alt: string; caption: string };
  index: number;
  onUpdate: (index: number, field: 'alt' | 'caption', value: string) => void;
  onRemove: (index: number) => void;
}> = ({ image, index, onUpdate, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: index.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 p-3 border rounded-lg bg-card"
    >
      <div className="flex-shrink-0 flex items-center">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex-shrink-0">
        <img src={image.url} alt={image.alt || ''} className="w-20 h-20 object-cover rounded" />
      </div>
      <div className="flex-1 space-y-2">
        <Input
          placeholder="Alt text"
          value={image.alt}
          onChange={(e) => onUpdate(index, 'alt', e.target.value)}
        />
        <Input
          placeholder="Caption (optional)"
          value={image.caption}
          onChange={(e) => onUpdate(index, 'caption', e.target.value)}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        className="flex-shrink-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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

      const { data: urlData } = supabase.storage.from('project-media').getPublicUrl(data.path);
      const url = urlData.publicUrl;

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

  // Photo grid specific handlers
  const handleAddPhotoGridImage = async (file: File) => {
    setUploading(true);
    try {
      const { data, error } = await supabase.storage
        .from('project-images')
        .upload(`${Date.now()}-${file.name}`, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(data.path);
      const url = urlData.publicUrl;

      const currentImages = editedBlock.images || [];
      setEditedBlock(prev => ({ 
        ...prev, 
        images: [...currentImages, { url, alt: '', caption: '' }]
      }));

      toast.success('Image added to photo grid');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectProjectImage = (imageUrl: string) => {
    const currentImages = editedBlock.images || [];
    setEditedBlock(prev => ({ 
      ...prev, 
      images: [...currentImages, { url: imageUrl, alt: '', caption: '' }]
    }));
    toast.success('Image added to photo grid');
  };

  const handleRemovePhotoGridImage = (index: number) => {
    const currentImages = editedBlock.images || [];
    setEditedBlock(prev => ({ 
      ...prev, 
      images: currentImages.filter((_, i) => i !== index)
    }));
  };

  const handleUpdatePhotoGridImage = (index: number, field: 'alt' | 'caption', value: string) => {
    const currentImages = editedBlock.images || [];
    const updatedImages = [...currentImages];
    updatedImages[index] = { ...updatedImages[index], [field]: value };
    setEditedBlock(prev => ({ ...prev, images: updatedImages }));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const currentImages = editedBlock.images || [];
      const oldIndex = currentImages.findIndex((_, i) => i.toString() === active.id);
      const newIndex = currentImages.findIndex((_, i) => i.toString() === over.id);
      
      setEditedBlock(prev => ({
        ...prev,
        images: arrayMove(currentImages, oldIndex, newIndex)
      }));
    }
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

      {/* Photo Grid Block */}
      {block.type === 'photo-grid' && (
        <div className="space-y-4">
          <div>
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
          </div>

          <div className="space-y-3">
            <Label>Images ({(editedBlock.images || []).length})</Label>
            
            {/* Add from project images */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Add from Project Images</Label>
              <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {projectImages.map((imageUrl, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectProjectImage(imageUrl)}
                    className="aspect-square rounded overflow-hidden border-2 border-border hover:border-primary transition-colors"
                    type="button"
                  >
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {projectImages.length === 0 && (
                  <p className="col-span-4 text-sm text-muted-foreground text-center py-4">No project images available</p>
                )}
              </div>
            </div>

            {/* Upload new image */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Or Upload New Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={e => e.target.files?.[0] && handleAddPhotoGridImage(e.target.files[0])}
                disabled={uploading}
              />
            </div>

            {/* Sortable list of images */}
            {(editedBlock.images || []).length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Drag to reorder images</Label>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={(editedBlock.images || []).map((_, i) => i.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {(editedBlock.images || []).map((image, index) => (
                        <SortablePhotoGridItem
                          key={index}
                          image={{
                            url: image.url,
                            alt: image.alt || '',
                            caption: image.caption || ''
                          }}
                          index={index}
                          onUpdate={handleUpdatePhotoGridImage}
                          onRemove={handleRemovePhotoGridImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
