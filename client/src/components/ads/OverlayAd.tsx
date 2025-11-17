import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverlayAdProps {
  ad: {
    id: string;
    title: string;
    imageUrl?: string;
    destinationUrl: string;
    description?: string | null;
  };
  onClose: () => void;
  onImpression: (adId: string) => void;
  onClick: (adId: string) => void;
}

export function OverlayAd({ ad, onClose, onImpression, onClick }: OverlayAdProps) {
  const [impressionTracked, setImpressionTracked] = useState(false);

  // Track impression on mount (in useEffect to avoid render loops)
  React.useEffect(() => {
    if (!impressionTracked && ad.id) {
      onImpression(ad.id);
      setImpressionTracked(true);
    }
  }, [impressionTracked, ad.id, onImpression]);

  // Guard: Don't render if no media
  if (!ad.imageUrl) {
    console.error("OverlayAd: No image URL provided for ad", ad.id);
    return null;
  }

  const handleClick = () => {
    onClick(ad.id);
    window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/10 animate-in slide-in-from-bottom duration-300"
      data-testid={`overlay-ad-${ad.id}`}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Ad Content */}
          <div 
            className="flex-1 flex items-center gap-4 cursor-pointer hover-elevate rounded-md p-2 transition-all"
            onClick={handleClick}
            data-testid="overlay-ad-content"
          >
            {ad.imageUrl && (
              <img 
                src={ad.imageUrl} 
                alt={ad.description || ad.title}
                className="h-16 md:h-20 object-contain rounded border border-white/10"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Advertisement</p>
              <p className="text-sm text-white font-medium truncate">{ad.title}</p>
            </div>
          </div>

          {/* Close Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="shrink-0 text-white hover:bg-white/10"
            data-testid="button-close-overlay-ad"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
