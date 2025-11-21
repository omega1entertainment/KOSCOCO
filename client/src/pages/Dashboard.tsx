import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CompletePaymentButton from "@/components/CompletePaymentButton";
import { 
  Video as VideoIcon, 
  TrendingUp, 
  Check, 
  ThumbsUp,
  Upload as UploadIcon,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  History
} from "lucide-react";
import type { Registration, Video, Vote, Category, WatchHistory } from "@shared/schema";
import { createPermalink } from "@/lib/slugUtils";

export default function Dashboard() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();


  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalVideos: number;
    totalVotesReceived: number;
    totalVotesCast: number;
  }>({
    queryKey: ["/api/stats/user"],
    enabled: !!user,
  });

  const { data: registrations = [], isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: ["/api/registrations/user"],
    enabled: !!user,
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos/user"],
    enabled: !!user,
  });

  const { data: votes = [], isLoading: votesLoading } = useQuery<Vote[]>({
    queryKey: ["/api/votes/user"],
    enabled: !!user,
  });

  const { data: watchHistory = [], isLoading: watchHistoryLoading } = useQuery<(WatchHistory & { video: Video })[]>({
    queryKey: ["/api/watch-history/user"],
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

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
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t('dashboard.authRequired')}</CardTitle>
            <CardDescription>
              {t('dashboard.authDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={login} className="w-full" data-testid="button-login">
              {t('dashboard.loginToContinue')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || t('dashboard.unknownCategory');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />{t('dashboard.status.approved')}</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />{t('dashboard.status.pending')}</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('dashboard.status.rejected')}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />{t('dashboard.payment.paid')}</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />{t('dashboard.payment.pending')}</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('dashboard.payment.rejected')}</Badge>;
    }
  };

  const isLoading = statsLoading || registrationsLoading || videosLoading || votesLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">{t('dashboard.loadingDashboard')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card data-testid="card-stat-videos">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalVideos')}</CardTitle>
                  <VideoIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.stats.videosUploaded')}</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-votes-received">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.votesReceived')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVotesReceived || 0}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.stats.totalSupport')}</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-votes-cast">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('dashboard.stats.votesCast')}</CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVotesCast || 0}</div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.stats.competitionVotes')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Registrations */}
            <Card data-testid="card-registrations">
              <CardHeader>
                <CardTitle>{t('dashboard.registrations.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.registrations.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">{t('dashboard.registrations.empty')}</p>
                    <Button onClick={() => setLocation("/register")} data-testid="button-register-now">
                      {t('dashboard.registrations.registerNow')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registrations.map((registration) => (
                      <div
                        key={registration.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                        data-testid={`registration-${registration.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {registration.categoryIds.map(id => getCategoryName(id)).join(", ")}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t('dashboard.registrations.amount')}: {registration.totalFee.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {getPaymentStatusBadge(registration.paymentStatus)}
                          {registration.paymentStatus === 'pending' && (
                            <CompletePaymentButton
                              registration={registration}
                              userEmail={user?.email || ''}
                              userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Videos */}
            <Card data-testid="card-videos">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('dashboard.videos.title')}</CardTitle>
                  <CardDescription>
                    {t('dashboard.videos.description')}
                  </CardDescription>
                </div>
                <Button onClick={() => setLocation("/upload")} data-testid="button-upload-video">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {t('dashboard.videos.uploadButton')}
                </Button>
              </CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('dashboard.videos.empty')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="border rounded-lg p-4 hover-elevate cursor-pointer"
                        onClick={() => setLocation(`/video/${createPermalink(video.id, video.title)}`)}
                        data-testid={`video-card-${video.id}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{video.title}</h3>
                          {getStatusBadge(video.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getCategoryName(video.categoryId)} - {video.subcategory}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1" title={t('dashboard.videos.views')}>
                            <Eye className="w-4 h-4" />
                            {video.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Votes */}
            <Card data-testid="card-recent-votes">
              <CardHeader>
                <CardTitle>{t('dashboard.votes.title')}</CardTitle>
                <CardDescription>
                  {t('dashboard.votes.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {votes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('dashboard.votes.empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {votes.slice(0, 5).map((vote) => (
                      <div
                        key={vote.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                        data-testid={`vote-${vote.id}`}
                      >
                        <div>
                          <p className="text-sm">{t('dashboard.votes.votedFor')}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(vote.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/video/${vote.videoId}`)}
                          data-testid={`button-view-video-${vote.id}`}
                        >
                          {t('dashboard.votes.viewVideo')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Watch History */}
            <Card data-testid="card-watch-history">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t('dashboard.watchHistory.title')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.watchHistory.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {watchHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">{t('dashboard.watchHistory.empty')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {watchHistory.slice(0, 10).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded-lg hover-elevate cursor-pointer"
                        onClick={() => setLocation(`/video/${createPermalink(item.videoId, item.video.title)}`)}
                        data-testid={`watch-history-${item.id}`}
                      >
                        {item.video.thumbnailUrl && (
                          <img
                            src={item.video.thumbnailUrl}
                            alt={item.video.title}
                            className="w-32 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.video.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getCategoryName(item.video.categoryId)} - {item.video.subcategory}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{t('dashboard.watchHistory.watchedOn')} {new Date(item.watchedAt).toLocaleDateString()}</span>
                            {item.completed && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('dashboard.watchHistory.completed')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
