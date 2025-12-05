import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import VotePaymentModal from "@/components/VotePaymentModal";
import { ReportDialog } from "@/components/ReportDialog";
import { OverlayAd } from "@/components/ads/OverlayAd";
import { SkippableInStreamAd } from "@/components/ads/SkippableInStreamAd";
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
  Play
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { extractIdFromPermalink, createPermalink } from "@/lib/slugUtils";
import { queryKeys } from "@/lib/queryKeys";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPreRollAd, setShowPreRollAd] = useState(true);
  const [preRollCompleted, setPreRollCompleted] = useState(false);
  const [showOverlayAd, setShowOverlayAd] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasRecordedWatchRef = useRef(false);

  const { data: video, isLoading: videoLoading } = useQuery<Video>({
    queryKey: queryKeys.videos.byId(videoId),
    enabled: !!videoId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  const { data: voteData } = useQuery<{ voteCount: number }>({
    queryKey: queryKeys.votes.byVideo(videoId),
    enabled: !!videoId,
  });

  const { data: likeData } = useQuery<{ likeCount: number }>({
    queryKey: queryKeys.likes.byVideo(videoId),
    enabled: !!videoId,
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
    if (!preRollAd && !isPreRollAdLoading) {
      setPreRollCompleted(true);
    }
  }, [preRollAd, isPreRollAdLoading]);

  useEffect(() => {
    if (preRollCompleted && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [preRollCompleted]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/likes`, "POST", { videoId });
    },
    onSuccess: () => {
      toast({
        title: t('videoPlayer.liked'),
        description: t('videoPlayer.likedVideoDescription'),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.likes.byVideo(videoId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byId(videoId) });
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
    mutationFn: async ({ watchDuration, completed }: { watchDuration: number; completed: boolean }) => {
      return await apiRequest(`/api/watch-history`, "POST", {
        videoId,
        watchDuration,
        completed,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos.byId(videoId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.home });
    },
  });

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

  const handlePreRollComplete = () => {
    setPreRollCompleted(true);
    setShowPreRollAd(false);
  };

  const handleShare = async () => {
    if (!video) return;
    const shareUrl = `${window.location.origin}/video/${createPermalink(video.id, video.title)}`;
    try {
      await navigator.share?.({
        title: video.title,
        text: `${t('videoPlayer.checkOutVideo')} ${video.title}`,
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

  const handleLike = () => {
    if (!user) {
      toast({
        title: t('videoPlayer.signInRequired'),
        description: t('videoPlayer.signInToLike'),
        variant: "destructive",
      });
      return;
    }
    likeMutation.mutate();
  };

  const handleVote = () => {
    if (!user) {
      toast({
        title: t('videoPlayer.signInRequired'),
        description: t('videoPlayer.signInToVote'),
        variant: "destructive",
      });
      return;
    }
    setVoteModalOpen(true);
  };

  useEffect(() => {
    if (!videoRef.current || !preRollCompleted || !user) return;

    const videoElement = videoRef.current;

    const handleTimeUpdate = () => {
      if (hasRecordedWatchRef.current) return;

      const currentTime = videoElement.currentTime;
      const duration = videoElement.duration;
      const watchThreshold = Math.min(30, duration * 0.5);
      
      if (currentTime >= watchThreshold) {
        hasRecordedWatchRef.current = true;
        watchHistoryMutation.mutate({
          watchDuration: Math.floor(currentTime),
          completed: false,
        });
      }
    };

    const handleEnded = () => {
      if (!hasRecordedWatchRef.current) {
        hasRecordedWatchRef.current = true;
        watchHistoryMutation.mutate({
          watchDuration: Math.floor(videoElement.duration),
          completed: true,
        });
      }
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [preRollCompleted, user, watchHistoryMutation]);

  if (videoLoading || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('videoPlayer.loadingVideo')}</p>
        </div>
      </div>
    );
  }

  const category = categories?.find(c => c.id === video.categoryId);
  const isVideoRejected = video.moderationStatus === 'rejected';
  const approvedRelatedVideos = relatedVideos.filter(v => v.status === 'approved' && v.id !== video.id);
  const voteCount = voteData?.voteCount || 0;
  const likeCount = likeData?.likeCount || 0;

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => category ? setLocation(`/category/${category.id}`) : setLocation('/')}
          className="mb-4 gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          {category ? `${t('videoPlayer.backTo')} ${category.name}` : t('videoPlayer.backToHome')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-primary/20">
              <div className="relative aspect-video bg-black">
                {showPreRollAd && preRollAd && !preRollCompleted ? (
                  <SkippableInStreamAd
                    ad={preRollAd}
                    onComplete={handlePreRollComplete}
                    onSkip={handlePreRollComplete}
                    onImpression={() => handleAdImpression(preRollAd.id)}
                    onClick={() => handleAdClick(preRollAd.id)}
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      controls
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      data-testid={`video-player-${video.id}`}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={(e) => {
                        console.error("Video playback error:", {
                          src: video.videoUrl,
                          error: videoRef.current?.error
                        });
                      }}
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </>
                )}
              </div>
            </Card>

            {overlayAd && showOverlayAd && preRollCompleted && (
              <div className="mt-4">
                <OverlayAd
                  ad={overlayAd}
                  onClose={() => setShowOverlayAd(false)}
                  onImpression={() => handleAdImpression(overlayAd.id)}
                  onClick={() => handleAdClick(overlayAd.id)}
                />
              </div>
            )}

            <div className="mt-6 space-y-4">
              <h1 className="text-2xl font-bold" data-testid="text-video-title">{video.title}</h1>
              
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary" data-testid="badge-category">
                  {video.subcategory}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1" data-testid="text-vote-count">
                    <Check className="w-4 h-4" />
                    {voteCount.toString().padStart(2, '0')} votes
                  </span>
                  <span className="flex items-center gap-1" data-testid="text-like-count">
                    <ThumbsUp className="w-4 h-4" />
                    {likeCount} likes
                  </span>
                  <span className="flex items-center gap-1" data-testid="text-view-count">
                    <Eye className="w-4 h-4" />
                    {video.views} views
                  </span>
                </div>
              </div>

              {video.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Description</h3>
                  <p className="text-muted-foreground" data-testid="text-description">{video.description}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button 
                  onClick={handleVote}
                  className="gap-2 bg-primary hover:bg-primary/90"
                  data-testid="button-vote"
                >
                  <Check className="w-4 h-4" />
                  Vote
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLike}
                  className="gap-2"
                  data-testid="button-like"
                >
                  <ThumbsUp className="w-4 h-4" />
                  Like
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  data-testid="button-save"
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setReportDialogOpen(true)}
                  data-testid="button-report"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-4">Related Videos</h2>
                {approvedRelatedVideos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No other videos in this category yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {approvedRelatedVideos.slice(0, 5).map((relatedVideo) => (
                      <Link
                        key={relatedVideo.id}
                        href={`/video/${createPermalink(relatedVideo.id, relatedVideo.title)}`}
                        className="block group"
                        data-testid={`link-related-video-${relatedVideo.id}`}
                      >
                        <div className="flex gap-3">
                          <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                            {relatedVideo.thumbnailUrl ? (
                              <img 
                                src={relatedVideo.thumbnailUrl} 
                                alt={relatedVideo.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Play className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {relatedVideo.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {relatedVideo.views}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <VotePaymentModal
        open={voteModalOpen}
        onOpenChange={setVoteModalOpen}
        videoId={video.id}
        videoTitle={video.title}
      />
      
      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        videoId={video.id}
        videoTitle={video.title}
      />
    </div>
  );
}
