import { ContentBlockData } from '@/components/layout/ContentBlock';

interface ProjectData {
  title: string;
  description: string;
  cover_image?: string;
  images?: string[];
  files?: any[];
}

export const generateInitialLayout = (project: ProjectData): ContentBlockData[] => {
  const layout: ContentBlockData[] = [];

  // Add description as text block if it exists
  if (project.description) {
    layout.push({
      id: `text-${Date.now()}`,
      type: 'text',
      content: project.description,
      size: 'large',
      alignment: 'left'
    });
  }

  // Add media carousel if images exist
  const mediaItems = [];
  
  // Add cover image
  if (project.cover_image) {
    mediaItems.push(project.cover_image);
  }
  
  // Add project images
  if (project.images && project.images.length > 0) {
    mediaItems.push(...project.images);
  }

  if (mediaItems.length > 0) {
    layout.push({
      id: `carousel-${Date.now()}`,
      type: 'carousel',
      images: mediaItems.map(url => ({ url, alt: '', caption: '' })),
      size: 'full',
      alignment: 'center'
    });
  }

  // Add a spacer between content blocks
  if (layout.length > 1) {
    layout.splice(1, 0, {
      id: `spacer-${Date.now()}`,
      type: 'spacer',
      content: '40',
      size: 'medium',
      alignment: 'center'
    });
  }

  return layout;
};