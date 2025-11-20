import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import PhaseManagement from "@/components/PhaseManagement";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  DollarSign,
  Flag,
  ExternalLink,
  UserCog,
  Upload,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Video,
  Category,
  PayoutRequest,
  Report,
  JudgeProfile,
  SelectUser,
} from "@shared/schema";

function AdminDashboardContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const {
    data: pendingVideos = [],
    isLoading,
    error,
  } = useQuery<Video[]>({
    queryKey: ["/api/videos/pending"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: payoutRequests = [], isLoading: payoutsLoading } = useQuery<
    PayoutRequest[]
  >({
    queryKey: ["/api/admin/payouts"],
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ["/api/admin/reports"],
  });

  const { data: judges = [], isLoading: judgesLoading } = useQuery<
    JudgeProfile[]
  >({
    queryKey: ["/api/admin/judges"],
  });

  const { data: pendingAds = [], isLoading: adsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/ads/pending"],
  });

  const { data: approvedAds = [], isLoading: approvedAdsLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/admin/ads/approved"],
  });

  const { data: advertisers = [], isLoading: advertisersLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/admin/advertisers"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Ad rejection state
  const [adRejectionDialogOpen, setAdRejectionDialogOpen] = useState(false);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [adRejectionReason, setAdRejectionReason] = useState("");

  // Judge photo upload state
  const [judgePhotoFile, setJudgePhotoFile] = useState<File | null>(null);
  const [judgePhotoPreview, setJudgePhotoPreview] = useState<string | null>(
    null,
  );
  const judgePhotoInputRef = useRef<HTMLInputElement>(null);

  // Judge delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<JudgeProfile | null>(null);

  // User filter state
  const [userFilter, setUserFilter] = useState<
    "all" | "verified" | "admin" | "judge" | "contestant"
  >("all");

  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return await apiRequest(
        `/api/admin/payouts/${payoutId}/approve`,
        "POST",
        {},
      );
    },
    onSuccess: () => {
      toast({
        title: t("admin.toast.payoutApproved"),
        description: t("admin.toast.payoutApprovedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.approvalFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async ({
      payoutId,
      rejectionReason,
    }: {
      payoutId: string;
      rejectionReason: string;
    }) => {
      return await apiRequest(`/api/admin/payouts/${payoutId}/reject`, "POST", {
        rejectionReason,
      });
    },
    onSuccess: () => {
      toast({
        title: t("admin.toast.payoutRejected"),
        description: t("admin.toast.payoutRejectedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      setRejectionDialogOpen(false);
      setSelectedPayoutId(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.rejectionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRejectPayout = () => {
    if (!selectedPayoutId || !rejectionReason) {
      toast({
        title: t("admin.toast.rejectionReasonRequired"),
        description: t("admin.toast.provideRejectionReason"),
        variant: "destructive",
      });
      return;
    }
    rejectPayoutMutation.mutate({
      payoutId: selectedPayoutId,
      rejectionReason,
    });
  };

  // Ad approval/rejection mutations
  const approveAdMutation = useMutation({
    mutationFn: async (adId: string) => {
      return await apiRequest(`/api/admin/ads/${adId}/approve`, "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Ad Approved",
        description: "The ad has been approved and is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads/approved"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectAdMutation = useMutation({
    mutationFn: async ({
      adId,
      rejectionReason,
    }: {
      adId: string;
      rejectionReason: string;
    }) => {
      return await apiRequest(`/api/admin/ads/${adId}/reject`, "POST", {
        rejectionReason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Ad Rejected",
        description: "The ad has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads/approved"] });
      setAdRejectionDialogOpen(false);
      setSelectedAdId(null);
      setAdRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRejectAd = () => {
    if (!selectedAdId || !adRejectionReason) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this ad.",
        variant: "destructive",
      });
      return;
    }
    rejectAdMutation.mutate({
      adId: selectedAdId,
      rejectionReason: adRejectionReason,
    });
  };

  // Advertiser approval/rejection mutations
  const approveAdvertiserMutation = useMutation({
    mutationFn: async (advertiserId: string) => {
      return await apiRequest(
        `/api/admin/advertisers/${advertiserId}/approve`,
        "POST",
        {},
      );
    },
    onSuccess: () => {
      toast({
        title: "Advertiser Approved",
        description:
          "The advertiser account has been approved and is now active.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const suspendAdvertiserMutation = useMutation({
    mutationFn: async (advertiserId: string) => {
      return await apiRequest(
        `/api/admin/advertisers/${advertiserId}/reject`,
        "POST",
        {},
      );
    },
    onSuccess: () => {
      toast({
        title: "Advertiser Suspended",
        description: "The advertiser account has been suspended.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Suspension Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      videoId,
      status,
    }: {
      videoId: string;
      status: string;
    }) => {
      return await apiRequest(`/api/videos/${videoId}/status`, "PATCH", {
        status,
      });
    },
    onSuccess: (_, { status }) => {
      toast({
        title: t("admin.toast.videoUpdated"),
        description: `${t("admin.toast.videoStatusUpdated")} ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.updateFailed"),
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
        title: t("admin.toast.thumbnailGenerationComplete"),
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.thumbnailGenerationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reviewReportMutation = useMutation({
    mutationFn: async ({
      reportId,
      status,
    }: {
      reportId: string;
      status: string;
    }) => {
      return await apiRequest(
        `/api/admin/reports/${reportId}/review`,
        "PATCH",
        { status },
      );
    },
    onSuccess: (_, { status }) => {
      toast({
        title: t("admin.toast.reportUpdated"),
        description: `${t("admin.toast.reportStatusUpdated")} ${status}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.updateFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createJudgeSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, t("admin.validation.passwordMinLength")),
    firstName: z.string().min(1, t("admin.validation.firstNameRequired")),
    lastName: z.string().min(1, t("admin.validation.lastNameRequired")),
    username: z.string().min(3, t("admin.validation.usernameMinLength")),
    judgeName: z.string().min(1, t("admin.validation.judgeNameRequired")),
    judgeBio: z.string().optional(),
    judgePhotoUrl: z
      .string()
      .url(t("admin.validation.validUrl"))
      .optional()
      .or(z.literal("")),
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

  // Photo upload mutation
  const uploadJudgePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/admin/judges/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload photo");
      }

      return await response.json();
    },
    onSuccess: (data: { photoUrl: string }) => {
      judgeForm.setValue("judgePhotoUrl", data.photoUrl);
      setJudgePhotoPreview(URL.createObjectURL(judgePhotoFile!));
      toast({
        title: t("admin.toast.photoUploaded"),
        description: t("admin.toast.photoUploadedDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.uploadFailed"),
        description: error.message,
        variant: "destructive",
      });
      setJudgePhotoFile(null);
      setJudgePhotoPreview(null);
    },
  });

  const createJudgeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createJudgeSchema>) => {
      return await apiRequest("/api/admin/judges", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: t("admin.toast.judgeCreated"),
        description: t("admin.toast.judgeCreatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/judges"] });
      judgeForm.reset();
      setJudgePhotoFile(null);
      setJudgePhotoPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.creationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete judge mutation
  const deleteJudgeMutation = useMutation({
    mutationFn: async (judgeId: string) => {
      const response = await fetch(`/api/admin/judges/${judgeId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete judge");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t("admin.toast.judgeDeleted"),
        description: t("admin.toast.judgeDeletedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/judges"] });
      setDeleteDialogOpen(false);
      setJudgeToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.deletionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePhotoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: t("admin.toast.invalidFormat"),
        description: t("admin.toast.invalidImageFormat"),
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      toast({
        title: t("admin.toast.fileTooLarge"),
        description: t("admin.toast.photoSizeLimit"),
        variant: "destructive",
      });
      return;
    }

    setJudgePhotoFile(file);
    uploadJudgePhotoMutation.mutate(file);
  };

  const handleClearPhoto = () => {
    setJudgePhotoFile(null);
    setJudgePhotoPreview(null);
    judgeForm.setValue("judgePhotoUrl", "");
    if (judgePhotoInputRef.current) {
      judgePhotoInputRef.current.value = "";
    }
  };

  const getCategoryName = (categoryId: string) => {
    return (
      categories.find((c) => c.id === categoryId)?.name ||
      t("admin.common.unknown")
    );
  };

  // Check if error is a 403 by inspecting the error object
  const is403Error =
    error &&
    typeof error === "object" &&
    "status" in error &&
    (error as any).status === 403;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">
          {t("admin.dashboard")}
        </h1>
        <p className="text-muted-foreground">{t("admin.dashboardSubtitle")}</p>
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          <TabsList className="flex flex-col h-fit w-full lg:w-48 gap-1">
            <TabsTrigger
              value="phases"
              className="w-full justify-start"
              data-testid="tab-phases"
            >
              {t("admin.tabs.phases")}
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="w-full justify-start"
              data-testid="tab-videos"
            >
              {t("admin.tabs.videos")}
              {pendingVideos.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingVideos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="w-full justify-start"
              data-testid="tab-users"
            >
              {t("admin.tabs.users")}
            </TabsTrigger>
            <TabsTrigger
              value="judges"
              className="w-full justify-start"
              data-testid="tab-judges"
            >
              {t("admin.tabs.judges")}
            </TabsTrigger>
            <TabsTrigger
              value="advertisers"
              className="w-full justify-start"
              data-testid="tab-advertisers"
            >
              Advertisers
              {advertisers.filter((a: any) => a.status === "pending").length >
                0 && (
                <Badge variant="destructive" className="ml-2">
                  {
                    advertisers.filter((a: any) => a.status === "pending")
                      .length
                  }
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="ads"
              className="w-full justify-start"
              data-testid="tab-ads"
            >
              Ads
              {pendingAds.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingAds.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="payouts"
              className="w-full justify-start"
              data-testid="tab-payouts"
            >
              {t("admin.tabs.payouts")}
              {payoutRequests.filter((p) => p.status === "pending").length >
                0 && (
                <Badge variant="destructive" className="ml-2">
                  {payoutRequests.filter((p) => p.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="w-full justify-start"
              data-testid="tab-reports"
            >
              {t("admin.tabs.reports")}
              {reports.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {reports.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1">
            <TabsContent value="phases" className="mt-0">
              <PhaseManagement />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" />
                    {t("admin.users.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div
                      className="text-center py-12"
                      data-testid="loading-users"
                    >
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">
                        {t("admin.common.loading")}
                      </p>
                    </div>
                  ) : users.length === 0 ? (
                    <div
                      className="text-center py-12"
                      data-testid="empty-users"
                    >
                      <p className="text-muted-foreground">
                        {t("admin.users.noUsers")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge
                          variant={userFilter === "all" ? "default" : "outline"}
                          className="text-base cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setUserFilter("all")}
                          data-testid="badge-total-users"
                        >
                          {users.length} {t("admin.users.totalUsers")}
                        </Badge>
                        <Badge
                          variant={
                            userFilter === "verified" ? "default" : "outline"
                          }
                          className="text-base cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setUserFilter("verified")}
                          data-testid="badge-verified-users"
                        >
                          {users.filter((u) => u.emailVerified).length}{" "}
                          {t("admin.users.verified")}
                        </Badge>
                        <Badge
                          variant={
                            userFilter === "admin" ? "default" : "outline"
                          }
                          className="text-base cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setUserFilter("admin")}
                          data-testid="badge-admin-users"
                        >
                          {users.filter((u) => u.isAdmin).length}{" "}
                          {t("admin.users.admins")}
                        </Badge>
                        <Badge
                          variant={
                            userFilter === "judge" ? "default" : "outline"
                          }
                          className="text-base cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setUserFilter("judge")}
                          data-testid="badge-judge-users"
                        >
                          {users.filter((u) => u.isJudge).length}{" "}
                          {t("admin.users.judges")}
                        </Badge>
                        <Badge
                          variant={
                            userFilter === "contestant" ? "default" : "outline"
                          }
                          className="text-base cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setUserFilter("contestant")}
                          data-testid="badge-contestant-users"
                        >
                          {users.filter((u) => !u.isAdmin && !u.isJudge).length}{" "}
                          {t("admin.users.contestants")}
                        </Badge>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full" data-testid="table-users">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.name")}
                              </th>
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.email")}
                              </th>
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.username")}
                              </th>
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.location")}
                              </th>
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.roles")}
                              </th>
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.status")}
                              </th>
                              <th className="text-left p-3 font-semibold">
                                {t("admin.users.joined")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {users
                              .filter((user) => {
                                if (userFilter === "all") return true;
                                if (userFilter === "verified")
                                  return user.emailVerified;
                                if (userFilter === "admin") return user.isAdmin;
                                if (userFilter === "judge") return user.isJudge;
                                if (userFilter === "contestant")
                                  return !user.isAdmin && !user.isJudge;
                                return true;
                              })
                              .map((user) => (
                                <tr
                                  key={user.id}
                                  className="border-b hover-elevate"
                                  data-testid={`row-user-${user.id}`}
                                >
                                  <td
                                    className="p-3"
                                    data-testid={`text-name-${user.id}`}
                                  >
                                    {user.firstName} {user.lastName}
                                  </td>
                                  <td
                                    className="p-3"
                                    data-testid={`text-email-${user.id}`}
                                  >
                                    {user.email}
                                  </td>
                                  <td
                                    className="p-3"
                                    data-testid={`text-username-${user.id}`}
                                  >
                                    {user.username || "-"}
                                  </td>
                                  <td
                                    className="p-3"
                                    data-testid={`text-location-${user.id}`}
                                  >
                                    {user.location || "-"}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1 flex-wrap">
                                      {user.isAdmin && (
                                        <Badge
                                          variant="destructive"
                                          data-testid={`badge-admin-${user.id}`}
                                        >
                                          {t("admin.users.admin")}
                                        </Badge>
                                      )}
                                      {user.isJudge && (
                                        <Badge
                                          variant="secondary"
                                          data-testid={`badge-judge-${user.id}`}
                                        >
                                          {t("admin.users.judge")}
                                        </Badge>
                                      )}
                                      {!user.isAdmin && !user.isJudge && (
                                        <Badge
                                          variant="outline"
                                          data-testid={`badge-user-${user.id}`}
                                        >
                                          {t("admin.users.contestant")}
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    {user.emailVerified ? (
                                      <Badge
                                        variant="default"
                                        data-testid={`badge-verified-${user.id}`}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        {t("admin.users.verified")}
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="secondary"
                                        data-testid={`badge-unverified-${user.id}`}
                                      >
                                        <Clock className="w-3 h-3 mr-1" />
                                        {t("admin.users.unverified")}
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {new Date(
                                      user.createdAt,
                                    ).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="judges" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="card-create-judge">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCog className="w-5 h-5" />
                      {t("admin.judges.createTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...judgeForm}>
                      <form
                        onSubmit={judgeForm.handleSubmit((data) =>
                          createJudgeMutation.mutate(data),
                        )}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={judgeForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("admin.judges.firstName")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    data-testid="input-judge-firstname"
                                  />
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
                                <FormLabel>
                                  {t("admin.judges.lastName")}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    data-testid="input-judge-lastname"
                                  />
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
                              <FormLabel>{t("admin.judges.email")}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  data-testid="input-judge-email"
                                />
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
                              <FormLabel>
                                {t("admin.judges.username")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  data-testid="input-judge-username"
                                />
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
                              <FormLabel>
                                {t("admin.judges.password")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  data-testid="input-judge-password"
                                />
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
                              <FormLabel>
                                {t("admin.judges.judgeName")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={t(
                                    "admin.judges.judgeNamePlaceholder",
                                  )}
                                  data-testid="input-judge-name"
                                />
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
                              <FormLabel>
                                {t("admin.judges.judgeBio")}
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder={t(
                                    "admin.judges.judgeBioPlaceholder",
                                  )}
                                  data-testid="input-judge-bio"
                                />
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
                              <FormLabel>
                                {t("admin.judges.profilePhoto")}
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <input
                                    ref={judgePhotoInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoFileSelect}
                                    className="hidden"
                                    data-testid="input-judge-photo-file"
                                  />
                                  {judgePhotoPreview ? (
                                    <div className="flex items-center gap-4">
                                      <img
                                        src={judgePhotoPreview}
                                        alt="Preview"
                                        className="w-20 h-20 rounded-full object-cover"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            judgePhotoInputRef.current?.click()
                                          }
                                          disabled={
                                            uploadJudgePhotoMutation.isPending
                                          }
                                          data-testid="button-change-photo"
                                        >
                                          <Upload className="w-4 h-4 mr-2" />
                                          {t("admin.judges.changePhoto")}
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={handleClearPhoto}
                                          disabled={
                                            uploadJudgePhotoMutation.isPending
                                          }
                                          data-testid="button-remove-photo"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          {t("admin.judges.remove")}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        judgePhotoInputRef.current?.click()
                                      }
                                      disabled={
                                        uploadJudgePhotoMutation.isPending
                                      }
                                      data-testid="button-upload-photo"
                                    >
                                      {uploadJudgePhotoMutation.isPending ? (
                                        <>{t("admin.judges.uploading")}</>
                                      ) : (
                                        <>
                                          <Upload className="w-4 h-4 mr-2" />
                                          {t("admin.judges.uploadPhoto")}
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  <Input {...field} type="hidden" />
                                </div>
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
                          {createJudgeMutation.isPending
                            ? t("admin.judges.creating")
                            : t("admin.judges.createButton")}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <Card data-testid="card-judge-list">
                  <CardHeader>
                    <CardTitle>
                      {t("admin.judges.currentJudges")} ({judges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {judgesLoading ? (
                      <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-muted-foreground">
                          {t("admin.judges.loadingJudges")}
                        </p>
                      </div>
                    ) : judges.length === 0 ? (
                      <div className="text-center py-12">
                        <UserCog className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">
                          {t("admin.judges.noJudgesTitle")}
                        </h3>
                        <p className="text-muted-foreground">
                          {t("admin.judges.noJudgesDescription")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {judges.map((judge) => (
                          <Card
                            key={judge.id}
                            className="p-4"
                            data-testid={`judge-item-${judge.id}`}
                          >
                            <div className="flex items-start gap-4">
                              {judge.judgePhotoUrl && (
                                <img
                                  src={judge.judgePhotoUrl}
                                  alt={judge.judgeName || judge.email}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <h4
                                  className="font-semibold"
                                  data-testid={`text-judge-name-${judge.id}`}
                                >
                                  {judge.judgeName ||
                                    `${judge.firstName} ${judge.lastName}`}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {judge.email}
                                </p>
                                {judge.judgeBio && (
                                  <p className="text-sm mt-2">
                                    {judge.judgeBio}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setJudgeToDelete(judge);
                                  setDeleteDialogOpen(true);
                                }}
                                disabled={deleteJudgeMutation.isPending}
                                data-testid={`button-delete-judge-${judge.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("admin.judges.delete")}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="advertisers" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Advertiser Accounts ({advertisers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {advertisersLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">
                        Loading advertisers...
                      </p>
                    </div>
                  ) : advertisers.length === 0 ? (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-semibold mb-2">
                        No Advertisers Yet
                      </h3>
                      <p className="text-muted-foreground">
                        No advertiser accounts have been created yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {advertisers.map((advertiser: any) => (
                        <Card
                          key={advertiser.id}
                          className="p-4"
                          data-testid={`advertiser-item-${advertiser.id}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4
                                  className="font-semibold text-lg"
                                  data-testid={`text-company-name-${advertiser.id}`}
                                >
                                  {advertiser.companyName}
                                </h4>
                                <Badge
                                  variant={
                                    advertiser.status === "active"
                                      ? "default"
                                      : advertiser.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {advertiser.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                <strong>Email:</strong> {advertiser.email}
                              </p>
                              <p className="text-sm text-muted-foreground mb-1">
                                <strong>Contact:</strong>{" "}
                                {advertiser.contactName}{" "}
                                {advertiser.contactPhone &&
                                  `(${advertiser.contactPhone})`}
                              </p>
                              <p className="text-sm text-muted-foreground mb-1">
                                <strong>Business Type:</strong>{" "}
                                {advertiser.businessType} |{" "}
                                <strong>Country:</strong> {advertiser.country}
                              </p>
                              {advertiser.companyWebsite && (
                                <p className="text-sm text-muted-foreground mb-1">
                                  <strong>Website:</strong>{" "}
                                  <a
                                    href={advertiser.companyWebsite}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {advertiser.companyWebsite}
                                  </a>
                                </p>
                              )}
                              {advertiser.companyDescription && (
                                <p className="text-sm mt-2">
                                  {advertiser.companyDescription}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Created:{" "}
                                {new Date(
                                  advertiser.createdAt,
                                ).toLocaleDateString()}
                                {advertiser.verifiedAt &&
                                  ` | Verified: ${new Date(advertiser.verifiedAt).toLocaleDateString()}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {advertiser.status === "pending" && (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      approveAdvertiserMutation.mutate(
                                        advertiser.id,
                                      )
                                    }
                                    disabled={
                                      approveAdvertiserMutation.isPending
                                    }
                                    data-testid={`button-approve-advertiser-${advertiser.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      suspendAdvertiserMutation.mutate(
                                        advertiser.id,
                                      )
                                    }
                                    disabled={
                                      suspendAdvertiserMutation.isPending
                                    }
                                    data-testid={`button-suspend-advertiser-${advertiser.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Suspend
                                  </Button>
                                </>
                              )}
                              {advertiser.status === "active" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    suspendAdvertiserMutation.mutate(
                                      advertiser.id,
                                    )
                                  }
                                  disabled={suspendAdvertiserMutation.isPending}
                                  data-testid={`button-suspend-advertiser-${advertiser.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Suspend
                                </Button>
                              )}
                              {advertiser.status === "suspended" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() =>
                                    approveAdvertiserMutation.mutate(
                                      advertiser.id,
                                    )
                                  }
                                  disabled={approveAdvertiserMutation.isPending}
                                  data-testid={`button-reactivate-advertiser-${advertiser.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Reactivate
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="videos" className="mt-0">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">
                    {t("admin.videos.loadingPending")}
                  </p>
                </div>
              ) : is403Error ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("admin.videos.accessDeniedTitle")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("admin.videos.accessDeniedDescription")}
                    </p>
                    <Button
                      onClick={() => setLocation("/")}
                      data-testid="button-go-home"
                    >
                      {t("admin.videos.goHome")}
                    </Button>
                  </CardContent>
                </Card>
              ) : error ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("admin.videos.errorLoadingTitle")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("admin.videos.errorLoadingDescription")}
                    </p>
                    <Button
                      onClick={() => window.location.reload()}
                      data-testid="button-retry"
                    >
                      {t("admin.videos.retry")}
                    </Button>
                  </CardContent>
                </Card>
              ) : pendingVideos.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("admin.videos.noPendingTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("admin.videos.noPendingDescription")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <Badge variant="outline" className="text-base">
                      {pendingVideos.length} {t("admin.videos.pending")}{" "}
                      {pendingVideos.length === 1
                        ? t("admin.videos.video")
                        : t("admin.videos.videos")}
                    </Badge>
                    <Button
                      onClick={() => generateThumbnailsMutation.mutate()}
                      disabled={generateThumbnailsMutation.isPending}
                      variant="outline"
                      data-testid="button-generate-thumbnails"
                    >
                      {generateThumbnailsMutation.isPending
                        ? t("admin.videos.generatingThumbnails")
                        : t("admin.videos.generateThumbnails")}
                    </Button>
                  </div>

                  <div className="grid gap-6">
                    {pendingVideos.map((video) => {
                      const videoUrl = video.videoUrl.startsWith("/objects/")
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
                                {t("admin.videos.duration")}:{" "}
                                {Math.floor(video.duration / 60)}:
                                {(video.duration % 60)
                                  .toString()
                                  .padStart(2, "0")}
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3
                                    className="text-xl font-semibold mb-2"
                                    data-testid={`text-video-title-${video.id}`}
                                  >
                                    {video.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <Badge variant="outline">
                                      {getCategoryName(video.categoryId)}
                                    </Badge>
                                    <Badge variant="outline">
                                      {video.subcategory}
                                    </Badge>
                                    <Badge variant="outline">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {new Date(
                                        video.createdAt,
                                      ).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {video.description && (
                                <div className="mb-4">
                                  <h4 className="font-medium text-sm mb-1">
                                    {t("admin.videos.description")}
                                  </h4>
                                  <p
                                    className="text-sm text-muted-foreground whitespace-pre-wrap"
                                    data-testid={`text-video-description-${video.id}`}
                                  >
                                    {video.description}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                <div>
                                  <span className="text-muted-foreground">
                                    {t("admin.videos.fileSize")}:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {(video.fileSize / (1024 * 1024)).toFixed(
                                      2,
                                    )}{" "}
                                    {t("admin.common.mb")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t("admin.videos.views")}:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {video.views}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-4 border-t">
                                <Button
                                  onClick={() =>
                                    window.open(videoUrl, "_blank")
                                  }
                                  variant="outline"
                                  className="flex-1"
                                  data-testid={`button-preview-${video.id}`}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  {t("admin.videos.previewFull")}
                                </Button>
                                <Button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      videoId: video.id,
                                      status: "approved",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className="flex-1"
                                  data-testid={`button-approve-${video.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {updateStatusMutation.isPending
                                    ? t("admin.videos.processing")
                                    : t("admin.approve")}
                                </Button>
                                <Button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      videoId: video.id,
                                      status: "rejected",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  variant="destructive"
                                  className="flex-1"
                                  data-testid={`button-reject-${video.id}`}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  {updateStatusMutation.isPending
                                    ? t("admin.videos.processing")
                                    : t("admin.reject")}
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

            <TabsContent value="payouts" className="mt-0">
              {payoutsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">
                    {t("admin.payouts.loadingRequests")}
                  </p>
                </div>
              ) : payoutRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("admin.payouts.noRequestsTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("admin.payouts.noRequestsDescription")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="text-base">
                      {payoutRequests.length} {t("admin.payouts.total")}{" "}
                      {payoutRequests.length === 1
                        ? t("admin.payouts.request")
                        : t("admin.payouts.requests")}
                    </Badge>
                    <Badge variant="secondary" className="text-base">
                      {
                        payoutRequests.filter((p) => p.status === "pending")
                          .length
                      }{" "}
                      {t("admin.pending")}
                    </Badge>
                  </div>

                  <div className="grid gap-6">
                    {payoutRequests.map((payout) => (
                      <Card
                        key={payout.id}
                        data-testid={`payout-card-${payout.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">
                                {payout.amount.toLocaleString()} FCFA
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t("admin.payouts.requestedOn")}{" "}
                                {new Date(
                                  payout.requestedAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                payout.status === "approved"
                                  ? "default"
                                  : payout.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="text-sm"
                            >
                              {payout.status === "pending" && (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {payout.status === "approved" && (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              {payout.status === "rejected" && (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {payout.status.charAt(0).toUpperCase() +
                                payout.status.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {t("admin.payouts.paymentMethod")}
                                </p>
                                <p className="font-medium">
                                  {payout.paymentMethod}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  {t("admin.payouts.affiliateId")}
                                </p>
                                <p className="font-mono text-sm">
                                  {payout.affiliateId}
                                </p>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {t("admin.payouts.accountDetails")}
                              </p>
                              <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm font-mono whitespace-pre-wrap">
                                  {payout.accountDetails}
                                </p>
                              </div>
                            </div>

                            {payout.status === "rejected" &&
                              payout.rejectionReason && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {t("admin.payouts.rejectionReason")}
                                  </p>
                                  <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                                    <p className="text-sm text-destructive">
                                      {payout.rejectionReason}
                                    </p>
                                  </div>
                                </div>
                              )}

                            {payout.status === "approved" &&
                              payout.processedAt && (
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {t("admin.payouts.approvedOn")}{" "}
                                    {new Date(
                                      payout.processedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              )}

                            {payout.status === "pending" && (
                              <div className="flex gap-3 pt-4 border-t">
                                <Button
                                  onClick={() =>
                                    approvePayoutMutation.mutate(payout.id)
                                  }
                                  disabled={approvePayoutMutation.isPending}
                                  className="flex-1"
                                  data-testid={`button-approve-payout-${payout.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {approvePayoutMutation.isPending
                                    ? t("admin.videos.processing")
                                    : t("admin.approve")}
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
                                  {t("admin.reject")}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Dialog
                    open={rejectionDialogOpen}
                    onOpenChange={setRejectionDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {t("admin.payouts.rejectTitle")}
                        </DialogTitle>
                        <DialogDescription>
                          {t("admin.payouts.rejectDescription")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rejection-reason">
                            {t("admin.payouts.rejectionReason")}
                          </Label>
                          <Textarea
                            id="rejection-reason"
                            placeholder={t("admin.payouts.rejectPlaceholder")}
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
                            {t("admin.common.cancel")}
                          </Button>
                          <Button
                            onClick={handleRejectPayout}
                            disabled={
                              rejectPayoutMutation.isPending || !rejectionReason
                            }
                            variant="destructive"
                            className="flex-1"
                            data-testid="button-confirm-reject"
                          >
                            {rejectPayoutMutation.isPending
                              ? t("admin.videos.processing")
                              : t("admin.payouts.confirmRejection")}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              {reportsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="mt-4 text-muted-foreground">
                    {t("admin.reports.loadingReports")}
                  </p>
                </div>
              ) : reports.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Flag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("admin.reports.noReportsTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("admin.reports.noReportsDescription")}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="text-base">
                      {reports.length} {t("admin.reports.total")}{" "}
                      {reports.length === 1
                        ? t("admin.reports.report")
                        : t("admin.reports.reports")}
                    </Badge>
                    <Badge variant="secondary" className="text-base">
                      {reports.filter((r) => r.status === "pending").length}{" "}
                      {t("admin.pending")}
                    </Badge>
                  </div>

                  <div className="grid gap-6">
                    {reports.map((report) => (
                      <Card
                        key={report.id}
                        data-testid={`report-card-${report.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-xl flex items-center gap-2">
                                <Flag className="w-5 h-5 text-destructive flex-shrink-0" />
                                <span className="truncate">
                                  {t("admin.reports.videoReport")}
                                </span>
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {t("admin.reports.reportedOn")}{" "}
                                {new Date(
                                  report.createdAt,
                                ).toLocaleDateString()}{" "}
                                {t("admin.reports.at")}{" "}
                                {new Date(
                                  report.createdAt,
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                report.status === "reviewed" ||
                                report.status === "action_taken"
                                  ? "default"
                                  : report.status === "dismissed"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-sm flex-shrink-0"
                            >
                              {report.status === "pending" && (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {(report.status === "reviewed" ||
                                report.status === "action_taken") && (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              {report.status.replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {t("admin.reports.reportReason")}
                              </p>
                              <div className="bg-muted p-4 rounded-md">
                                <p className="text-sm whitespace-pre-wrap">
                                  {report.reason}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setLocation(`/video/${report.videoId}`)
                                }
                                className="gap-2"
                                data-testid={`button-view-video-${report.id}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                                {t("admin.reports.viewReportedVideo")}
                              </Button>
                            </div>

                            {report.reviewedAt && report.reviewedBy && (
                              <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                  {t("admin.reports.reviewedOn")}{" "}
                                  {new Date(
                                    report.reviewedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}

                            {report.status === "pending" && (
                              <div className="flex gap-3 pt-4 border-t">
                                <Button
                                  onClick={() =>
                                    reviewReportMutation.mutate({
                                      reportId: report.id,
                                      status: "reviewed",
                                    })
                                  }
                                  disabled={reviewReportMutation.isPending}
                                  variant="default"
                                  className="flex-1"
                                  data-testid={`button-mark-reviewed-${report.id}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {reviewReportMutation.isPending
                                    ? t("admin.videos.processing")
                                    : t("admin.reports.markReviewed")}
                                </Button>
                                <Button
                                  onClick={() =>
                                    reviewReportMutation.mutate({
                                      reportId: report.id,
                                      status: "action_taken",
                                    })
                                  }
                                  disabled={reviewReportMutation.isPending}
                                  className="flex-1"
                                  data-testid={`button-action-taken-${report.id}`}
                                >
                                  {t("admin.reports.actionTaken")}
                                </Button>
                                <Button
                                  onClick={() =>
                                    reviewReportMutation.mutate({
                                      reportId: report.id,
                                      status: "dismissed",
                                    })
                                  }
                                  disabled={reviewReportMutation.isPending}
                                  variant="outline"
                                  className="flex-1"
                                  data-testid={`button-dismiss-${report.id}`}
                                >
                                  {t("admin.reports.dismiss")}
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

            <TabsContent value="ads" className="mt-0">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="pending" data-testid="tab-pending-ads">
                    Pending
                    {pendingAds.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {pendingAds.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved" data-testid="tab-approved-ads">
                    Approved
                    {approvedAds.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {approvedAds.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  {adsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">
                        Loading ads...
                      </p>
                    </div>
                  ) : pendingAds.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">
                          No Pending Ads
                        </h3>
                        <p className="text-muted-foreground">
                          All ads have been reviewed. New ads awaiting approval
                          will appear here.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline" className="text-base">
                          {pendingAds.length} Total Pending
                        </Badge>
                      </div>

                      <div className="grid gap-6">
                        {pendingAds.map((ad) => (
                          <Card key={ad.id} data-testid={`ad-card-${ad.id}`}>
                            <CardHeader>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-xl flex items-center gap-2">
                                    <span className="truncate">{ad.name}</span>
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Type:{" "}
                                    {ad.adType === "overlay"
                                      ? "Overlay Banner"
                                      : "Skippable In-Stream Video"}{" "}
                                    • Created{" "}
                                    {new Date(
                                      ad.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-sm flex-shrink-0"
                                >
                                  {ad.pricingModel.toUpperCase()} •{" "}
                                  {ad.bidAmount} XAF
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Destination URL
                                  </p>
                                  <div className="bg-muted p-4 rounded-md">
                                    <a
                                      href={ad.destinationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline break-all"
                                    >
                                      {ad.destinationUrl}
                                    </a>
                                  </div>
                                </div>

                                {ad.mediaUrl && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Media Preview
                                    </p>
                                    <div className="bg-muted p-4 rounded-md">
                                      {ad.adType === "overlay" ? (
                                        <img
                                          src={ad.mediaUrl}
                                          alt={ad.altText || "Ad image"}
                                          className="max-w-full max-h-64 rounded"
                                        />
                                      ) : (
                                        <video
                                          src={ad.mediaUrl}
                                          controls
                                          className="max-w-full max-h-64 rounded"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}

                                {ad.altText && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Alt Text
                                    </p>
                                    <div className="bg-muted p-4 rounded-md">
                                      <p className="text-sm">{ad.altText}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                  <Button
                                    onClick={() =>
                                      approveAdMutation.mutate(ad.id)
                                    }
                                    disabled={approveAdMutation.isPending}
                                    variant="default"
                                    className="flex-1"
                                    data-testid={`button-approve-ad-${ad.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {approveAdMutation.isPending
                                      ? "Approving..."
                                      : "Approve Ad"}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setSelectedAdId(ad.id);
                                      setAdRejectionDialogOpen(true);
                                    }}
                                    disabled={rejectAdMutation.isPending}
                                    variant="destructive"
                                    className="flex-1"
                                    data-testid={`button-reject-ad-${ad.id}`}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    {rejectAdMutation.isPending
                                      ? "Rejecting..."
                                      : "Reject Ad"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="approved">
                  {approvedAdsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">
                        Loading approved ads...
                      </p>
                    </div>
                  ) : approvedAds.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-xl font-semibold mb-2">
                          No Approved Ads
                        </h3>
                        <p className="text-muted-foreground">
                          Approved ads will appear here for reference.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline" className="text-base">
                          {approvedAds.length} Total Approved
                        </Badge>
                      </div>

                      <div className="grid gap-6">
                        {approvedAds.map((ad) => (
                          <Card
                            key={ad.id}
                            data-testid={`approved-ad-card-${ad.id}`}
                          >
                            <CardHeader>
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-xl flex items-center gap-2">
                                    <span className="truncate">{ad.name}</span>
                                    <Badge
                                      variant="default"
                                      className="flex-shrink-0"
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Approved
                                    </Badge>
                                  </CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Type:{" "}
                                    {ad.adType === "overlay"
                                      ? "Overlay Banner"
                                      : "Skippable In-Stream Video"}{" "}
                                    • Approved{" "}
                                    {new Date(
                                      ad.approvedAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-sm flex-shrink-0"
                                >
                                  {ad.pricingModel.toUpperCase()} •{" "}
                                  {ad.bidAmount} XAF
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Destination URL
                                  </p>
                                  <div className="bg-muted p-4 rounded-md">
                                    <a
                                      href={ad.destinationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline break-all"
                                    >
                                      {ad.destinationUrl}
                                    </a>
                                  </div>
                                </div>

                                {ad.mediaUrl && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Media Preview
                                    </p>
                                    <div className="bg-muted p-4 rounded-md">
                                      {ad.adType === "overlay" ? (
                                        <img
                                          src={ad.mediaUrl}
                                          alt={ad.altText || "Ad image"}
                                          className="max-w-full max-h-64 rounded"
                                        />
                                      ) : (
                                        <video
                                          src={ad.mediaUrl}
                                          controls
                                          className="max-w-full max-h-64 rounded"
                                        />
                                      )}
                                    </div>
                                  </div>
                                )}

                                {ad.altText && (
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      Alt Text
                                    </p>
                                    <div className="bg-muted p-4 rounded-md">
                                      <p className="text-sm">{ad.altText}</p>
                                    </div>
                                  </div>
                                )}

                                <div className="pt-4 border-t">
                                  <p className="text-sm text-muted-foreground">
                                    Status:{" "}
                                    <Badge variant="default" className="ml-2">
                                      {ad.status}
                                    </Badge>
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Ad Rejection Dialog */}
              <AlertDialog
                open={adRejectionDialogOpen}
                onOpenChange={setAdRejectionDialogOpen}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Ad</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please provide a reason for rejecting this ad. This will
                      be sent to the advertiser.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    value={adRejectionReason}
                    onChange={(e) => setAdRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="min-h-24"
                    data-testid="textarea-ad-rejection-reason"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setAdRejectionDialogOpen(false);
                        setSelectedAdId(null);
                        setAdRejectionReason("");
                      }}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      onClick={handleRejectAd}
                      disabled={
                        !adRejectionReason || rejectAdMutation.isPending
                      }
                      variant="destructive"
                      data-testid="button-confirm-reject-ad"
                    >
                      {rejectAdMutation.isPending
                        ? "Rejecting..."
                        : "Confirm Rejection"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Delete Judge Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-judge">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.judges.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.judges.deleteDescription")}{" "}
              <strong>
                {judgeToDelete?.judgeName || judgeToDelete?.email}
              </strong>
              ? {t("admin.judges.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {t("admin.common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (judgeToDelete) {
                  deleteJudgeMutation.mutate(judgeToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteJudgeMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteJudgeMutation.isPending
                ? t("admin.judges.deleting")
                : t("admin.judges.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">
            {t("admin.common.loading")}
          </p>
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
            <h2 className="text-2xl font-bold mb-4">
              {t("admin.common.authRequired")}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t("admin.common.authDescription")}
            </p>
            <Button onClick={() => setLocation("/")}>
              {t("admin.videos.goHome")}
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
