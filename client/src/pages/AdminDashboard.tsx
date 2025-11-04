import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PhaseManagement from "@/components/PhaseManagement";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category } from "@shared/schema";

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: pendingVideos = [], isLoading, error } = useQuery<Video[]>({
    queryKey: ["/api/videos/pending"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ videoId, status }: { videoId: string; status: string }) => {
      return await apiRequest(`/api/videos/${videoId}/status`, "PATCH", { status });
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Video Updated",
        description: `Video has been ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "Unknown";
  };

  // Check if error is a 403 by inspecting the error object
  const is403Error = error && typeof error === 'object' && 'status' in error && (error as any).status === 403;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage competition phases and moderate video submissions
        </p>
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
          <TabsTrigger value="phases" data-testid="tab-phases">
            Phase Management
          </TabsTrigger>
          <TabsTrigger value="videos" data-testid="tab-videos">
            Video Moderation
            {pendingVideos.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingVideos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="mt-6">
          <PhaseManagement />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading pending videos...</p>
            </div>
          ) : is403Error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-6">
                  You do not have permission to access the admin dashboard.
                  Please contact an administrator if you believe this is an error.
                </p>
                <Button onClick={() => setLocation("/")} data-testid="button-go-home">
                  Go to Home
                </Button>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h3 className="text-xl font-semibold mb-2">Error Loading Videos</h3>
                <p className="text-muted-foreground mb-6">
                  Failed to load pending videos. Please try again later or contact support if the problem persists.
                </p>
                <Button onClick={() => window.location.reload()} data-testid="button-retry">
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : pendingVideos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Pending Videos</h3>
                <p className="text-muted-foreground">
                  All video submissions have been reviewed
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className="text-base">
                  {pendingVideos.length} Pending {pendingVideos.length === 1 ? 'Video' : 'Videos'}
                </Badge>
              </div>

              <div className="grid gap-6">
                {pendingVideos.map((video) => {
                  const videoUrl = video.videoUrl.startsWith('/objects/') 
                    ? video.videoUrl 
                    : `/objects/${video.videoUrl}`;

                  return (
                    <Card key={video.id} className="overflow-hidden">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        <div className="md:col-span-1">
                          <div className="aspect-video bg-black rounded-md overflow-hidden">
                            <video
                              controls
                              preload="metadata"
                              className="w-full h-full"
                              data-testid={`video-preview-${video.id}`}
                            >
                              <source src={videoUrl} type="video/mp4" />
                            </video>
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">
                            Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold mb-2" data-testid={`text-video-title-${video.id}`}>
                                {video.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                <Badge variant="outline">{getCategoryName(video.categoryId)}</Badge>
                                <Badge variant="outline">{video.subcategory}</Badge>
                                <Badge variant="outline">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {new Date(video.createdAt).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {video.description && (
                            <div className="mb-4">
                              <h4 className="font-medium text-sm mb-1">Description</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-video-description-${video.id}`}>
                                {video.description}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <span className="text-muted-foreground">File Size:</span>
                              <span className="ml-2 font-medium">
                                {(video.fileSize / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Views:</span>
                              <span className="ml-2 font-medium">{video.views}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                              onClick={() => window.open(videoUrl, '_blank')}
                              variant="outline"
                              className="flex-1"
                              data-testid={`button-preview-${video.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview Full Video
                            </Button>
                            <Button
                              onClick={() => updateStatusMutation.mutate({ videoId: video.id, status: 'approved' })}
                              disabled={updateStatusMutation.isPending}
                              className="flex-1"
                              data-testid={`button-approve-${video.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {updateStatusMutation.isPending ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => updateStatusMutation.mutate({ videoId: video.id, status: 'rejected' })}
                              disabled={updateStatusMutation.isPending}
                              variant="destructive"
                              className="flex-1"
                              data-testid={`button-reject-${video.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              {updateStatusMutation.isPending ? "Processing..." : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // After auth loads, check if user is authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the admin dashboard
            </p>
            <Button onClick={() => setLocation("/")}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render the dashboard
  return (
    <div className="container mx-auto px-4 py-8">
      <AdminDashboardContent />
    </div>
  );
}
