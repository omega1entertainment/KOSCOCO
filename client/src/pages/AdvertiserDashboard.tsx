import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  LogOut, 
  BarChart3, 
  PlaySquare, 
  Wallet, 
  Settings, 
  Plus,
  Eye,
  MousePointerClick,
  TrendingUp,
  Loader2
} from "lucide-react";

export default function AdvertiserDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: advertiser, isLoading: isLoadingAdvertiser } = useQuery({
    queryKey: ["/api/advertiser/me"],
  });

  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ["/api/advertiser/campaigns"],
    enabled: !!advertiser,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/advertiser/stats"],
    enabled: !!advertiser,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/advertiser/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Logout failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged out successfully",
      });
      setLocation("/advertiser/login");
    },
  });

  if (isLoadingAdvertiser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!advertiser) {
    setLocation("/advertiser/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-company-name">
                  {advertiser.companyName}
                </h1>
                <p className="text-sm text-muted-foreground">{advertiser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={advertiser.status === 'active' ? 'default' : 'secondary'}
                data-testid="badge-status"
              >
                {advertiser.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" data-testid="tab-campaigns">
              <PlaySquare className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="payments" data-testid="tab-payments">
              <Wallet className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Analytics Overview</h2>
              </div>

              {isLoadingStats ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 bg-muted rounded w-24 animate-pulse" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-impressions">
                        {stats?.totalImpressions?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                      <MousePointerClick className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-clicks">
                        {stats?.totalClicks?.toLocaleString() || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-ctr">
                        {stats?.ctr || '0.00'}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-spend">
                        {stats?.totalSpend?.toLocaleString() || 0} XAF
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>
                    Your currently running advertising campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingCampaigns ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="text-center py-8">
                      <PlaySquare className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground mb-4">No campaigns yet</p>
                      <Button onClick={() => setActiveTab("campaigns")} data-testid="button-create-first-campaign">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Campaign
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.slice(0, 5).map((campaign: any) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                        >
                          <div>
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">{campaign.objective}</p>
                          </div>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">Campaigns</h2>
                <Button onClick={() => setLocation("/advertiser/campaign/create")} data-testid="button-create-campaign">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              {isLoadingCampaigns ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <PlaySquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Create your first campaign to start advertising on KOSCOCO
                      </p>
                      <Button onClick={() => setLocation("/advertiser/campaign/create")} data-testid="button-create-first">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {campaigns.map((campaign: any) => (
                    <Card key={campaign.id} className="hover-elevate cursor-pointer">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{campaign.name}</CardTitle>
                            <CardDescription className="mt-1">{campaign.objective}</CardDescription>
                          </div>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-semibold">{campaign.budget?.toLocaleString()} XAF</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Spent</p>
                            <p className="font-semibold">{campaign.spent?.toLocaleString() || 0} XAF</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Duration</p>
                            <p className="font-semibold">
                              {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your advertising payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No payments yet</h3>
                  <p className="text-muted-foreground">
                    Your payment history will appear here once you start running campaigns
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your advertiser account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Company Name</label>
                    <p className="text-muted-foreground">{advertiser.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-muted-foreground">{advertiser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Name</label>
                    <p className="text-muted-foreground">{advertiser.contactName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Business Type</label>
                    <p className="text-muted-foreground">{advertiser.businessType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Country</label>
                    <p className="text-muted-foreground">{advertiser.country}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
