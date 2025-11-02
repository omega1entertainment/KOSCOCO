import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import TopBar from "@/components/TopBar";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import { ArrowLeft, ThumbsUp, Eye, Share2, Flag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category } from "@shared/schema";

export default function VideoPlayer() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/video/:id");
  const videoId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

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

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <NavigationHeader 
        onUploadClick={() => setLocation("/upload")}
        onNavigate={(path) => setLocation(path)}
      />

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
                        voteMutation.mutate();
                      }}
                      disabled={voteMutation.isPending}
                      className="flex-1"
                      data-testid="button-vote"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {voteMutation.isPending ? "Voting..." : "Vote for this Video"}
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
                      onClick={() => {
                        toast({
                          title: "Report Submitted",
                          description: "Thank you for helping keep our platform safe",
                        });
                      }}
                      data-testid="button-report"
                    >
                      <Flag className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Video Details</h3>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium">{category?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Subcategory</dt>
                      <dd className="font-medium">{video.subcategory}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Duration</dt>
                      <dd className="font-medium">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>
                        <Badge 
                          variant={video.status === 'approved' ? 'default' : video.status === 'rejected' ? 'destructive' : 'outline'}
                        >
                          {video.status}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Uploaded</dt>
                      <dd className="font-medium">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 pt-6 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/category/${video.categoryId}`)}
                      data-testid="button-more-videos"
                    >
                      More from {category?.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
