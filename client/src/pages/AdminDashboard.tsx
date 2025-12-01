import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  Edit,
  Mail,
  Send,
  Users,
  AlertTriangle,
  Film,
  BarChart3,
  Shield,
} from "lucide-react";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import { createPermalink } from "@/lib/slugUtils";
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
import { useRef, useMemo } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  Video,
  Category,
  PayoutRequest,
  Report,
  JudgeProfile,
  SelectUser,
  CmsContent,
} from "@shared/schema";
import { Plus, Settings, Power } from "lucide-react";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

function CMSManagementTab() {
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<string>("hero");
  const [cmsContent, setCmsContent] = useState<CmsContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(z.object({
      section: z.string(),
      key: z.string().min(1),
      label: z.string().min(1),
      value: z.any().optional(),
      type: z.string(),
    })),
    defaultValues: { section: "hero", key: "", label: "", value: "", type: "text" },
  });

  const loadCmsContent = async (section: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest(`/api/cms/${section}`, "GET");
      const data = await res.json();
      setCmsContent(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load CMS content", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const saveCmsMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/cms", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "CMS content saved successfully" });
      loadCmsContent(selectedSection);
      form.reset({ section: selectedSection, key: "", label: "", value: "", type: "text" });
      setEditingId(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to save CMS content", variant: "destructive" }),
  });

  const deleteCmsMutation = useMutation({
    mutationFn: async (params: { section: string; key: string }) => {
      const res = await apiRequest(`/api/cms/${params.section}/${params.key}`, "DELETE");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "CMS content deleted" });
      loadCmsContent(selectedSection);
    },
    onError: () => toast({ title: "Error", description: "Failed to delete CMS content", variant: "destructive" }),
  });

  const sections = useMemo(() => ["hero", "homepage", "footer", "navigation", "about", "contact"], []);

  const onSubmit = (data: any) => {
    saveCmsMutation.mutate({ ...data, section: selectedSection });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Content Management System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="section-select">Select Section</Label>
            <Select value={selectedSection} onValueChange={(val) => { setSelectedSection(val); loadCmsContent(val); }}>
              <SelectTrigger id="section-select" data-testid="select-cms-section">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="key" render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., title, description, buttonText" {...field} data-testid="input-cms-key" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="label" render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Display label for admins" {...field} data-testid="input-cms-label" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-cms-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="image">Image URL</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    {form.getValues("type") === "textarea" || form.getValues("type") === "html" ? (
                      <Textarea placeholder="Enter content value" {...field} data-testid="textarea-cms-value" />
                    ) : (
                      <Input placeholder="Enter content value" {...field} data-testid="input-cms-value" />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={saveCmsMutation.isPending} className="w-full" data-testid="button-save-cms">
                <Plus className="w-4 h-4 mr-2" />
                {saveCmsMutation.isPending ? "Saving..." : editingId ? "Update" : "Add"} Content
              </Button>
            </form>
          </Form>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold mb-4">Existing Content in {selectedSection}</h3>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : cmsContent.length === 0 ? (
            <p className="text-muted-foreground">No content yet. Create one above.</p>
          ) : (
            <div className="space-y-3">
              {cmsContent.map(item => (
                <Card key={item.id} className="p-4" data-testid={`cms-item-${item.key}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{item.label}</p>
                      <p className="text-sm text-muted-foreground">Key: {item.key}</p>
                      <p className="text-sm mt-2 truncate">{String(item.value)}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(String(item.id)); form.setValue("key", item.key); form.setValue("label", item.label); form.setValue("value", String(item.value)); form.setValue("type", item.type); }} data-testid={`button-edit-cms-${item.id}`}>
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCmsMutation.mutate({ section: selectedSection, key: item.key })} disabled={deleteCmsMutation.isPending} data-testid={`button-delete-cms-${item.id}`}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SmsTestingForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("send");
  const { data: analytics } = useQuery({ queryKey: ["/api/admin/sms/analytics"] });
  const { data: history = [] } = useQuery({ queryKey: ["/api/admin/sms/history"] });
  const { data: usersCount } = useQuery({ queryKey: ["/api/admin/sms/bulk-recipients/users"] });
  const { data: subscribersCount } = useQuery({ queryKey: ["/api/admin/sms/bulk-recipients/subscribers"] });
  
  const form = useForm({
    resolver: zodResolver(z.object({
      to: z.string().min(8, "Valid phone number required"),
      body: z.string().min(1, "Message required").max(1600),
    })),
    defaultValues: { to: "", body: "" },
  });

  const bulkForm = useForm({
    resolver: zodResolver(z.object({
      recipientType: z.enum(['users', 'subscribers']),
      body: z.string().min(1, "Message required").max(1600),
    })),
    defaultValues: { recipientType: 'subscribers', body: "" },
  });

  async function onSubmit(data: any) {
    setLoading(true);
    try {
      const res = await apiRequest("/api/admin/sms/send", "POST", data);
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "SMS sent successfully!" });
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/history"] });
      } else {
        toast({ title: "Error", description: result.message || "Failed to send SMS", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send SMS", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function onBulkSubmit(data: any) {
    setLoading(true);
    try {
      const res = await apiRequest("/api/admin/sms/bulk", "POST", data);
      const result = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: result.message });
        bulkForm.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/history", "/api/admin/sms/analytics"] });
      } else {
        toast({ title: "Error", description: result.message || "Failed to send bulk SMS", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send bulk SMS", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function retryFailed() {
    try {
      const res = await apiRequest("/api/admin/sms/retry-failed", "POST");
      const result = await res.json();
      toast({ title: "Success", description: result.message });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/history", "/api/admin/sms/analytics"] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to retry messages", variant: "destructive" });
    }
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="send">Send SMS</TabsTrigger>
        <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="send" className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="to" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+237123456789" data-testid="input-sms-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="body" render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter SMS message..." className="min-h-24" data-testid="textarea-sms-body" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={loading} data-testid="button-send-sms">
              {loading ? "Sending..." : "Send SMS"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="bulk" className="space-y-4">
        <Form {...bulkForm}>
          <form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-4">
            <FormField control={bulkForm.control} name="recipientType" render={({ field }) => (
              <FormItem>
                <FormLabel>Recipients</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid="select-bulk-recipients">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="users">
                        All Users with Phone ({usersCount?.count || 0})
                      </SelectItem>
                      <SelectItem value="subscribers">
                        Newsletter Subscribers ({subscribersCount?.count || 0})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={bulkForm.control} name="body" render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter SMS message for all recipients..." className="min-h-24" data-testid="textarea-bulk-sms-body" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={loading} data-testid="button-send-bulk-sms">
              {loading ? "Sending to all recipients..." : "Send Bulk SMS"}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SMS Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{analytics?.total || 0}</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-bold text-green-600">{analytics?.sent || 0}</p>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">{analytics?.failed || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {analytics?.total ? Math.round((analytics.sent / analytics.total) * 100) : 0}%
              </p>
            </div>
          </CardContent>
        </Card>
        {analytics?.failed > 0 && (
          <Button onClick={retryFailed} variant="outline" className="w-full" data-testid="button-retry-failed">
            Retry {analytics.failed} Failed Messages
          </Button>
        )}
      </TabsContent>

      <TabsContent value="history" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Messages ({history.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No messages sent yet</p>
              ) : (
                history.slice(0, 20).map((msg: any) => (
                  <div key={msg.id} className="p-3 border rounded-lg text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs">{msg.to}</span>
                      <Badge variant={msg.status === 'failed' ? 'destructive' : msg.status === 'sent' ? 'default' : 'secondary'}>
                        {msg.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{msg.body}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

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

  const { data: affiliates = [], isLoading: affiliatesLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliates"],
  });

  const { data: registrationStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ["/api/registrations/status"],
  });

  const { data: affiliateAnalytics = { summary: {}, payoutSummary: {}, topPerformers: [], allAffiliates: [] }, isLoading: analyticsLoading } = useQuery<any>({
    queryKey: ["/api/admin/affiliate-analytics"],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: payoutRequestsData = [], isLoading: payoutRequestsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: paymentsData = { payments: [], summary: {} }, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery<any>({
    queryKey: ["/api/admin/payments"],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: dashboardStats = null, isLoading: statsLoading, refetch: refetchDashboardStats } = useQuery<any>({
    queryKey: ["/api/admin/stats/dashboard"],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/campaigns"],
  });

  const [paymentFilter, setPaymentFilter] = useState<string>("all");

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

  // Judge edit dialog state
  const [editJudgeDialogOpen, setEditJudgeDialogOpen] = useState(false);
  const [judgeToEdit, setJudgeToEdit] = useState<JudgeProfile | null>(null);
  const [editJudgeName, setEditJudgeName] = useState("");
  const [editJudgeBio, setEditJudgeBio] = useState("");
  const [editJudgePhotoFile, setEditJudgePhotoFile] = useState<File | null>(null);
  const [editJudgePhotoPreview, setEditJudgePhotoPreview] = useState<string | null>(null);
  const editJudgePhotoInputRef = useRef<HTMLInputElement>(null);

  // User delete dialog state
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SelectUser | null>(null);

  // Advertiser delete dialog state
  const [deleteAdvertiserDialogOpen, setDeleteAdvertiserDialogOpen] = useState(false);
  const [advertiserToDelete, setAdvertiserToDelete] = useState<any | null>(null);

  // User filter state
  const [userFilter, setUserFilter] = useState<
    "all" | "verified" | "admin" | "judge" | "contestant"
  >("all");

  // User role edit dialog state
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [userToEditRoles, setUserToEditRoles] = useState<SelectUser | null>(null);
  const [editingRoles, setEditingRoles] = useState({
    isAdmin: false,
    isJudge: false,
    isModerator: false,
    isContentManager: false,
    isAffiliateManager: false,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkRoleDialogOpen, setBulkRoleDialogOpen] = useState(false);

  // Affiliate state
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [affiliateStatusDialog, setAffiliateStatusDialog] = useState(false);
  const [newAffiliateStatus, setNewAffiliateStatus] = useState("active");
  const [affiliateCommissionDialog, setAffiliateCommissionDialog] = useState(false);
  const [newCommissionRate, setNewCommissionRate] = useState(20);
  const [affiliateDetailDialog, setAffiliateDetailDialog] = useState(false);
  const [affiliatePerformanceData, setAffiliatePerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [customPayoutDialog, setCustomPayoutDialog] = useState(false);
  const [customPayoutAmount, setCustomPayoutAmount] = useState("");
  const [customPayoutMethod, setCustomPayoutMethod] = useState("bank_transfer");
  const [affiliatePayoutActionDialog, setAffiliatePayoutActionDialog] = useState(false);
  const [affiliatePayoutAction, setAffiliatePayoutAction] = useState<"approve" | "reject">("approve");
  const [affiliateSelectedPayoutId, setAffiliateSelectedPayoutId] = useState<string | null>(null);
  const [affiliatePayoutRejectionReason, setAffiliatePayoutRejectionReason] = useState("");

  // Affiliate Campaign state
  const [affiliateCampaignDialogOpen, setAffiliateCampaignDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [affiliateCampaignForm, setAffiliateCampaignForm] = useState({ name: "", description: "", objective: "", targetAudience: "", startDate: "", endDate: "", budget: "", promoAssetTitle: "", promoAssetType: "", promoAssetPreviewUrl: "", promoAssetDownloadUrl: "", promoAssetDimensions: "" });
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [assetForm, setAssetForm] = useState({ type: "banner", title: "", description: "", downloadUrl: "", previewUrl: "", dimensions: "", fileSize: "" });
  const [campaignAssets, setCampaignAssets] = useState<any[]>([]);

  // Newsletter state
  const { data: newsletterSubscribers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/newsletter/subscribers"],
  });

  const { data: emailCampaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/newsletter/campaigns"],
  });

  const [newsletterDialogOpen, setNewsletterDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [subscriberForm, setSubscriberForm] = useState({ email: "", firstName: "", lastName: "", phone: "", location: "", country: "", interests: [] });
  const [campaignForm, setCampaignForm] = useState({ title: "", subject: "", content: "", htmlContent: "" });
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);

  // Newsletter mutations
  const addSubscriberMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/admin/newsletter/subscribers", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subscriber added successfully" });
      setNewsletterDialogOpen(false);
      setSubscriberForm({ email: "", firstName: "", lastName: "", phone: "", location: "", country: "", interests: [] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/subscribers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSubscriberMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/newsletter/subscribers/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Subscriber deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/subscribers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/admin/newsletter/campaigns", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign created successfully" });
      setCampaignDialogOpen(false);
      setCampaignForm({ title: "", subject: "", content: "", htmlContent: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/admin/newsletter/campaigns/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign updated successfully" });
      setCampaignDialogOpen(false);
      setCampaignForm({ title: "", subject: "", content: "", htmlContent: "" });
      setEditingCampaign(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/newsletter/campaigns/${id}/send`, "POST");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/newsletter/campaigns/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Newsletter handlers
  const handleAddSubscriber = () => {
    if (subscriberForm.email) {
      addSubscriberMutation.mutate({
        ...subscriberForm,
        status: "subscribed",
        firstName: subscriberForm.firstName || null,
        lastName: subscriberForm.lastName || null,
        phone: subscriberForm.phone || null,
        location: subscriberForm.location || null,
        country: subscriberForm.country || null,
        interests: subscriberForm.interests || [],
      });
    }
  };

  const handleDeleteSubscriber = (id: string) => {
    if (confirm("Are you sure you want to delete this subscriber?")) {
      deleteSubscriberMutation.mutate(id);
    }
  };

  const handleCreateCampaign = () => {
    if (campaignForm.title && campaignForm.subject && campaignForm.content) {
      const dataToSend = {
        title: campaignForm.title,
        subject: campaignForm.subject,
        content: campaignForm.content,
        htmlContent: campaignForm.htmlContent || campaignForm.content,
      };
      if (editingCampaign) {
        updateCampaignMutation.mutate({ id: editingCampaign.id, data: dataToSend });
      } else {
        createCampaignMutation.mutate(dataToSend);
      }
    }
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      subject: campaign.subject,
      content: campaign.content,
      htmlContent: campaign.htmlContent || campaign.content,
    });
    setCampaignDialogOpen(true);
  };

  const handleSendCampaign = (id: string) => {
    if (confirm("Are you sure you want to send this campaign to all subscribers?")) {
      sendCampaignMutation.mutate(id);
    }
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteCampaignMutation.mutate(id);
    }
  };

  // Affiliate mutations
  const updateAffiliateStatusMutation = useMutation({
    mutationFn: async ({ affiliateId, status }: { affiliateId: string; status: string }) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Affiliate status updated" });
      setAffiliateStatusDialog(false);
      setSelectedAffiliateId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateAffiliateCommissionMutation = useMutation({
    mutationFn: async ({ affiliateId, commissionRate }: { affiliateId: string; commissionRate: number }) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/commission`, "PATCH", { commissionRate });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Commission rate updated" });
      setAffiliateCommissionDialog(false);
      setSelectedAffiliateId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const customPayoutMutation = useMutation({
    mutationFn: async ({ affiliateId, amount }: { affiliateId: string; amount: number }) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/custom-payout`, "POST", {
        amount,
        paymentMethod: customPayoutMethod,
        accountDetails: 'admin_custom'
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Custom payout created" });
      setCustomPayoutDialog(false);
      setCustomPayoutAmount("");
      if (selectedAffiliateId) {
        loadAffiliatePerformance(selectedAffiliateId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-analytics"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const loadAffiliatePerformance = async (affiliateId: string) => {
    setPerformanceLoading(true);
    try {
      const res = await apiRequest(`/api/admin/affiliates/${affiliateId}/performance`, "GET");
      const data = await res.json();
      setAffiliatePerformanceData(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load performance data", variant: "destructive" });
    } finally {
      setPerformanceLoading(false);
    }
  };

  const handleViewAffiliateDetail = (affiliateId: string) => {
    setSelectedAffiliateId(affiliateId);
    setAffiliateDetailDialog(true);
    loadAffiliatePerformance(affiliateId);
  };

  const createAffiliateCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const campaignData = {
        name: data.name,
        description: data.description,
        objective: data.objective,
        target_audience: data.targetAudience,
        budget: data.budget ? parseInt(data.budget) : null,
        startDate: data.startDate,
        endDate: data.endDate,
      };
      const res = await apiRequest("/api/admin/campaigns", "POST", campaignData);
      const campaign = await res.json();
      
      // Create promotional asset if provided
      if (data.promoAssetTitle && campaign.id) {
        const assetData = {
          type: data.promoAssetType || "banner",
          title: data.promoAssetTitle,
          description: "",
          download_url: data.promoAssetDownloadUrl || "",
          preview_url: data.promoAssetPreviewUrl || "",
          dimensions: data.promoAssetDimensions || "",
        };
        await apiRequest(`/api/admin/campaigns/${campaign.id}/assets`, "POST", assetData);
      }
      
      return campaign;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign created" });
      setAffiliateCampaignDialogOpen(false);
      setAffiliateCampaignForm({ name: "", description: "", objective: "", targetAudience: "", startDate: "", endDate: "", budget: "", promoAssetTitle: "", promoAssetType: "", promoAssetPreviewUrl: "", promoAssetDownloadUrl: "", promoAssetDimensions: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAffiliateCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/campaigns/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Campaign deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/admin/campaigns/${selectedCampaignId}/assets`, "POST", { ...data, fileSize: data.fileSize ? parseInt(data.fileSize) : null });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Asset created" });
      setAssetDialogOpen(false);
      setAssetForm({ type: "banner", title: "", description: "", downloadUrl: "", previewUrl: "", dimensions: "", fileSize: "" });
      if (selectedCampaignId) loadCampaignAssets(selectedCampaignId);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      return await apiRequest(`/api/admin/campaigns/${selectedCampaignId}/assets/${assetId}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Asset deleted" });
      if (selectedCampaignId) loadCampaignAssets(selectedCampaignId);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const loadCampaignAssets = async (campaignId: string) => {
    try {
      const res = await apiRequest(`/api/admin/campaigns/${campaignId}/assets`, "GET");
      const data = await res.json();
      setCampaignAssets(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load assets", variant: "destructive" });
    }
  };

  const handleSelectCampaign = (campaign: any) => {
    setSelectedCampaignId(campaign.id);
    loadCampaignAssets(campaign.id);
  };

  const approveAffiliatePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return await apiRequest(`/api/admin/payout-requests/${payoutId}/approve`, "PATCH", {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payout approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      setAffiliatePayoutActionDialog(false);
      setAffiliateSelectedPayoutId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectAffiliatePayoutMutation = useMutation({
    mutationFn: async ({ payoutId, reason }: { payoutId: string; reason: string }) => {
      return await apiRequest(`/api/admin/payout-requests/${payoutId}/reject`, "PATCH", { rejectionReason: reason });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Payout rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
      setAffiliatePayoutActionDialog(false);
      setAffiliateSelectedPayoutId(null);
      setAffiliatePayoutRejectionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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

  const deleteAdvertiserMutation = useMutation({
    mutationFn: async (advertiserId: string) => {
      return await apiRequest(
        `/api/admin/advertisers/${advertiserId}`,
        "DELETE",
        {},
      );
    },
    onSuccess: () => {
      toast({
        title: "Advertiser Deleted",
        description: "The advertiser account has been permanently deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/advertisers"] });
      setDeleteAdvertiserDialogOpen(false);
      setAdvertiserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
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

  const toggleRegistrationMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      return await apiRequest("/api/admin/registrations/toggle", "POST", { enabled });
    },
    onSuccess: (_, enabled) => {
      toast({
        title: "Registration Status Updated",
        description: enabled ? "Registrations are now OPEN" : "Registrations are now CLOSED",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
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

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return await apiRequest(`/api/admin/reports/${reportId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "The report has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
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
    judgePhotoUrl: z.string().optional().default(""),
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

  // Update judge mutation
  const updateJudgeMutation = useMutation({
    mutationFn: async () => {
      if (!judgeToEdit) throw new Error("No judge selected");
      
      const formData = new FormData();
      formData.append("judgeName", editJudgeName);
      formData.append("judgeBio", editJudgeBio);
      if (editJudgePhotoFile) {
        formData.append("photo", editJudgePhotoFile);
      }

      const response = await fetch(`/api/admin/judges/${judgeToEdit.id}/profile`, {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update judge profile");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Judge Updated",
        description: "Judge profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/judges"] });
      setEditJudgeDialogOpen(false);
      setJudgeToEdit(null);
      setEditJudgePhotoFile(null);
      setEditJudgePhotoPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User account has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("admin.toast.deletionFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user roles mutation
  const updateUserRolesMutation = useMutation({
    mutationFn: async () => {
      if (!userToEditRoles) throw new Error("No user selected");
      const res = await apiRequest(`/api/admin/users/${userToEditRoles.id}/role`, "PATCH", editingRoles);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Roles Updated",
        description: "User roles and permissions have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditRoleDialogOpen(false);
      setUserToEditRoles(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenEditRoles = (user: SelectUser) => {
    setUserToEditRoles(user);
    setEditingRoles({
      isAdmin: user.isAdmin ?? false,
      isJudge: user.isJudge ?? false,
      isModerator: user.isModerator ?? false,
      isContentManager: user.isContentManager ?? false,
      isAffiliateManager: user.isAffiliateManager ?? false,
    });
    setEditRoleDialogOpen(true);
  };

  // Suspend/Activate user mutation
  const toggleUserSuspensionMutation = useMutation({
    mutationFn: async () => {
      if (!userToEditRoles) throw new Error("No user selected");
      const endpoint = userToEditRoles.suspended ? "activate" : "suspend";
      const res = await apiRequest(`/api/admin/users/${userToEditRoles.id}/${endpoint}`, "POST");
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: userToEditRoles?.suspended ? "User Activated" : "User Suspended",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      if (userToEditRoles) {
        setUserToEditRoles({ ...userToEditRoles, suspended: !userToEditRoles.suspended });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Bulk role assignment mutation
  const bulkUpdateRolesMutation = useMutation({
    mutationFn: async (roles: any) => {
      const promises = Array.from(selectedUserIds).map(userId =>
        apiRequest(`/api/admin/users/${userId}/role`, "PATCH", roles)
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Bulk Update Complete",
        description: `Roles updated for ${selectedUserIds.size} users.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUserIds(new Set());
      setBulkRoleDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk Update Failed",
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

      {/* Mobile Accordion Version */}
      <Accordion type="single" collapsible className="w-full lg:hidden" data-testid="accordion-admin-mobile">
        <AccordionItem value="overview" data-testid="accordion-item-overview">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-overview">
            Dashboard Overview
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {statsLoading ? (
                <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
              ) : dashboardStats ? (
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalUsers || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                      <Film className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalVideos || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.totalViews || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.suspendedUsers || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unverified Emails</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dashboardStats.unverifiedEmails || 0}</div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="phases" data-testid="accordion-item-phases">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-phases">
            {t("admin.tabs.phases")}
          </AccordionTrigger>
          <AccordionContent>
            <PhaseManagement />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="videos" data-testid="accordion-item-videos">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-videos">
            <div className="flex items-center gap-2">
              {t("admin.tabs.videos")}
              {pendingVideos.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingVideos.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  For full video moderation features, please use a larger screen or rotate to landscape mode.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="users" data-testid="accordion-item-users">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-users">
            {t("admin.tabs.users")}
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="w-5 h-5" />
                  {t("admin.users.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-12" data-testid="loading-users">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted-foreground">{t("admin.common.loading")}</p>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12" data-testid="empty-users">
                    <p className="text-muted-foreground">{t("admin.users.noUsers")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <Badge
                        variant={userFilter === "all" ? "default" : "outline"}
                        className="text-base cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setUserFilter("all")}
                        data-testid="badge-total-users"
                      >
                        {users.length} {t("admin.users.totalUsers")}
                      </Badge>
                      <Badge
                        variant={userFilter === "verified" ? "default" : "outline"}
                        className="text-base cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setUserFilter("verified")}
                        data-testid="badge-verified-users"
                      >
                        {users.filter((u) => u.emailVerified).length} {t("admin.users.verified")}
                      </Badge>
                      <Badge
                        variant={userFilter === "admin" ? "default" : "outline"}
                        className="text-base cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setUserFilter("admin")}
                        data-testid="badge-admin-users"
                      >
                        {users.filter((u) => u.isAdmin).length} {t("admin.users.admins")}
                      </Badge>
                      <Badge
                        variant={userFilter === "judge" ? "default" : "outline"}
                        className="text-base cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setUserFilter("judge")}
                        data-testid="badge-judge-users"
                      >
                        {users.filter((u) => u.isJudge).length} {t("admin.users.judges")}
                      </Badge>
                      <Badge
                        variant={userFilter === "contestant" ? "default" : "outline"}
                        className="text-base cursor-pointer hover-elevate active-elevate-2"
                        onClick={() => setUserFilter("contestant")}
                        data-testid="badge-contestant-users"
                      >
                        {users.filter((u) => !u.isAdmin && !u.isJudge).length} {t("admin.users.contestants")}
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full" data-testid="table-users">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold w-10">
                              <Checkbox
                                checked={selectedUserIds.size > 0 && selectedUserIds.size === users.filter(u => {
                                  if (userFilter === "all") return true;
                                  if (userFilter === "verified") return u.emailVerified;
                                  if (userFilter === "admin") return u.isAdmin;
                                  if (userFilter === "judge") return u.isJudge;
                                  if (userFilter === "contestant") return !u.isAdmin && !u.isJudge;
                                  return true;
                                }).length}
                                onCheckedChange={(checked) => {
                                  if (checked === true) {
                                    const filtered = users.filter(u => {
                                      if (userFilter === "all") return true;
                                      if (userFilter === "verified") return u.emailVerified;
                                      if (userFilter === "admin") return u.isAdmin;
                                      if (userFilter === "judge") return u.isJudge;
                                      if (userFilter === "contestant") return !u.isAdmin && !u.isJudge;
                                      return true;
                                    });
                                    setSelectedUserIds(new Set(filtered.map(u => u.id)));
                                  } else {
                                    setSelectedUserIds(new Set());
                                  }
                                }}
                                data-testid="checkbox-select-all-users"
                              />
                            </th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.name")}</th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.email")}</th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.username")}</th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.location")}</th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.roles")}</th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.status")}</th>
                            <th className="text-left p-3 font-semibold">{t("admin.users.joined")}</th>
                            <th className="text-left p-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter((user) => {
                              if (userFilter === "all") return true;
                              if (userFilter === "verified") return user.emailVerified;
                              if (userFilter === "admin") return user.isAdmin;
                              if (userFilter === "judge") return user.isJudge;
                              if (userFilter === "contestant") return !user.isAdmin && !user.isJudge;
                              return true;
                            })
                            .map((user) => (
                              <tr key={user.id} className="border-b hover-elevate" data-testid={`row-user-${user.id}`}>
                                <td className="p-3 w-10">
                                  <Checkbox
                                    checked={selectedUserIds.has(user.id)}
                                    onCheckedChange={(checked) => {
                                      const newSelected = new Set(selectedUserIds);
                                      if (checked === true) {
                                        newSelected.add(user.id);
                                      } else {
                                        newSelected.delete(user.id);
                                      }
                                      setSelectedUserIds(newSelected);
                                    }}
                                    data-testid={`checkbox-select-user-${user.id}`}
                                  />
                                </td>
                                <td className="p-3" data-testid={`text-name-${user.id}`}>
                                  {user.firstName} {user.lastName}
                                </td>
                                <td className="p-3" data-testid={`text-email-${user.id}`}>
                                  {user.email}
                                </td>
                                <td className="p-3" data-testid={`text-username-${user.id}`}>
                                  {user.username || "-"}
                                </td>
                                <td className="p-3" data-testid={`text-location-${user.id}`}>
                                  {user.location || "-"}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-1 flex-wrap">
                                    {user.isAdmin && (
                                      <Badge variant="destructive" data-testid={`badge-admin-${user.id}`}>
                                        {t("admin.users.admin")}
                                      </Badge>
                                    )}
                                    {user.isJudge && (
                                      <Badge variant="secondary" data-testid={`badge-judge-${user.id}`}>
                                        {t("admin.users.judge")}
                                      </Badge>
                                    )}
                                    {!user.isAdmin && !user.isJudge && (
                                      <Badge variant="outline" data-testid={`badge-user-${user.id}`}>
                                        {t("admin.users.contestant")}
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {user.emailVerified ? (
                                    <Badge variant="default" data-testid={`badge-verified-${user.id}`}>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      {t("admin.users.verified")}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" data-testid={`badge-unverified-${user.id}`}>
                                      <Clock className="w-3 h-3 mr-1" />
                                      {t("admin.users.unverified")}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-3">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleOpenEditRoles(user)}
                                      data-testid={`button-edit-roles-${user.id}`}
                                      title="Edit user roles and permissions"
                                    >
                                      <Edit className="w-4 h-4 text-primary" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setDeleteUserDialogOpen(true);
                                      }}
                                      data-testid={`button-delete-user-${user.id}`}
                                      title="Delete user account"
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </div>
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
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="judges" data-testid="accordion-item-judges">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-judges">
            {t("admin.tabs.judges")}
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  For full judge management features, please use a larger screen or rotate to landscape mode.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="advertisers" data-testid="accordion-item-advertisers">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-advertisers">
            <div className="flex items-center gap-2">
              Advertisers
              {advertisers.filter((a: any) => a.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {advertisers.filter((a: any) => a.status === "pending").length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  For full advertiser management features, please use a larger screen or rotate to landscape mode.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="ads" data-testid="accordion-item-ads">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-ads">
            <div className="flex items-center gap-2">
              Ads
              {pendingAds.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingAds.length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  For full ad management features, please use a larger screen or rotate to landscape mode.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="payouts" data-testid="accordion-item-payouts">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-payouts">
            <div className="flex items-center gap-2">
              {t("admin.tabs.payouts")}
              {payoutRequests.filter((p) => p.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {payoutRequests.filter((p) => p.status === "pending").length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  For full payout management features, please use a larger screen or rotate to landscape mode.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="reports" data-testid="accordion-item-reports">
          <AccordionTrigger className="text-base font-medium" data-testid="accordion-trigger-reports">
            <div className="flex items-center gap-2">
              {t("admin.tabs.reports")}
              {reports.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {reports.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  For full report management features, please use a larger screen or rotate to landscape mode.
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Desktop Tabs Version */}
      <Tabs defaultValue="overview" className="w-full hidden lg:block">
        <div className="flex flex-col lg:flex-row gap-6">
          <TabsList className="flex flex-col h-fit w-full lg:w-48 gap-1">
            <TabsTrigger
              value="overview"
              className="w-full justify-start"
              data-testid="tab-overview"
            >
              Dashboard Overview
            </TabsTrigger>
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
              value="payments"
              className="w-full justify-start"
              data-testid="tab-payments"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payments
              {paymentsData.summary?.byStatus?.pending > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {paymentsData.summary.byStatus.pending}
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
            <TabsTrigger
              value="newsletter"
              className="w-full justify-start"
              data-testid="tab-newsletter"
            >
              <Mail className="w-4 h-4 mr-2" />
              Newsletter
            </TabsTrigger>
            <TabsTrigger
              value="cms"
              className="w-full justify-start"
              data-testid="tab-cms"
            >
              CMS
            </TabsTrigger>
            <TabsTrigger
              value="affiliates"
              className="w-full justify-start"
              data-testid="tab-affiliates"
            >
              Affiliates
              {affiliates.filter((a: any) => a.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {affiliates.filter((a: any) => a.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="w-full justify-start"
              data-testid="tab-campaigns"
            >
              Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="fraud-alerts"
              className="w-full justify-start"
              data-testid="tab-fraud-alerts"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Fraud Alerts
            </TabsTrigger>
            <TabsTrigger
              value="api-tracking"
              className="w-full justify-start"
              data-testid="tab-api-tracking"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              API Tracking
            </TabsTrigger>
            <TabsTrigger
              value="sms"
              className="w-full justify-start"
              data-testid="tab-sms"
            >
              <Send className="w-4 h-4 mr-2" />
              SMS Management
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="w-full justify-start"
              data-testid="tab-security"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          <div className="flex-1">
            <TabsContent value="overview" className="mt-0">
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <Power className="w-4 h-4" />
                    Registration Control
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {registrationStatus?.enabled ? "Open" : "Closed"}
                    </span>
                    <Switch
                      checked={registrationStatus?.enabled || false}
                      onCheckedChange={(enabled) => toggleRegistrationMutation.mutate(enabled)}
                      disabled={toggleRegistrationMutation.isPending}
                      data-testid="switch-toggle-registrations"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {registrationStatus?.enabled 
                      ? "Registrations are currently OPEN. Users can register for competitions."
                      : "Registrations are currently CLOSED. Users will see a 'Coming Soon' message on the registration page."}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
                  ) : dashboardStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{dashboardStats.totalUsers || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                          <Film className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{dashboardStats.totalVideos || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{dashboardStats.totalViews || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{dashboardStats.suspendedUsers || 0}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Unverified Emails</CardTitle>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{dashboardStats.unverifiedEmails || 0}</div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

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
                      {selectedUserIds.size > 0 && (
                        <div className="bg-muted p-4 rounded-lg mb-4 flex items-center justify-between gap-4">
                          <div className="text-sm font-medium">{selectedUserIds.size} users selected</div>
                          <Button
                            size="sm"
                            onClick={() => setBulkRoleDialogOpen(true)}
                            data-testid="button-bulk-assign-roles"
                          >
                            Assign Roles
                          </Button>
                        </div>
                      )}

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
                              <th className="text-left p-3 font-semibold w-10">
                                <Checkbox
                                  checked={selectedUserIds.size > 0 && selectedUserIds.size === users.filter(u => {
                                    if (userFilter === "all") return true;
                                    if (userFilter === "verified") return u.emailVerified;
                                    if (userFilter === "admin") return u.isAdmin;
                                    if (userFilter === "judge") return u.isJudge;
                                    if (userFilter === "contestant") return !u.isAdmin && !u.isJudge;
                                    return true;
                                  }).length}
                                  onCheckedChange={(checked) => {
                                    if (checked === true) {
                                      const filtered = users.filter(u => {
                                        if (userFilter === "all") return true;
                                        if (userFilter === "verified") return u.emailVerified;
                                        if (userFilter === "admin") return u.isAdmin;
                                        if (userFilter === "judge") return u.isJudge;
                                        if (userFilter === "contestant") return !u.isAdmin && !u.isJudge;
                                        return true;
                                      });
                                      setSelectedUserIds(new Set(filtered.map(u => u.id)));
                                    } else {
                                      setSelectedUserIds(new Set());
                                    }
                                  }}
                                  data-testid="checkbox-select-all-users-desktop"
                                />
                              </th>
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
                              <th className="text-left p-3 font-semibold">
                                Actions
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
                                  <td className="p-3 w-10">
                                    <Checkbox
                                      checked={selectedUserIds.has(user.id)}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(selectedUserIds);
                                        if (checked === true) {
                                          newSelected.add(user.id);
                                        } else {
                                          newSelected.delete(user.id);
                                        }
                                        setSelectedUserIds(newSelected);
                                      }}
                                      data-testid={`checkbox-select-user-desktop-${user.id}`}
                                    />
                                  </td>
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
                                  <td className="p-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleOpenEditRoles(user)}
                                        data-testid={`button-edit-roles-${user.id}`}
                                        title="Edit user roles and permissions"
                                      >
                                        <Edit className="w-4 h-4 text-primary" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                          setUserToDelete(user);
                                          setDeleteUserDialogOpen(true);
                                        }}
                                        data-testid={`button-delete-user-${user.id}`}
                                        title="Delete user account"
                                      >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
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

              {/* Role Management Dialog */}
              <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
                <DialogContent className="max-w-md" data-testid="dialog-edit-roles">
                  <DialogHeader>
                    <DialogTitle>Edit User Roles & Permissions</DialogTitle>
                    <DialogDescription>
                      {userToEditRoles && `${userToEditRoles.firstName} ${userToEditRoles.lastName}`}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="role-admin"
                          checked={editingRoles.isAdmin}
                          onCheckedChange={(checked) =>
                            setEditingRoles({ ...editingRoles, isAdmin: checked === true })
                          }
                          data-testid="checkbox-role-admin"
                        />
                        <Label htmlFor="role-admin" className="cursor-pointer flex-1">
                          <div className="font-medium">Administrator</div>
                          <div className="text-sm text-muted-foreground">Full platform access</div>
                        </Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="role-judge"
                          checked={editingRoles.isJudge}
                          onCheckedChange={(checked) =>
                            setEditingRoles({ ...editingRoles, isJudge: checked === true })
                          }
                          data-testid="checkbox-role-judge"
                        />
                        <Label htmlFor="role-judge" className="cursor-pointer flex-1">
                          <div className="font-medium">Judge</div>
                          <div className="text-sm text-muted-foreground">Score videos in competitions</div>
                        </Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="role-moderator"
                          checked={editingRoles.isModerator}
                          onCheckedChange={(checked) =>
                            setEditingRoles({ ...editingRoles, isModerator: checked === true })
                          }
                          data-testid="checkbox-role-moderator"
                        />
                        <Label htmlFor="role-moderator" className="cursor-pointer flex-1">
                          <div className="font-medium">Moderator</div>
                          <div className="text-sm text-muted-foreground">Moderate content and reports</div>
                        </Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="role-content-manager"
                          checked={editingRoles.isContentManager}
                          onCheckedChange={(checked) =>
                            setEditingRoles({ ...editingRoles, isContentManager: checked === true })
                          }
                          data-testid="checkbox-role-content-manager"
                        />
                        <Label htmlFor="role-content-manager" className="cursor-pointer flex-1">
                          <div className="font-medium">Content Manager</div>
                          <div className="text-sm text-muted-foreground">Manage platform content</div>
                        </Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="role-affiliate-manager"
                          checked={editingRoles.isAffiliateManager}
                          onCheckedChange={(checked) =>
                            setEditingRoles({ ...editingRoles, isAffiliateManager: checked === true })
                          }
                          data-testid="checkbox-role-affiliate-manager"
                        />
                        <Label htmlFor="role-affiliate-manager" className="cursor-pointer flex-1">
                          <div className="font-medium">Affiliate Manager</div>
                          <div className="text-sm text-muted-foreground">Manage affiliate programs</div>
                        </Label>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="text-sm">
                        <p className="font-medium mb-2">Quick Actions:</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRoles({ isAdmin: true, isJudge: false, isModerator: false, isContentManager: false, isAffiliateManager: false });
                            }}
                            data-testid="button-make-admin"
                          >
                            Make Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRoles({ isAdmin: false, isJudge: true, isModerator: false, isContentManager: false, isAffiliateManager: false });
                            }}
                            data-testid="button-make-judge"
                          >
                            Make Judge
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRoles({ isAdmin: false, isJudge: false, isModerator: false, isContentManager: false, isAffiliateManager: false });
                            }}
                            data-testid="button-make-contestant"
                          >
                            Make Contestant
                          </Button>
                        </div>
                      </div>

                      {userToEditRoles && (
                        <div className="flex items-center gap-3 p-3 bg-muted rounded">
                          <Checkbox
                            id="suspend-user"
                            checked={userToEditRoles.suspended ?? false}
                            onCheckedChange={() => toggleUserSuspensionMutation.mutate()}
                            data-testid="checkbox-suspend-user"
                          />
                          <Label htmlFor="suspend-user" className="cursor-pointer flex-1">
                            <div className="font-medium">Suspend Account</div>
                            <div className="text-xs text-muted-foreground">Prevent login and access</div>
                          </Label>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditRoleDialogOpen(false)}
                        className="flex-1"
                        data-testid="button-cancel-roles"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateUserRolesMutation.mutate()}
                        disabled={updateUserRolesMutation.isPending}
                        className="flex-1"
                        data-testid="button-save-roles"
                      >
                        {updateUserRolesMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Bulk Role Assignment Dialog */}
              <Dialog open={bulkRoleDialogOpen} onOpenChange={setBulkRoleDialogOpen}>
                <DialogContent className="max-w-md" data-testid="dialog-bulk-roles">
                  <DialogHeader>
                    <DialogTitle>Bulk Assign Roles</DialogTitle>
                    <DialogDescription>
                      Assign roles to {selectedUserIds.size} selected users
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="bulk-admin"
                          data-testid="checkbox-bulk-admin"
                          onCheckedChange={(checked) => {
                            bulkUpdateRolesMutation.mutate({
                              isAdmin: checked === true,
                              isJudge: false,
                              isModerator: false,
                              isContentManager: false,
                              isAffiliateManager: false,
                            });
                          }}
                        />
                        <Label htmlFor="bulk-admin" className="cursor-pointer flex-1">
                          <div className="font-medium">Administrator</div>
                        </Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="bulk-judge"
                          data-testid="checkbox-bulk-judge"
                          onCheckedChange={(checked) => {
                            bulkUpdateRolesMutation.mutate({
                              isAdmin: false,
                              isJudge: checked === true,
                              isModerator: false,
                              isContentManager: false,
                              isAffiliateManager: false,
                            });
                          }}
                        />
                        <Label htmlFor="bulk-judge" className="cursor-pointer flex-1">
                          <div className="font-medium">Judge</div>
                        </Label>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setBulkRoleDialogOpen(false)}
                      className="w-full"
                      data-testid="button-close-bulk"
                    >
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                          disabled={createJudgeMutation.isPending || uploadJudgePhotoMutation.isPending}
                          data-testid="button-create-judge"
                        >
                          {createJudgeMutation.isPending
                            ? t("admin.judges.creating")
                            : uploadJudgePhotoMutation.isPending
                            ? t("admin.judges.uploading")
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
                                  src={`/objects/${judge.judgePhotoUrl.replace(/^\/objects\/|^\.\//, '')}`}
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
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setJudgeToEdit(judge);
                                    setEditJudgeName(judge.judgeName || "");
                                    setEditJudgeBio(judge.judgeBio || "");
                                    setEditJudgeDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-judge-${judge.id}`}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
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
                            <div className="flex gap-2 flex-wrap">
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAdvertiserToDelete(advertiser);
                                      setDeleteAdvertiserDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-advertiser-${advertiser.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </>
                              )}
                              {advertiser.status === "active" && (
                                <>
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAdvertiserToDelete(advertiser);
                                      setDeleteAdvertiserDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-advertiser-${advertiser.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </>
                              )}
                              {advertiser.status === "suspended" && (
                                <>
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
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAdvertiserToDelete(advertiser);
                                      setDeleteAdvertiserDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-advertiser-${advertiser.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </Button>
                                </>
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

            <TabsContent value="payments" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payment Tracking
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => refetchPayments()} disabled={paymentsLoading} data-testid="button-refresh-payments">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">Loading payments...</p>
                    </div>
                  ) : paymentsData.payments.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">No Payments Yet</h3>
                      <p className="text-muted-foreground">No payment transactions found</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold">{(paymentsData.summary.totalAmount || 0).toLocaleString()} FCFA</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 dark:bg-green-950/20">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Completed/Approved</p>
                            <p className="text-2xl font-bold text-green-600">{(paymentsData.summary.completedAmount || 0).toLocaleString()} FCFA</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-blue-50/50 dark:bg-blue-950/20">
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Total Transactions</p>
                            <p className="text-2xl font-bold text-blue-600">{paymentsData.summary.totalPayments || 0}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Filter Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={paymentFilter === "all" ? "default" : "outline"}
                          className="cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setPaymentFilter("all")}
                          data-testid="badge-all-payments"
                        >
                          All ({paymentsData.summary.totalPayments || 0})
                        </Badge>
                        <Badge
                          variant={paymentFilter === "votes" ? "default" : "outline"}
                          className="cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setPaymentFilter("votes")}
                          data-testid="badge-vote-payments"
                        >
                          Vote Purchases ({paymentsData.summary.byType?.votes || 0})
                        </Badge>
                        <Badge
                          variant={paymentFilter === "registrations" ? "default" : "outline"}
                          className="cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setPaymentFilter("registrations")}
                          data-testid="badge-registration-payments"
                        >
                          Registrations ({paymentsData.summary.byType?.registrations || 0})
                        </Badge>
                        <Badge
                          variant={paymentFilter === "ads" ? "default" : "outline"}
                          className="cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setPaymentFilter("ads")}
                          data-testid="badge-ad-payments"
                        >
                          Ad Payments ({paymentsData.summary.byType?.ads || 0})
                        </Badge>
                        <Badge
                          variant={paymentFilter === "affiliates" ? "default" : "outline"}
                          className="cursor-pointer hover-elevate active-elevate-2"
                          onClick={() => setPaymentFilter("affiliates")}
                          data-testid="badge-affiliate-payments"
                        >
                          Affiliate Payouts ({paymentsData.summary.byType?.affiliates || 0})
                        </Badge>
                      </div>

                      {/* Payments Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b">
                            <tr>
                              <th className="text-left p-2 font-medium">Type</th>
                              <th className="text-left p-2 font-medium">User/Company</th>
                              <th className="text-right p-2 font-medium">Amount</th>
                              <th className="text-left p-2 font-medium">Status</th>
                              <th className="text-left p-2 font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(paymentFilter === "all" ? paymentsData.payments : paymentsData.payments.filter((p: any) => p.payment_type === `${paymentFilter === "votes" ? "vote_purchase" : paymentFilter === "ads" ? "ad_payment" : paymentFilter === "affiliates" ? "affiliate_payout" : "registration"}`)).map((payment: any) => (
                              <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                                <td className="p-2">
                                  <Badge variant="outline" className="text-xs">
                                    {payment.payment_type === "vote_purchase" ? "Vote" : 
                                     payment.payment_type === "registration" ? "Registration" :
                                     payment.payment_type === "ad_payment" ? "Ad" : "Affiliate"}
                                  </Badge>
                                </td>
                                <td className="p-2 font-medium text-foreground truncate" data-testid={`text-payment-user-${payment.id}`}>{payment.username}</td>
                                <td className="p-2 text-right font-mono font-bold text-primary">{(payment.amount || 0).toLocaleString()} FCFA</td>
                                <td className="p-2">
                                  <Badge variant={
                                    payment.status === "completed" || payment.status === "approved" ? "default" :
                                    payment.status === "pending" ? "secondary" : "destructive"
                                  } className="text-xs">
                                    {payment.status === "completed" ? "Completed" :
                                     payment.status === "approved" ? "Approved" :
                                     payment.status === "pending" ? "Pending" : "Rejected"}
                                  </Badge>
                                </td>
                                <td className="p-2 text-muted-foreground text-xs">{new Date(payment.created_at).toLocaleDateString()}</td>
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
                                onClick={() => setLocation(`/video/${report.videoId}`)}
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
                                <Button
                                  onClick={() =>
                                    deleteReportMutation.mutate(report.id)
                                  }
                                  disabled={deleteReportMutation.isPending}
                                  variant="destructive"
                                  size="icon"
                                  data-testid={`button-delete-report-${report.id}`}
                                  title="Delete report"
                                >
                                  <Trash2 className="w-4 h-4" />
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
            </TabsContent>

            <TabsContent value="campaigns" className="mt-0">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Affiliate Campaigns</CardTitle>
                      <p className="text-sm text-muted-foreground">Create marketing campaigns with promotional assets for affiliates</p>
                    </div>
                    <Button onClick={() => setAffiliateCampaignDialogOpen(true)} data-testid="button-create-new-campaign">Create Campaign</Button>
                  </CardHeader>
                  <CardContent>
                    {campaignsLoading ? (
                      <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    ) : campaigns.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No campaigns yet. Create one to get started.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaigns.map((campaign: any) => (
                          <Card key={campaign.id} className="cursor-pointer hover-elevate" onClick={() => handleSelectCampaign(campaign)} data-testid={`card-campaign-${campaign.id}`}>
                            <CardHeader>
                              <CardTitle className="text-base">{campaign.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{campaign.description}</p>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div><span className="text-muted-foreground">Objective:</span> {campaign.objective || "—"}</div>
                              <div><span className="text-muted-foreground">Target:</span> {campaign.target_audience || "—"}</div>
                              <div><span className="text-muted-foreground">Budget:</span> {campaign.budget ? `${campaign.budget.toLocaleString()} FCFA` : "—"}</div>
                              <div className="flex gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSelectCampaign(campaign); }} data-testid={`button-manage-assets-${campaign.id}`}>Assets</Button>
                                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this campaign and all assets?")) deleteAffiliateCampaignMutation.mutate(campaign.id); }} disabled={deleteAffiliateCampaignMutation.isPending} data-testid={`button-delete-campaign-${campaign.id}`}>Delete</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedCampaignId && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Marketing Assets</CardTitle>
                        <p className="text-sm text-muted-foreground">Banners, creatives, and promotional materials</p>
                      </div>
                      <Button onClick={() => setAssetDialogOpen(true)} data-testid="button-add-asset">Add Asset</Button>
                    </CardHeader>
                    <CardContent>
                      {campaignAssets.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No assets for this campaign yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {campaignAssets.map((asset: any) => (
                            <div key={asset.id} className="border rounded p-3 flex items-center justify-between" data-testid={`asset-item-${asset.id}`}>
                              <div>
                                <p className="font-medium">{asset.title}</p>
                                <p className="text-sm text-muted-foreground">{asset.description}</p>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Type: {asset.type} | Dimensions: {asset.dimensions || "—"} | Size: {asset.file_size ? `${(asset.file_size / 1024).toFixed(2)} KB` : "—"}
                                </div>
                              </div>
                              <Button size="sm" variant="destructive" onClick={() => deleteAssetMutation.mutate(asset.id)} disabled={deleteAssetMutation.isPending} data-testid={`button-delete-asset-${asset.id}`}>Delete</Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="fraud-alerts" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Fraud Detection Alerts
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Monitor suspicious clicks and bot detection patterns</p>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">No Alerts Yet</p>
                    <p className="text-xs text-muted-foreground">Fraud monitoring system is active. Alerts will appear here when suspicious click patterns or bot activity is detected.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-tracking" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    API Tracking Logs
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Monitor affiliate API calls, postback URLs, and click tracking</p>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">No Logs Yet</p>
                    <p className="text-xs text-muted-foreground">API tracking system is active. Logs will appear here once affiliates start making API calls and using postback URLs for click tracking.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sms" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    SMS Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Manage SMS messages and campaigns using Twilio</p>
                </CardHeader>
                <CardContent>
                  <SmsTestingForm />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ad Rejection Dialog - moved outside tabs */}
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

            <TabsContent value="newsletter" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Newsletter Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="subscribers" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="subscribers" data-testid="tab-newsletter-subscribers">
                        Subscribers
                      </TabsTrigger>
                      <TabsTrigger value="campaigns" data-testid="tab-newsletter-campaigns">
                        Campaigns
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="subscribers" className="space-y-4 mt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Email Subscribers</h3>
                        <Button size="sm" onClick={() => setNewsletterDialogOpen(true)} data-testid="button-add-subscriber">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subscriber
                        </Button>
                      </div>

                      {newsletterSubscribers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No subscribers yet</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border rounded-md">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr className="border-b">
                                <th className="text-left py-3 px-3 font-semibold">Email</th>
                                <th className="text-left py-3 px-3 font-semibold">First Name</th>
                                <th className="text-left py-3 px-3 font-semibold">Last Name</th>
                                <th className="text-left py-3 px-3 font-semibold">Phone</th>
                                <th className="text-left py-3 px-3 font-semibold">Location</th>
                                <th className="text-left py-3 px-3 font-semibold">Country</th>
                                <th className="text-left py-3 px-3 font-semibold">Interests</th>
                                <th className="text-left py-3 px-3 font-semibold">Status</th>
                                <th className="text-left py-3 px-3 font-semibold">Subscribed</th>
                                <th className="text-left py-3 px-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {newsletterSubscribers.map((subscriber: any) => (
                                <tr key={subscriber.id} className="border-b hover:bg-muted/50">
                                  <td className="py-3 px-3">{subscriber.email}</td>
                                  <td className="py-3 px-3">{subscriber.firstName || "-"}</td>
                                  <td className="py-3 px-3">{subscriber.lastName || "-"}</td>
                                  <td className="py-3 px-3 text-xs">{subscriber.phone || "-"}</td>
                                  <td className="py-3 px-3 text-xs">{subscriber.location || "-"}</td>
                                  <td className="py-3 px-3 text-xs">{subscriber.country || "-"}</td>
                                  <td className="py-3 px-3 text-xs">
                                    {subscriber.interests && subscriber.interests.length > 0 ? subscriber.interests.join(", ") : "-"}
                                  </td>
                                  <td className="py-3 px-3">
                                    <Badge
                                      variant={subscriber.status === "subscribed" ? "default" : "secondary"}
                                      data-testid={`badge-subscriber-status-${subscriber.id}`}
                                    >
                                      {subscriber.status}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-3 text-xs">
                                    {new Date(subscriber.subscribedAt).toLocaleDateString()}
                                  </td>
                                  <td className="py-3 px-3 flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteSubscriber(subscriber.id)}
                                      disabled={deleteSubscriberMutation.isPending}
                                      data-testid={`button-delete-subscriber-${subscriber.id}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="campaigns" className="space-y-4 mt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Email Campaigns</h3>
                        <Button size="sm" onClick={() => setCampaignDialogOpen(true)} data-testid="button-create-campaign">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Campaign
                        </Button>
                      </div>

                      {emailCampaigns.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No campaigns yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {emailCampaigns.map((campaign) => (
                            <Card key={campaign.id}>
                              <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{campaign.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{campaign.subject}</p>
                                  </div>
                                  <Badge variant={campaign.status === "draft" ? "secondary" : campaign.status === "sent" ? "default" : "outline"} data-testid={`badge-campaign-status-${campaign.id}`}>
                                    {campaign.status}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Recipients</p>
                                    <p className="font-semibold">{campaign.totalRecipients}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Sent</p>
                                    <p className="font-semibold">{campaign.totalSent}</p>
                                  </div>
                                  {campaign.status === "sent" && (
                                    <>
                                      <div>
                                        <p className="text-muted-foreground">Opened</p>
                                        <p className="font-semibold">{campaign.totalOpened} ({campaign.totalSent > 0 ? Math.round((campaign.totalOpened / campaign.totalSent) * 100) : 0}%)</p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Clicked</p>
                                        <p className="font-semibold">{campaign.totalClicked} ({campaign.totalSent > 0 ? Math.round((campaign.totalClicked / campaign.totalSent) * 100) : 0}%)</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2 pt-2">
                                  {campaign.status === "draft" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditCampaign(campaign)}
                                        data-testid={`button-edit-campaign-${campaign.id}`}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleSendCampaign(campaign.id)}
                                        disabled={sendCampaignMutation.isPending}
                                        data-testid={`button-send-campaign-${campaign.id}`}
                                      >
                                        <Send className="w-4 h-4 mr-2" />
                                        Send
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                    disabled={deleteCampaignMutation.isPending}
                                    data-testid={`button-delete-campaign-${campaign.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Add Subscriber Dialog */}
              <Dialog open={newsletterDialogOpen} onOpenChange={setNewsletterDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-add-subscriber">
                  <DialogHeader>
                    <DialogTitle>Add Subscriber</DialogTitle>
                    <DialogDescription>Add a new email subscriber with all their information</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="subscriber-email">Email *</Label>
                        <Input
                          id="subscriber-email"
                          type="email"
                          placeholder="subscriber@example.com"
                          value={subscriberForm.email}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, email: e.target.value })}
                          data-testid="input-subscriber-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscriber-firstName">First Name</Label>
                        <Input
                          id="subscriber-firstName"
                          placeholder="John"
                          value={(subscriberForm as any).firstName || ""}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, ...(subscriberForm as any), firstName: e.target.value })}
                          data-testid="input-subscriber-firstName"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscriber-lastName">Last Name</Label>
                        <Input
                          id="subscriber-lastName"
                          placeholder="Doe"
                          value={(subscriberForm as any).lastName || ""}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, ...(subscriberForm as any), lastName: e.target.value })}
                          data-testid="input-subscriber-lastName"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscriber-phone">Phone</Label>
                        <Input
                          id="subscriber-phone"
                          placeholder="+237 6XX XXX XXX"
                          value={(subscriberForm as any).phone || ""}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, ...(subscriberForm as any), phone: e.target.value })}
                          data-testid="input-subscriber-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscriber-location">Location</Label>
                        <Input
                          id="subscriber-location"
                          placeholder="City, Region"
                          value={(subscriberForm as any).location || ""}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, ...(subscriberForm as any), location: e.target.value })}
                          data-testid="input-subscriber-location"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subscriber-country">Country</Label>
                        <Input
                          id="subscriber-country"
                          placeholder="Cameroon"
                          value={(subscriberForm as any).country || ""}
                          onChange={(e) => setSubscriberForm({ ...subscriberForm, ...(subscriberForm as any), country: e.target.value })}
                          data-testid="input-subscriber-country"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="subscriber-interests">Interests (comma separated)</Label>
                      <Input
                        id="subscriber-interests"
                        placeholder="Comedy, Music, Fashion"
                        value={(subscriberForm as any).interests?.join(", ") || ""}
                        onChange={(e) => setSubscriberForm({ ...subscriberForm, ...(subscriberForm as any), interests: e.target.value ? e.target.value.split(",").map(i => i.trim()) : [] })}
                        data-testid="input-subscriber-interests"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewsletterDialogOpen(false)} data-testid="button-cancel-subscriber">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddSubscriber}
                      disabled={!subscriberForm.email || addSubscriberMutation.isPending}
                      data-testid="button-confirm-add-subscriber"
                    >
                      {addSubscriberMutation.isPending ? "Adding..." : "Add Subscriber"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Campaign Dialog */}
              <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-campaign">
                  <DialogHeader>
                    <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
                    <DialogDescription>
                      {editingCampaign ? "Update your email campaign" : "Create a new email campaign"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="campaign-title">Title</Label>
                      <Input
                        id="campaign-title"
                        placeholder="Campaign title"
                        value={campaignForm.title}
                        onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                        data-testid="input-campaign-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaign-subject">Subject Line</Label>
                      <Input
                        id="campaign-subject"
                        placeholder="Email subject"
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                        data-testid="input-campaign-subject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="campaign-content">Content</Label>
                      <div className="bg-background border rounded-md overflow-hidden" style={{ height: "500px" }}>
                        <ReactQuill
                          value={campaignForm.htmlContent}
                          onChange={(html) => setCampaignForm({ ...campaignForm, htmlContent: html, content: html.replace(/<[^>]*>/g, "") })}
                          theme="snow"
                          placeholder="Write your email content here..."
                          modules={{
                            toolbar: [
                              [{ header: [1, 2, 3, false] }],
                              ["bold", "italic", "underline", "strike"],
                              ["blockquote", "code-block"],
                              [{ list: "ordered" }, { list: "bullet" }],
                              [{ align: [] }],
                              ["link", "image"],
                              ["clean"],
                            ],
                          }}
                          data-testid="editor-campaign-content"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCampaignDialogOpen(false)} data-testid="button-cancel-campaign">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCampaign}
                      disabled={!campaignForm.title || !campaignForm.subject || !campaignForm.content || (editingCampaign ? updateCampaignMutation.isPending : createCampaignMutation.isPending)}
                      data-testid="button-confirm-campaign"
                    >
                      {editingCampaign ? (updateCampaignMutation.isPending ? "Updating..." : "Update Campaign") : (createCampaignMutation.isPending ? "Creating..." : "Create Campaign")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="affiliates" className="mt-0">
              {analyticsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Global Performance Overview */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Global Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Affiliates</p>
                          <p className="text-2xl font-bold">{affiliateAnalytics.summary.totalAffiliates || 0}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Active Affiliates</p>
                          <p className="text-2xl font-bold text-green-600">{affiliateAnalytics.summary.activeAffiliates || 0}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Referrals</p>
                          <p className="text-2xl font-bold">{affiliateAnalytics.summary.totalReferrals || 0}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Conversions</p>
                          <p className="text-2xl font-bold text-blue-600">{affiliateAnalytics.summary.totalConversions || 0}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Revenue</p>
                          <p className="text-2xl font-bold text-purple-600">{(affiliateAnalytics.summary.totalEarnings || 0).toLocaleString()} FCFA</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Commission Generated</p>
                          <p className="text-2xl font-bold text-orange-600">{(affiliateAnalytics.summary.totalCommission || 0).toLocaleString()} FCFA</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Payout Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Payout Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-yellow-200 dark:border-yellow-900">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Pending Payouts</p>
                          <p className="text-2xl font-bold text-yellow-600">{affiliateAnalytics.payoutSummary.pending?.count || 0}</p>
                          <p className="text-sm text-muted-foreground mt-2">{(affiliateAnalytics.payoutSummary.pending?.amount || 0).toLocaleString()} FCFA</p>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 dark:border-blue-900">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Approved Payouts</p>
                          <p className="text-2xl font-bold text-blue-600">{affiliateAnalytics.payoutSummary.approved?.count || 0}</p>
                          <p className="text-sm text-muted-foreground mt-2">{(affiliateAnalytics.payoutSummary.approved?.amount || 0).toLocaleString()} FCFA</p>
                        </CardContent>
                      </Card>
                      <Card className="border-green-200 dark:border-green-900">
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Paid Payouts</p>
                          <p className="text-2xl font-bold text-green-600">{affiliateAnalytics.payoutSummary.paid?.count || 0}</p>
                          <p className="text-sm text-muted-foreground mt-2">{(affiliateAnalytics.payoutSummary.paid?.amount || 0).toLocaleString()} FCFA</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Top Performing Affiliates */}
                  {affiliateAnalytics.topPerformers && affiliateAnalytics.topPerformers.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Top-Performing Affiliates</h3>
                      <Card>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr className="border-b">
                                  <th className="text-left p-3 font-semibold">Affiliate</th>
                                  <th className="text-right p-3 font-semibold">Referrals</th>
                                  <th className="text-right p-3 font-semibold">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(affiliateAnalytics.topPerformers || []).map((affiliate: any, idx: number) => (
                                  <tr key={affiliate.id} className="border-b hover:bg-muted/50">
                                    <td className="p-3">
                                      <div className="font-medium">#{idx + 1} {affiliate.username}</div>
                                      <div className="text-xs text-muted-foreground">{affiliate.email}</div>
                                    </td>
                                    <td className="p-3 text-right font-semibold">{affiliate.total_referrals}</td>
                                    <td className="p-3 text-right font-bold text-green-600">{(affiliate.total_earnings || 0).toLocaleString()} FCFA</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* All Affiliates Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>All Affiliates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {affiliateAnalytics.allAffiliates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No affiliates found</div>
                      ) : (
                        <div className="overflow-x-auto border rounded-md">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr className="border-b">
                                <th className="text-left p-3 font-semibold">User</th>
                                <th className="text-left p-3 font-semibold">Referral Code</th>
                                <th className="text-right p-3 font-semibold">Referrals</th>
                                <th className="text-right p-3 font-semibold">Earnings</th>
                                <th className="text-center p-3 font-semibold">Commission %</th>
                                <th className="text-left p-3 font-semibold">Status</th>
                                <th className="text-left p-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(affiliateAnalytics.allAffiliates as any[]).map((affiliate) => (
                                <tr key={affiliate.id} className="border-b hover:bg-muted/50">
                                  <td className="p-3">
                                    <div className="font-medium">{affiliate.username || affiliate.email}</div>
                                    <div className="text-xs text-muted-foreground">{affiliate.email}</div>
                                  </td>
                                  <td className="p-3 font-mono text-sm">{affiliate.referral_code}</td>
                                  <td className="p-3 text-right">{affiliate.total_referrals}</td>
                                  <td className="p-3 text-right font-semibold">{(affiliate.total_earnings || 0).toLocaleString()} FCFA</td>
                                  <td className="p-3 text-center font-semibold">{affiliate.commission_rate || 20}%</td>
                                  <td className="p-3">
                                    <Badge variant={affiliate.status === "active" ? "default" : "secondary"}>
                                      {affiliate.status}
                                    </Badge>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1 flex-wrap">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedAffiliateId(affiliate.id);
                                          setNewAffiliateStatus(affiliate.status);
                                          setAffiliateStatusDialog(true);
                                        }}
                                        data-testid={`button-update-affiliate-status-${affiliate.id}`}
                                      >
                                        Status
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedAffiliateId(affiliate.id);
                                          setNewCommissionRate(affiliate.commission_rate || 20);
                                          setAffiliateCommissionDialog(true);
                                        }}
                                        data-testid={`button-update-affiliate-commission-${affiliate.id}`}
                                      >
                                        Commission
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleViewAffiliateDetail(affiliate.id)}
                                        data-testid={`button-view-affiliate-details-${affiliate.id}`}
                                      >
                                        Details
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payout Requests Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Payout Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {payoutRequestsLoading ? (
                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                      ) : payoutRequestsData.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No payout requests</div>
                      ) : (
                        <div className="overflow-x-auto border rounded-md">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr className="border-b">
                                <th className="text-left p-3 font-semibold">Affiliate</th>
                                <th className="text-right p-3 font-semibold">Amount</th>
                                <th className="text-left p-3 font-semibold">Status</th>
                                <th className="text-left p-3 font-semibold">Method</th>
                                <th className="text-left p-3 font-semibold">Requested</th>
                                <th className="text-left p-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(payoutRequestsData as any[]).map((payout) => (
                                <tr key={payout.id} className="border-b hover:bg-muted/50">
                                  <td className="p-3">
                                    <div className="font-medium">{payout.username || payout.email}</div>
                                    <div className="text-xs text-muted-foreground">{payout.referral_code}</div>
                                  </td>
                                  <td className="p-3 text-right font-semibold">{(payout.amount || 0).toLocaleString()} FCFA</td>
                                  <td className="p-3">
                                    <Badge variant={payout.status === "pending" ? "destructive" : payout.status === "approved" ? "default" : "secondary"}>
                                      {payout.status}
                                    </Badge>
                                  </td>
                                  <td className="p-3 text-sm">{payout.payment_method}</td>
                                  <td className="p-3 text-xs">{new Date(payout.requested_at).toLocaleDateString()}</td>
                                  <td className="p-3">
                                    {payout.status === "pending" && (
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setAffiliateSelectedPayoutId(payout.id);
                                            setAffiliatePayoutAction("approve");
                                            setAffiliatePayoutActionDialog(true);
                                          }}
                                          data-testid={`button-approve-payout-${payout.id}`}
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => {
                                            setAffiliateSelectedPayoutId(payout.id);
                                            setAffiliatePayoutAction("reject");
                                            setAffiliatePayoutActionDialog(true);
                                          }}
                                          data-testid={`button-reject-payout-${payout.id}`}
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Update Affiliate Status Dialog */}
              <Dialog open={affiliateStatusDialog} onOpenChange={setAffiliateStatusDialog}>
                <DialogContent data-testid="dialog-update-affiliate-status">
                  <DialogHeader>
                    <DialogTitle>Update Affiliate Status</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="affiliate-status">Status</Label>
                      <Select value={newAffiliateStatus} onValueChange={setNewAffiliateStatus}>
                        <SelectTrigger id="affiliate-status" data-testid="select-affiliate-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAffiliateStatusDialog(false)} data-testid="button-cancel-status">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedAffiliateId) {
                          updateAffiliateStatusMutation.mutate({ affiliateId: selectedAffiliateId, status: newAffiliateStatus });
                        }
                      }}
                      disabled={updateAffiliateStatusMutation.isPending}
                      data-testid="button-confirm-status"
                    >
                      {updateAffiliateStatusMutation.isPending ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Affiliate Performance Detail Dialog */}
              <Dialog open={affiliateDetailDialog} onOpenChange={setAffiliateDetailDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-affiliate-performance">
                  <DialogHeader>
                    <DialogTitle>Affiliate Performance Details</DialogTitle>
                  </DialogHeader>
                  {performanceLoading ? (
                    <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                  ) : affiliatePerformanceData ? (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Affiliate Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span>{affiliatePerformanceData.affiliate.first_name} {affiliatePerformanceData.affiliate.last_name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span>{affiliatePerformanceData.affiliate.email}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Referral Code:</span><span className="font-mono">{affiliatePerformanceData.affiliate.referral_code}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Commission Rate:</span><span className="font-semibold">{affiliatePerformanceData.affiliate.commission_rate}%</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Referrals:</span><span className="font-semibold">{affiliatePerformanceData.affiliate.total_referrals}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Earnings:</span><span className="font-semibold text-green-600">{(affiliatePerformanceData.affiliate.total_earnings || 0).toLocaleString()} FCFA</span></div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                          <CardTitle className="text-base">Referral History</CardTitle>
                          <Button size="sm" onClick={() => setCustomPayoutDialog(true)} data-testid="button-create-custom-payout">Create Payout</Button>
                        </CardHeader>
                        <CardContent>
                          {affiliatePerformanceData.referrals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No referrals</p>
                          ) : (
                            <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                              {affiliatePerformanceData.referrals.map((ref: any) => (
                                <div key={ref.id} className="flex justify-between p-2 bg-muted/30 rounded">
                                  <div><p className="font-medium">{ref.username}</p><p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p></div>
                                  <div className="text-right"><p className="font-semibold">{(ref.commission || 0).toLocaleString()} FCFA</p><Badge variant="outline" className="text-xs mt-1">{ref.status}</Badge></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Payout History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {affiliatePerformanceData.payouts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No payouts</p>
                          ) : (
                            <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
                              {affiliatePerformanceData.payouts.map((payout: any) => (
                                <div key={payout.id} className="flex justify-between p-2 bg-muted/30 rounded">
                                  <div><p className="font-medium">{payout.payment_method}</p><p className="text-xs text-muted-foreground">{new Date(payout.requested_at).toLocaleDateString()}</p></div>
                                  <div className="text-right"><p className="font-semibold">{(payout.amount || 0).toLocaleString()} FCFA</p><Badge variant={payout.status === 'approved' ? 'default' : 'secondary'} className="text-xs mt-1">{payout.status}</Badge></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : null}
                </DialogContent>
              </Dialog>

              {/* Custom Payout Dialog */}
              <Dialog open={customPayoutDialog} onOpenChange={setCustomPayoutDialog}>
                <DialogContent data-testid="dialog-custom-payout">
                  <DialogHeader>
                    <DialogTitle>Create Custom Payout</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payout-amount">Amount (FCFA)</Label>
                      <Input
                        id="payout-amount"
                        type="number"
                        min="0"
                        value={customPayoutAmount}
                        onChange={(e) => setCustomPayoutAmount(e.target.value)}
                        placeholder="Enter amount"
                        data-testid="input-payout-amount"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payout-method">Payment Method</Label>
                      <Select value={customPayoutMethod} onValueChange={setCustomPayoutMethod}>
                        <SelectTrigger id="payout-method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="wallet">Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCustomPayoutDialog(false)} data-testid="button-cancel-payout">Cancel</Button>
                    <Button
                      onClick={() => {
                        if (selectedAffiliateId && customPayoutAmount) {
                          customPayoutMutation.mutate({ affiliateId: selectedAffiliateId, amount: parseInt(customPayoutAmount) });
                        }
                      }}
                      disabled={!customPayoutAmount || customPayoutMutation.isPending}
                      data-testid="button-confirm-payout"
                    >
                      {customPayoutMutation.isPending ? "Creating..." : "Create Payout"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Update Commission Rate Dialog */}
              <Dialog open={affiliateCommissionDialog} onOpenChange={setAffiliateCommissionDialog}>
                <DialogContent data-testid="dialog-update-affiliate-commission">
                  <DialogHeader>
                    <DialogTitle>Update Commission Rate</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                      <Input
                        id="commission-rate"
                        type="number"
                        min="0"
                        max="100"
                        value={newCommissionRate}
                        onChange={(e) => setNewCommissionRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                        data-testid="input-commission-rate"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAffiliateCommissionDialog(false)} data-testid="button-cancel-commission">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (selectedAffiliateId) {
                          updateAffiliateCommissionMutation.mutate({ affiliateId: selectedAffiliateId, commissionRate: newCommissionRate });
                        }
                      }}
                      disabled={updateAffiliateCommissionMutation.isPending}
                      data-testid="button-confirm-commission"
                    >
                      {updateAffiliateCommissionMutation.isPending ? "Updating..." : "Update Commission"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Payout Action Dialog */}
              <Dialog open={affiliatePayoutActionDialog} onOpenChange={setAffiliatePayoutActionDialog}>
                <DialogContent data-testid="dialog-payout-action">
                  <DialogHeader>
                    <DialogTitle>{affiliatePayoutAction === "approve" ? "Approve Payout" : "Reject Payout"}</DialogTitle>
                  </DialogHeader>
                  {affiliatePayoutAction === "reject" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reason">Reason</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="Explain why this payout is being rejected..."
                          value={affiliatePayoutRejectionReason}
                          onChange={(e) => setAffiliatePayoutRejectionReason(e.target.value)}
                          data-testid="textarea-rejection-reason"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setAffiliatePayoutActionDialog(false)} data-testid="button-cancel-payout-action">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (affiliateSelectedPayoutId) {
                          if (affiliatePayoutAction === "approve") {
                            approveAffiliatePayoutMutation.mutate(affiliateSelectedPayoutId);
                          } else {
                            rejectAffiliatePayoutMutation.mutate({ payoutId: affiliateSelectedPayoutId, reason: affiliatePayoutRejectionReason });
                          }
                        }
                      }}
                      disabled={affiliatePayoutAction === "reject" ? !affiliatePayoutRejectionReason || rejectAffiliatePayoutMutation.isPending : approveAffiliatePayoutMutation.isPending}
                      variant={affiliatePayoutAction === "reject" ? "destructive" : "default"}
                      data-testid={`button-confirm-payout-${affiliatePayoutAction}`}
                    >
                      {affiliatePayoutAction === "approve"
                        ? approveAffiliatePayoutMutation.isPending ? "Approving..." : "Approve Payout"
                        : rejectAffiliatePayoutMutation.isPending ? "Rejecting..." : "Reject Payout"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="cms" className="mt-0">
              <CMSManagementTab />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">
                    Secure your admin account with two-factor authentication to protect 
                    against unauthorized access to the dashboard.
                  </p>
                  <TwoFactorSettings userType="admin" />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Edit Judge Dialog */}
      <Dialog open={editJudgeDialogOpen} onOpenChange={setEditJudgeDialogOpen}>
        <DialogContent data-testid="dialog-edit-judge">
          <DialogHeader>
            <DialogTitle>Edit Judge Profile</DialogTitle>
            <DialogDescription>
              Update the judge's name, biography, and profile photo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                {editJudgePhotoPreview || judgeToEdit?.judgePhotoUrl ? (
                  <img
                    src={editJudgePhotoPreview || `/objects/${judgeToEdit?.judgePhotoUrl?.replace(/^\/objects\/|^\.\//, '')}`}
                    alt="Judge preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editJudgePhotoInputRef.current?.click()}
                  data-testid="button-upload-judge-photo"
                >
                  {editJudgePhotoFile ? "Change Photo" : "Upload Photo"}
                </Button>
              </div>
              <input
                ref={editJudgePhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditJudgePhotoFile(file);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setEditJudgePhotoPreview(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                data-testid="input-edit-judge-photo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-judge-name">Judge Name</Label>
              <Input
                id="edit-judge-name"
                value={editJudgeName}
                onChange={(e) => setEditJudgeName(e.target.value)}
                placeholder="Judge display name"
                data-testid="input-edit-judge-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-judge-bio">Biography</Label>
              <Textarea
                id="edit-judge-bio"
                value={editJudgeBio}
                onChange={(e) => setEditJudgeBio(e.target.value)}
                placeholder="Judge biography"
                rows={4}
                data-testid="textarea-edit-judge-bio"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditJudgeDialogOpen(false);
                setEditJudgePhotoFile(null);
                setEditJudgePhotoPreview(null);
              }}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={() => updateJudgeMutation.mutate()}
              disabled={updateJudgeMutation.isPending}
              data-testid="button-save-judge"
            >
              {updateJudgeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Delete User Dialog with Data Selection */}
      {userToDelete && (
        <DeleteAccountDialog
          open={deleteUserDialogOpen}
          onOpenChange={setDeleteUserDialogOpen}
          userId={userToDelete.id}
          userName={`${userToDelete.firstName} ${userToDelete.lastName}`}
          isAdmin={true}
          onSuccess={() => {
            setUserToDelete(null);
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
          }}
        />
      )}

      {/* Delete Advertiser Confirmation Dialog */}
      <AlertDialog open={deleteAdvertiserDialogOpen} onOpenChange={setDeleteAdvertiserDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-advertiser">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertiser Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the advertiser account for{" "}
              <strong>
                {advertiserToDelete?.companyName}
              </strong>
              ? This will also delete all associated campaigns, ads, and payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-advertiser">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (advertiserToDelete) {
                  deleteAdvertiserMutation.mutate(advertiserToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAdvertiserMutation.isPending}
              data-testid="button-confirm-delete-advertiser"
            >
              {deleteAdvertiserMutation.isPending ? "Deleting..." : "Delete Advertiser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Campaign Dialog - Hoisted to root level for visibility */}
      <Dialog open={affiliateCampaignDialogOpen} onOpenChange={setAffiliateCampaignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="dialog-create-campaign">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-4 space-y-3">
            <div>
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input id="campaign-name" value={affiliateCampaignForm.name} onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, name: e.target.value})} placeholder="Campaign name" data-testid="input-campaign-name" />
            </div>
            <div>
              <Label htmlFor="campaign-description">Description</Label>
              <Input id="campaign-description" value={affiliateCampaignForm.description} onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, description: e.target.value})} placeholder="Campaign description" data-testid="input-campaign-description" />
            </div>
            <div>
              <Label htmlFor="campaign-objective">Objective</Label>
              <Input id="campaign-objective" value={affiliateCampaignForm.objective} onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, objective: e.target.value})} placeholder="Campaign objective" data-testid="input-campaign-objective" />
            </div>
            <div>
              <Label htmlFor="campaign-audience">Target Audience</Label>
              <Input id="campaign-audience" value={affiliateCampaignForm.targetAudience} onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, targetAudience: e.target.value})} placeholder="Target audience" data-testid="input-campaign-audience" />
            </div>
            <div>
              <Label htmlFor="campaign-budget">Budget (FCFA)</Label>
              <Input id="campaign-budget" type="number" value={affiliateCampaignForm.budget} onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, budget: e.target.value})} placeholder="Budget" data-testid="input-campaign-budget" />
            </div>

            <div className="border-t pt-3">
              <h3 className="text-sm font-semibold mb-2">Promotional Assets</h3>
              <p className="text-xs text-muted-foreground mb-3">Add promotional assets to your campaign. You can add more assets after creating the campaign.</p>
              
              <div>
                <Label htmlFor="promo-asset-title">Asset Title (Optional)</Label>
                <Input 
                  id="promo-asset-title" 
                  value={affiliateCampaignForm.promoAssetTitle || ''} 
                  onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, promoAssetTitle: e.target.value})} 
                  placeholder="e.g., Hero Banner 1200x630" 
                  data-testid="input-promo-asset-title" 
                />
              </div>

              <div className="mt-2">
                <Label htmlFor="promo-asset-type">Asset Type (Optional)</Label>
                <Select value={affiliateCampaignForm.promoAssetType || 'banner'} onValueChange={(value) => setAffiliateCampaignForm({...affiliateCampaignForm, promoAssetType: value})}>
                  <SelectTrigger id="promo-asset-type" data-testid="select-promo-asset-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="tracking_link">Tracking Link</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-2">
                <Label htmlFor="promo-asset-preview">Preview URL (Optional)</Label>
                <Input 
                  id="promo-asset-preview" 
                  value={affiliateCampaignForm.promoAssetPreviewUrl || ''} 
                  onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, promoAssetPreviewUrl: e.target.value})} 
                  placeholder="https://..." 
                  data-testid="input-promo-asset-preview" 
                />
              </div>

              <div className="mt-2">
                <Label htmlFor="promo-asset-download">Download URL (Optional)</Label>
                <Input 
                  id="promo-asset-download" 
                  value={affiliateCampaignForm.promoAssetDownloadUrl || ''} 
                  onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, promoAssetDownloadUrl: e.target.value})} 
                  placeholder="https://..." 
                  data-testid="input-promo-asset-download" 
                />
              </div>

              <div className="mt-2">
                <Label htmlFor="promo-asset-dimensions">Dimensions (Optional)</Label>
                <Input 
                  id="promo-asset-dimensions" 
                  value={affiliateCampaignForm.promoAssetDimensions || ''} 
                  onChange={(e) => setAffiliateCampaignForm({...affiliateCampaignForm, promoAssetDimensions: e.target.value})} 
                  placeholder="e.g., 1200x630" 
                  data-testid="input-promo-asset-dimensions" 
                />
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setAffiliateCampaignDialogOpen(false)} data-testid="button-cancel-campaign">Cancel</Button>
            <Button onClick={() => createAffiliateCampaignMutation.mutate(affiliateCampaignForm)} disabled={!affiliateCampaignForm.name || createAffiliateCampaignMutation.isPending} data-testid="button-confirm-campaign">{createAffiliateCampaignMutation.isPending ? "Creating..." : "Create Campaign"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Asset Dialog - Hoisted to root level for visibility */}
      <Dialog open={assetDialogOpen} onOpenChange={setAssetDialogOpen}>
        <DialogContent data-testid="dialog-add-asset">
          <DialogHeader>
            <DialogTitle>Add Marketing Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="asset-type">Asset Type</Label>
              <Select value={assetForm.type} onValueChange={(value) => setAssetForm({...assetForm, type: value})}>
                <SelectTrigger id="asset-type" data-testid="select-asset-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="tracking_link">Tracking Link</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="asset-title">Title</Label>
              <Input id="asset-title" value={assetForm.title} onChange={(e) => setAssetForm({...assetForm, title: e.target.value})} placeholder="Asset title" data-testid="input-asset-title" />
            </div>
            <div>
              <Label htmlFor="asset-description">Description</Label>
              <Input id="asset-description" value={assetForm.description} onChange={(e) => setAssetForm({...assetForm, description: e.target.value})} placeholder="Asset description" data-testid="input-asset-description" />
            </div>
            <div>
              <Label htmlFor="asset-download">Download URL</Label>
              <Input id="asset-download" value={assetForm.downloadUrl} onChange={(e) => setAssetForm({...assetForm, downloadUrl: e.target.value})} placeholder="https://..." data-testid="input-asset-download" />
            </div>
            <div>
              <Label htmlFor="asset-preview">Preview URL</Label>
              <Input id="asset-preview" value={assetForm.previewUrl} onChange={(e) => setAssetForm({...assetForm, previewUrl: e.target.value})} placeholder="https://..." data-testid="input-asset-preview" />
            </div>
            <div>
              <Label htmlFor="asset-dimensions">Dimensions (e.g., 1200x630)</Label>
              <Input id="asset-dimensions" value={assetForm.dimensions} onChange={(e) => setAssetForm({...assetForm, dimensions: e.target.value})} placeholder="1200x630" data-testid="input-asset-dimensions" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAssetDialogOpen(false)} data-testid="button-cancel-asset">Cancel</Button>
            <Button onClick={() => createAssetMutation.mutate(assetForm)} disabled={!assetForm.title || createAssetMutation.isPending} data-testid="button-confirm-asset">{createAssetMutation.isPending ? "Adding..." : "Add Asset"}</Button>
          </div>
        </DialogContent>
      </Dialog>
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
