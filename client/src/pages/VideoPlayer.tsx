import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useVideoMetaTags } from "@/hooks/useVideoMetaTags";
import VotePaymentModal from "@/components/VotePaymentModal";
import { ReportDialog } from "@/components/ReportDialog";
import { 
  ArrowLeft, 
  Check, 
  ThumbsUp,
  Eye, 
  Share2, 
  Flag, 
  AlertTriangle, 
  ExternalLink, 
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Send,
  X,
  UserPlus,
  UserCheck,
  Grid3X3,
  Copy,
  Link,
  Search,
  Home
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp, SiTelegram, SiInstagram, SiTiktok, SiYoutube, SiLinkedin, SiPinterest, SiReddit, SiSnapchat, SiDiscord } from "react-icons/si";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Video, Category, CommentWithUser, VideoWithStats } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { extractIdFromPermalink, createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  isNeighbor: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  user: any;
  category?: Category;
  voteCount: number;
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  isFollowing: boolean;
  followersCount: number;
  creatorName: string;
  onVote: () => void;
  onLike: (isCurrentlyLiked: boolean) => void;
  onShare: () => void;
  onReport: () => void;
  onOpenComments: () => void;
  onFollow: () => void;
  onWatchProgress: (duration: number, completed: boolean) => void;
}

function VideoItem({
  video,
  isActive,
  isNeighbor,
  isMuted,
  onToggleMute,
  user,
  category,
  voteCount,
  likeCount,
  isLiked,
  commentCount,
  isFollowing,
  followersCount,
  creatorName,
  onVote,
  onLike,
  onShare,
  onReport,
  onOpenComments,
  onFollow,
  onWatchProgress,
}: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const hasRecordedWatchRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  // Use React Query for CDN URL caching - prevents re-fetching on re-renders
  const { data: cdnData } = useQuery<{ videoUrl?: string; thumbnailUrl?: string }>({
    queryKey: ['/api/videos', video.id, 'cdn-url'],
    queryFn: async () => {
      const res = await fetch(`/api/videos/${video.id}/cdn-url`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: isActive || isNeighbor,
    staleTime: Infinity, // CDN URLs don't change, cache forever
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });

  // Mobile optimization: neighbors also preload "auto" to reduce buffering time
  const preloadValue = isActive || isNeighbor ? "auto" : "metadata";
  const fallbackVideoUrl = (video as any).compressedVideoUrl || video.videoUrl;
  
  // Use CDN URL if available, otherwise fall back to proxy URL
  const videoUrl = cdnData?.videoUrl || fallbackVideoUrl;
  const thumbnailUrl = cdnData?.thumbnailUrl || video.thumbnailUrl;

  // Lazy loading: Only load video when it's in or near viewport
  // Keep videos mounted once loaded to avoid re-downloading on scroll back
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Load immediately if active or neighbor
    if (isActive || isNeighbor) {
      setShouldLoadVideo(true);
      hasLoadedOnceRef.current = true;
      return;
    }

    // If already loaded once, keep it mounted (don't unload on scroll away)
    if (hasLoadedOnceRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadVideo(true);
            hasLoadedOnceRef.current = true;
          }
          // Don't unmount videos once loaded - keeps them cached for faster replay
        });
      },
      {
        rootMargin: '1200px 0px', // Mobile optimization: larger prefetch window for smoother scrolling
        threshold: 0,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isActive, isNeighbor]);

  useEffect(() => {
    if (!videoRef.current || !shouldLoadVideo) return;

    if (isActive) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      hasRecordedWatchRef.current = false;
    }
  }, [isActive, shouldLoadVideo]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!videoRef.current || !isActive || !user) return;

    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      if (hasRecordedWatchRef.current) return;

      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      const watchThreshold = Math.min(30, duration * 0.5);
      
      if (currentTime >= watchThreshold) {
        hasRecordedWatchRef.current = true;
        onWatchProgress(Math.floor(currentTime), false);
      }
    };

    const handleEnded = () => {
      if (!hasRecordedWatchRef.current) {
        hasRecordedWatchRef.current = true;
        onWatchProgress(Math.floor(videoElement.duration), true);
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [isActive, user, onWatchProgress]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div ref={containerRef} className="h-full w-full relative bg-black flex items-center justify-center">
      {/* Thumbnail placeholder - shown until video is playing */}
      {thumbnailUrl && (
        <img 
          src={thumbnailUrl} 
          alt=""
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${isPlaying && shouldLoadVideo ? 'opacity-0' : 'opacity-100'}`}
        />
      )}
      
      {/* Video element - only loads source when shouldLoadVideo is true */}
      {shouldLoadVideo ? (
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          loop
          muted={isMuted}
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          preload={preloadValue}
          poster={thumbnailUrl || undefined}
          onClick={togglePlay}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
          onLoadedMetadata={() => setIsLoading(false)}
          data-testid={`video-player-${video.id}`}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div 
          className="h-full w-full flex items-center justify-center cursor-pointer"
          onClick={() => setShouldLoadVideo(true)}
          data-testid={`video-placeholder-${video.id}`}
        >
          {!thumbnailUrl && (
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          )}
        </div>
      )}

      {isLoading && isActive && shouldLoadVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {!isPlaying && isActive && !isLoading && shouldLoadVideo && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}

      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onVote}
            className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center"
            data-testid="button-vote"
          >
            <span className="text-white text-xs font-bold">Vote</span>
          </button>
          <span className="text-white text-xs font-semibold">{voteCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => onLike(isLiked)}
            className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center ${
              isLiked ? 'bg-red-500' : 'bg-black/50'
            }`}
            data-testid="button-like"
          >
            <ThumbsUp className={`w-6 h-6 ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
          </button>
          <span className="text-white text-xs font-semibold">{likeCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={onOpenComments}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            data-testid="button-comments"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <span className="text-white text-xs font-semibold">{commentCount}</span>
        </div>

        <button
          onClick={onShare}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          data-testid="button-share"
        >
          <Share2 className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={onReport}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          data-testid="button-report"
        >
          <Flag className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="absolute left-4 bottom-20 right-20 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-primary/80 text-white border-0" data-testid="badge-category">
            {category?.name || video.subcategory}
          </Badge>
          <span className="flex items-center gap-1 text-sm">
            <Eye className="w-4 h-4" />
            {video.views}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-semibold text-sm" data-testid="text-creator-name">@{creatorName}</span>
          {user && user.id !== video.userId && (
            <button
              onClick={onFollow}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                isFollowing 
                  ? 'bg-white/20 text-white' 
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
              data-testid="button-follow"
            >
              {isFollowing ? (
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
          <span className="text-xs text-white/70">{followersCount} followers</span>
        </div>
        <h2 className="text-lg font-bold mb-1 line-clamp-2" data-testid="text-video-title">
          {video.title}
        </h2>
        {video.description && (
          <p className="text-sm text-white/80 line-clamp-2" data-testid="text-description">
            {video.description}
          </p>
        )}
      </div>

      <div className="hidden absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 text-white/60">
        <ChevronUp className="w-6 h-6 animate-bounce" />
        <span className="text-xs">Scroll</span>
        <ChevronDown className="w-6 h-6 animate-bounce" />
      </div>
    </div>
  );
}

interface CommentsPanelProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

function CommentsPanel({ videoId, isOpen, onClose, user }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: commentsData, isLoading } = useQuery<{ comments: CommentWithUser[], count: number }>({
    queryKey: ['/api/videos', videoId, 'comments'],
    enabled: isOpen && !!videoId,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest(`/api/videos/${videoId}/comments`, "POST", { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'comments'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }
    commentMutation.mutate(newComment.trim());
  };

  const getInitials = (comment: CommentWithUser) => {
    if (comment.user.firstName && comment.user.lastName) {
      return `${comment.user.firstName[0]}${comment.user.lastName[0]}`.toUpperCase();
    }
    return comment.user.username?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = (comment: CommentWithUser) => {
    if (comment.user.firstName && comment.user.lastName) {
      return `${comment.user.firstName} ${comment.user.lastName}`;
    }
    return comment.user.username || "User";
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div 
        className="relative w-full max-w-lg bg-background rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-lg">
            Comments {commentsData?.count ? `(${commentsData.count})` : ""}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full"
            data-testid="button-close-comments"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !commentsData?.comments?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commentsData.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3" data-testid={`comment-${comment.id}`}>
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={comment.user.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">{getInitials(comment)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{getDisplayName(comment)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? "Add a comment..." : "Sign in to comment"}
            disabled={!user || commentMutation.isPending}
            className="flex-1"
            maxLength={1000}
            data-testid="input-comment"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!user || !newComment.trim() || commentMutation.isPending}
            data-testid="button-submit-comment"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

interface SharePanelProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
}

function SharePanel({ video, isOpen, onClose }: SharePanelProps) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/video/${createPermalink(video.id, video.title)}`;
  const shareText = `Check out this video: ${video.title}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Video link copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleShareX = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleShareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
      '_blank'
    );
  };

  const handleShareTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      '_blank'
    );
  };

  const handleShareInstagram = () => {
    // Instagram doesn't have a direct share URL, open Instagram
    window.open('https://www.instagram.com', '_blank');
  };

  const handleShareTikTok = () => {
    window.open(
      `https://www.tiktok.com/`,
      '_blank'
    );
  };

  const handleShareYouTube = () => {
    window.open(
      `https://www.youtube.com/share?url=${encodeURIComponent(shareUrl)}`,
      '_blank'
    );
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleSharePinterest = () => {
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleShareReddit = () => {
    window.open(
      `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(video.title)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const handleShareSnapchat = () => {
    // Snapchat doesn't have a direct share URL
    window.open('https://www.snapchat.com', '_blank');
  };

  const handleShareDiscord = () => {
    // Discord doesn't have a direct share URL, but users can copy and paste
    handleCopyLink();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div 
        className="relative w-full max-w-lg bg-background rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Share Video</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full"
            data-testid="button-close-share"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <button
            onClick={handleShareFacebook}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-facebook"
          >
            <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center">
              <SiFacebook className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Facebook</span>
          </button>

          <button
            onClick={handleShareX}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-x"
          >
            <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <SiX className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="text-xs text-muted-foreground">X</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-whatsapp"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
              <SiWhatsapp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">WhatsApp</span>
          </button>

          <button
            onClick={handleShareTelegram}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-telegram"
          >
            <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center">
              <SiTelegram className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Telegram</span>
          </button>

          <button
            onClick={handleShareInstagram}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-instagram"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#feda75] via-[#fa7e1e] to-[#d92e7f] flex items-center justify-center">
              <SiInstagram className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Instagram</span>
          </button>

          <button
            onClick={handleShareTikTok}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-tiktok"
          >
            <div className="w-12 h-12 rounded-full bg-black dark:bg-white flex items-center justify-center">
              <SiTiktok className="w-6 h-6 text-white dark:text-black" />
            </div>
            <span className="text-xs text-muted-foreground">TikTok</span>
          </button>

          <button
            onClick={handleShareYouTube}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-youtube"
          >
            <div className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center">
              <SiYoutube className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">YouTube</span>
          </button>

          <button
            onClick={handleShareLinkedIn}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-linkedin"
          >
            <div className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center">
              <SiLinkedin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">LinkedIn</span>
          </button>

          <button
            onClick={handleSharePinterest}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-pinterest"
          >
            <div className="w-12 h-12 rounded-full bg-[#E60023] flex items-center justify-center">
              <SiPinterest className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Pinterest</span>
          </button>

          <button
            onClick={handleShareReddit}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-reddit"
          >
            <div className="w-12 h-12 rounded-full bg-[#FF4500] flex items-center justify-center">
              <SiReddit className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Reddit</span>
          </button>

          <button
            onClick={handleShareSnapchat}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-snapchat"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFFC00] flex items-center justify-center">
              <SiSnapchat className="w-6 h-6 text-black" />
            </div>
            <span className="text-xs text-muted-foreground">Snapchat</span>
          </button>

          <button
            onClick={handleShareDiscord}
            className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-share-discord"
          >
            <div className="w-12 h-12 rounded-full bg-[#5865F2] flex items-center justify-center">
              <SiDiscord className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-muted-foreground">Discord</span>
          </button>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <Link className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{shareUrl}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopyLink}
            className="flex-shrink-0"
            data-testid="button-copy-link"
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VideoPlayer() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/video/:permalink");
  const permalink = params?.permalink || "";
  const isAllFeed = permalink.toLowerCase() === "all" || permalink === "";
  const videoId = isAllFeed ? "" : extractIdFromPermalink(permalink);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string>(videoId);
  const [selectedVideoForAction, setSelectedVideoForAction] = useState<Video | null>(null);
  const [filterMode, setFilterMode] = useState<'current' | 'all' | 'category'>(isAllFeed ? 'all' : 'current');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Diagnostic logging for video loading
  useEffect(() => {
    if (videoId && !isAllFeed) {
      console.log(`[VideoPlayer] Loading video - permalink: ${permalink}, extracted videoId: ${videoId}`);
    }
  }, [permalink, videoId, isAllFeed]);

  const { data: video, isLoading: videoLoading, error: videoError } = useQuery<VideoWithStats>({
    queryKey: queryKeys.videos.byId(videoId),
    enabled: !!videoId,
  });

  // Log errors
  useEffect(() => {
    if (videoError) {
      console.error(`[VideoPlayer] Video loading error for ${videoId}:`, videoError);
    }
  }, [videoError, videoId]);

  // Update meta tags for social sharing
  useVideoMetaTags(video ? {
    id: video.id,
    title: video.title,
    description: video.description ?? undefined,
    thumbnailUrl: video.thumbnailUrl ?? undefined
  } : null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  // Track when user manually changes filter
  const [hasChangedFilter, setHasChangedFilter] = useState(isAllFeed);
  
  // Feed query based on filter mode - only load when needed
  const shouldLoadFeed = hasChangedFilter || isAllFeed || !videoId;
  const feedQueryParams = filterMode === 'category' && selectedCategoryId 
    ? `?filter=category&categoryId=${selectedCategoryId}&limit=20`
    : filterMode === 'current' 
      ? '?filter=current&limit=20'
      : '?limit=20';
  
  const { data: feedVideos = [], isLoading: feedLoading } = useQuery<VideoWithStats[]>({
    queryKey: ['/api/videos/feed', filterMode, selectedCategoryId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/feed${feedQueryParams}`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000,
    enabled: shouldLoadFeed,
  });

  const { data: relatedVideos = [] } = useQuery<VideoWithStats[]>({
    queryKey: queryKeys.videos.byCategory(video?.categoryId || ""),
    enabled: !!video?.categoryId,
  });

  const { data: voteDataMap } = useQuery<Record<string, number>>({
    queryKey: ['/api/votes/batch', activeVideoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${activeVideoId}/votes`);
      if (!response.ok) return {};
      const data = await response.json();
      return { [activeVideoId]: data.voteCount || 0 };
    },
    enabled: !!activeVideoId,
  });

  const { data: likeDataMap } = useQuery<Record<string, { likeCount: number; hasLiked: boolean }>>({
    queryKey: ['/api/likes/batch', activeVideoId],
    queryFn: async () => {
      const response = await fetch(`/api/likes/video/${activeVideoId}`);
      if (!response.ok) return {};
      const data = await response.json();
      return { [activeVideoId]: { likeCount: data.likeCount || 0, hasLiked: data.hasLiked || false } };
    },
    enabled: !!activeVideoId,
  });

  const { data: commentCountMap } = useQuery<Record<string, number>>({
    queryKey: ['/api/comments/count', activeVideoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${activeVideoId}/comments?limit=0`);
      if (!response.ok) return {};
      const data = await response.json();
      return { [activeVideoId]: data.count || 0 };
    },
    enabled: !!activeVideoId,
  });

  const activeVideo = video?.id === activeVideoId 
    ? video 
    : relatedVideos.find(v => v.id === activeVideoId) || feedVideos.find(v => v.id === activeVideoId);
  const activeCreatorId = activeVideo?.userId;

  const { data: followData } = useQuery<{ followersCount: number; isFollowing: boolean }>({
    queryKey: ['/api/users', activeCreatorId, 'follow-status'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${activeCreatorId}/follow-status`);
      if (!response.ok) return { followersCount: 0, isFollowing: false };
      return response.json();
    },
    enabled: !!activeCreatorId,
  });

  const { data: creatorData } = useQuery<{ firstName: string; lastName: string; username: string | null }>({
    queryKey: ['/api/users', activeCreatorId, 'info'],
    queryFn: async () => {
      const response = await fetch(`/api/users/${activeCreatorId}`);
      if (!response.ok) return { firstName: '', lastName: '', username: null };
      return response.json();
    },
    enabled: !!activeCreatorId,
  });

  // Determine which videos to show based on filter mode
  const handleFilterChange = (newMode: 'current' | 'all' | 'category') => {
    setFilterMode(newMode);
    setHasChangedFilter(true);
  };
  
  // Use feed videos when filter has been changed or no specific video
  const allVideos = (hasChangedFilter || !video)
    ? feedVideos.filter(v => v.status === 'approved')
    : [video, ...relatedVideos.filter(v => v.status === 'approved' && v.id !== video.id)];
  const activeVideoIndex = allVideos.findIndex(v => v.id === activeVideoId);
  
  // Set initial active video when feed loads or filter changes
  useEffect(() => {
    // When filter changes or no specific video, use feed videos
    if (hasChangedFilter || !videoId) {
      if (feedVideos.length > 0) {
        // Set to first video when feed changes
        setActiveVideoId(feedVideos[0].id);
      } else {
        // Clear active video when feed is empty to prevent stale controls
        setActiveVideoId('');
      }
    }
  }, [videoId, feedVideos, filterMode, selectedCategoryId, hasChangedFilter]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const videoId = entry.target.getAttribute('data-video-id');
            if (videoId) {
              setActiveVideoId(videoId);
              const foundVideo = allVideos.find(v => v.id === videoId);
              if (foundVideo && filterMode === 'current') {
                window.history.replaceState(
                  null, 
                  '', 
                  `/video/${createPermalink(foundVideo.id, foundVideo.title)}`
                );
              }
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '0px',
        threshold: 0.5,
      }
    );

    videoRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [allVideos, filterMode]);

  const likeMutation = useMutation({
    mutationFn: async ({ targetVideoId, isUnlike }: { targetVideoId: string; isUnlike: boolean }) => {
      if (isUnlike) {
        return await apiRequest(`/api/likes`, "DELETE", { videoId: targetVideoId });
      }
      return await apiRequest(`/api/likes`, "POST", { videoId: targetVideoId });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isUnlike ? "Unliked" : t('videoPlayer.liked'),
        description: variables.isUnlike ? "You removed your like" : t('videoPlayer.likedVideoDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/likes/batch'] });
      queryClient.invalidateQueries({ queryKey: ['/api/likes/video', variables.targetVideoId] });
    },
    onError: (error: Error) => {
      toast({
        title: t('videoPlayer.likeFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const watchHistoryMutation = useMutation({
    mutationFn: async ({ targetVideoId, watchDuration, completed }: { targetVideoId: string; watchDuration: number; completed: boolean }) => {
      return await apiRequest(`/api/watch-history`, "POST", {
        videoId: targetVideoId,
        watchDuration,
        completed,
      });
    },
  });

  const handleShare = useCallback((targetVideo: Video) => {
    setSelectedVideoForAction(targetVideo);
    setShareOpen(true);
  }, []);

  const handleLike = useCallback((targetVideo: Video, isCurrentlyLiked: boolean) => {
    if (!user && !isCurrentlyLiked) {
      toast({
        title: t('videoPlayer.signInRequired'),
        description: t('videoPlayer.signInToLike'),
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate({ targetVideoId: targetVideo.id, isUnlike: isCurrentlyLiked });
  }, [user, t, toast, likeMutation]);

  const handleVote = useCallback((targetVideo: Video) => {
    if (!user) {
      toast({
        title: t('videoPlayer.signInRequired'),
        description: t('videoPlayer.signInToVote'),
        variant: "destructive",
      });
      return;
    }
    setSelectedVideoForAction(targetVideo);
    setVoteModalOpen(true);
  }, [user, t, toast]);

  const handleReport = useCallback((targetVideo: Video) => {
    setSelectedVideoForAction(targetVideo);
    setReportDialogOpen(true);
  }, []);

  const handleOpenComments = useCallback((targetVideo: Video) => {
    setSelectedVideoForAction(targetVideo);
    setCommentsOpen(true);
  }, []);

  const handleFollow = useCallback(async (targetVideo: Video) => {
    if (!user) {
      toast({
        title: t('videoPlayer.signInRequired'),
        description: "Please sign in to follow creators",
        variant: "destructive",
      });
      return;
    }
    
    const creatorId = targetVideo.userId;
    const currentlyFollowing = followData?.isFollowing || false;
    
    try {
      if (currentlyFollowing) {
        await apiRequest(`/api/users/${creatorId}/follow`, "DELETE");
      } else {
        await apiRequest(`/api/users/${creatorId}/follow`, "POST");
      }
      queryClient.invalidateQueries({ queryKey: ['/api/users', creatorId, 'follow-status'] });
      toast({
        title: currentlyFollowing ? "Unfollowed" : "Following",
        description: currentlyFollowing ? "You unfollowed this creator" : "You are now following this creator",
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error.message || "Could not update follow status",
        variant: "destructive",
      });
    }
  }, [user, t, toast, followData]);

  const handleWatchProgress = useCallback((targetVideoId: string, duration: number, completed: boolean) => {
    if (!user) return;
    watchHistoryMutation.mutate({ targetVideoId, watchDuration: duration, completed });
  }, [user, watchHistoryMutation]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  if (isAllFeed ? feedLoading : (videoLoading || !video)) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-white/60">{t('videoPlayer.loadingVideo')}</p>
        </div>
      </div>
    );
  }

  const category = video ? categories?.find(c => c.id === video.categoryId) : null;
  const isVideoRejected = video?.moderationStatus === 'rejected';

  if (isVideoRejected && video) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => category ? setLocation(`/category/${category.id}`) : setLocation('/')}
              className="mb-6 gap-2"
              data-testid="button-back-rejected"
            >
              <ArrowLeft className="w-4 h-4" />
              {category ? `${t('videoPlayer.backTo')} ${category.name}` : t('videoPlayer.backToHome')}
            </Button>

            <div className="max-w-2xl mx-auto">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-8 text-center">
                <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">{t('videoPlayer.videoRemoved')}</h2>
                <p className="text-muted-foreground mb-4">
                  {t('videoPlayer.videoRemovedDescription')}
                </p>

                {video.moderationReason && (
                  <div className="bg-background/50 rounded-lg p-4 text-left mb-6">
                    <p className="text-sm font-semibold mb-2">{t('videoPlayer.reasonForRemoval')}</p>
                    <p className="text-sm">{video.moderationReason}</p>
                  </div>
                )}

                <div className="space-y-4 pt-6">
                  <p className="text-sm text-muted-foreground">
                    {t('videoPlayer.rejectedNotice')}
                  </p>
                  
                  <Button
                    onClick={() => setLocation('/terms')}
                    variant="default"
                    className="gap-2"
                    data-testid="button-view-terms"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('videoPlayer.viewTerms')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Filter Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setLocation('/')}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            data-testid="button-home"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleFilterChange('current')}
              className={`px-2 py-1 text-sm transition-all flex flex-col items-center ${
                filterMode === 'current' 
                  ? 'text-white font-bold' 
                  : 'text-gray-400 font-normal hover:text-gray-300'
              }`}
              data-testid="button-filter-current"
            >
              <span>Current</span>
              {filterMode === 'current' && <span className="w-4 h-0.5 bg-white mt-1 rounded-full" />}
            </button>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-2 py-1 text-sm transition-all flex flex-col items-center ${
                filterMode === 'all' 
                  ? 'text-white font-bold' 
                  : 'text-gray-400 font-normal hover:text-gray-300'
              }`}
              data-testid="button-filter-all"
            >
              <span>All</span>
              {filterMode === 'all' && <span className="w-3 h-0.5 bg-white mt-1 rounded-full" />}
            </button>
            <button
              onClick={() => handleFilterChange('category')}
              className={`px-2 py-1 text-sm transition-all flex flex-col items-center ${
                filterMode === 'category' 
                  ? 'text-white font-bold' 
                  : 'text-gray-400 font-normal hover:text-gray-300'
              }`}
              data-testid="button-filter-category"
            >
              <span className="flex items-center gap-1">
                <Grid3X3 className="w-4 h-4" />
                Category
              </span>
              {filterMode === 'category' && <span className="w-6 h-0.5 bg-white mt-1 rounded-full" />}
            </button>
          </div>
          <button
            onClick={() => setLocation('/search')}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            data-testid="button-search-videos"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        
        {/* Category Selector */}
        {filterMode === 'category' && (
          <div className="px-4 pb-3">
            <Select
              value={selectedCategoryId}
              onValueChange={(value) => setSelectedCategoryId(value)}
            >
              <SelectTrigger className="w-full bg-white/20 border-white/30 text-white" data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} data-testid={`option-category-${cat.id}`}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide video-scroll-container"
      >
        {allVideos.length === 0 && !videoLoading && !feedLoading ? (
          <div className="h-screen w-full flex flex-col items-center justify-center text-white">
            <div className="text-center px-6">
              <Grid3X3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Videos Found</h3>
              <p className="text-white/70 mb-4">
                {filterMode === 'category' && !selectedCategoryId 
                  ? 'Please select a category to view videos'
                  : filterMode === 'category'
                    ? 'No videos available in this category yet'
                    : 'No videos available at the moment'}
              </p>
              {filterMode === 'category' && (
                <button
                  onClick={() => handleFilterChange('all')}
                  className="px-4 py-2 bg-primary text-white rounded-full text-sm font-semibold"
                  data-testid="button-view-all-videos"
                >
                  View All Videos
                </button>
              )}
            </div>
          </div>
        ) : null}
        {allVideos.map((v, index) => {
          const videoCategory = categories?.find(c => c.id === v.categoryId);
          const isNeighbor = Math.abs(index - activeVideoIndex) === 1;
          return (
            <div
              key={v.id}
              ref={(el) => {
                if (el) videoRefs.current.set(v.id, el);
                else videoRefs.current.delete(v.id);
              }}
              data-video-id={v.id}
              className="h-screen w-full snap-start snap-always flex-shrink-0"
            >
              <VideoItem
                video={v}
                isActive={activeVideoId === v.id}
                isNeighbor={isNeighbor}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                user={user}
                category={videoCategory}
                voteCount={voteDataMap?.[v.id] || 0}
                likeCount={likeDataMap?.[v.id]?.likeCount || 0}
                isLiked={likeDataMap?.[v.id]?.hasLiked || false}
                commentCount={commentCountMap?.[v.id] || 0}
                isFollowing={v.id === activeVideoId ? (followData?.isFollowing || false) : false}
                followersCount={v.id === activeVideoId ? (followData?.followersCount || 0) : 0}
                creatorName={(v as VideoWithStats).creatorUsername || `${(v as VideoWithStats).creatorFirstName || ''} ${(v as VideoWithStats).creatorLastName || ''}`.trim() || 'Creator'}
                onVote={() => handleVote(v)}
                onLike={(isCurrentlyLiked) => handleLike(v, isCurrentlyLiked)}
                onShare={() => handleShare(v)}
                onReport={() => handleReport(v)}
                onOpenComments={() => handleOpenComments(v)}
                onFollow={() => handleFollow(v)}
                onWatchProgress={(duration, completed) => handleWatchProgress(v.id, duration, completed)}
              />
            </div>
          );
        })}
      </div>

      <VotePaymentModal
        open={voteModalOpen}
        onOpenChange={setVoteModalOpen}
        videoId={selectedVideoForAction?.id || ""}
        videoTitle={selectedVideoForAction?.title || ""}
      />
      
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        videoId={selectedVideoForAction?.id || ""}
        videoTitle={selectedVideoForAction?.title || ""}
      />

      <CommentsPanel
        videoId={selectedVideoForAction?.id || ""}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        user={user}
      />

      {selectedVideoForAction && (
        <SharePanel
          video={selectedVideoForAction}
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
