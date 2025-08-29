import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, CloudUpload, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageDropZoneProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

export const ImageDropZone: React.FC<ImageDropZoneProps> = ({
  label,
  value,
  onChange,
  onFileSelect,
  loading = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="flex items-center gap-4">
          <img src={value} alt={label} className="w-32 h-32 object-cover rounded border" />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Change Image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange('')}
              disabled={loading}
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5 scale-102" 
              : "border-border hover:border-primary/50 hover:bg-accent/50",
            loading && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            {isDragging ? (
              <CloudUpload className="w-12 h-12 text-primary animate-bounce" />
            ) : (
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            )}
            
            <div className="space-y-2">
              <h3 className="font-medium">
                {isDragging ? 'Drop image here' : `Upload ${label}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop an image here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: JPEG, PNG, WebP, GIF
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4" />
              Browse Image
            </Button>
          </div>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};