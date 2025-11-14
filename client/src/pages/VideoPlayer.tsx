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
import { ArrowLeft, ThumbsUp, Eye, Share2, Flag, AlertTriangle, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category } from "@shared/schema";

export default function VideoPlayer() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();
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
        title: "Vote Submitted!",
        description: "Your vote has been counted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/votes/video/${videoId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Vote Failed",
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
          <p className="mt-4 text-muted-foreground">Loading video...</p>
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
              Back to {category?.name}
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
                      Content Policy Violation
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      This video has been automatically blocked because it violates our Terms and Conditions.
                    </p>
                  </div>

                  {video.moderationReason && (
                    <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-md max-w-2xl mx-auto">
                      <p className="text-sm font-semibold mb-2">Reason for Removal:</p>
                      <p className="text-sm">{video.moderationReason}</p>
                    </div>
                  )}

                  <div className="space-y-4 pt-6">
                    <p className="text-sm text-muted-foreground">
                      Our automated content moderation system detected policy violations in this content.
                      All uploads are subject to review to ensure compliance with platform guidelines.
                    </p>
                    
                    <Button
                      onClick={() => setLocation('/terms')}
                      variant="default"
                      className="gap-2"
                      data-testid="button-view-terms"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Terms and Conditions
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
            Back to {category?.name}
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
                    Your browser does not support the video tag.
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
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views.toLocaleString()} views
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {voteData?.voteCount || 0} votes
                        </div>
                      </div>
                    </div>
                  </div>

                  {video.description && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-video-description">
                        {video.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        if (!user) {
                          toast({
                            title: "Sign In Required",
                            description: "Please sign in to vote for videos",
                            variant: "destructive",
                          });
                          return;
                        }
                        setVoteModalOpen(true);
                      }}
                      className="flex-1"
                      data-testid="button-vote"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Vote for this Video
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.share?.({
                          title: video.title,
                          text: `Check out this video: ${video.title}`,
                          url: window.location.href,
                        }).catch(() => {
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link Copied",
                            description: "Video link copied to clipboard",
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
                <h3 className="font-semibold text-lg">Related Videos</h3>
                
                {otherVideos.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      No other videos in this category yet
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
                                  No thumbnail
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
