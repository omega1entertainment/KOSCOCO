import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createPermalink } from "@/lib/slugUtils";
import {
  Heart,
  MessageCircle,
  Share2,
  Gift,
  Vote,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Plus,
  Check,
  ChevronDown,
  Trophy,
  Star,
  BadgeCheck,
  Lock,
  Unlock,
} from "lucide-react";
import type { VideoFeedItem, Competition, Category } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type FeedTab = "following" | "trending" | "exclusive" | "competition";

export default function Feed() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FeedTab>("trending");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("kozzii");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [purchasedVideos, setPurchasedVideos] = useState<Set<string>>(new Set());
  const [previewEnded, setPreviewEnded] = useState<Set<string>>(new Set());

  // Fetch feed videos based on active tab
  const { data: videos = [], isLoading } = useQuery<VideoFeedItem[]>({
    queryKey: queryKeys.feed.byTab(activeTab, selectedCompetition, selectedCategory),
    queryFn: async () => {
      let endpoint = "/api/feed/trending";
      const params = new URLSearchParams();
      
      switch (activeTab) {
        case "following":
          endpoint = "/api/feed/following";
          break;
        case "exclusive":
          endpoint = "/api/feed/exclusive";
          break;
        case "competition":
          endpoint = "/api/feed/competition";
          params.set("competition", selectedCompetition);
          if (selectedCategory) params.set("category", selectedCategory);
          break;
        default:
          endpoint = "/api/feed/trending";
      }
      
      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch feed");
      return response.json();
    },
  });

  // Fetch competitions for dropdown
  const { data: competitions = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
    enabled: activeTab === "competition",
  });

  // Fetch categories for filtering
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: activeTab === "competition",
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest(`/api/videos/${videoId}/like`, "POST");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.byTab(activeTab, selectedCompetition, selectedCategory) });
    },
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async ({ creatorId, action }: { creatorId: string; action: "follow" | "unfollow" }) => {
      const response = await apiRequest(`/api/users/${creatorId}/${action}`, "POST");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.byTab(activeTab, selectedCompetition, selectedCategory) });
    },
  });

  // Purchase exclusive content mutation
  const purchaseMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const response = await apiRequest(`/api/exclusive/${videoId}/purchase`, "POST");
      return response.json();
    },
    onSuccess: (_, videoId) => {
      setPurchasedVideos(prev => new Set(Array.from(prev).concat(videoId)));
      setPreviewEnded(prev => {
        const next = new Set(Array.from(prev));
        next.delete(videoId);
        return next;
      });
      toast({
        title: "Purchase successful!",
        description: "You now have full access to this exclusive content.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message || "Please try again or top up your wallet",
        variant: "destructive",
      });
    },
  });

  // Handle exclusive content preview timer
  const handleVideoTimeUpdate = useCallback((video: VideoFeedItem, currentTime: number) => {
    if (video.isExclusive && !purchasedVideos.has(video.id) && currentTime >= 5) {
      setPreviewEnded(prev => new Set(Array.from(prev).concat(video.id)));
      const videoEl = videoRefs.current.get(videos.findIndex(v => v.id === video.id));
      if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 5;
      }
    }
  }, [purchasedVideos, videos]);

  const handlePurchase = (video: VideoFeedItem) => {
    if (!user) {
      login();
      return;
    }
    purchaseMutation.mutate(video.id);
  };

  // Handle vertical swipe navigation
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < videos.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, videos.length]);

  // Handle video playback based on current index
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === currentIndex) {
        if (isPlaying) {
          video.play().catch(() => {});
        }
        video.muted = isMuted;
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying, isMuted]);

  // Scroll to specific video index
  const scrollToIndex = (index: number) => {
    if (containerRef.current && index >= 0 && index < videos.length) {
      containerRef.current.scrollTo({
        top: index * containerRef.current.clientHeight,
        behavior: "smooth",
      });
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < videos.length - 1) {
            scrollToIndex(currentIndex + 1);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            scrollToIndex(currentIndex - 1);
          }
          break;
        case " ":
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case "m":
          setIsMuted(!isMuted);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, videos.length, isPlaying, isMuted]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    const swipeThreshold = 50;

    if (swipeDistance > swipeThreshold && currentIndex < videos.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else if (swipeDistance < -swipeThreshold && currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }

    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  const handleLike = (videoId: string) => {
    if (!user) {
      login();
      return;
    }
    likeMutation.mutate(videoId);
  };

  const handleFollow = (creatorId: string, isFollowing: boolean) => {
    if (!user) {
      login();
      return;
    }
    followMutation.mutate({ creatorId, action: isFollowing ? "unfollow" : "follow" });
  };

  const handleShare = async (video: VideoFeedItem) => {
    const url = `${window.location.origin}/video/${createPermalink(video.id, video.title)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "Video link copied to clipboard" });
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleGift = (video: VideoFeedItem) => {
    if (!user) {
      login();
      return;
    }
    setLocation(`/gift/${video.id}`);
  };

  const handleVote = (video: VideoFeedItem) => {
    if (!user) {
      login();
      return;
    }
    setLocation(`/vote/${video.id}`);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith(".private/")) {
      return `/objects/${url.replace(".private/", "")}`;
    }
    return url;
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      {/* Top Navigation Tabs */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-center items-center py-4 px-2 md:px-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-0 md:gap-1 max-w-full overflow-x-auto scrollbar-hide justify-center">
          <Button
            variant={activeTab === "following" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("following")}
            className={`text-white ${activeTab === "following" ? "bg-primary" : "hover:bg-white/20"}`}
            data-testid="tab-following"
          >
            Following
          </Button>
          <Button
            variant={activeTab === "trending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("trending")}
            className={`text-white ${activeTab === "trending" ? "bg-primary" : "hover:bg-white/20"}`}
            data-testid="tab-trending"
          >
            Trending
          </Button>
          <Button
            variant={activeTab === "exclusive" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("exclusive")}
            className={`text-white ${activeTab === "exclusive" ? "bg-primary" : "hover:bg-white/20"}`}
            data-testid="tab-exclusive"
          >
            Exclusive
          </Button>
          
          {/* Competition Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={activeTab === "competition" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("competition")}
                className={`text-white ${activeTab === "competition" ? "bg-primary" : "hover:bg-white/20"}`}
                data-testid="tab-competition"
              >
                <Trophy className="w-4 h-4 mr-1" />
                Competition
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select Competition</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {competitions.map((comp) => (
                <DropdownMenuItem
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompetition(comp.slug);
                    setActiveTab("competition");
                  }}
                  className={selectedCompetition === comp.slug ? "bg-accent" : ""}
                  data-testid={`competition-${comp.slug}`}
                >
                  {comp.name}
                  {comp.status === "active" && (
                    <Badge variant="secondary" className="ml-2 text-xs">Live</Badge>
                  )}
                </DropdownMenuItem>
              ))}
              {activeTab === "competition" && categories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setSelectedCategory(null)}
                    className={!selectedCategory ? "bg-accent" : ""}
                  >
                    All Categories
                  </DropdownMenuItem>
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={selectedCategory === cat.id ? "bg-accent" : ""}
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Video Feed Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide touch-pan-y"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollSnapType: "y mandatory" }}
        data-testid="feed-container"
      >
        {videos.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-semibold mb-2">
                {activeTab === "following" 
                  ? "Follow creators to see their videos"
                  : "No videos available"}
              </p>
              <p className="text-sm opacity-70">
                {activeTab === "following"
                  ? "Explore trending videos to find creators you love"
                  : "Check back later for new content"}
              </p>
              {activeTab === "following" && (
                <Button
                  className="mt-4"
                  onClick={() => setActiveTab("trending")}
                  data-testid="button-explore-trending"
                >
                  Explore Trending
                </Button>
              )}
            </div>
          </div>
        ) : (
          videos.map((video, index) => (
            <div
              key={video.id}
              className="h-full w-full snap-start snap-always relative flex items-center justify-center"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Video Player */}
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(index, el);
                }}
                src={getMediaUrl(video.videoUrl)}
                className="h-full w-full object-contain"
                loop={!video.isExclusive || purchasedVideos.has(video.id)}
                playsInline
                muted={isMuted}
                onClick={() => setIsPlaying(!isPlaying)}
                onTimeUpdate={(e) => handleVideoTimeUpdate(video, e.currentTarget.currentTime)}
                data-testid={`video-player-${video.id}`}
              />

              {/* Exclusive Badge */}
              {video.isExclusive && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-yellow-500/90 text-black font-semibold">
                    {purchasedVideos.has(video.id) ? (
                      <><Unlock className="w-3 h-3 mr-1" /> Unlocked</>
                    ) : (
                      <><Lock className="w-3 h-3 mr-1" /> Exclusive ${((video.exclusivePrice || 0) / 100).toFixed(2)}</>
                    )}
                  </Badge>
                </div>
              )}

              {/* Exclusive Content Paywall Overlay */}
              {video.isExclusive && !purchasedVideos.has(video.id) && previewEnded.has(video.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md" data-testid={`paywall-${video.id}`}>
                  <div className="text-center px-6 max-w-sm">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-10 h-10 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Exclusive Content</h3>
                    <p className="text-gray-300 mb-4">
                      Your 5-second preview has ended. Unlock full access to this exclusive video.
                    </p>
                    <div className="text-3xl font-bold text-yellow-400 mb-4">
                      ${((video.exclusivePrice || 0) / 100).toFixed(2)}
                    </div>
                    <Button
                      size="lg"
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold w-full"
                      onClick={() => handlePurchase(video)}
                      disabled={purchaseMutation.isPending}
                      data-testid={`button-purchase-${video.id}`}
                    >
                      {purchaseMutation.isPending ? "Processing..." : "Unlock Now"}
                    </Button>
                    <p className="text-xs text-gray-400 mt-3">
                      65% goes directly to the creator
                    </p>
                  </div>
                </div>
              )}

              {/* Play/Pause Overlay */}
              {!isPlaying && currentIndex === index && !previewEnded.has(video.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Right Side Actions */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5">
                {/* Creator Avatar */}
                <div className="relative">
                  <Avatar 
                    className="w-12 h-12 border-2 border-white cursor-pointer"
                    onClick={() => setLocation(`/creator/${video.creator.id}`)}
                  >
                    <AvatarImage src={video.creator.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary text-white">
                      {video.creator.firstName[0]}{video.creator.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Verification Badge */}
                  {(video.creator.blueTick || video.creator.redStar) && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                      {video.creator.redStar ? (
                        <Star className="w-4 h-4 text-red-500 fill-red-500" data-testid="badge-red-star" />
                      ) : (
                        <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" data-testid="badge-blue-tick" />
                      )}
                    </div>
                  )}
                  {!video.isFollowing && user?.id !== video.creator.id && (
                    <button
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      onClick={() => handleFollow(video.creator.id, video.isFollowing)}
                      data-testid={`button-follow-${video.id}`}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                {/* Like Button */}
                <button
                  className="flex flex-col items-center"
                  onClick={() => handleLike(video.id)}
                  data-testid={`button-like-${video.id}`}
                >
                  <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ${video.isLiked ? "text-red-500" : "text-white"}`}>
                    <Heart className={`w-7 h-7 ${video.isLiked ? "fill-current" : ""}`} />
                  </div>
                  <span className="text-white text-xs mt-1">{formatCount(video.likeCount)}</span>
                </button>

                {/* Comment Button */}
                <button
                  className="flex flex-col items-center"
                  onClick={() => setLocation(`/video/${createPermalink(video.id, video.title)}`)}
                  data-testid={`button-comment-${video.id}`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <MessageCircle className="w-7 h-7" />
                  </div>
                  <span className="text-white text-xs mt-1">Comments</span>
                </button>

                {/* Gift Button */}
                <button
                  className="flex flex-col items-center"
                  onClick={() => handleGift(video)}
                  data-testid={`button-gift-${video.id}`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-yellow-400">
                    <Gift className="w-7 h-7" />
                  </div>
                  <span className="text-white text-xs mt-1">{formatCount(video.giftCount)}</span>
                </button>

                {/* Vote Button (for competition videos) */}
                {activeTab === "competition" && (
                  <button
                    className="flex flex-col items-center"
                    onClick={() => handleVote(video)}
                    data-testid={`button-vote-${video.id}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center text-white animate-pulse">
                      <Vote className="w-7 h-7" />
                    </div>
                    <span className="text-white text-xs mt-1">{formatCount(video.voteCount)}</span>
                  </button>
                )}

                {/* Share Button */}
                <button
                  className="flex flex-col items-center"
                  onClick={() => handleShare(video)}
                  data-testid={`button-share-${video.id}`}
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Share2 className="w-7 h-7" />
                  </div>
                  <span className="text-white text-xs mt-1">Share</span>
                </button>
              </div>

              {/* Bottom Info */}
              <div className="absolute left-4 right-24 bottom-8">
                {/* Creator Info */}
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-white font-bold cursor-pointer"
                    onClick={() => setLocation(`/creator/${video.creator.id}`)}
                  >
                    @{video.creator.username || `${video.creator.firstName}${video.creator.lastName}`}
                  </span>
                  {video.creator.blueTick && (
                    <BadgeCheck className="w-4 h-4 text-blue-500" />
                  )}
                  {video.creator.redStar && (
                    <Star className="w-4 h-4 text-red-500 fill-current" />
                  )}
                  {video.isFollowing ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs border-white/50 text-white hover:bg-white/20"
                      onClick={() => handleFollow(video.creator.id, true)}
                    >
                      <Check className="w-3 h-3 mr-1" /> Following
                    </Button>
                  ) : user?.id !== video.creator.id && (
                    <Button
                      size="sm"
                      className="h-6 text-xs bg-primary hover:bg-primary/90"
                      onClick={() => handleFollow(video.creator.id, false)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Follow
                    </Button>
                  )}
                </div>

                {/* Video Title & Description */}
                <h3 className="text-white font-semibold text-lg mb-1">{video.title}</h3>
                {video.description && (
                  <p className="text-white/80 text-sm line-clamp-2">{video.description}</p>
                )}

                {/* Exclusive Badge */}
                {video.isExclusive && (
                  <Badge className="mt-2 bg-yellow-500 text-black">
                    Exclusive • {video.exclusivePrice ? `$${(video.exclusivePrice / 100).toFixed(2)}` : "Premium"}
                  </Badge>
                )}

                {/* Competition Badge */}
                {activeTab === "competition" && (
                  <Badge variant="outline" className="mt-2 border-primary text-primary">
                    <Trophy className="w-3 h-3 mr-1" />
                    {selectedCompetition.toUpperCase()}
                  </Badge>
                )}
              </div>

              {/* Sound Toggle */}
              <button
                className="absolute right-4 top-20 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
                onClick={() => setIsMuted(!isMuted)}
                data-testid="button-mute-toggle"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6">
        <Button
          size="icon"
          className="rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 text-white"
          onClick={() => setLocation("/koscoco")}
          data-testid="button-koscoco-link"
          title="Visit KOSCOCO"
        >
          <Trophy className="w-6 h-6" />
        </Button>
        <Button
          size="icon"
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 text-white"
          onClick={() => setLocation("/upload")}
          data-testid="button-upload"
          title="Upload Video"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
