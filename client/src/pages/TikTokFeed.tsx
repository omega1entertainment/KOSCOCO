import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Share2, Play, X, VolumeX, Volume2, Check } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import type { Video, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import VotePaymentModal from "@/components/VotePaymentModal";
import ShareModal from "@/components/ShareModal";

export default function TikTokFeed() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [creators, setCreators] = useState<{ [key: string]: { firstName: string; lastName: string } }>({});
  const [videoStats, setVideoStats] = useState<{ [key: string]: { likeCount: number; voteCount: number } }>({});
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideoForShare, setSelectedVideoForShare] = useState<{ id: string; title: string } | null>(null);
  const lastScrollTime = useRef(0);

  // Fetch all categories and videos
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  // Fetch all videos from all categories (lazy load)
  useEffect(() => {
    if (categories.length === 0) return;

    const fetchAllVideos = async () => {
      const allVideos: Video[] = [];
      const userIds = new Set<string>();
      
      for (const category of categories) {
        try {
          const response = await fetch(`/api/videos/category/${category.id}`);
          if (response.ok) {
            const categoryVideos = await response.json();
            allVideos.push(...categoryVideos);
            categoryVideos.forEach((video: Video) => {
              userIds.add(video.userId);
            });
          }
        } catch (err) {
          console.error(`Failed to fetch videos for category ${category.id}:`, err);
        }
      }
      
      setVideos(allVideos);

      // Fetch creator info and stats for videos near current index
      const fetchMetadata = async (videoIndices: number[]) => {
        const usersToFetch = new Set<string>();
        const videosToFetch: Video[] = [];
        
        videoIndices.forEach((idx) => {
          if (allVideos[idx]) {
            usersToFetch.add(allVideos[idx].userId);
            videosToFetch.push(allVideos[idx]);
          }
        });

        // Fetch creator info
        const creatorMap: { [key: string]: { firstName: string; lastName: string } } = {};
        for (const userId of Array.from(usersToFetch)) {
          try {
            const response = await fetch(`/api/users/${userId}`);
            if (response.ok) {
              const userData = await response.json();
              creatorMap[userId] = {
                firstName: userData.firstName || "",
                lastName: userData.lastName || ""
              };
            }
          } catch (err) {
            console.error(`Failed to fetch user ${userId}:`, err);
          }
        }

        // Fetch video stats
        const statsMap: { [key: string]: { likeCount: number; voteCount: number } } = {};
        for (const video of videosToFetch) {
          try {
            const [likeRes, voteRes] = await Promise.all([
              fetch(`/api/likes/video/${video.id}`),
              fetch(`/api/votes/video/${video.id}`)
            ]);
            
            const likeData = likeRes.ok ? await likeRes.json() : { likeCount: 0 };
            const voteData = voteRes.ok ? await voteRes.json() : { voteCount: 0 };
            
            statsMap[video.id] = {
              likeCount: likeData.likeCount || 0,
              voteCount: voteData.voteCount || 0
            };
          } catch (err) {
            statsMap[video.id] = { likeCount: 0, voteCount: 0 };
          }
        }

        setCreators((prev) => ({ ...prev, ...creatorMap }));
        setVideoStats((prev) => ({ ...prev, ...statsMap }));
      };

      // Fetch metadata for first 3 videos immediately
      fetchMetadata([0, 1, 2]);
    };

    fetchAllVideos();
  }, [categories]);

  // Lazy load metadata for nearby videos as user scrolls
  useEffect(() => {
    const indicesToFetch: number[] = [];
    
    // Load current and next 2 videos
    for (let i = currentVideoIndex; i < Math.min(currentVideoIndex + 3, videos.length); i++) {
      indicesToFetch.push(i);
    }
    
    if (indicesToFetch.length > 0) {
      const fetchMetadata = async () => {
        const usersToFetch = new Set<string>();
        const videosToFetch: Video[] = [];
        
        indicesToFetch.forEach((idx) => {
          if (videos[idx]) {
            usersToFetch.add(videos[idx].userId);
            videosToFetch.push(videos[idx]);
          }
        });

        // Fetch creator info
        for (const userId of Array.from(usersToFetch)) {
          if (!creators[userId]) {
            try {
              const response = await fetch(`/api/users/${userId}`);
              if (response.ok) {
                const userData = await response.json();
                setCreators((prev) => ({
                  ...prev,
                  [userId]: {
                    firstName: userData.firstName || "",
                    lastName: userData.lastName || ""
                  }
                }));
              }
            } catch (err) {
              console.error(`Failed to fetch user ${userId}:`, err);
            }
          }
        }

        // Fetch video stats
        for (const video of videosToFetch) {
          if (!videoStats[video.id]) {
            try {
              const [likeRes, voteRes] = await Promise.all([
                fetch(`/api/likes/video/${video.id}`),
                fetch(`/api/votes/video/${video.id}`)
              ]);
              
              const likeData = likeRes.ok ? await likeRes.json() : { likeCount: 0 };
              const voteData = voteRes.ok ? await voteRes.json() : { voteCount: 0 };
              
              setVideoStats((prev) => ({
                ...prev,
                [video.id]: {
                  likeCount: likeData.likeCount || 0,
                  voteCount: voteData.voteCount || 0
                }
              }));
            } catch (err) {
              console.error(`Failed to fetch stats for video ${video.id}:`, err);
            }
          }
        }
      };

      fetchMetadata();
    }
  }, [currentVideoIndex, videos]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToVideo(Math.max(0, currentVideoIndex - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollToVideo(Math.min(videos.length - 1, currentVideoIndex + 1));
      } else if (e.key === " ") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m") {
        setIsMuted(!isMuted);
      } else if (e.key === "Escape") {
        setLocation("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentVideoIndex, videos.length, isMuted, setLocation]);

  // Scroll to specific video
  const scrollToVideo = useCallback((index: number) => {
    if (!containerRef.current) return;
    const now = Date.now();
    if (now - lastScrollTime.current < 300) return;
    lastScrollTime.current = now;

    setCurrentVideoIndex(index);
    const videoElement = containerRef.current.children[index];
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Pause all other videos
    videoRefs.current.forEach((video, key) => {
      if (key !== videos[index]?.id) {
        video.pause();
      }
    });

    // Play current video
    const currentVideo = videoRefs.current.get(videos[index]?.id);
    if (currentVideo) {
      currentVideo.play().catch(() => {});
    }
  }, [videos]);

  // Wheel scroll handler
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 300) return;

      if (e.deltaY > 0) {
        scrollToVideo(Math.min(videos.length - 1, currentVideoIndex + 1));
      } else if (e.deltaY < 0) {
        scrollToVideo(Math.max(0, currentVideoIndex - 1));
      }
    };

    const container = containerRef.current;
    container?.addEventListener("wheel", handleWheel, { passive: true });
    return () => container?.removeEventListener("wheel", handleWheel);
  }, [currentVideoIndex, videos.length, scrollToVideo]);

  const togglePlayPause = () => {
    const currentVideo = videoRefs.current.get(videos[currentVideoIndex]?.id);
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play().catch(() => {});
      } else {
        currentVideo.pause();
      }
    }
  };

  const handleDoubleClick = (videoId: string) => {
    const newLiked = new Set(liked);
    if (newLiked.has(videoId)) {
      newLiked.delete(videoId);
    } else {
      newLiked.add(videoId);
    }
    setLiked(newLiked);
  };

  if (videos.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black overflow-hidden relative">
      {/* Close button */}
      <button
        onClick={() => setLocation("/")}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        data-testid="button-close-feed"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Mute button */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        data-testid="button-toggle-mute"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      {/* Video container */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="h-screen w-full flex-shrink-0 snap-start relative bg-black flex items-center justify-center group"
            data-testid={`video-container-${index}`}
          >
            {/* Video */}
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(video.id, el);
              }}
              src={video.videoUrl}
              muted={isMuted}
              className="h-full w-full object-contain cursor-pointer"
              onClick={togglePlayPause}
              onDoubleClick={() => handleDoubleClick(video.id)}
              data-testid={`video-${video.id}`}
              onEnded={() => scrollToVideo(Math.min(videos.length - 1, index + 1))}
            />

            {/* Play button overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlayPause}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center backdrop-blur">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </div>
            </div>

            {/* Right sidebar - interactions */}
            <div className="absolute right-2 sm:right-4 bottom-24 sm:bottom-20 z-40 flex flex-col items-center gap-4 sm:gap-6">
              {/* Like button */}
              <button
                onClick={() => handleDoubleClick(video.id)}
                className={`flex flex-col items-center gap-2 transition-transform hover:scale-110 ${
                  liked.has(video.id) ? "text-red-500" : "text-white"
                }`}
                data-testid={`button-like-${video.id}`}
              >
                <ThumbsUp
                  className={`w-8 h-8 ${liked.has(video.id) ? "fill-current" : ""}`}
                />
                <span className="text-xs">{videoStats[video.id]?.likeCount || 0}</span>
              </button>

              {/* Vote button */}
              <button
                onClick={() => {
                  setSelectedVideo({ id: video.id, title: video.title });
                  setVoteModalOpen(true);
                }}
                className="flex flex-col items-center gap-2 transition-transform hover:scale-110 text-white"
                data-testid={`button-vote-${video.id}`}
              >
                <Check className="w-8 h-8" />
                <span className="text-xs">{videoStats[video.id]?.voteCount || 0}</span>
              </button>

              {/* Share button */}
              <button
                onClick={() => {
                  setSelectedVideoForShare({ id: video.id, title: video.title });
                  setShareModalOpen(true);
                }}
                className="flex flex-col items-center gap-2 transition-transform hover:scale-110 text-white"
                data-testid={`button-share-${video.id}`}
              >
                <Share2 className="w-8 h-8" />
              </button>
            </div>

            {/* Bottom info - creator and video details */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8 sm:pb-6 safe-area-bottom">
              <div className="flex items-end gap-3">
                {/* Creator info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10 border-2 border-white">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {creators[video.userId]?.firstName?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {creators[video.userId]
                          ? `${creators[video.userId].firstName} ${creators[video.userId].lastName}`.trim()
                          : "Creator"}
                      </p>
                      <p className="text-white/70 text-xs">
                        {video.views || 0} views
                      </p>
                    </div>
                  </div>

                  {/* Video title and category */}
                  <p className="text-white text-sm mb-2 line-clamp-2">
                    {video.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {video.categoryId && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/20 text-white border-0"
                      >
                        {categories.find((c) => c.id === video.categoryId)?.name ||
                          "Category"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading indicator */}
            {video.videoUrl && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Press SPACE to play/pause • ↑↓ to navigate
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Vote modal */}
      {selectedVideo && (
        <VotePaymentModal
          open={voteModalOpen}
          onOpenChange={setVoteModalOpen}
          videoId={selectedVideo.id}
          videoTitle={selectedVideo.title}
        />
      )}

      {/* Share modal */}
      {selectedVideoForShare && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          videoId={selectedVideoForShare.id}
          videoTitle={selectedVideoForShare.title}
        />
      )}

      {/* Hide scrollbar styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
