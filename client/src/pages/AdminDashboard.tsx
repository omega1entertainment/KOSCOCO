import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PhaseManagement from "@/components/PhaseManagement";
import { CheckCircle, XCircle, Eye, Clock, DollarSign, Flag, ExternalLink, UserCog } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Video, Category, PayoutRequest, Report, JudgeProfile } from "@shared/schema";

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: pendingVideos = [], isLoading, error } = useQuery<Video[]>({
    queryKey: ["/api/videos/pending"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: payoutRequests = [], isLoading: payoutsLoading } = useQuery<PayoutRequest[]>({
    queryKey: ["/api/admin/payouts"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: judges = [], isLoading: judgesLoading } = useQuery<JudgeProfile[]>({
    queryKey: ["/api/admin/judges"],
  });

  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return await apiRequest(`/api/admin/payouts/${payoutId}/approve`, "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Payout Approved",
        description: "The payout request has been approved",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async ({ payoutId, rejectionReason }: { payoutId: string; rejectionReason: string }) => {
      return await apiRequest(`/api/admin/payouts/${payoutId}/reject`, "POST", { rejectionReason });
    },
    onSuccess: () => {
      toast({
        title: "Payout Rejected",
        description: "The payout request has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      setRejectionDialogOpen(false);
      setSelectedPayoutId(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRejectPayout = () => {
    if (!selectedPayoutId || !rejectionReason) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    rejectPayoutMutation.mutate({ payoutId: selectedPayoutId, rejectionReason });
  };

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

  const generateThumbnailsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/generate-thumbnails", "POST", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Thumbnail Generation Complete",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Thumbnail Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      return await apiRequest(`/api/admin/reports/${reportId}/review`, "PATCH", { status });
    },
    onSuccess: (_, { status }) => {
      toast({
        title: "Report Updated",
        description: `Report has been marked as ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createJudgeSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    judgeName: z.string().min(1, "Judge name is required"),
    judgeBio: z.string().optional(),
    judgePhotoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  });

  const judgeForm = useForm<z.infer<typeof createJudgeSchema>>({
    resolver: zodResolver(createJudgeSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      username: "",
      judgeName: "",
      judgeBio: "",
      judgePhotoUrl: "",
    },
  });

  const createJudgeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createJudgeSchema>) => {
      return await apiRequest("/api/admin/judges", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Judge Created",
        description: "Judge account has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/judges"] });
      judgeForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
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
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-5 gap-1">
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
          <TabsTrigger value="judges" data-testid="tab-judges">
            Judges
          </TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-payouts">
            Payout Requests
            {payoutRequests.filter(p => p.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {payoutRequests.filter(p => p.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">
            Reports
            {reports.filter(r => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reports.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="mt-6">
          <PhaseManagement />
        </TabsContent>

        <TabsContent value="judges" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-create-judge">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  Create Judge Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...judgeForm}>
                  <form onSubmit={judgeForm.handleSubmit((data) => createJudgeMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={judgeForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-judge-firstname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={judgeForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-judge-lastname" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={judgeForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-judge-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={judgeForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-judge-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={judgeForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" data-testid="input-judge-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={judgeForm.control}
                      name="judgeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judge Name (Public Display)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Prof. John Doe" data-testid="input-judge-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={judgeForm.control}
                      name="judgeBio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Judge Bio (Optional)</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Brief biography" data-testid="input-judge-bio" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={judgeForm.control}
                      name="judgePhotoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Photo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://..." data-testid="input-judge-photo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createJudgeMutation.isPending}
                      data-testid="button-create-judge"
                    >
                      {createJudgeMutation.isPending ? "Creating..." : "Create Judge Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card data-testid="card-judge-list">
              <CardHeader>
                <CardTitle>Current Judges ({judges.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {judgesLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">Loading judges...</p>
                  </div>
                ) : judges.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCog className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No Judges Yet</h3>
                    <p className="text-muted-foreground">
                      Create judge accounts using the form
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {judges.map((judge) => (
                      <Card key={judge.id} className="p-4" data-testid={`judge-item-${judge.id}`}>
                        <div className="flex items-start gap-4">
                          {judge.judgePhotoUrl && (
                            <img 
                              src={judge.judgePhotoUrl} 
                              alt={judge.judgeName || judge.email} 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold" data-testid={`text-judge-name-${judge.id}`}>
                              {judge.judgeName || `${judge.firstName} ${judge.lastName}`}
                            </h4>
                            <p className="text-sm text-muted-foreground">{judge.email}</p>
                            {judge.judgeBio && (
                              <p className="text-sm mt-2">{judge.judgeBio}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
              <div className="flex items-center justify-between gap-4 mb-4">
                <Badge variant="outline" className="text-base">
                  {pendingVideos.length} Pending {pendingVideos.length === 1 ? 'Video' : 'Videos'}
                </Badge>
                <Button 
                  onClick={() => generateThumbnailsMutation.mutate()}
                  disabled={generateThumbnailsMutation.isPending}
                  variant="outline"
                  data-testid="button-generate-thumbnails"
                >
                  {generateThumbnailsMutation.isPending ? "Generating Thumbnails..." : "Generate Missing Thumbnails"}
                </Button>
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

        <TabsContent value="payouts" className="mt-6">
          {payoutsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading payout requests...</p>
            </div>
          ) : payoutRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Payout Requests</h3>
                <p className="text-muted-foreground">
                  There are no payout requests from affiliates at this time
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className="text-base">
                  {payoutRequests.length} Total {payoutRequests.length === 1 ? 'Request' : 'Requests'}
                </Badge>
                <Badge variant="secondary" className="text-base">
                  {payoutRequests.filter(p => p.status === 'pending').length} Pending
                </Badge>
              </div>

              <div className="grid gap-6">
                {payoutRequests.map((payout) => (
                  <Card key={payout.id} data-testid={`payout-card-${payout.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl">
                            {payout.amount.toLocaleString()} FCFA
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Requested on {new Date(payout.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            payout.status === 'approved' ? 'default' : 
                            payout.status === 'rejected' ? 'destructive' : 
                            'secondary'
                          }
                          className="text-sm"
                        >
                          {payout.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {payout.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {payout.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-medium">{payout.paymentMethod}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Affiliate ID</p>
                            <p className="font-mono text-sm">{payout.affiliateId}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Account Details</p>
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-mono whitespace-pre-wrap">{payout.accountDetails}</p>
                          </div>
                        </div>

                        {payout.status === 'rejected' && payout.rejectionReason && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                            <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                              <p className="text-sm text-destructive">{payout.rejectionReason}</p>
                            </div>
                          </div>
                        )}

                        {payout.status === 'approved' && payout.processedAt && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Approved on {new Date(payout.processedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {payout.status === 'pending' && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button
                              onClick={() => approvePayoutMutation.mutate(payout.id)}
                              disabled={approvePayoutMutation.isPending}
                              className="flex-1"
                              data-testid={`button-approve-payout-${payout.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {approvePayoutMutation.isPending ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedPayoutId(payout.id);
                                setRejectionDialogOpen(true);
                              }}
                              disabled={rejectPayoutMutation.isPending}
                              variant="destructive"
                              className="flex-1"
                              data-testid={`button-reject-payout-${payout.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Payout Request</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejecting this payout request.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rejection-reason">Rejection Reason</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Enter the reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        data-testid="textarea-rejection-reason"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setRejectionDialogOpen(false);
                          setSelectedPayoutId(null);
                          setRejectionReason("");
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRejectPayout}
                        disabled={rejectPayoutMutation.isPending || !rejectionReason}
                        variant="destructive"
                        className="flex-1"
                        data-testid="button-confirm-reject"
                      >
                        {rejectPayoutMutation.isPending ? "Processing..." : "Confirm Rejection"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          {reportsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Reports</h3>
                <p className="text-muted-foreground">
                  There are no video reports at this time
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className="text-base">
                  {reports.length} Total {reports.length === 1 ? 'Report' : 'Reports'}
                </Badge>
                <Badge variant="secondary" className="text-base">
                  {reports.filter(r => r.status === 'pending').length} Pending
                </Badge>
              </div>

              <div className="grid gap-6">
                {reports.map((report) => (
                  <Card key={report.id} data-testid={`report-card-${report.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Flag className="w-5 h-5 text-destructive flex-shrink-0" />
                            <span className="truncate">Video Report</span>
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Reported on {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            report.status === 'reviewed' || report.status === 'action_taken' ? 'default' : 
                            report.status === 'dismissed' ? 'secondary' : 
                            'destructive'
                          }
                          className="text-sm flex-shrink-0"
                        >
                          {report.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {(report.status === 'reviewed' || report.status === 'action_taken') && <CheckCircle className="w-3 h-3 mr-1" />}
                          {report.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Report Reason</p>
                          <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm whitespace-pre-wrap">{report.reason}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setLocation(`/video/${report.videoId}`)}
                            className="gap-2"
                            data-testid={`button-view-video-${report.id}`}
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Reported Video
                          </Button>
                        </div>

                        {report.reviewedAt && report.reviewedBy && (
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              Reviewed on {new Date(report.reviewedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {report.status === 'pending' && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button
                              onClick={() => reviewReportMutation.mutate({ reportId: report.id, status: 'reviewed' })}
                              disabled={reviewReportMutation.isPending}
                              variant="default"
                              className="flex-1"
                              data-testid={`button-mark-reviewed-${report.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {reviewReportMutation.isPending ? "Processing..." : "Mark Reviewed"}
                            </Button>
                            <Button
                              onClick={() => reviewReportMutation.mutate({ reportId: report.id, status: 'action_taken' })}
                              disabled={reviewReportMutation.isPending}
                              className="flex-1"
                              data-testid={`button-action-taken-${report.id}`}
                            >
                              Action Taken
                            </Button>
                            <Button
                              onClick={() => reviewReportMutation.mutate({ reportId: report.id, status: 'dismissed' })}
                              disabled={reviewReportMutation.isPending}
                              variant="outline"
                              className="flex-1"
                              data-testid={`button-dismiss-${report.id}`}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
