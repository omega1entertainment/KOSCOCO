import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BarChart3, Users, TrendingUp, AlertTriangle, DollarSign, Mail, Settings, Target, Eye, CheckCircle, XCircle } from "lucide-react";

type AffiliateStats = {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  topAffiliates: Array<{ id: string; name: string; earnings: number; referrals: number }>;
  pendingPayouts: number;
  approvedPayouts: number;
};

export default function AdminAffiliateDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [commissionRate, setCommissionRate] = useState("20");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");

  const { data: stats } = useQuery<AffiliateStats>({
    queryKey: ["/api/admin/affiliates/stats"],
  });

  const { data: affiliates = [] } = useQuery({
    queryKey: ["/api/admin/affiliates"],
  });

  const { data: payoutRequests = [] } = useQuery({
    queryKey: ["/api/admin/payouts"],
  });

  const { data: fraudAlerts = [] } = useQuery({
    queryKey: ["/api/admin/fraud-alerts"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates/campaigns"] });
    },
    onError: (error) => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  const approvePayoutMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      return await apiRequest(`/api/admin/payouts/${payoutId}/approve`, "POST", {});
    },
    onSuccess: () => {
      toast({ title: "Payout approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
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
                  <div className="text-2xl font-bold">${((stats?.totalRevenue || 0) / 100).toFixed(2)}</div>
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
                  <p className="text-xs text-muted-foreground mt-1">{stats?.approvedPayouts || 0} approved</p>
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
                        <p className="font-bold">${(affiliate.earnings / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AFFILIATES TAB */}
          <TabsContent value="affiliates">
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
                          <h4 className="font-semibold">{aff.user?.firstName} {aff.user?.lastName}</h4>
                          <p className="text-sm text-muted-foreground">{aff.user?.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">Code: {aff.referralCode}</p>
                        </div>
                        <Badge variant={aff.status === "active" ? "default" : "destructive"}>{aff.status}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div><span className="text-muted-foreground">Referrals:</span> {aff.totalReferrals}</div>
                        <div><span className="text-muted-foreground">Earnings:</span> ${(aff.totalEarnings / 100).toFixed(2)}</div>
                        <div><span className="text-muted-foreground">Joined:</span> {new Date(aff.createdAt).toLocaleDateString()}</div>
                      </div>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns">
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
                  <Button onClick={() => createCampaignMutation.mutate()} disabled={createCampaignMutation.isPending}>
                    Create Campaign
                  </Button>
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
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <p className="font-medium">{alert.alertType}</p>
                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                            <Badge className="mt-2" variant={alert.severity === "high" ? "destructive" : "secondary"}>
                              {alert.severity}
                            </Badge>
                          </div>
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
                  {payoutRequests.map((request: any) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">${(request.amount / 100).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{request.paymentMethod} • {request.affiliate?.user?.firstName}</p>
                        </div>
                        <Badge variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}>
                          {request.status}
                        </Badge>
                      </div>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approvePayoutMutation.mutate(request.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
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
                  <Textarea placeholder="Email subject" />
                  <Textarea placeholder="Email message" className="min-h-32" />
                  <Button>Send to All Affiliates</Button>
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
                    <label className="text-sm font-medium">Minimum Withdrawal Amount ($)</label>
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
      </div>
    </div>
  );
}
