import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Paragraph from '@tiptap/extension-paragraph';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon,
  Unlink,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: (content: string) => void;
  onCancel: () => void;
  className?: string;
}

export const InlineTextEditor: React.FC<InlineTextEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  className
}) => {
  const [content, setContent] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
      }),
      Paragraph.configure({
        HTMLAttributes: {
          class: 'mb-4 last:mb-0',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80 cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setContent(newContent);
      onChange(newContent);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[60px] p-4',
          'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground',
          'prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:text-foreground prose-a:text-primary'
        ),
      },
    },
    autofocus: true,
  });

  const setLink = React.useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleSave = () => {
    onSave(content);
  };

  const handleCancel = () => {
    onChange(value); // Reset to original value
    onCancel();
  };

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [content]);

  if (!editor) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn("relative border border-primary rounded-lg bg-background shadow-lg", className)}>
      {/* Floating Toolbar */}
      <div className="sticky top-0 z-10 border-b border-input bg-background/95 backdrop-blur-sm p-2 flex flex-wrap gap-1 items-center justify-between rounded-t-lg">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive('bold') && "bg-accent"
            )}
          >
            <Bold className="h-3 w-3" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive('italic') && "bg-accent"
            )}
          >
            <Italic className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive('strike') && "bg-accent"
            )}
          >
            <Underline className="h-3 w-3" />
          </Button>

          {/* Lists */}
          <div className="w-px h-5 bg-border mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive('bulletList') && "bg-accent"
            )}
          >
            <List className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive('orderedList') && "bg-accent"
            )}
          >
            <ListOrdered className="h-3 w-3" />
          </Button>

          {/* Text Alignment */}
          <div className="w-px h-5 bg-border mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive({ textAlign: 'left' }) && "bg-accent"
            )}
          >
            <AlignLeft className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive({ textAlign: 'center' }) && "bg-accent"
            )}
          >
            <AlignCenter className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive({ textAlign: 'right' }) && "bg-accent"
            )}
          >
            <AlignRight className="h-3 w-3" />
          </Button>

          {/* Links */}
          <div className="w-px h-5 bg-border mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(
              "h-7 w-7 p-0",
              editor.isActive('link') && "bg-accent"
            )}
          >
            <LinkIcon className="h-3 w-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            className="h-7 w-7 p-0"
          >
            <Unlink className="h-3 w-3" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            className="h-7 px-2 text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="min-h-[60px]">
        <EditorContent 
          editor={editor} 
          className="prose max-w-none [&_.ProseMirror]:focus:outline-none [&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_p:last-child]:mb-0"
        />
      </div>
    </div>
  );
};