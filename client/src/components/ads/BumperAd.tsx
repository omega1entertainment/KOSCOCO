import { useState, useEffect, useRef } from "react";

interface BumperAdProps {
  adId: string;
  mediaUrl: string;
  destinationUrl: string;
  title: string;
  onComplete: () => void;
}

export default function BumperAd({
  adId,
  mediaUrl,
  destinationUrl,
  title,
  onComplete,
}: BumperAdProps) {
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (hasTrackedImpression) return;
    
    fetch("/api/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId }),
      credentials: "include",
    })
      .then(() => setHasTrackedImpression(true))
      .catch(console.error);
  }, [adId]);

  const handleVideoEnded = () => {
    if (!hasTrackedView) {
      fetch("/api/ads/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
        credentials: "include",
      }).catch(console.error);
      setHasTrackedView(true);
    }
    onComplete();
  };

  const handleAdClick = () => {
    fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId }),
      credentials: "include",
    }).catch(console.error);
    window.open(destinationUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" data-testid="ad-bumper">
      <div className="relative w-full h-full max-w-5xl max-h-screen flex items-center justify-center">
        <div 
          className="relative w-full h-full cursor-pointer"
          onClick={handleAdClick}
          data-testid="bumper-clickable"
        >
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted={false}
            onEnded={handleVideoEnded}
            data-testid="video-bumper"
          />
          
          <div className="absolute top-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded" data-testid="text-bumper-label">
              Bumper Ad (6s)
            </div>
          </div>

          <div className="absolute bottom-4 left-4">
            <p className="text-white text-sm bg-black/60 backdrop-blur-sm px-3 py-1 rounded" data-testid="text-bumper-title">
              {title}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
