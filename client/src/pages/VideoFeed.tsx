import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import VotePaymentModal from "@/components/VotePaymentModal";
import { ReportDialog } from "@/components/ReportDialog";
import { ThumbsUp, Share2, Flag, ChevronUp, ChevronDown, Eye, Play } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VideoWithStats, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

export default function VideoFeed() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const { data: videos = [] } = useQuery<VideoWithStats[]>({
    queryKey: queryKeys.videos.all,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  // Filter only approved videos
  const approvedVideos = videos.filter(v => v.status === 'approved');
  const currentVideo = approvedVideos[currentIndex];

  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return await apiRequest(`/api/likes`, "POST", { videoId });
    },
    onSuccess: (_, videoId) => {
      toast({
        title: t("categoryVideos.likedTitle"),
        description: t("categoryVideos.likedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.likes.byVideo(videoId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
    },
    onError: (error: Error) => {
      toast({
        title: t("categoryVideos.likeFailedTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const viewMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return await apiRequest(`/api/videos/${videoId}/view`, "POST");
    },
    onError: (error: Error) => {
      console.error("Error recording view:", error.message);
    },
  });

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : approvedVideos.length - 1));
  }, [approvedVideos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < approvedVideos.length - 1 ? prev + 1 : 0));
  }, [approvedVideos.length]);

  // Wheel scroll navigation
  useEffect(() => {
    let wheelTimeout: NodeJS.Timeout;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      clearTimeout(wheelTimeout);
      
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
          handleNext();
        } else {
          handlePrevious();
        }
      }, 50);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
      clearTimeout(wheelTimeout);
    };
  }, [handleNext, handlePrevious]);

  // Touch/swipe navigation
  useEffect(() => {
    let touchStart = 0;
    let touchEnd = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart = e.touches[0]?.clientY || 0;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEnd = e.changedTouches[0]?.clientY || 0;
      const diff = touchStart - touchEnd;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleNext();
        } else {
          handlePrevious();
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      if (container) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [handleNext, handlePrevious]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious]);

  // Record view when video changes
  useEffect(() => {
    if (currentVideo) {
      viewMutation.mutate(currentVideo.id);
    }
  }, [currentVideo?.id]);

  const category = currentVideo ? categories?.find(c => c.id === currentVideo.categoryId) : null;

  if (approvedVideos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Play className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t("nav.feed")}</h1>
          <p className="text-muted-foreground mb-4">No videos available yet</p>
          <Button onClick={() => setLocation("/")} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden snap-y snap-mandatory"
    >
      {/* Video Container */}
      <div className="relative w-full h-full">
        {currentVideo && (
          <div className="w-full h-full flex flex-col relative">
            {/* Video Player */}
            <video
              key={currentVideo.id}
              src={currentVideo.videoUrl}
              className="w-full h-full object-contain bg-black"
              autoPlay
              loop
              muted
              controls={false}
              playsInline
            />

            {/* Video Metadata - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="flex flex-col gap-2 mb-4">
                <h2 className="text-white font-bold text-lg md:text-xl line-clamp-2">
                  {currentVideo.title}
                </h2>
                <p className="text-white/80 text-sm md:text-base line-clamp-2">
                  {currentVideo.description}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {category && (
                    <Badge variant="secondary" className="text-xs md:text-sm">
                      {category.name}
                    </Badge>
                  )}
                  {currentVideo.subcategory && (
                    <Badge variant="outline" className="text-xs md:text-sm text-white border-white/30">
                      {currentVideo.subcategory}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Engagement Sidebar - Right */}
            <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 md:gap-6">
              {/* Like Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center gap-1"
                onClick={() => {
                  if (!isAuthenticated) {
                    setLocation("/login");
                    return;
                  }
                  likeMutation.mutate(currentVideo.id);
                }}
                data-testid="button-like-feed"
              >
                <ThumbsUp className="w-6 h-6 md:w-7 md:h-7" />
                <span className="text-xs font-bold">{currentVideo.likeCount || 0}</span>
              </Button>

              {/* Vote Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 text-white flex flex-col items-center justify-center gap-1"
                onClick={() => {
                  if (!isAuthenticated) {
                    setLocation("/login");
                    return;
                  }
                  setSelectedVideoId(currentVideo.id);
                  setVoteModalOpen(true);
                }}
                data-testid="button-vote-feed"
              >
                <Eye className="w-6 h-6 md:w-7 md:h-7" />
                <span className="text-xs font-bold">{currentVideo.voteCount || 0}</span>
              </Button>

              {/* Share Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => {
                  const videoUrl = `${window.location.origin}/video/${createPermalink(currentVideo.id, currentVideo.title)}`;
                  navigator.share?.({
                    title: currentVideo.title,
                    text: currentVideo.description || undefined,
                    url: videoUrl,
                  }).catch(() => {
                    navigator.clipboard.writeText(videoUrl);
                    toast({
                      title: "Link copied",
                      description: "Video link copied to clipboard",
                    });
                  });
                }}
                data-testid="button-share-feed"
              >
                <Share2 className="w-6 h-6 md:w-7 md:h-7" />
              </Button>

              {/* Report Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => {
                  if (!isAuthenticated) {
                    setLocation("/login");
                    return;
                  }
                  setSelectedVideoId(currentVideo.id);
                  setReportDialogOpen(true);
                }}
                data-testid="button-report-feed"
              >
                <Flag className="w-6 h-6 md:w-7 md:h-7" />
              </Button>
            </div>

            {/* Navigation Buttons - Visible on Desktop */}
            <div className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={handlePrevious}
                data-testid="button-prev-video"
              >
                <ChevronUp className="w-6 h-6" />
              </Button>
            </div>

            <div className="hidden md:flex absolute right-6 bottom-24 md:bottom-32">
              <Button
                size="icon"
                variant="ghost"
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={handleNext}
                data-testid="button-next-video"
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
            </div>

            {/* Video Counter */}
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-semibold backdrop-blur-sm" data-testid="text-video-counter">
              {currentIndex + 1} / {approvedVideos.length}
            </div>

            {/* View Full Video Link */}
            <div className="absolute top-6 left-6">
              <Button
                variant="ghost"
                className="bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setLocation(`/video/${createPermalink(currentVideo.id, currentVideo.title)}`)}
                data-testid="button-view-full-video"
              >
                View Full Video
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedVideoId && currentVideo && (
        <>
          <VotePaymentModal
            open={voteModalOpen}
            onOpenChange={setVoteModalOpen}
            videoId={selectedVideoId}
            videoTitle={currentVideo.title}
          />
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            videoId={selectedVideoId}
            videoTitle={currentVideo.title}
          />
        </>
      )}

      {/* Mobile Instructions */}
      <div className="absolute bottom-6 left-6 text-white/60 text-xs md:hidden pointer-events-none">
        <p>Swipe up/down or scroll to navigate</p>
      </div>
    </div>
  );
}
