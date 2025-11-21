import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  Eye, 
  ThumbsUp, 
  TrendingUp, 
  BarChart3, 
  Users, 
  PlayCircle,
  Edit,
  Trash2,
  Trophy,
  Calendar
} from "lucide-react";
import { createPermalink } from "@/lib/slugUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VideoWithStats = {
  id: string;
  title: string;
  description: string | null;
  subcategory: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  views: number;
  status: string;
  createdAt: Date;
  voteCount: number;
  likeCount: number;
};

type CreatorStats = {
  totalVideos: number;
  totalViews: number;
  totalVotes: number;
  totalLikes: number;
  approvedVideos: number;
  pendingVideos: number;
  rankingPosition: number | null;
};

type VideoAnalytics = {
  videoId: string;
  title: string;
  viewsOverTime: { date: string; views: number }[];
  votesOverTime: { date: string; votes: number }[];
  engagementRate: number;
};

export default function CreatorDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [editingVideo, setEditingVideo] = useState<VideoWithStats | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  // Form state for editing
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Fetch creator stats
  const { data: stats, isLoading: statsLoading } = useQuery<CreatorStats>({
    queryKey: ["/api/creator/stats"],
    enabled: !!user,
  });

  // Fetch creator videos
  const { data: videos = [], isLoading: videosLoading } = useQuery<VideoWithStats[]>({
    queryKey: ["/api/creator/videos"],
    enabled: !!user,
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await apiRequest(`/api/videos/${videoId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: t('creator.toast.videoDeleted'),
        description: t('creator.toast.videoDeletedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/stats"] });
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('creator.toast.deleteFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Edit video mutation
  const editVideoMutation = useMutation({
    mutationFn: async ({ videoId, data }: { videoId: string; data: { title: string; description: string } }) => {
      const response = await apiRequest(`/api/videos/${videoId}/metadata`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('creator.toast.videoUpdated'),
        description: t('creator.toast.videoUpdatedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/videos"] });
      setEditDialogOpen(false);
      setEditingVideo(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('creator.toast.updateFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (video: VideoWithStats) => {
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditDescription(video.description || "");
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingVideo) return;
    
    editVideoMutation.mutate({
      videoId: editingVideo.id,
      data: {
        title: editTitle,
        description: editDescription,
      },
    });
  };

  const handleConfirmDelete = () => {
    if (!videoToDelete) return;
    deleteVideoMutation.mutate(videoToDelete);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('creator.title')}</h1>
        <p className="text-muted-foreground">{t('creator.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('creator.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="videos" data-testid="tab-videos">
            <PlayCircle className="h-4 w-4 mr-2" />
            {t('creator.tabs.myVideos')}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('creator.tabs.analytics')}
          </TabsTrigger>
          <TabsTrigger value="audience" data-testid="tab-audience">
            <Users className="h-4 w-4 mr-2" />
            {t('creator.tabs.audience')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('creator.stats.totalVideos')}</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-videos">
                  {statsLoading ? "..." : stats?.totalVideos || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approvedVideos || 0} {t('creator.stats.approved')}, {stats?.pendingVideos || 0} {t('creator.stats.pending')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('creator.stats.totalViews')}</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-views">
                  {statsLoading ? "..." : stats?.totalViews?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('creator.stats.allTimeViews')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('creator.stats.totalVotes')}</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-votes">
                  {statsLoading ? "..." : stats?.totalVotes?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">{t('creator.stats.totalLikes')}: {stats?.totalLikes || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('creator.stats.ranking')}</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-ranking">
                  {statsLoading ? "..." : stats?.rankingPosition ? `#${stats.rankingPosition}` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">{t('creator.stats.currentPosition')}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('creator.quickActions.title')}</CardTitle>
              <CardDescription>{t('creator.quickActions.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={() => setLocation("/upload")} data-testid="button-upload-video">
                <Video className="h-4 w-4 mr-2" />
                {t('creator.quickActions.uploadVideo')}
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("videos")} data-testid="button-manage-videos">
                <PlayCircle className="h-4 w-4 mr-2" />
                {t('creator.quickActions.manageVideos')}
              </Button>
              <Button variant="outline" onClick={() => setLocation("/leaderboard")} data-testid="button-view-leaderboard">
                <Trophy className="h-4 w-4 mr-2" />
                {t('creator.quickActions.viewLeaderboard')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('creator.myVideos.title')}</CardTitle>
              <CardDescription>{t('creator.myVideos.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {videosLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8">
                  <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">{t('creator.myVideos.noVideos')}</p>
                  <Button onClick={() => setLocation("/upload")} data-testid="button-upload-first-video">
                    {t('creator.myVideos.uploadFirst')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="hover-elevate">
                      <CardContent className="flex flex-col md:flex-row gap-4 p-4">
                        <div className="flex-shrink-0">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full md:w-32 h-20 object-cover rounded"
                            />
                          ) : (
                            <div className="w-full md:w-32 h-20 bg-muted rounded flex items-center justify-center">
                              <PlayCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate mb-1">{video.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{video.description}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge variant={video.status === 'approved' ? 'default' : video.status === 'pending' ? 'secondary' : 'destructive'}>
                              {video.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {video.views}
                            </span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {video.voteCount}
                            </span>
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/video/${createPermalink(video.id, video.title)}`)}
                            data-testid={`button-view-${video.id}`}
                          >
                            {t('creator.myVideos.view')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(video)}
                            data-testid={`button-edit-${video.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(video.id)}
                            data-testid={`button-delete-${video.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('creator.analytics.title')}</CardTitle>
              <CardDescription>{t('creator.analytics.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>{t('creator.analytics.comingSoon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('creator.audience.title')}</CardTitle>
              <CardDescription>{t('creator.audience.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>{t('creator.audience.comingSoon')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Video Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('creator.editDialog.title')}</DialogTitle>
            <DialogDescription>{t('creator.editDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">{t('creator.editDialog.titleLabel')}</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t('creator.editDialog.titlePlaceholder')}
                data-testid="input-edit-title"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">{t('creator.editDialog.descriptionLabel')}</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder={t('creator.editDialog.descriptionPlaceholder')}
                rows={4}
                data-testid="input-edit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={editVideoMutation.isPending} data-testid="button-save-edit">
              {editVideoMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('creator.deleteDialog.title')}</DialogTitle>
            <DialogDescription>{t('creator.deleteDialog.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteVideoMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteVideoMutation.isPending ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
