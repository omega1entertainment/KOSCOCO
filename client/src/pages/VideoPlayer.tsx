import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import VotePaymentModal from "@/components/VotePaymentModal";
import { ReportDialog } from "@/components/ReportDialog";
import { ArrowLeft, Check, ThumbsUp, Eye, Share2, Flag, AlertTriangle, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VideoPlayer() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: video, isLoading: videoLoading } = useQuery<Video>({
    queryKey: [`/api/videos/${videoId}`],
    enabled: !!videoId,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: voteData } = useQuery<{ voteCount: number }>({
    queryKey: [`/api/votes/video/${videoId}`],
    enabled: !!videoId,
  });

  const { data: likeData } = useQuery<{ likeCount: number }>({
    queryKey: [`/api/likes/video/${videoId}`],
    enabled: !!videoId,
  });

  const { data: judgeScoresData } = useQuery<{
    scores: Array<{
      id: string;
      judgeId: string;
      creativityScore: number;
      qualityScore: number;
      comments: string | null;
      createdAt: Date;
      judge?: {
        judgeName: string | null;
        firstName: string;
        lastName: string;
      };
    }>;
    count: number;
    total: number;
    average: number;
  }>({
    queryKey: [`/api/videos/${videoId}/scores`],
    enabled: !!videoId,
  });

  const { data: relatedVideos = [] } = useQuery<Video[]>({
    queryKey: [`/api/videos/category/${video?.categoryId}`],
    enabled: !!video?.categoryId,
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/votes`, "POST", {
        videoId,
      });
    },
    onSuccess: () => {
      toast({
        title: t('videoPlayer.voteSubmitted'),
        description: t('videoPlayer.voteCountedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/votes/video/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: t('videoPlayer.voteFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/likes`, "POST", {
        videoId,
      });
    },
    onSuccess: () => {
      toast({
        title: t('videoPlayer.liked'),
        description: t('videoPlayer.likedVideoDescription'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/likes/video/${videoId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: t('videoPlayer.likeFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (videoRef.current && video && !videoLoading) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked by browser, ignore error
      });
    }
  }, [videoId, video, videoLoading]);

  if (videoLoading || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('videoPlayer.loadingVideo')}</p>
        </div>
      </div>
    );
  }

  const category = categories?.find(c => c.id === video.categoryId);
  const videoUrl = video.videoUrl.startsWith('/objects/') 
    ? video.videoUrl 
    : `/objects/${video.videoUrl}`;

  const isVideoRejected = video.moderationStatus === 'rejected';
  
  const approvedVideos = relatedVideos.filter(v => v.status === 'approved');
  const currentIndex = approvedVideos.findIndex(v => v.id === videoId);
  const nextVideo = currentIndex >= 0 && currentIndex < approvedVideos.length - 1 
    ? approvedVideos[currentIndex + 1] 
    : null;
  const previousVideo = currentIndex > 0 
    ? approvedVideos[currentIndex - 1] 
    : null;

  const otherVideos = approvedVideos
    .filter(v => v.id !== videoId)
    .slice(0, 10);

  if (isVideoRejected) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 bg-background">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              onClick={() => setLocation(`/category/${video.categoryId}`)}
              className="mb-6"
              data-testid="button-back-category"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('videoPlayer.backTo')} {category?.name}
            </Button>

            <Card className="border-destructive">
              <CardContent className="p-12">
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/category/${video.categoryId}`)}
            className="mb-6"
            data-testid="button-back-category"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('videoPlayer.backTo')} {category?.name}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <div className="aspect-video bg-black relative">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full"
                    data-testid="video-player"
                  >
                    <source src={videoUrl} type="video/mp4" />
                    {t('videoPlayer.browserNotSupported')}
                  </video>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-2" data-testid="text-video-title">
                        {video.title}
                      </h1>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="outline">{video.subcategory}</Badge>
                        <div className="flex items-center gap-1" title={t('videoPlayer.competitionVotesTooltip')}>
                          <Check className="w-4 h-4" />
                          {voteData?.voteCount || 0} {t('video.votes')}
                        </div>
                        <div className="flex items-center gap-1" title={t('videoPlayer.likesTooltip')}>
                          <ThumbsUp className="w-4 h-4" />
                          {likeData?.likeCount || 0} {t('video.likes')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views.toLocaleString()} {t('video.views')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {video.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">{t('videoPlayer.description')}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-video-description">
                        {video.description}
                      </p>
                    </div>
                  )}

                  {/* Judge Scores Section */}
                  {judgeScoresData && judgeScoresData.count > 0 && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-lg border" data-testid="section-judge-scores">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {t('videoPlayer.judgeScores')}
                      </h3>
                      
                      {/* Average Score Display */}
                      <div className="mb-4 p-3 bg-background rounded-md border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('videoPlayer.averageJudgeScore')}</p>
                            <p className="text-xs text-muted-foreground">{judgeScoresData.count} {judgeScoresData.count === 1 ? t('videoPlayer.judge') : t('videoPlayer.judges')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary" data-testid="text-avg-judge-score">
                              {judgeScoresData.average.toFixed(1)}/20
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Individual Judge Scores */}
                      <div className="space-y-2">
                        {judgeScoresData.scores.map((score) => {
                          const judgeName = score.judge?.judgeName || 
                            `${score.judge?.firstName} ${score.judge?.lastName}` || 
                            t('videoPlayer.anonymousJudge');
                          const totalScore = score.creativityScore + score.qualityScore;

                          return (
                            <div 
                              key={score.id} 
                              className="flex items-center justify-between p-3 bg-background rounded-md hover-elevate"
                              data-testid={`judge-score-${score.id}`}
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{judgeName}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>{t('videoPlayer.creativity')} {score.creativityScore}/10</span>
                                  <span>{t('videoPlayer.quality')} {score.qualityScore}/10</span>
                                </div>
                                {score.comments && (
                                  <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                                    "{score.comments}"
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold" data-testid={`text-judge-total-${score.id}`}>
                                  {totalScore}/20
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        if (!user) {
                          toast({
                            title: t('videoPlayer.signInRequired'),
                            description: t('videoPlayer.signInToVote'),
                            variant: "destructive",
                          });
                          return;
                        }
                        setVoteModalOpen(true);
                      }}
                      className="flex-1"
                      data-testid="button-vote"
                      title={t('videoPlayer.voteTooltip')}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {t('videoPlayer.vote')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!user) {
                          toast({
                            title: t('videoPlayer.signInRequired'),
                            description: t('videoPlayer.signInToLike'),
                            variant: "destructive",
                          });
                          return;
                        }
                        likeMutation.mutate();
                      }}
                      data-testid="button-like"
                      title={t('videoPlayer.likeTooltip')}
                      disabled={likeMutation.isPending}
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {t('videoPlayer.like')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.share?.({
                          title: video.title,
                          text: `${t('videoPlayer.checkOutVideo')} ${video.title}`,
                          url: window.location.href,
                        }).catch(() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: t('videoPlayer.linkCopied'),
                            description: t('videoPlayer.linkCopiedDescription'),
                          });
                        });
                      }}
                      data-testid="button-share"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setReportDialogOpen(true)}
                      data-testid="button-report"
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">{t('videoPlayer.relatedVideos')}</h3>
                
                {otherVideos.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      {t('videoPlayer.noOtherVideos')}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {otherVideos.map((relatedVideo) => {
                      const thumbnailUrl = relatedVideo.thumbnailUrl?.startsWith('/objects/') 
                        ? relatedVideo.thumbnailUrl 
                        : `/objects/${relatedVideo.thumbnailUrl}`;
                      
                      return (
                        <Card 
                          key={relatedVideo.id}
                          className="overflow-hidden hover-elevate active-elevate-2 cursor-pointer"
                          onClick={() => setLocation(`/video/${relatedVideo.id}`)}
                          data-testid={`related-video-${relatedVideo.id}`}
                        >
                          <div className="flex gap-3 p-3">
                            <div className="relative w-40 flex-shrink-0 aspect-video bg-muted rounded overflow-hidden">
                              {relatedVideo.thumbnailUrl ? (
                                <img 
                                  src={thumbnailUrl}
                                  alt={relatedVideo.title}
                                  className="w-full h-full object-cover"
                                  data-testid={`img-thumbnail-${relatedVideo.id}`}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  {t('videoPlayer.noThumbnail')}
                                </div>
                              )}
                              <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                                {relatedVideo.duration ? `${Math.floor(relatedVideo.duration / 60)}:${(relatedVideo.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2 mb-1" data-testid={`text-title-${relatedVideo.id}`}>
                                {relatedVideo.title}
                              </h4>
                              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs py-0">
                                    {relatedVideo.subcategory}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {relatedVideo.views.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {videoId && video && (
        <>
          <VotePaymentModal
            open={voteModalOpen}
            onOpenChange={setVoteModalOpen}
            videoId={videoId}
            videoTitle={video.title}
          />
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            videoId={videoId}
            videoTitle={video.title}
          />
        </>
      )}
    </div>
  );
}
