import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Share2, MessageCircle, Volume2, VolumeX, ChevronUp, ChevronDown } from "lucide-react";
import type { VideoWithStats, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

export default function VideoFeed() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "disqualified">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  // Fetch all videos from all categories
  const { data: allVideos = [] } = useQuery<VideoWithStats[]>({
    queryKey: ["feed-videos"],
    queryFn: async () => {
      const videos: VideoWithStats[] = [];
      for (const category of categories) {
        try {
          const response = await fetch(`/api/videos/category/${category.id}`);
          if (response.ok) {
            const categoryVideos = await response.json();
            videos.push(...categoryVideos);
          }
        } catch (err) {
          console.error(`Failed to fetch videos for category ${category.id}:`, err);
        }
      }
      return videos;
    },
    enabled: categories.length > 0,
  });

  // Filter videos based on selection
  const filteredVideos = selectedCategory
    ? allVideos.filter(v => v.categoryId === selectedCategory)
    : allVideos;

  const currentVideo = filteredVideos[currentVideoIndex];

  const followMutation = useMutation({
    mutationFn: async (creatorId: string) => {
      return await apiRequest(`/api/follows`, "POST", { creatorId });
    },
    onSuccess: () => {
      toast({
        title: t("videoFeed.followedSuccess"),
        description: t("videoFeed.followedDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("videoFeed.followFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      return await apiRequest(`/api/likes`, "POST", { videoId });
    },
    onSuccess: () => {
      toast({
        title: t("videoFeed.likedTitle"),
        description: t("videoFeed.likedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["feed-videos"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("videoFeed.likeFailedTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Keyboard and wheel controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        handleNextVideo();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handlePrevVideo();
      } else if (e.key === "m") {
        setIsMuted(!isMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVideoIndex, isMuted, filteredVideos.length]);

  const handleNextVideo = useCallback(() => {
    if (currentVideoIndex < filteredVideos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  }, [currentVideoIndex, filteredVideos.length]);

  const handlePrevVideo = useCallback(() => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  }, [currentVideoIndex]);

  const handleWatchVideo = () => {
    if (currentVideo) {
      const permalink = createPermalink(currentVideo.title, currentVideo.id);
      setLocation(`/video/${permalink}`);
    }
  };

  const handleShare = () => {
    if (currentVideo && navigator.share) {
      navigator.share({
        title: currentVideo.title,
        text: `Check out ${currentVideo.title} on KOSCOCO`,
        url: window.location.href,
      });
    } else if (currentVideo) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t("videoFeed.shareCopied"),
        description: t("videoFeed.linkCopiedDescription"),
      });
    }
  };

  if (!currentVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t("videoFeed.noVideosAvailable")}</p>
          <Button onClick={() => setLocation("/")}>{t("videoFeed.backHome")}</Button>
        </div>
      </div>
    );
  }

  const category = categories.find(c => c.id === currentVideo.categoryId);

  return (
    <div className="h-screen w-full bg-black overflow-hidden" ref={containerRef}>
      {/* Category Filter Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Badge
            variant={selectedCategory === "" ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setSelectedCategory("")}
            data-testid="badge-all-categories"
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`badge-category-${cat.id}`}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 mt-3">
          {["all", "active", "disqualified"].map((filter) => (
            <Badge
              key={filter}
              variant={activeFilter === filter as any ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveFilter(filter as any)}
              data-testid={`badge-filter-${filter}`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      {/* Main Video Container */}
      <div className="h-full w-full flex items-center justify-center relative">
        {/* Video */}
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <video
            key={currentVideo.id}
            src={currentVideo.videoUrl}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover"
            data-testid="video-player-feed"
          />

          {/* Video Info Overlay - Bottom Left */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pb-32">
            <div className="max-w-sm">
              {/* Creator Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <p className="font-bold text-white text-sm" data-testid="text-creator-name">
                        {currentVideo.createdByName || "Creator"}
                      </p>
                      <p className="text-xs text-gray-300">
                        {currentVideo.views || 0} {t("videoFeed.views")}
                      </p>
                    </div>
                  </div>

                  {/* Video Title */}
                  <h2 className="text-white font-bold text-base mb-3 line-clamp-2" data-testid="text-video-title">
                    {currentVideo.title}
                  </h2>

                  {/* Category Badge */}
                  {category && (
                    <Badge className="bg-red-600 text-white mb-3" data-testid="badge-video-category">
                      {category.name}
                    </Badge>
                  )}
                </div>

                {/* Follow Button */}
                {isAuthenticated && user?.id !== currentVideo.createdBy && (
                  <Button
                    onClick={() => followMutation.mutate(currentVideo.createdBy)}
                    disabled={followMutation.isPending}
                    className="ml-3 bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                    size="sm"
                    data-testid="button-follow"
                  >
                    + Follow
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="absolute right-6 bottom-40 z-10 flex flex-col gap-6">
          {/* Like Button */}
          <button
            onClick={() => likeMutation.mutate(currentVideo.id)}
            disabled={likeMutation.isPending}
            className="flex flex-col items-center gap-1 hover-elevate p-2"
            data-testid="button-like-feed"
          >
            <Heart className="w-8 h-8 text-white" fill="white" />
            <span className="text-white text-xs font-bold">{currentVideo.likeCount || 0}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleWatchVideo}
            className="flex flex-col items-center gap-1 hover-elevate p-2"
            data-testid="button-comment-feed"
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 hover-elevate p-2"
            data-testid="button-share-feed"
          >
            <Share2 className="w-8 h-8 text-white" />
          </button>

          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex flex-col items-center gap-1 hover-elevate p-2"
            data-testid="button-mute-feed"
          >
            {isMuted ? (
              <VolumeX className="w-8 h-8 text-white" />
            ) : (
              <Volume2 className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        {/* Navigation - Top Right Corner */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {currentVideoIndex > 0 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handlePrevVideo}
              className="bg-white/20 hover:bg-white/30 text-white"
              data-testid="button-prev-video"
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
          )}

          {currentVideoIndex < filteredVideos.length - 1 && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleNextVideo}
              className="bg-white/20 hover:bg-white/30 text-white"
              data-testid="button-next-video"
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Counter - Top Right */}
        <div className="absolute top-20 right-4 z-10">
          <p className="text-white font-bold text-center" data-testid="text-video-counter">
            {String(currentVideoIndex + 1).padStart(3, "0")}
          </p>
        </div>
      </div>
    </div>
  );
}
