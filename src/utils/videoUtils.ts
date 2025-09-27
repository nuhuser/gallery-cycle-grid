// Utility functions for video processing and URL handling

export const extractVideoUrl = (input: string): string | null => {
  const trimmed = input.trim();
  
  // Direct video URLs
  if (/\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(trimmed)) {
    return trimmed;
  }
  
  // Google Drive links
  const googleDriveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (googleDriveMatch) {
    return `https://drive.google.com/uc?export=download&id=${googleDriveMatch[1]}`;
  }
  
  // Google Photos links (convert to direct access)
  const googlePhotosMatch = trimmed.match(/photos\.google\.com\/share\/[^/]+\/photo\/([^?]+)/);
  if (googlePhotosMatch) {
    // Note: Google Photos requires authentication, so we'll return the original URL
    // but show a warning to the user
    return trimmed;
  }
  
  // YouTube embed URLs
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return convertToEmbedUrl(trimmed);
  }
  
  // Vimeo URLs
  if (trimmed.includes('vimeo.com')) {
    return convertToEmbedUrl(trimmed);
  }
  
  // Other video hosting platforms
  if (trimmed.includes('dropbox.com')) {
    return trimmed.replace('?dl=0', '?raw=1');
  }
  
  return trimmed;
};

export const convertToEmbedUrl = (url: string): string => {
  try {
    const u = new URL(url);
    
    // YouTube
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}?autoplay=1&mute=1` : url;
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
    }
    
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1` : url;
    }
  } catch {}
  return url;
};

export const isEmbedUrl = (url: string): boolean => {
  return /youtu\.be|youtube\.com|vimeo\.com/.test(url);
};

export const getVideoDuration = (videoElement: HTMLVideoElement): Promise<number> => {
  return new Promise((resolve) => {
    if (videoElement.duration && !isNaN(videoElement.duration)) {
      resolve(videoElement.duration);
    } else {
      const handleLoadedData = () => {
        resolve(videoElement.duration || 0);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
      };
      videoElement.addEventListener('loadeddata', handleLoadedData);
    }
  });
};

export const shouldAutoLoop = (duration: number): boolean => {
  return duration > 0 && duration < 60; // Auto-loop videos under 60 seconds
};

export const getVideoAspectRatio = (videoElement: HTMLVideoElement): number => {
  if (videoElement.videoWidth && videoElement.videoHeight) {
    return videoElement.videoWidth / videoElement.videoHeight;
  }
  return 16 / 9; // Default aspect ratio
};
