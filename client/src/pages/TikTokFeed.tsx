import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Share2, Play, X, VolumeX, Volume2, Check, UserPlus, UserCheck, Trophy, Grid3X3, CheckCircle, XCircle } from "lucide-react";
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
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [creators, setCreators] = useState<{ [key: string]: { firstName: string; lastName: string } }>({});
  const [videoStats, setVideoStats] = useState<{ [key: string]: { likeCount: number; voteCount: number } }>({});
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedVideoForShare, setSelectedVideoForShare] = useState<{ id: string; title: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "disqualified">("all");
  const [activePhase, setActivePhase] = useState<{ id: string; name: string } | null>(null);
  const lastScrollTime = useRef(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Fetch all categories and videos
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  // Fetch active phase
  useEffect(() => {
    const fetchActivePhase = async () => {
      try {
        const response = await fetch("/api/phases/active");
        if (response.ok) {
          const phase = await response.json();
          setActivePhase({ id: phase.id, name: phase.name });
        }
      } catch (err) {
        console.error("Failed to fetch active phase:", err);
      }
    };
    fetchActivePhase();
  }, []);

  // Fetch all videos from all categories
  useEffect(() => {
    if (categories.length === 0) return;

    const fetchAllVideos = async () => {
      const videos: Video[] = [];
      
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
      
      setAllVideos(videos);
    };

    fetchAllVideos();
  }, [categories]);

  // Filter videos based on selected category and status
  const filteredVideos = useMemo(() => {
    let filtered = allVideos;
    
    if (selectedCategory) {
      filtered = filtered.filter(v => v.categoryId === selectedCategory);
    }
    
    if (selectedStatus === "active") {
      filtered = filtered.filter(v => v.status === "active" || v.status === "approved");
    } else if (selectedStatus === "disqualified") {
      filtered = filtered.filter(v => v.status === "disqualified" || v.status === "rejected");
    }
    
    return filtered;
  }, [allVideos, selectedCategory, selectedStatus]);

  // Reset currentVideoIndex when filters change and auto-play first video
  useEffect(() => {
    setCurrentVideoIndex(0);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [selectedCategory, selectedStatus]);

  // Auto-play first video on initial load or when filtered videos change
  useEffect(() => {
    if (filteredVideos.length > 0) {
      setTimeout(() => {
        const firstVideo = videoRefs.current.get(filteredVideos[0]?.id);
        if (firstVideo) {
          firstVideo.play().catch(() => {});
        }
      }, 100);
    }
  }, [filteredVideos.length]);

  // Lazy load metadata for nearby videos as user scrolls
  useEffect(() => {
    if (filteredVideos.length === 0) return;
    
    const indicesToFetch: number[] = [];
    
    // Load current and next 2 videos
    for (let i = currentVideoIndex; i < Math.min(currentVideoIndex + 3, filteredVideos.length); i++) {
      indicesToFetch.push(i);
    }
    
    if (indicesToFetch.length > 0) {
      const fetchMetadata = async () => {
        const usersToFetch = new Set<string>();
        const videosToFetch: Video[] = [];
        
        indicesToFetch.forEach((idx) => {
          if (filteredVideos[idx]) {
            usersToFetch.add(filteredVideos[idx].userId);
            videosToFetch.push(filteredVideos[idx]);
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
  }, [currentVideoIndex, filteredVideos]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollToVideo(Math.max(0, currentVideoIndex - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollToVideo(Math.min(filteredVideos.length - 1, currentVideoIndex + 1));
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
  }, [currentVideoIndex, filteredVideos.length, isMuted, setLocation]);

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
      if (key !== filteredVideos[index]?.id) {
        video.pause();
      }
    });

    // Play current video
    const currentVideo = videoRefs.current.get(filteredVideos[index]?.id);
    if (currentVideo) {
      currentVideo.play().catch(() => {});
    }
  }, [filteredVideos]);

  // Wheel scroll handler (desktop)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 300) return;

      if (e.deltaY > 0) {
        scrollToVideo(Math.min(filteredVideos.length - 1, currentVideoIndex + 1));
      } else if (e.deltaY < 0) {
        scrollToVideo(Math.max(0, currentVideoIndex - 1));
      }
    };

    const container = containerRef.current;
    container?.addEventListener("wheel", handleWheel, { passive: true });
    return () => container?.removeEventListener("wheel", handleWheel);
  }, [currentVideoIndex, filteredVideos.length, scrollToVideo]);

  // Scroll handler (mobile and desktop) - debounced for performance
  useEffect(() => {
    if (!containerRef.current || filteredVideos.length === 0) return;

    const handleScroll = () => {
      // Mark as scrolling
      isScrolling.current = true;
      
      // Debounce scroll detection
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        // Find which video is most visible
        let mostVisibleIndex = 0;
        let maxVisibility = 0;

        Array.from(container.children).forEach((child, index) => {
          if (index === container.children.length - 1) return; // Skip spacer
          const element = child as HTMLElement;
          const rect = element.getBoundingClientRect();
          // Calculate how much of the video is visible
          const visibility = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
          
          if (visibility > maxVisibility) {
            maxVisibility = visibility;
            mostVisibleIndex = index;
          }
        });

        // Update current video index only if it changed significantly
        if (mostVisibleIndex !== currentVideoIndex) {
          setCurrentVideoIndex(mostVisibleIndex);

          // Pause all other videos
          videoRefs.current.forEach((video, key) => {
            if (key !== filteredVideos[mostVisibleIndex]?.id) {
              video.pause();
            }
          });

          // Play current video
          const currentVideo = videoRefs.current.get(filteredVideos[mostVisibleIndex]?.id);
          if (currentVideo && currentVideo.paused) {
            currentVideo.play().catch(() => {});
          }
        }
        
        // Mark scroll complete
        isScrolling.current = false;
      }, 50); // Debounce by 50ms
    };

    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout.current);
      container?.removeEventListener("scroll", handleScroll);
    };
  }, [filteredVideos, currentVideoIndex]);

  const togglePlayPause = () => {
    // Ignore clicks during scrolling on mobile
    if (isScrolling.current) return;
    
    const currentVideo = videoRefs.current.get(filteredVideos[currentVideoIndex]?.id);
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play().catch(() => {});
      } else {
        currentVideo.pause();
      }
    }
  };

  const handleDoubleClick = (videoId: string) => {
    // Ignore double clicks during scrolling on mobile
    if (isScrolling.current) return;
    
    const newLiked = new Set(liked);
    if (newLiked.has(videoId)) {
      newLiked.delete(videoId);
    } else {
      newLiked.add(videoId);
    }
    setLiked(newLiked);
  };

  const handleFollow = async (creatorId: string) => {
    if (!user) {
      toast({
        title: "Not Logged In",
        description: "Please log in to follow creators.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newFollowing = new Set(following);
      
      if (newFollowing.has(creatorId)) {
        // Unfollow
        await fetch(`/api/users/${creatorId}/unfollow`, { method: "POST" });
        newFollowing.delete(creatorId);
        toast({
          title: "Unfollowed",
          description: "You unfollowed this creator.",
        });
      } else {
        // Follow
        await fetch(`/api/users/${creatorId}/follow`, { method: "POST" });
        newFollowing.add(creatorId);
        toast({
          title: "Following",
          description: "You are now following this creator.",
        });
      }
      
      setFollowing(newFollowing);
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status.",
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (allVideos.length === 0) {
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
    <div className="h-screen w-full bg-black flex flex-col">
      {/* Top navigation bar - Competition arrangement */}
      <div className="z-50 bg-gradient-to-b from-black/80 to-transparent p-3 safe-area-top flex-shrink-0">
        {/* Top row: Close, Phase badge, Mute */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            data-testid="button-toggle-mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          {/* Active Phase Badge */}
          {activePhase && (
            <Badge 
              variant="secondary" 
              className="bg-yellow-500/90 text-black font-bold px-3 py-1"
              data-testid="badge-active-phase"
            >
              <Trophy className="w-4 h-4 mr-1" />
              {activePhase.name}
            </Badge>
          )}
          
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            data-testid="button-close-feed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category pills - wrap on mobile, scroll on desktop */}
        <div className="flex flex-wrap gap-1 sm:gap-2 sm:overflow-x-auto sm:scrollbar-hide pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedCategory === null
                ? "bg-red-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            data-testid="button-category-all"
          >
            <Grid3X3 className="w-3 h-3" />
            <span className="hidden sm:inline">All Categories</span>
            <span className="sm:hidden">All</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === category.id
                  ? "bg-red-600 text-white"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
              data-testid={`button-category-${category.id}`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Status filter buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === "all"
                ? "bg-white text-black"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            data-testid="button-status-all"
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus("active")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === "active"
                ? "bg-green-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            data-testid="button-status-active"
          >
            <CheckCircle className="w-3 h-3" />
            Active
          </button>
          <button
            onClick={() => setSelectedStatus("disqualified")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedStatus === "disqualified"
                ? "bg-red-800 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
            data-testid="button-status-disqualified"
          >
            <XCircle className="w-3 h-3" />
            Disqualified
          </button>
        </div>
      </div>

      {/* Empty state when no videos match filters */}
      {filteredVideos.length === 0 ? (
        <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
          <div className="text-center text-white">
            <XCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No videos found</p>
            <p className="text-white/70 text-sm">
              Try selecting a different category or status filter
            </p>
          </div>
        </div>
      ) : (
        /* Video container */
        <div
          ref={containerRef}
          className="flex-1 w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}
        >
          {filteredVideos.map((video, index) => (
            <div
              key={video.id}
              className="h-screen w-full flex-shrink-0 snap-start relative bg-black flex items-center justify-center group overflow-hidden"
              data-testid={`video-container-${index}`}
            >
              {/* Video */}
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(video.id, el);
                }}
                src={video.videoUrl}
                muted={isMuted}
                className="h-full w-full object-cover cursor-pointer"
                onClick={togglePlayPause}
                onDoubleClick={() => handleDoubleClick(video.id)}
                data-testid={`video-${video.id}`}
                onEnded={() => scrollToVideo(Math.min(filteredVideos.length - 1, index + 1))}
              />

              {/* Play button overlay - desktop only */}
              <div
                className="absolute inset-0 hidden sm:flex items-center justify-center cursor-pointer"
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
                    if (isScrolling.current) return;
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
                    if (isScrolling.current) return;
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
                        {user && video.userId !== user.id && (
                          <button
                            onClick={() => {
                              if (isScrolling.current) return;
                              handleFollow(video.userId);
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold whitespace-nowrap transition-colors mt-1"
                            data-testid={`button-follow-${video.userId}`}
                          >
                            {following.has(video.userId) ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Following
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3" />
                                Follow
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Video title and category/status badges */}
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
                      {video.status && (
                        <Badge
                          variant="secondary"
                          className={`text-xs border-0 ${
                            video.status === "active" || video.status === "approved"
                              ? "bg-green-600/80 text-white"
                              : video.status === "disqualified" || video.status === "rejected"
                              ? "bg-red-800/80 text-white"
                              : "bg-yellow-500/80 text-black"
                          }`}
                        >
                          {video.status === "active" || video.status === "approved" ? "Active" : 
                           video.status === "disqualified" || video.status === "rejected" ? "Disqualified" : 
                           video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              {video.videoUrl && (
                <div className="absolute top-36 left-1/2 -translate-x-1/2 text-white/50 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Press SPACE to play/pause • ↑↓ to navigate
                </div>
              )}
            </div>
          ))}
          {/* Bottom spacer */}
          <div className="h-[50px] flex-shrink-0"></div>
        </div>
      )}

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
