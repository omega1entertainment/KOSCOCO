import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NonSkippableInStreamAdProps {
  adId: string;
  mediaUrl: string;
  destinationUrl: string;
  title: string;
  onComplete: () => void;
}

export default function NonSkippableInStreamAd({
  adId,
  mediaUrl,
  destinationUrl,
  title,
  onComplete,
}: NonSkippableInStreamAdProps) {
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
      .catch((error) => {
        console.error("Failed to track non-skippable ad impression:", error);
      });
  }, [adId]);

  const handleVideoEnded = () => {
    if (!hasTrackedView) {
      fetch("/api/ads/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adId }),
        credentials: "include",
      }).catch((error) => {
        console.error("Failed to track non-skippable ad view:", error);
      });
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
    }).catch((error) => {
      console.error("Failed to track non-skippable ad click:", error);
    });
    window.open(destinationUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" data-testid="ad-non-skippable-instream">
      <div className="relative w-full h-full max-w-5xl max-h-screen flex items-center justify-center">
        <video
          ref={videoRef}
          src={mediaUrl}
          className="w-full h-full object-contain"
          autoPlay
          playsInline
          onEnded={handleVideoEnded}
          data-testid="video-ad"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-white text-sm mb-1" data-testid="text-ad-label">
                Advertisement
              </p>
              <h3 className="text-white font-semibold" data-testid="text-ad-title">{title}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdClick}
              className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
              data-testid="button-visit-advertiser"
            >
              Visit Advertiser
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
