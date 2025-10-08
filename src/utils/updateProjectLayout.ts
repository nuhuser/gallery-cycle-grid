import { supabase } from "@/integrations/supabase/client";
import { ContentBlockData } from "@/components/layout/ContentBlock";

export const updateProjectLayout = async (projectId: string, layout: ContentBlockData[]) => {
  const { data, error } = await supabase.functions.invoke('update-project-layout', {
    body: { projectId, layout }
  });

  if (error) throw error;
  return data;
};

export const addVideoToProject = async (projectSlug: string, videoUrl: string) => {
  // First get the project
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, layout')
    .eq('slug', projectSlug)
    .single();

  if (fetchError) throw fetchError;
  if (!project) throw new Error('Project not found');

  // Convert YouTube Shorts URL to embed URL
  const embedUrl = videoUrl.replace('youtube.com/shorts/', 'youtube.com/embed/');

  // Add video block to layout
  const newVideoBlock: ContentBlockData = {
    id: `video-${Date.now()}`,
    type: 'video',
    iframeSrc: embedUrl,
    size: 'large',
    alignment: 'center'
  };

  const currentLayout = Array.isArray(project.layout) 
    ? (project.layout as unknown as ContentBlockData[]) 
    : [];
  const updatedLayout = [...currentLayout, newVideoBlock];

  // Update via edge function
  return updateProjectLayout(project.id, updatedLayout);
};
