import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { generateInitialLayout } from '@/utils/projectLayout';
import { ContentBlock, ContentBlockData } from '@/components/layout/ContentBlock';
import { BlockEditor } from '@/components/layout/BlockEditor';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Image,
  Video,
  Minus,
  Eye,
  Save,
  Grid,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  description: string;
  images: string[];
  files: any[];
  layout: ContentBlockData[];
  slug: string;
}

const ProjectLayoutEditor = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState<ContentBlockData[]>([]);
  const [editingBlock, setEditingBlock] = useState<ContentBlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      // Check if user owns this project
      if (data.user_id !== user?.id) {
        toast.error('You can only edit your own projects');
        navigate('/admin');
        return;
      }

      const layoutData = Array.isArray(data.layout) ? data.layout as unknown as ContentBlockData[] : [];
      
      setProject({
        ...data,
        files: Array.isArray(data.files) ? data.files : [],
        layout: layoutData
      });
      
      // Auto-generate layout if none exists
      if (layoutData.length === 0) {
        const projectForLayout = {
          title: data.title,
          description: data.description,
          cover_image: data.cover_image,
          images: data.images || [],
          files: Array.isArray(data.files) ? data.files : []
        };
        const autoLayout = generateInitialLayout(projectForLayout);
        setLayout(autoLayout);
      } else {
        setLayout(layoutData);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const generateBlockId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addBlock = (type: 'text' | 'image' | 'video' | 'spacer' | 'photo-grid') => {
    const newBlock: ContentBlockData = {
      id: generateBlockId(),
      type,
      size: 'medium',
      alignment: 'center',
      ...(type === 'text' && { content: '<p>Your text here...</p>' }),
      ...(type === 'spacer' && { content: '40' }),
      ...(type === 'photo-grid' && { images: [], gridColumns: 3 })
    };

    setLayout(prev => [...prev, newBlock]);
    setEditingBlock(newBlock);
  };

  const updateBlock = (updatedBlock: ContentBlockData) => {
    setLayout(prev => prev.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
    setEditingBlock(null);
  };

  const deleteBlock = (blockId: string) => {
    setLayout(prev => prev.filter(block => block.id !== blockId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = layout.findIndex(block => block.id === active.id);
      const newIndex = layout.findIndex(block => block.id === over?.id);

      setLayout(arrayMove(layout, oldIndex, newIndex));
    }
  };

  const saveLayout = async () => {
    if (!project) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ layout: layout as any })
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Layout saved successfully');
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const previewProject = () => {
    window.open(`/project/${project?.slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Link to="/admin">
            <Button>Go back to admin</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Layout Editor</h1>
              <p className="text-muted-foreground">{project.title}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={previewProject}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveLayout} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Layout'}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Toolbar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Add Content Blocks</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('text')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Text Block
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('image')}
                  >
                    <Image className="w-4 h-4 mr-2" />
                    Image Block
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('video')}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Video Block
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('photo-grid')}
                  >
                    <Grid className="w-4 h-4 mr-2" />
                    Photo Grid
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => addBlock('spacer')}
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Spacer
                  </Button>
                </div>
              </div>

              {/* Block Editor Panel */}
              {editingBlock && (
                <BlockEditor
                  block={editingBlock}
                  projectImages={project.images}
                  onSave={updateBlock}
                  onCancel={() => setEditingBlock(null)}
                />
              )}
            </div>
          </div>

          {/* Layout Canvas */}
          <div className="lg:col-span-3">
            <div className="border rounded-lg p-8 bg-card min-h-[600px]">
              {layout.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-muted-foreground mb-4">
                    <Plus className="w-12 h-12 mx-auto mb-4" />
                    <p>Start building your article layout</p>
                    <p className="text-sm">Add content blocks from the sidebar</p>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={layout.map(block => block.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-8">
                      {layout.map((block) => (
                        <ContentBlock
                          key={block.id}
                          block={block}
                          isEditing={true}
                          onEdit={setEditingBlock}
                          onDelete={deleteBlock}
                          onUpdateBlock={(updatedBlock) => {
                            setLayout(prev => prev.map(b => 
                              b.id === updatedBlock.id ? updatedBlock : b
                            ));
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectLayoutEditor;