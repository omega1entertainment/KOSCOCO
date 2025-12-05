import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkippableInStreamAdProps {
  ad: {
    id: string;
    title: string;
    videoUrl?: string;
    destinationUrl: string;
    skipAfterSeconds?: number;
  };
  onComplete: () => void;
  onSkip: () => void;
  onImpression: (adId: string) => void;
  onClick: (adId: string) => void;
}

export function SkippableInStreamAd({ 
  ad, 
  onComplete, 
  onSkip, 
  onImpression, 
  onClick 
}: SkippableInStreamAdProps) {
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [impressionTracked, setImpressionTracked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skipAfter = ad.skipAfterSeconds || 5;
  const canSkip = secondsWatched >= skipAfter;

  // Track impression on mount
  useEffect(() => {
    if (!impressionTracked && ad.id) {
      onImpression(ad.id);
      setImpressionTracked(true);
    }
  }, [impressionTracked, ad.id, onImpression]);

  // Auto-play video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("Failed to auto-play skippable ad video:", error);
      });
    }
  }, []);

  // Track seconds watched
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSecondsWatched(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleVideoClick = () => {
    onClick(ad.id);
    window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSkip = () => {
    onSkip();
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleVideoEnd = () => {
    onComplete();
  };

  // Guard: Don't render if no media (skip in useEffect to avoid render-time state updates)
  React.useEffect(() => {
    if (!ad.videoUrl) {
      console.error("SkippableInStreamAd: No video URL provided for ad", ad.id);
      onSkip();
    }
  }, [ad.videoUrl, ad.id, onSkip]);

  if (!ad.videoUrl) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 bg-black z-50 flex items-center justify-center"
      data-testid={`video-ad-${ad.id}`}
    >
      <div className="relative w-full h-full">
        {/* Video Player */}
        <video
            ref={videoRef}
            src={ad.videoUrl}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleVideoClick}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnd}
            data-testid="video-ad-player"
          />

        {/* Overlay Controls */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            {/* Ad Label */}
            <div className="bg-yellow-500 text-black px-3 py-1 rounded-md text-xs font-semibold">
              Ad
            </div>

            {/* Skip Button or Countdown */}
            {canSkip ? (
              <Button
                variant="secondary"
                onClick={handleSkip}
                className="font-semibold"
                data-testid="button-skip-ad"
              >
                <X className="w-4 h-4 mr-1" />
                Skip Ad
              </Button>
            ) : (
              <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-md text-sm font-medium">
                Skip in {skipAfter - secondsWatched}s
              </div>
            )}
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div
            className="cursor-pointer hover-elevate p-3 rounded-md transition-all"
            onClick={handleVideoClick}
            data-testid="video-ad-info"
          >
            <p className="text-white font-semibold text-sm mb-1">{ad.title}</p>
            <p className="text-white/70 text-xs">Click to learn more</p>
          </div>
        </div>
      </div>
    </div>
  );
}
