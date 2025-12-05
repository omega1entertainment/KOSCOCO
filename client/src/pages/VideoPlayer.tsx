import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import VotePaymentModal from "@/components/VotePaymentModal";
import { ReportDialog } from "@/components/ReportDialog";
import { OverlayAd } from "@/components/ads/OverlayAd";
import { SkippableInStreamAd } from "@/components/ads/SkippableInStreamAd";
import { 
  ArrowLeft, 
  Check, 
  Heart, 
  Eye, 
  Share2, 
  Flag, 
  AlertTriangle, 
  ExternalLink, 
  Star,
  Bookmark,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractIdFromPermalink, createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

interface TikTokVideoCardProps {
  video: Video;
  isActive: boolean;
  onVote: () => void;
  onLike: () => void;
  onShare: () => void;
  onReport: () => void;
  voteCount: number;
  likeCount: number;
  user: any;
  toast: any;
  t: any;
  likeMutation: any;
  category?: Category;
  preRollAd?: any;
  overlayAd?: any;
  showPreRollAd: boolean;
  showOverlayAd: boolean;
  onPreRollAdComplete: () => void;
  onOverlayAdClose: () => void;
  onAdImpression: (adId: string) => void;
  onAdClick: (adId: string) => void;
  onWatchProgress: (duration: number, completed: boolean) => void;
}

function TikTokVideoCard({ 
  video, 
  isActive, 
  onVote, 
  onLike, 
  onShare,
  onReport,
  voteCount,
  likeCount,
  user,
  toast,
  t,
  likeMutation,
  category,
  preRollAd,
  overlayAd,
  showPreRollAd,
  showOverlayAd,
  onPreRollAdComplete,
  onOverlayAdClose,
  onAdImpression,
  onAdClick,
  onWatchProgress,
  isPreRollAdLoading
}: TikTokVideoCardProps & { isPreRollAdLoading: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [preRollCompleted, setPreRollCompleted] = useState(!preRollAd && !isPreRollAdLoading);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const watchStartTimeRef = useRef(0);
  const hasRecordedWatchRef = useRef(false);
  const lastWatchTimeRef = useRef(0);

  useEffect(() => {
    setPreRollCompleted(!preRollAd && !isPreRollAdLoading);
    hasRecordedWatchRef.current = false;
    watchStartTimeRef.current = 0;
    lastWatchTimeRef.current = 0;
  }, [video.id, preRollAd, isPreRollAdLoading]);

  useEffect(() => {
    if (videoRef.current) {
      setIsPiPSupported(
        document.pictureInPictureEnabled === true &&
        typeof videoRef.current.requestPictureInPicture === 'function'
      );
    }
  }, [preRollCompleted]);

  useEffect(() => {
    if (!videoRef.current) return;
    
    if (isActive && preRollCompleted) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      watchStartTimeRef.current = Date.now();
    } else {
      if (!isActive && videoRef.current.currentTime > 0 && user && !hasRecordedWatchRef.current) {
        const watchDuration = Math.floor(videoRef.current.currentTime);
        if (watchDuration >= 3) {
          hasRecordedWatchRef.current = true;
          onWatchProgress(watchDuration, false);
        }
      }
      videoRef.current.pause();
      if (!isActive) {
        videoRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }
  }, [isActive, preRollCompleted, user, onWatchProgress]);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (!videoRef.current) return;
      
      if (document.hidden) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else if (preRollCompleted) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, preRollCompleted]);

  useEffect(() => {
    if (!videoRef.current || !isActive || !preRollCompleted || !user) return;

    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      lastWatchTimeRef.current = videoElement.currentTime;
      
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
  }, [isActive, preRollCompleted, user, onWatchProgress]);

  const handlePictureInPicture = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiP failed:", error);
    }
  };

  const handlePreRollComplete = () => {
    setPreRollCompleted(true);
    onPreRollAdComplete();
  };

  const togglePlay = () => {
    if (!videoRef.current || !preRollCompleted) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative h-full w-full bg-black snap-start snap-always">
      {isActive && showPreRollAd && preRollAd && !preRollCompleted ? (
        <SkippableInStreamAd
          ad={preRollAd}
          onComplete={handlePreRollComplete}
          onSkip={handlePreRollComplete}
          onImpression={() => onAdImpression(preRollAd.id)}
          onClick={() => onAdClick(preRollAd.id)}
        />
      ) : (
        <>
          <video
            ref={videoRef}
            loop
            muted={isMuted}
            playsInline
            className="absolute inset-0 w-full h-full object-contain"
            data-testid={`video-player-${video.id}`}
            onClick={togglePlay}
          >
            <source src={video.videoUrl} type="video/mp4" />
          </video>

          {isActive && overlayAd && showOverlayAd && preRollCompleted && (
            <OverlayAd
              ad={overlayAd}
              onClose={onOverlayAdClose}
              onImpression={() => onAdImpression(overlayAd.id)}
              onClick={() => onAdClick(overlayAd.id)}
            />
          )}

          {!isPlaying && preRollCompleted && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
          )}
        </>
      )}

      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 z-20">
        <button
          onClick={() => {
            if (!user) {
              toast({
                title: t('videoPlayer.signInRequired'),
                description: t('videoPlayer.signInToLike'),
                variant: "destructive",
              });
              return;
            }
            onLike();
          }}
          className="flex flex-col items-center gap-1 group"
          data-testid={`button-like-${video.id}`}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">
            {formatCount(likeCount)}
          </span>
        </button>

        <button
          onClick={() => {
            if (!user) {
              toast({
                title: t('videoPlayer.signInRequired'),
                description: t('videoPlayer.signInToVote'),
                variant: "destructive",
              });
              return;
            }
            onVote();
          }}
          className="flex flex-col items-center gap-1 group"
          data-testid={`button-vote-${video.id}`}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Star className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">
            {formatCount(voteCount)}
          </span>
        </button>

        <button
          onClick={onShare}
          className="flex flex-col items-center gap-1 group"
          data-testid={`button-share-${video.id}`}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">Share</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 group"
          data-testid={`button-save-${video.id}`}
        >
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Bookmark className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-lg">Save</span>
        </button>

        <button
          onClick={onReport}
          className="flex flex-col items-center gap-1 group"
          data-testid={`button-report-${video.id}`}
        >
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Flag className="w-5 h-5 text-white" />
          </div>
        </button>
      </div>

      <div className="absolute left-0 right-16 bottom-4 p-4 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {video.title.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm drop-shadow-lg truncate">
              {video.title}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                {video.subcategory}
              </Badge>
              {category && (
                <span className="text-white/70 text-xs drop-shadow-lg">{category.name}</span>
              )}
            </div>
          </div>
        </div>

        {video.description && (
          <p className="text-white/90 text-sm line-clamp-2 drop-shadow-lg mb-2">
            {video.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-white/80 text-xs">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{formatCount(video.views)} views</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4" />
            <span>{formatCount(voteCount)} votes</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <button
          onClick={toggleMute}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          data-testid="button-mute-toggle"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
        {isPiPSupported && preRollCompleted && (
          <button
            onClick={handlePictureInPicture}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
            data-testid="button-pip"
            title="Picture-in-Picture"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <rect x="12" y="10" width="8" height="6" rx="1" fill="currentColor" opacity="0.5" />
            </svg>
          </button>
        )}
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
  const [activeVideoId, setActiveVideoId] = useState(videoId);
  const [selectedVideoForModal, setSelectedVideoForModal] = useState<Video | null>(null);
  const [showPreRollAd, setShowPreRollAd] = useState(true);
  const [showOverlayAd, setShowOverlayAd] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const videoDataCache = useRef<Map<string, { voteCount: number; likeCount: number }>>(new Map());

  const { data: video, isLoading: videoLoading } = useQuery<Video>({
    queryKey: queryKeys.videos.byId(videoId),
    enabled: !!videoId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  const { data: voteData } = useQuery<{ voteCount: number }>({
    queryKey: queryKeys.votes.byVideo(activeVideoId),
    enabled: !!activeVideoId,
  });

  const { data: likeData } = useQuery<{ likeCount: number }>({
    queryKey: queryKeys.likes.byVideo(activeVideoId),
    enabled: !!activeVideoId,
  });

  const { data: relatedVideos = [] } = useQuery<Video[]>({
    queryKey: queryKeys.videos.byCategory(video?.categoryId || ""),
    enabled: !!video?.categoryId,
  });

  const { data: overlayAd } = useQuery<any>({
    queryKey: queryKeys.ads.overlayServe,
  });

  const { data: preRollAd, isLoading: isPreRollAdLoading } = useQuery<any>({
    queryKey: queryKeys.ads.skippableInStreamServe,
  });

  useEffect(() => {
    if (voteData && activeVideoId) {
      videoDataCache.current.set(activeVideoId, {
        voteCount: voteData.voteCount,
        likeCount: likeData?.likeCount || 0,
      });
    }
  }, [voteData, likeData, activeVideoId]);

  const likeMutation = useMutation({
    mutationFn: async (targetVideoId: string) => {
      return await apiRequest(`/api/likes`, "POST", {
        videoId: targetVideoId,
      });
    },
    onSuccess: (_, targetVideoId) => {
      toast({
        title: t('videoPlayer.liked'),
        description: t('videoPlayer.likedVideoDescription'),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.likes.byVideo(targetVideoId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byId(targetVideoId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byCategory(video?.categoryId || "") });
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
    onSuccess: (_, { targetVideoId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byId(targetVideoId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byCategory(video?.categoryId || "") });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.home });
    },
    onError: (error: Error) => {
      console.error("Failed to record watch history:", error);
    },
  });

  const approvedVideos = relatedVideos.filter(v => v.status === 'approved');
  
  const videoFeed = video ? [
    video,
    ...approvedVideos.filter(v => v.id !== video.id)
  ] : [];

  useEffect(() => {
    setShowPreRollAd(true);
    setShowOverlayAd(true);
  }, [activeVideoId]);

  useEffect(() => {
    if (!containerRef.current || videoFeed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const targetVideoId = entry.target.getAttribute('data-video-id');
            if (targetVideoId && targetVideoId !== activeVideoId) {
              setActiveVideoId(targetVideoId);
              const targetVideo = videoFeed.find(v => v.id === targetVideoId);
              if (targetVideo) {
                const newPermalink = createPermalink(targetVideoId, targetVideo.title);
                window.history.replaceState(null, '', `/video/${newPermalink}`);
              }
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.5],
      }
    );

    videoRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [videoFeed, activeVideoId]);

  const handleAdImpression = async (adId: string) => {
    try {
      await apiRequest(`/api/ads/${adId}/impression`, "POST", {});
    } catch (error) {
      console.error("Failed to track ad impression:", error);
    }
  };

  const handleAdClick = async (adId: string) => {
    try {
      await apiRequest(`/api/ads/${adId}/click`, "POST", {});
    } catch (error) {
      console.error("Failed to track ad click:", error);
    }
  };

  const handleWatchProgress = useCallback((targetVideoId: string, duration: number, completed: boolean) => {
    if (user) {
      watchHistoryMutation.mutate({
        targetVideoId,
        watchDuration: duration,
        completed,
      });
    }
  }, [user, watchHistoryMutation]);

  const handleVote = (targetVideo: Video) => {
    setSelectedVideoForModal(targetVideo);
    setVoteModalOpen(true);
  };

  const handleShare = async (targetVideo: Video) => {
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
  };

  const handleReport = (targetVideo: Video) => {
    setSelectedVideoForModal(targetVideo);
    setReportDialogOpen(true);
  };

  const handleBack = () => {
    if (video?.categoryId) {
      setLocation(`/category/${video.categoryId}`);
    } else {
      setLocation('/');
    }
  };

  const getVideoStats = (feedVideoId: string) => {
    if (feedVideoId === activeVideoId) {
      return {
        voteCount: voteData?.voteCount || 0,
        likeCount: likeData?.likeCount || 0,
      };
    }
    return videoDataCache.current.get(feedVideoId) || { voteCount: 0, likeCount: 0 };
  };

  if (videoLoading || !video) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white/70">{t('videoPlayer.loadingVideo')}</p>
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
              onClick={handleBack}
              className="mb-6"
              data-testid="button-back-category"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('videoPlayer.backTo')} {category?.name}
            </Button>

            <div className="border border-destructive rounded-lg p-12 bg-card">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-destructive/10 p-6">
                    <AlertTriangle className="w-16 h-16 text-destructive" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-destructive">
                    {t('videoPlayer.rejectedTitle')}
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t('videoPlayer.rejectedDescription')}
                  </p>
                </div>

                {video.moderationReason && (
                  <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-md max-w-2xl mx-auto">
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
    <div className="h-screen w-full bg-black overflow-hidden">
      <div className="absolute top-4 left-4 z-30">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-white/20"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="absolute top-1/2 right-3 -translate-y-1/2 z-30 flex flex-col gap-2">
        <button
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white"
          onClick={() => {
            const currentIdx = videoFeed.findIndex(v => v.id === activeVideoId);
            if (currentIdx > 0) {
              const prevVideo = videoFeed[currentIdx - 1];
              const element = videoRefs.current.get(prevVideo.id);
              element?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          data-testid="button-scroll-up"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white"
          onClick={() => {
            const currentIdx = videoFeed.findIndex(v => v.id === activeVideoId);
            if (currentIdx < videoFeed.length - 1) {
              const nextVideo = videoFeed[currentIdx + 1];
              const element = videoRefs.current.get(nextVideo.id);
              element?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          data-testid="button-scroll-down"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {videoFeed.map((feedVideo) => {
          const stats = getVideoStats(feedVideo.id);
          return (
            <div
              key={feedVideo.id}
              ref={(el) => {
                if (el) videoRefs.current.set(feedVideo.id, el);
              }}
              data-video-id={feedVideo.id}
              className="h-screen w-full"
              style={{ scrollSnapAlign: 'start' }}
            >
              <TikTokVideoCard
                video={feedVideo}
                isActive={feedVideo.id === activeVideoId}
                onVote={() => handleVote(feedVideo)}
                onLike={() => likeMutation.mutate(feedVideo.id)}
                onShare={() => handleShare(feedVideo)}
                onReport={() => handleReport(feedVideo)}
                voteCount={stats.voteCount}
                likeCount={stats.likeCount}
                user={user}
                toast={toast}
                t={t}
                likeMutation={likeMutation}
                category={category}
                preRollAd={preRollAd}
                overlayAd={overlayAd}
                showPreRollAd={showPreRollAd}
                showOverlayAd={showOverlayAd}
                onPreRollAdComplete={() => setShowPreRollAd(false)}
                onOverlayAdClose={() => setShowOverlayAd(false)}
                onAdImpression={handleAdImpression}
                onAdClick={handleAdClick}
                onWatchProgress={(duration, completed) => handleWatchProgress(feedVideo.id, duration, completed)}
                isPreRollAdLoading={isPreRollAdLoading}
              />
            </div>
          );
        })}
      </div>

      {selectedVideoForModal && (
        <>
          <VotePaymentModal
            open={voteModalOpen}
            onOpenChange={setVoteModalOpen}
            videoId={selectedVideoForModal.id}
            videoTitle={selectedVideoForModal.title}
          />
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            videoId={selectedVideoForModal.id}
            videoTitle={selectedVideoForModal.title}
          />
        </>
      )}
    </div>
  );
}
