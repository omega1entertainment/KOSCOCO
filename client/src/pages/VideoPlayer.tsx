import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  UserCheck
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Video, Category, CommentWithUser } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { extractIdFromPermalink, createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  user: any;
  category?: Category;
  voteCount: number;
  likeCount: number;
  commentCount: number;
  isFollowing: boolean;
  followersCount: number;
  creatorName: string;
  onVote: () => void;
  onLike: () => void;
  onShare: () => void;
  onReport: () => void;
  onOpenComments: () => void;
  onFollow: () => void;
  onWatchProgress: (duration: number, completed: boolean) => void;
}

function VideoItem({
  video,
  isActive,
  isMuted,
  onToggleMute,
  user,
  category,
  voteCount,
  likeCount,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const hasRecordedWatchRef = useRef(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      hasRecordedWatchRef.current = false;
    }
  }, [isActive]);

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
    <div className="h-screen w-full snap-start snap-always relative bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onClick={togglePlay}
        data-testid={`video-player-${video.id}`}
      >
        <source src={video.videoUrl} type="video/mp4" />
      </video>

      {!isPlaying && isActive && (
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
        <button
          onClick={onToggleMute}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          data-testid="button-mute-toggle"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 text-white" />
          ) : (
            <Volume2 className="w-6 h-6 text-white" />
          )}
        </button>

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
            onClick={onLike}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
            data-testid="button-like"
          >
            <ThumbsUp className="w-6 h-6 text-white" />
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

export default function VideoPlayer() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/video/:permalink");
  const permalink = params?.permalink || "";
  const videoId = extractIdFromPermalink(permalink);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string>(videoId);
  const [selectedVideoForAction, setSelectedVideoForAction] = useState<Video | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { data: video, isLoading: videoLoading } = useQuery<Video>({
    queryKey: queryKeys.videos.byId(videoId),
    enabled: !!videoId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  const { data: relatedVideos = [] } = useQuery<Video[]>({
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

  const { data: likeDataMap } = useQuery<Record<string, number>>({
    queryKey: ['/api/likes/batch', activeVideoId],
    queryFn: async () => {
      const response = await fetch(`/api/videos/${activeVideoId}/likes`);
      if (!response.ok) return {};
      const data = await response.json();
      return { [activeVideoId]: data.likeCount || 0 };
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

  const activeVideo = video?.id === activeVideoId ? video : relatedVideos.find(v => v.id === activeVideoId);
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

  const allVideos = video ? [video, ...relatedVideos.filter(v => v.status === 'approved' && v.id !== video.id)] : [];

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
              if (foundVideo) {
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
  }, [allVideos]);

  const likeMutation = useMutation({
    mutationFn: async (targetVideoId: string) => {
      return await apiRequest(`/api/likes`, "POST", { videoId: targetVideoId });
    },
    onSuccess: () => {
      toast({
        title: t('videoPlayer.liked'),
        description: t('videoPlayer.likedVideoDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/likes/batch', activeVideoId] });
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

  const handleShare = useCallback(async (targetVideo: Video) => {
    const shareUrl = `${window.location.origin}/video/${createPermalink(targetVideo.id, targetVideo.title)}`;
    try {
      await navigator.share?.({
        title: targetVideo.title,
        text: `${t('videoPlayer.checkOutVideo')} ${targetVideo.title}`,
        url: shareUrl,
      });
    } catch {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: t('videoPlayer.linkCopied'),
        description: t('videoPlayer.linkCopiedDescription'),
      });
    }
  }, [t, toast]);

  const handleLike = useCallback((targetVideo: Video) => {
    if (!user) {
      toast({
        title: t('videoPlayer.signInRequired'),
        description: t('videoPlayer.signInToLike'),
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate(targetVideo.id);
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

  if (videoLoading || !video) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-white/60">{t('videoPlayer.loadingVideo')}</p>
        </div>
      </div>
    );
  }

  const category = categories?.find(c => c.id === video.categoryId);
  const isVideoRejected = video.moderationStatus === 'rejected';

  if (isVideoRejected) {
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
      <Button
        variant="ghost"
        onClick={() => category ? setLocation(`/category/${category.id}`) : setLocation('/')}
        className="absolute top-4 left-4 z-50 gap-2 bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 hover:text-white"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {allVideos.map((v) => {
          const videoCategory = categories?.find(c => c.id === v.categoryId);
          return (
            <div
              key={v.id}
              ref={(el) => {
                if (el) videoRefs.current.set(v.id, el);
                else videoRefs.current.delete(v.id);
              }}
              data-video-id={v.id}
            >
              <VideoItem
                video={v}
                isActive={activeVideoId === v.id}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                user={user}
                category={videoCategory}
                voteCount={voteDataMap?.[v.id] || 0}
                likeCount={likeDataMap?.[v.id] || 0}
                commentCount={commentCountMap?.[v.id] || 0}
                isFollowing={v.id === activeVideoId ? (followData?.isFollowing || false) : false}
                followersCount={v.id === activeVideoId ? (followData?.followersCount || 0) : 0}
                creatorName={v.id === activeVideoId ? (creatorData?.username || `${creatorData?.firstName || ''} ${creatorData?.lastName || ''}`.trim() || 'Creator') : 'Creator'}
                onVote={() => handleVote(v)}
                onLike={() => handleLike(v)}
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
    </div>
  );
}
