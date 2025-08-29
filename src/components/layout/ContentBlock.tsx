import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit, Image, FileText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ContentBlockData {
  id: string;
  type: 'text' | 'image' | 'video' | 'spacer';
  content?: string;
  url?: string;
  alt?: string;
  caption?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  alignment?: 'left' | 'center' | 'right';
}

interface ContentBlockProps {
  block: ContentBlockData;
  isEditing?: boolean;
  onEdit?: (block: ContentBlockData) => void;
  onDelete?: (id: string) => void;
}

export const ContentBlock: React.FC<ContentBlockProps> = ({
  block,
  isEditing = false,
  onEdit,
  onDelete
}) => {
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

  const renderBlockContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <div 
            className={cn(
              "prose prose-sm max-w-none",
              getSizeClass(block.size),
              getAlignmentClass(block.alignment)
            )}
            dangerouslySetInnerHTML={{ __html: block.content || '<p>Click to edit text...</p>' }}
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
                  controls
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
                  <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to add video</p>
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
      <div className={cn(!isEditing && "cursor-pointer")} onClick={() => !isEditing && onEdit?.(block)}>
        {renderBlockContent()}
      </div>
    </div>
  );
};