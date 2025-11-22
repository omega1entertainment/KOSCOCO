import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Calendar,
  User,
  Zap,
  History,
  Settings,
  Copy,
  DollarSign
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

type CreatorProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  profileImageUrl: string | null;
  location: string | null;
  age: number | null;
  emailVerified: boolean;
  createdAt: Date;
};

type Competition = {
  id: string;
  userId: string;
  categoryIds: string[];
  totalFee: number;
  amountPaid: number;
  paymentStatus: string;
  createdAt: Date;
  categories: { id: string; name: string }[];
};

type WatchHistoryEntry = {
  id: string;
  userId: string;
  videoId: string;
  watchedAt: Date;
  watchDuration: number | null;
  completed: boolean;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    categoryId: string;
  } | null;
};

type CreatorEarnings = {
  isAffiliate: boolean;
  referralCode?: string;
  totalEarnings: number;
  totalReferrals: number;
  pendingPayouts: number;
  completedPayouts: number;
  status?: string;
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

  // Fetch creator profile
  const { data: profile, isLoading: profileLoading } = useQuery<CreatorProfile>({
    queryKey: ["/api/creator/profile"],
    enabled: !!user,
  });

  // Fetch creator competitions
  const { data: competitions = [], isLoading: competitionsLoading } = useQuery<Competition[]>({
    queryKey: ["/api/creator/competitions"],
    enabled: !!user,
  });

  // Fetch creator watch history
  const { data: watchHistory = [], isLoading: historyLoading } = useQuery<WatchHistoryEntry[]>({
    queryKey: ["/api/creator/watch-history"],
    enabled: !!user,
  });

  // Fetch creator earnings
  const { data: earnings, isLoading: earningsLoading } = useQuery<CreatorEarnings>({
    queryKey: ["/api/creator/earnings"],
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
        <TabsList className="grid w-full grid-cols-7 max-w-3xl">
          <TabsTrigger value="overview" data-testid="tab-overview">
            <BarChart3 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{t('creator.tabs.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="videos" data-testid="tab-videos">
            <PlayCircle className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{t('creator.tabs.myVideos')}</span>
          </TabsTrigger>
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="competitions" data-testid="tab-competitions">
            <Trophy className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Competitions</span>
          </TabsTrigger>
          <TabsTrigger value="watch-history" data-testid="tab-history">
            <History className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" data-testid="tab-earnings">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Earnings</span>
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-1" />
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

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : profile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile.profileImageUrl || ""} />
                      <AvatarFallback>{profile.firstName[0]}{profile.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-2xl font-bold">{profile.firstName} {profile.lastName}</h3>
                      <p className="text-muted-foreground">{profile.email}</p>
                      <Badge className="mt-2" variant={profile.emailVerified ? 'default' : 'secondary'}>
                        {profile.emailVerified ? 'Email Verified' : 'Email Not Verified'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Username</label>
                      <p className="text-lg">{profile.username || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-lg">{profile.location || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Age</label>
                      <p className="text-lg">{profile.age || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="text-lg">{new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button onClick={() => setLocation('/edit-profile')} data-testid="button-edit-profile">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitions Tab */}
        <TabsContent value="competitions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Competitions</CardTitle>
              <CardDescription>View your competition registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {competitionsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : competitions.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't registered for any competitions yet</p>
                  <Button onClick={() => setLocation('/categories')} data-testid="button-browse-categories">
                    Browse Categories
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {competitions.map((comp) => (
                    <Card key={comp.id} className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">Categories Entered</h3>
                            <div className="flex flex-wrap gap-2">
                              {comp.categories.map(cat => (
                                <Badge key={cat.id} variant="outline">
                                  {cat.name}
                                </Badge>
                              ))}
                            </div>
                            <div className="mt-4 text-sm space-y-2">
                              <p><span className="text-muted-foreground">Total Fee:</span> <strong>{comp.totalFee}</strong></p>
                              <p><span className="text-muted-foreground">Amount Paid:</span> <strong>{comp.amountPaid}</strong></p>
                              <Badge variant={comp.paymentStatus === 'completed' ? 'default' : comp.paymentStatus === 'pending' ? 'secondary' : 'destructive'}>
                                {comp.paymentStatus}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Watch History Tab */}
        <TabsContent value="watch-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Watch History</CardTitle>
              <CardDescription>Videos you've recently watched</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : watchHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your watch history is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchHistory.map((entry) => (
                    <Card key={entry.id} className="hover-elevate">
                      <CardContent className="flex flex-col sm:flex-row gap-3 p-3">
                        {entry.video?.thumbnailUrl && (
                          <img 
                            src={entry.video.thumbnailUrl} 
                            alt={entry.video.title} 
                            className="w-full sm:w-20 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{entry.video?.title || 'Deleted Video'}</h4>
                          <p className="text-xs text-muted-foreground">Watched on {new Date(entry.watchedAt).toLocaleDateString()}</p>
                          {entry.watchDuration && <p className="text-xs text-muted-foreground">Duration: {Math.round(entry.watchDuration / 60)}m</p>}
                          {entry.completed && <Badge className="mt-2">Completed</Badge>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Earnings</CardTitle>
              <CardDescription>Track your referral and affiliate earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {earningsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : earnings ? (
                <div>
                  {!earnings.isAffiliate ? (
                    <div className="text-center py-8">
                      <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">You're not an affiliate yet</p>
                      <Button onClick={() => setLocation('/affiliate')} data-testid="button-join-affiliate">
                        Join Affiliate Program
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-2">Total Earnings</p>
                            <p className="text-2xl font-bold">{earnings.totalEarnings}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-2">Total Referrals</p>
                            <p className="text-2xl font-bold">{earnings.totalReferrals}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-2">Pending Payouts</p>
                            <p className="text-2xl font-bold">{earnings.pendingPayouts}</p>
                          </CardContent>
                        </Card>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Referral Code</label>
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={earnings.referralCode || ''}
                            readOnly
                            className="flex-1 px-3 py-2 border rounded-md bg-muted"
                            data-testid="input-referral-code"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(earnings.referralCode || '');
                              toast({
                                title: "Copied!",
                                description: "Referral code copied to clipboard"
                              });
                            }}
                            data-testid="button-copy-referral"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button onClick={() => setLocation('/affiliate/dashboard')} data-testid="button-view-affiliate-dashboard">
                        View Full Dashboard
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Privacy & Security</h4>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-change-password">
                    Change Password
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Email Preferences</h4>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-email-preferences">
                    Manage Email Preferences
                  </Button>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Account</h4>
                  <Button variant="destructive" className="w-full justify-start" data-testid="button-delete-account">
                    Delete Account
                  </Button>
                </div>
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
