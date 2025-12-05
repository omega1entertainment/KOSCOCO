import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InFeedVideoAdProps {
  adId: string;
  mediaUrl: string;
  destinationUrl: string;
  title: string;
  description?: string;
  ctaText?: string;
}

export default function InFeedVideoAd({
  adId,
  mediaUrl,
  destinationUrl,
  title,
  description,
  ctaText = "Learn More",
}: InFeedVideoAdProps) {
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedImpression) {
            fetch("/api/ads/impression", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ adId }),
              credentials: "include",
            })
              .then(() => setHasTrackedImpression(true))
              .catch((error) => {
                console.error("Failed to track in-feed ad impression:", error);
              });
          }
        });
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`in-feed-ad-${adId}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [adId]);

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!hasTrackedView && videoRef.current) {
      const watchedPercentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      if (watchedPercentage >= 30) {
        fetch("/api/ads/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId }),
          credentials: "include",
        }).catch((error) => {
          console.error("Failed to track in-feed ad view:", error);
        });
        setHasTrackedView(true);
      }
    }
  };

  const handleAdClick = () => {
    fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adId }),
      credentials: "include",
    }).catch((error) => {
      console.error("Failed to track in-feed ad click:", error);
    });
    window.open(destinationUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      id={`in-feed-ad-${adId}`}
      className="overflow-hidden hover-elevate"
      data-testid={`ad-in-feed-${adId}`}
    >
      <div className="relative">
        <Badge className="absolute top-2 left-2 z-10 bg-primary/90 backdrop-blur-sm" data-testid="badge-sponsored">
          Sponsored
        </Badge>
        
        <div className="relative aspect-video bg-muted">
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-cover"
            playsInline
            muted={isMuted}
            onTimeUpdate={handleVideoTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            data-testid="video-in-feed"
          />
          
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Button
                size="icon"
                variant="outline"
                className="w-16 h-16 rounded-full bg-white/90 backdrop-blur-sm border-white/40 hover:bg-white"
                onClick={handlePlay}
                data-testid="button-play-in-feed"
              >
                <Play className="w-8 h-8 text-black fill-black" />
              </Button>
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button
              size="icon"
              variant="outline"
              className="bg-black/60 backdrop-blur-sm border-white/40 text-white hover:bg-black/80"
              onClick={toggleMute}
              data-testid="button-toggle-mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1" data-testid="text-in-feed-title">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2" data-testid="text-in-feed-description">
              {description}
            </p>
          )}
        </div>

        <Button
          onClick={handleAdClick}
          className="w-full"
          data-testid="button-cta-in-feed"
        >
          {ctaText}
        </Button>
      </div>
    </Card>
  );
}
