import { useEffect } from 'react';

export function useVideoMetaTags(video: { id: string; title: string; description?: string; thumbnailUrl?: string } | null) {
  useEffect(() => {
    if (!video) return;

    const shareUrl = `${window.location.origin}/video/${video.id}`;
    const description = video.description || `Check out this video: ${video.title}`;
    const thumbnail = video.thumbnailUrl || '';

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', video.title);

    // Update og:description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    // Update og:image
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', thumbnail);

    // Update og:url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', shareUrl);

    // Update og:type
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      ogType = document.createElement('meta');
      ogType.setAttribute('property', 'og:type');
      document.head.appendChild(ogType);
    }
    ogType.setAttribute('content', 'video.other');

    // Update page title
    document.title = `${video.title} - Kozzii`;

    return () => {
      document.title = 'Kozzii';
    };
  }, [video?.id, video?.title, video?.description, video?.thumbnailUrl]);
}
