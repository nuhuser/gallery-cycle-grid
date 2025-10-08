import { useEffect, useState } from 'react';
import { addVideoToProject } from '@/utils/updateProjectLayout';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const EmbedVideo = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const embedVideo = async () => {
      try {
        await addVideoToProject('n-a-n-a-cap-v1', 'https://www.youtube.com/shorts/cU9tTlQffHI');
        setStatus('success');
        toast.success('Video embedded successfully!');
        setTimeout(() => {
          navigate('/projects/n-a-n-a-cap-v1');
        }, 1500);
      } catch (error) {
        console.error('Error embedding video:', error);
        setStatus('error');
        toast.error('Failed to embed video');
      }
    };

    embedVideo();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && <p>Embedding video...</p>}
        {status === 'success' && <p>Video embedded! Redirecting...</p>}
        {status === 'error' && <p>Error embedding video. Please try again.</p>}
      </div>
    </div>
  );
};

export default EmbedVideo;
