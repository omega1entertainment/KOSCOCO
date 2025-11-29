import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, Eye, Share2, Volume2, VolumeX, ChevronDown } from "lucide-react";
import type { VideoWithStats } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

export default function VideoFeed() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch all approved videos
  const { data: allVideos = [], isLoading } = useQuery<VideoWithStats[]>({
    queryKey: queryKeys.videos.all,
  });

  const videos = allVideos.filter(v => v.status === 'approved');

  // Snap scroll effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      if (isScrolling) return;
      isScrolling = true;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPosition = container.scrollTop;
        const itemHeight = container.clientHeight;
        const closestIndex = Math.round(scrollPosition / itemHeight);

        container.scrollTo({
          top: closestIndex * itemHeight,
          behavior: "smooth",
        });

        setCurrentIndex(closestIndex);
        isScrolling = false;
      }, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-play current video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, user will click to play
      });
    }
  }, [currentIndex]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleLike = async () => {
    const video = videos[currentIndex];
    if (!video) return;

    try {
      await apiRequest(`/api/likes`, "POST", { videoId: video.id });
      toast({
        title: t("videoFeed.liked"),
        description: t("videoFeed.likedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.likes.byVideo(video.id) });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to like video",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    const video = videos[currentIndex];
    if (!video) return;

    const url = `${window.location.origin}/video/${createPermalink(video.id, video.title)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: t("videoFeed.linkCopied"),
      description: t("videoFeed.linkCopiedDescription"),
    });
  };

  const handleViewFull = () => {
    const video = videos[currentIndex];
    if (!video) return;

    setLocation(`/video/${createPermalink(video.id, video.title)}`);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t("videoFeed.loading")}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t("videoFeed.noVideos")}</p>
          <Button onClick={() => setLocation("/categories")} data-testid="button-back-to-categories">
            {t("videoFeed.backToCategories")}
          </Button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black"
      style={{
        scrollBehavior: "smooth",
        scrollSnapType: "y mandatory",
      }}
      data-testid="container-video-feed"
    >
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="relative w-full h-screen flex items-center justify-center bg-black snap-start snap-always"
          data-testid={`slide-video-${index}`}
        >
          {/* Video Player */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={index === currentIndex ? videoRef : null}
              src={video.videoUrl}
              className="w-full h-full object-contain"
              onClick={handleVideoClick}
              muted={isMuted}
              controls={false}
              data-testid={`video-player-${index}`}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

            {/* Video Controls - Right Side */}
            <div className="absolute right-4 bottom-20 flex flex-col gap-4 z-10">
              {/* Mute Button */}
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white w-12 h-12"
                onClick={() => setIsMuted(!isMuted)}
                data-testid={`button-${isMuted ? 'unmute' : 'mute'}`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>

              {/* Like Button */}
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white w-12 h-12"
                onClick={handleLike}
                data-testid="button-like-feed"
              >
                <ThumbsUp className="w-5 h-5" />
              </Button>

              {/* Share Button */}
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white w-12 h-12"
                onClick={handleShare}
                data-testid="button-share-feed"
              >
                <Share2 className="w-5 h-5" />
              </Button>

              {/* View Full Button */}
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/20 hover:bg-white/30 text-white w-12 h-12"
                onClick={handleViewFull}
                data-testid="button-view-full"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
            </div>

            {/* Video Info - Bottom Left */}
            <div className="absolute bottom-6 left-4 right-16 text-white z-10">
              <h2 className="text-xl font-bold mb-2 line-clamp-2">{currentVideo.title}</h2>

              <div className="flex items-center gap-3 mb-3">
                <Badge variant="secondary" className="bg-white/20" data-testid={`badge-category-${index}`}>
                  {currentVideo.subcategory}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span data-testid={`text-views-${index}`}>{currentVideo.views}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span data-testid={`text-likes-${index}`}>{currentVideo.likeCount}</span>
                </div>
              </div>
            </div>

            {/* Play Button Overlay (when paused) */}
            {videoRef.current && index === currentIndex && videoRef.current.paused && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={handleVideoClick}>
                <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center">
                  <div className="w-0 h-0 border-l-12 border-l-white border-t-8 border-t-transparent border-b-8 border-b-transparent ml-1" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Video Counter */}
      <div className="fixed top-4 right-4 bg-white/20 text-white px-3 py-1 rounded-full text-sm z-20" data-testid="text-video-counter">
        {currentIndex + 1} / {videos.length}
      </div>

      {/* Back Button */}
      <Button
        variant="ghost"
        className="fixed top-4 left-4 bg-white/20 hover:bg-white/30 text-white z-20"
        onClick={() => setLocation("/")}
        data-testid="button-back-home"
      >
        ← {t("videoFeed.back")}
      </Button>
    </div>
  );
}
