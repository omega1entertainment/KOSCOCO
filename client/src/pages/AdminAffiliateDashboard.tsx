import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, TrendingUp, AlertTriangle, DollarSign, Mail, Settings, Target, Eye, CheckCircle, XCircle, Plus, Edit2, Lock } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type AffiliateStats = {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  topAffiliates: Array<{ id: string; name: string; earnings: number; referrals: number }>;
  pendingPayouts: number;
  approvedPayouts: number;
  pendingPayoutAmount: number;
  approvedPayoutAmount: number;
  paidPayoutAmount: number;
  geoBreakdown: Array<{ location: string; registrations: number }>;
};

export default function AdminAffiliateDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [commissionRate, setCommissionRate] = useState("20");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const { data: stats } = useQuery<AffiliateStats>({
    queryKey: ["/api/admin/affiliates/stats"],
  });

  const { data: affiliates = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliates"],
  });

  const { data: payoutRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/payout-requests"],
  });

  const { data: fraudAlerts = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/fraud-alerts"],
  });

  const { data: campaigns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/affiliate-campaigns"],
  });

  const { data: selectedAffiliateDetails } = useQuery({
    queryKey: ["/api/admin/affiliates", selectedAffiliateId],
    queryFn: () => fetch(`/api/admin/affiliates/${selectedAffiliateId}`).then(r => r.json()),
    enabled: !!selectedAffiliateId,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/affiliate-campaigns", "POST", {
        name: campaignName,
        description: campaignDesc,
        commissionPercentage: parseInt(commissionRate),
      });
    },
    onSuccess: () => {
      toast({ title: "Campaign created successfully" });
      setCampaignName("");
      setCampaignDesc("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliate-campaigns"] });
    },
    onError: (error) => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return await apiRequest(`/api/admin/payout-requests/${payoutId}/approve`, "PATCH", {});
    },
    onSuccess: () => {
      toast({ title: "Payout approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
    },
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async ({ payoutId, reason }: { payoutId: string; reason: string }) => {
      return await apiRequest(`/api/admin/payout-requests/${payoutId}/reject`, "PATCH", { rejectionReason: reason });
    },
    onSuccess: () => {
      toast({ title: "Payout rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-requests"] });
    },
  });

  const updateAffiliateStatusMutation = useMutation({
    mutationFn: async ({ affiliateId, status }: { affiliateId: string; status: string }) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      toast({ title: "Affiliate status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
  });

  const resolveFraudAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest(`/api/admin/fraud-alerts/${alertId}/resolve`, "PATCH", {});
    },
    onSuccess: () => {
      toast({ title: "Fraud alert resolved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fraud-alerts"] });
    },
  });

  const createAffiliateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/affiliates", "POST", {
        email: formEmail,
        firstName: formFirstName,
        lastName: formLastName,
      });
    },
    onSuccess: () => {
      toast({ title: "Affiliate created successfully" });
      setFormEmail("");
      setFormFirstName("");
      setFormLastName("");
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create affiliate", variant: "destructive" });
    },
  });

  const editAffiliateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/admin/affiliates/${editingAffiliateId}/edit`, "PATCH", {
        firstName: formFirstName,
        lastName: formLastName,
        email: formEmail,
      });
    },
    onSuccess: () => {
      toast({ title: "Affiliate updated successfully" });
      setFormEmail("");
      setFormFirstName("");
      setFormLastName("");
      setEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update affiliate", variant: "destructive" });
    },
  });

  const approveAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: string) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/approve`, "PATCH", {});
    },
    onSuccess: () => {
      toast({ title: "Affiliate approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
  });

  const blockAffiliateMutation = useMutation({
    mutationFn: async (affiliateId: string) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/block`, "PATCH", {});
    },
    onSuccess: () => {
      toast({ title: "Affiliate blocked" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
  });

  const updateCommissionMutation = useMutation({
    mutationFn: async ({ affiliateId, rate }: { affiliateId: string; rate: number }) => {
      return await apiRequest(`/api/admin/affiliates/${affiliateId}/commission`, "PATCH", { commissionRate: rate });
    },
    onSuccess: () => {
      toast({ title: "Commission rate updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to update commission", variant: "destructive" });
    },
  });

  const sendBulkCommunicationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/communications/send", "POST", {
        subject: emailSubject,
        message: emailMessage,
      });
    },
    onSuccess: () => {
      toast({ title: "Email sent to all affiliates" });
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to send email", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Affiliate Management</h1>
          <p className="text-muted-foreground">Manage affiliates, campaigns, payouts, and performance metrics</p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="affiliates" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Affiliates</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="fraud" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Fraud</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Payouts</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Comms</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Affiliates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAffiliates || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.activeAffiliates || 0} active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(stats?.totalRevenue || 0).toLocaleString()} XAF</div>
                  <p className="text-xs text-muted-foreground mt-1">from referrals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalConversions || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stats?.totalClicks || 0} clicks</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingPayouts || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">{(stats?.pendingPayoutAmount || 0).toLocaleString()} XAF</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Payout Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="font-medium">{stats?.pendingPayouts || 0} ({(stats?.pendingPayoutAmount || 0).toLocaleString()} XAF)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-medium">{stats?.approvedPayouts || 0} ({(stats?.approvedPayoutAmount || 0).toLocaleString()} XAF)</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-bold text-green-600">{(stats?.paidPayoutAmount || 0).toLocaleString()} XAF</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Top Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.geoBreakdown?.map((location: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{location.location}</span>
                        <Badge variant="outline">{location.registrations} reg.</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Traffic Sources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Clicks</span>
                      <span className="font-medium">{stats?.totalClicks || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conversions</span>
                      <span className="font-medium">{stats?.totalConversions || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span>Conversion Rate</span>
                      <span className="font-bold">{stats?.totalClicks ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Affiliates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topAffiliates?.map((affiliate, idx) => (
                    <div key={affiliate.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{idx + 1}</Badge>
                        <div>
                          <p className="font-medium">{affiliate.name}</p>
                          <p className="text-sm text-muted-foreground">{affiliate.referrals} referrals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{affiliate.earnings.toLocaleString()} XAF</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AFFILIATES TAB */}
          <TabsContent value="affiliates">
            <div className="space-y-4">
              <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-affiliate"><Plus className="w-4 h-4 mr-2" />Add Affiliate</Button>
              <Card>
                <CardHeader>
                  <CardTitle>Affiliate Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {affiliates.map((aff: any) => (
                      <div key={aff.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{aff.first_name} {aff.last_name}</h4>
                            <p className="text-sm text-muted-foreground">{aff.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">Code: {aff.referral_code}</p>
                          </div>
                          <Badge variant={aff.status === "active" ? "default" : "destructive"}>{aff.status}</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                          <div><span className="text-muted-foreground">Referrals:</span> {aff.total_referrals}</div>
                          <div><span className="text-muted-foreground">Earnings:</span> {aff.total_earnings.toLocaleString()} XAF</div>
                          <div><span className="text-muted-foreground">Commission:</span> {aff.commission_rate || 20}%</div>
                          <div><span className="text-muted-foreground">Joined:</span> {new Date(aff.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAffiliateId(aff.id); setDetailsDialogOpen(true); }} data-testid={`button-view-details-${aff.id}`}>View Details</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditingAffiliateId(aff.id); setFormEmail(aff.email); setFormFirstName(aff.first_name); setFormLastName(aff.last_name); setEditDialogOpen(true); }} data-testid={`button-edit-${aff.id}`}><Edit2 className="w-4 h-4 mr-1" />Edit</Button>
                          <div className="flex items-center gap-1">
                            <Input type="number" min="0" max="100" defaultValue={aff.commission_rate || 20} className="w-16 h-8" id={`rate-${aff.id}`} data-testid={`input-commission-${aff.id}`} />
                            <Button size="sm" variant="outline" onClick={() => { const val = (document.getElementById(`rate-${aff.id}`) as HTMLInputElement).value; updateCommissionMutation.mutate({ affiliateId: aff.id, rate: parseInt(val) }); }} data-testid={`button-set-commission-${aff.id}`}>Set</Button>
                          </div>
                          {aff.status !== "approved" && <Button size="sm" variant="outline" onClick={() => approveAffiliateMutation.mutate(aff.id)} data-testid={`button-approve-${aff.id}`}><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>}
                          {aff.status !== "blocked" && <Button size="sm" variant="destructive" onClick={() => blockAffiliateMutation.mutate(aff.id)} data-testid={`button-block-${aff.id}`}><Lock className="w-4 h-4 mr-1" />Block</Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input placeholder="Campaign name" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
                  <Textarea placeholder="Campaign description" value={campaignDesc} onChange={(e) => setCampaignDesc(e.target.value)} />
                  <div>
                    <label className="text-sm font-medium">Commission Rate (%)</label>
                    <Input type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} />
                  </div>
                  <Button onClick={() => createCampaignMutation.mutate()} disabled={createCampaignMutation.isPending || !campaignName || !commissionRate}>
                    {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No campaigns created yet</p>
                  ) : (
                    campaigns.map((campaign: any) => (
                      <div key={campaign.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.description}</p>
                            <Badge variant="outline" className="mt-2">{campaign.commission_percentage}% commission</Badge>
                          </div>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"}>{campaign.status}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FRAUD TAB */}
          <TabsContent value="fraud">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fraudAlerts.length === 0 ? (
                    <p className="text-muted-foreground">No fraud alerts detected</p>
                  ) : (
                    fraudAlerts.map((alert: any) => (
                      <div key={alert.id} className="p-4 border rounded-lg border-destructive/50">
                        <div className="flex items-start gap-3 justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
                            <div>
                              <p className="font-medium">{alert.alert_type}</p>
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">{alert.first_name} {alert.last_name} ({alert.email})</p>
                              <Badge className="mt-2" variant={alert.severity === "high" ? "destructive" : "secondary"}>
                                {alert.severity}
                              </Badge>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => resolveFraudAlertMutation.mutate(alert.id)}>
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PAYOUTS TAB */}
          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payout Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutRequests.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No payout requests</p>
                  ) : (
                    payoutRequests.map((request: any) => (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{request.amount.toLocaleString()} XAF</p>
                            <p className="text-sm text-muted-foreground">{request.payment_method} • {request.first_name} {request.last_name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{request.email}</p>
                          </div>
                          <Badge variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}>
                            {request.status}
                          </Badge>
                        </div>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approvePayoutMutation.mutate(request.id)} disabled={approvePayoutMutation.isPending}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectPayoutMutation.mutate({ payoutId: request.id, reason: "Administrative decision" })} disabled={rejectPayoutMutation.isPending}>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMMUNICATIONS TAB */}
          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Subject</label>
                    <Input 
                      placeholder="Enter email subject" 
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      data-testid="input-email-subject"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email Message</label>
                    <div className="border rounded-md bg-white overflow-hidden" data-testid="editor-email-message">
                      <ReactQuill 
                        theme="snow" 
                        value={emailMessage} 
                        onChange={setEmailMessage}
                        placeholder="Write your email message here..."
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={() => sendBulkCommunicationMutation.mutate()}
                    disabled={sendBulkCommunicationMutation.isPending || !emailSubject || !emailMessage}
                    data-testid="button-send-bulk-email"
                  >
                    {sendBulkCommunicationMutation.isPending ? "Sending..." : "Send to All Affiliates"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Affiliate Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Default Commission Rate (%)</label>
                    <Input type="number" placeholder="20" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minimum Withdrawal Amount (XAF)</label>
                    <Input type="number" placeholder="25" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Methods</label>
                    <div className="space-y-2 mt-2">
                      {["Bank Transfer", "PayPal", "Mobile Money", "Crypto"].map((method) => (
                        <div key={method} className="flex items-center gap-2">
                          <input type="checkbox" id={method} defaultChecked />
                          <label htmlFor={method}>{method}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Affiliate Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-add-affiliate">
            <DialogHeader>
              <DialogTitle>Add New Affiliate</DialogTitle>
              <DialogDescription>Create a new affiliate account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="affiliate@example.com" data-testid="input-add-email" />
              </div>
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="John" data-testid="input-add-firstname" />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Doe" data-testid="input-add-lastname" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createAffiliateMutation.mutate()} disabled={createAffiliateMutation.isPending || !formEmail || !formFirstName || !formLastName} data-testid="button-create-affiliate">{createAffiliateMutation.isPending ? "Creating..." : "Create Affiliate"}</Button>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Affiliate Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md" data-testid="dialog-edit-affiliate">
            <DialogHeader>
              <DialogTitle>Edit Affiliate</DialogTitle>
              <DialogDescription>Update affiliate details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="affiliate@example.com" data-testid="input-edit-email" />
              </div>
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input value={formFirstName} onChange={(e) => setFormFirstName(e.target.value)} placeholder="John" data-testid="input-edit-firstname" />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input value={formLastName} onChange={(e) => setFormLastName(e.target.value)} placeholder="Doe" data-testid="input-edit-lastname" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => editAffiliateMutation.mutate()} disabled={editAffiliateMutation.isPending || !formEmail || !formFirstName || !formLastName} data-testid="button-update-affiliate">{editAffiliateMutation.isPending ? "Updating..." : "Update Affiliate"}</Button>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Affiliate Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-affiliate-details">
            <DialogHeader>
              <DialogTitle>Affiliate Details</DialogTitle>
              <DialogDescription>
                Complete information for the selected affiliate
              </DialogDescription>
            </DialogHeader>
            {selectedAffiliateDetails ? (
              <div className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedAffiliateDetails.first_name} {selectedAffiliateDetails.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedAffiliateDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedAffiliateDetails.location || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Referral Code</p>
                      <p className="font-medium font-mono">{selectedAffiliateDetails.referral_code}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm text-muted-foreground">Total Referrals</p>
                      <p className="text-2xl font-bold">{selectedAffiliateDetails.total_referrals}</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                      <p className="text-2xl font-bold">{selectedAffiliateDetails.total_earnings.toLocaleString()} XAF</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm text-muted-foreground">Pending Payouts</p>
                      <p className="text-2xl font-bold">{selectedAffiliateDetails.pending_payouts}</p>
                    </div>
                    <div className="p-3 bg-muted rounded">
                      <p className="text-sm text-muted-foreground">Total Paid Out</p>
                      <p className="text-2xl font-bold">{selectedAffiliateDetails.total_paid_out.toLocaleString()} XAF</p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div>
                  <h3 className="font-semibold mb-2 text-sm">Account Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className="mt-1" variant={selectedAffiliateDetails.status === "active" ? "default" : "destructive"}>
                        {selectedAffiliateDetails.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joined Date</p>
                      <p className="font-medium">{new Date(selectedAffiliateDetails.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Referrals List */}
                {selectedAffiliateDetails.referrals && selectedAffiliateDetails.referrals.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Recent Referrals</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {selectedAffiliateDetails.referrals.map((referral: any) => (
                        <div key={referral.id} className="p-2 border rounded text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{referral.first_name} {referral.last_name}</p>
                              <p className="text-xs text-muted-foreground">{referral.email}</p>
                            </div>
                            <Badge variant="outline">{referral.commission.toLocaleString()} XAF</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(referral.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payout Requests */}
                {selectedAffiliateDetails.payoutRequests && selectedAffiliateDetails.payoutRequests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Payout Requests</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {selectedAffiliateDetails.payoutRequests.map((payout: any) => (
                        <div key={payout.id} className="p-2 border rounded text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{payout.amount.toLocaleString()} XAF</p>
                              <p className="text-xs text-muted-foreground">{payout.payment_method}</p>
                            </div>
                            <Badge variant={payout.status === "pending" ? "secondary" : payout.status === "approved" ? "default" : "destructive"}>
                              {payout.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{new Date(payout.requested_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading details...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
