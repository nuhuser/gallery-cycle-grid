import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit, Image, FileText, Grid, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InlineTextEditor } from './InlineTextEditor';
import { Lightbox } from '@/components/ui/lightbox';

export interface ContentBlockData {
  id: string;
  type: 'text' | 'image' | 'video' | 'spacer' | 'photo-grid';
  content?: string;
  url?: string;
  alt?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  alignment?: 'left' | 'center' | 'right';
  images?: Array<{ url: string; alt?: string; caption?: string }>;
  gridColumns?: number;
  poster?: string;
}

interface ContentBlockProps {
  block: ContentBlockData;
  isEditing?: boolean;
  onEdit?: (block: ContentBlockData) => void;
  onDelete?: (id: string) => void;
  onUpdateBlock?: (block: ContentBlockData) => void;
}

export const ContentBlock: React.FC<ContentBlockProps> = ({
  block,
  isEditing = false,
  onEdit,
  onDelete,
  onUpdateBlock
}) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getSizeClass = (size: string = 'medium') => {
    const sizeMap = {
      small: 'max-w-sm',
      medium: 'max-w-2xl',
      large: 'max-w-4xl',
      full: 'w-full'
    };
    return sizeMap[size as keyof typeof sizeMap] || sizeMap.medium;
  };

  const getAlignmentClass = (alignment: string = 'center') => {
    const alignmentMap = {
      left: 'ml-0',
      center: 'mx-auto',
      right: 'ml-auto'
    };
    return alignmentMap[alignment as keyof typeof alignmentMap] || alignmentMap.center;
  };


  const handleTextSave = (newContent: string) => {
    if (onUpdateBlock) {
      onUpdateBlock({ ...block, content: newContent });
    }
    setIsEditingText(false);
  };

  const handleTextCancel = () => {
    setIsEditingText(false);
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        if (isEditing && isEditingText) {
          return (
            <div className={cn(getSizeClass(block.size), getAlignmentClass(block.alignment))}>
              <InlineTextEditor
                value={block.content || '<p>Enter your text here...</p>'}
                onChange={(content) => {
                  // Update block content in real-time for preview
                  if (onUpdateBlock) {
                    onUpdateBlock({ ...block, content });
                  }
                }}
                onSave={handleTextSave}
                onCancel={handleTextCancel}
              />
            </div>
          );
        }
        
        return (
          <div 
            className={cn(
              "prose prose-sm max-w-none cursor-text min-h-[40px] p-2 rounded hover:bg-muted/30 transition-colors",
              getSizeClass(block.size),
              getAlignmentClass(block.alignment),
              isEditing && "border border-dashed border-muted-foreground/30"
            )}
            dangerouslySetInnerHTML={{ __html: block.content || '<p class="text-muted-foreground">Click to edit text...</p>' }}
            onClick={(e) => {
              if (isEditing) {
                e.stopPropagation();
                setIsEditingText(true);
              }
            }}
          />
        );
      
      case 'image':
        return (
          <div className={cn(getSizeClass(block.size), getAlignmentClass(block.alignment))}>
            {block.url ? (
              <div className="space-y-2">
                <img
                  src={block.url}
                  alt={block.alt || ''}
                  className="w-full h-auto rounded-lg"
                />
                {block.caption && (
                  <p className="text-sm text-muted-foreground text-center italic">
                    {block.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to add image</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className={cn(getSizeClass(block.size), getAlignmentClass(block.alignment))}>
            {block.url ? (
              <div className="space-y-2">
                <video
                  src={block.url}
                  poster={block.poster}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
                {block.caption && (
                  <p className="text-sm text-muted-foreground text-center italic">
                    {block.caption}
                  </p>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to add video</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'photo-grid':
        return (
          <div className={cn(getSizeClass(block.size), getAlignmentClass(block.alignment))}>
            {block.images && block.images.length > 0 ? (
              <div 
                className={cn(
                  "grid gap-1 overflow-hidden",
                  block.gridColumns === 2 ? "grid-cols-2" : 
                  block.gridColumns === 4 ? "grid-cols-2 md:grid-cols-4" : 
                  "grid-cols-2 md:grid-cols-3"
                )}
              >
                {block.images.map((img, index) => (
                  <div key={index} className="relative group overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.alt || ''}
                      className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                      onClick={() => setSelectedImageIndex(index)}
                    />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-xs text-center">
                          {img.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Grid className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to add photo grid</p>
                </div>
              </div>
            )}
          </div>
        );
      
      
      case 'spacer':
        return (
          <div 
            className="w-full bg-border/20 rounded flex items-center justify-center text-muted-foreground text-sm"
            style={{ height: `${parseInt(block.content || '40')}px` }}
          >
            {isEditing && 'Spacer'}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50",
        isEditing && "border border-dashed border-border hover:border-primary/50 rounded-lg p-4"
      )}
    >
      {/* Editing Controls */}
      {isEditing && (
        <div className="absolute -top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-md p-1 shadow-sm z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 cursor-grab"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit?.(block)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(block.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Block Content */}
      <div 
        className={cn(
          block.type === 'text' && isEditing ? "" : "cursor-pointer"
        )} 
        onClick={() => {
          if (block.type !== 'text' || !isEditing) {
            onEdit?.(block);
          }
        }}
      >
        {renderBlockContent()}
      </div>

      {/* Lightbox for images */}
      {selectedImageIndex !== null && block.images && (
        <Lightbox
          images={block.images.map(img => img.url)}
          initialIndex={selectedImageIndex}
          isOpen={true}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </div>
  );
};