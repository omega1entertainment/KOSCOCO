import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CompletePaymentButton from "@/components/CompletePaymentButton";
import { 
  Video as VideoIcon, 
  TrendingUp, 
  Heart, 
  Upload as UploadIcon,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ThumbsUp,
  Mail,
  AlertCircle
} from "lucide-react";
import type { Registration, Video, Vote, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();

  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/resend-verification", "POST");
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Sent",
        description: data.message || "Verification email sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to view your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={login} className="w-full" data-testid="button-login">
              Log In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || "Unknown Category";
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === 'approved') {
      return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    } else {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const isLoading = statsLoading || registrationsLoading || videosLoading || votesLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your competition progress, videos, and voting activity
          </p>
        </div>

        {!user.emailVerified && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950" data-testid="alert-email-verification">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email not verified</span>
                <span className="text-sm">
                  Please verify your email to access all features
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resendVerificationMutation.mutate()}
                disabled={resendVerificationMutation.isPending}
                data-testid="button-resend-verification"
              >
                {resendVerificationMutation.isPending ? "Sending..." : "Resend Email"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card data-testid="card-stat-videos">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                  <VideoIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
                  <p className="text-xs text-muted-foreground">Videos uploaded</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-votes-received">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Votes Received</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVotesReceived || 0}</div>
                  <p className="text-xs text-muted-foreground">Total support</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-votes-cast">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVotesCast || 0}</div>
                  <p className="text-xs text-muted-foreground">Videos supported</p>
                </CardContent>
              </Card>
            </div>

            {/* Registrations */}
            <Card data-testid="card-registrations">
              <CardHeader>
                <CardTitle>My Registrations</CardTitle>
                <CardDescription>
                  Categories you've registered for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registrations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No registrations yet</p>
                    <Button onClick={() => setLocation("/register")} data-testid="button-register-now">
                      Register Now
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
                            Amount: {registration.totalFee.toLocaleString()} FCFA
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
                  <CardTitle>My Videos</CardTitle>
                  <CardDescription>
                    Your uploaded competition entries
                  </CardDescription>
                </div>
                <Button onClick={() => setLocation("/upload")} data-testid="button-upload-video">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Upload Video
                </Button>
              </CardHeader>
              <CardContent>
                {videos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No videos uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="border rounded-lg p-4 hover-elevate cursor-pointer"
                        onClick={() => setLocation(`/video/${video.id}`)}
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
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {video.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            {/* Vote count would need to be fetched separately or joined */}
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
                <CardTitle>Recent Votes</CardTitle>
                <CardDescription>
                  Videos you've recently voted for
                </CardDescription>
              </CardHeader>
              <CardContent>
                {votes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No votes cast yet</p>
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
                          <p className="text-sm">Voted for video</p>
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
                          View Video
                        </Button>
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
