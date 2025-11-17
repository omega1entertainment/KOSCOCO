import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Loader2,
  Edit,
  Trash2,
  Play,
  Pause,
  CreditCard,
  ArrowUpCircle
} from "lucide-react";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export default function AdvertiserDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const { data: payments = [], isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/advertiser/wallet/payments"],
    enabled: !!advertiser,
  });

  const loadFlutterwaveScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.FlutterwaveCheckout) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Flutterwave'));
      document.body.appendChild(script);
    });
  };

  const initiateTopupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("/api/advertiser/wallet/topup/initiate", "POST", { amount });
      return response.json();
    },
    onSuccess: async (data) => {
      try {
        setIsProcessingPayment(true);
        
        await loadFlutterwaveScript();
        
        // Close the top-up dialog before opening Flutterwave
        setTopupDialogOpen(false);

        const modal = window.FlutterwaveCheckout({
          public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || '',
          tx_ref: data.txRef,
          amount: data.amount,
          currency: 'XAF',
          payment_options: 'card,mobilemoney,ussd',
          customer: {
            email: data.customer.email,
            phone_number: data.customer.phone,
            name: data.customer.name,
          },
          customizations: {
            title: 'KOSCOCO Advertiser Wallet Top-up',
            description: `Top-up ${data.amount.toLocaleString()} XAF`,
            logo: '',
          },
          callback: async (response: any) => {
            console.log("Payment callback:", response);
            modal.close();
            
            if (response.status === "successful") {
              try {
                const verifyResponse = await apiRequest("/api/advertiser/wallet/topup/callback", "POST", {
                  txRef: data.txRef,
                  transactionId: response.transaction_id,
                });

                const verifyData = await verifyResponse.json();

                if (verifyResponse.ok && verifyData.success) {
                  toast({
                    title: "Top-up Successful!",
                    description: `${verifyData.amount.toLocaleString()} XAF has been added to your wallet.`,
                  });
                  setTopupAmount("");
                  
                  // Invalidate queries to refresh data
                  queryClient.invalidateQueries({ queryKey: ["/api/advertiser/me"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/advertiser/wallet/payments"] });
                } else {
                  toast({
                    title: "Verification Pending",
                    description: "Your payment is being verified. Balance will be updated shortly.",
                  });
                }
              } catch (error) {
                console.error("Verification error:", error);
                toast({
                  title: "Verification Pending",
                  description: "Your payment is being verified. Balance will be updated shortly.",
                });
              } finally {
                setIsProcessingPayment(false);
              }
            } else {
              toast({
                title: "Payment Failed",
                description: "Your payment was not successful. Please try again.",
                variant: "destructive",
              });
              setIsProcessingPayment(false);
            }
          },
          onclose: () => {
            console.log("Payment modal closed - user cancelled or closed");
            setIsProcessingPayment(false);
            // Don't reopen dialog - user intentionally closed payment
          },
        });
      } catch (error) {
        console.error("Error loading Flutterwave:", error);
        toast({
          title: "Error",
          description: "Failed to load payment gateway. Please try again.",
          variant: "destructive",
        });
        setIsProcessingPayment(false);
        setTopupDialogOpen(true);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to initiate payment",
        description: error.message,
        variant: "destructive",
      });
      setTopupDialogOpen(false);
      setIsProcessingPayment(false);
    },
  });

  const handleTopupSubmit = () => {
    const amount = parseFloat(topupAmount);
    
    if (!amount || amount < 1000) {
      toast({
        title: "Invalid Amount",
        description: "Minimum top-up amount is 1,000 XAF",
        variant: "destructive",
      });
      return;
    }

    if (amount > 10000000) {
      toast({
        title: "Invalid Amount",
        description: "Maximum top-up amount is 10,000,000 XAF",
        variant: "destructive",
      });
      return;
    }

    initiateTopupMutation.mutate(amount);
  };

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

  const deleteCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest(`/api/advertiser/campaigns/${campaignId}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertiser/campaigns"] });
      toast({
        title: "Campaign deleted",
        description: "The campaign and all its ads have been removed.",
      });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleCampaignStatusMutation = useMutation({
    mutationFn: async ({ campaignId, newStatus }: { campaignId: string; newStatus: string }) => {
      return await apiRequest(`/api/advertiser/campaigns/${campaignId}`, "PATCH", { status: newStatus });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertiser/campaigns"] });
      const statusLabel = variables.newStatus === 'active' ? 'activated' : variables.newStatus === 'paused' ? 'paused' : 'set to draft';
      toast({
        title: "Campaign status updated",
        description: `Campaign ${statusLabel} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update campaign status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      deleteCampaignMutation.mutate(campaignToDelete);
    }
  };

  const handleToggleCampaignStatus = (campaignId: string, currentStatus: string) => {
    let newStatus = 'draft';
    if (currentStatus === 'draft') {
      newStatus = 'active';
    } else if (currentStatus === 'active') {
      newStatus = 'paused';
    } else if (currentStatus === 'paused') {
      newStatus = 'active';
    }
    toggleCampaignStatusMutation.mutate({ campaignId, newStatus });
  };

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
                    <Card key={campaign.id} className="hover-elevate">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle>{campaign.name}</CardTitle>
                            <CardDescription className="mt-1">{campaign.objective}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                              {campaign.status}
                            </Badge>
                            <Button
                              variant={campaign.status === 'active' ? 'default' : 'outline'}
                              size="icon"
                              onClick={() => handleToggleCampaignStatus(campaign.id, campaign.status)}
                              disabled={toggleCampaignStatusMutation.isPending}
                              title={campaign.status === 'active' ? 'Pause campaign' : 'Activate campaign'}
                              data-testid={`button-toggle-campaign-${campaign.id}`}
                            >
                              {campaign.status === 'active' ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/advertiser/campaign/${campaign.id}/edit`)}
                              data-testid={`button-edit-campaign-${campaign.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(campaign.id)}
                              data-testid={`button-delete-campaign-${campaign.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
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
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setLocation(`/advertiser/campaign/${campaign.id}/create-ad`)}
                          data-testid={`button-manage-ads-${campaign.id}`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ads
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <div className="space-y-6">
              {/* Wallet Balance Card */}
              <Card data-testid="card-wallet-balance">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Wallet Balance</CardTitle>
                      <CardDescription>
                        Manage your advertising budget
                      </CardDescription>
                    </div>
                    <Wallet className="h-8 w-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-4xl font-bold" data-testid="text-wallet-balance">
                        {advertiser?.walletBalance?.toLocaleString() || '0'} XAF
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Available for advertising campaigns
                      </p>
                    </div>

                    <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full" 
                          disabled={isProcessingPayment}
                          data-testid="button-topup-wallet"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle className="w-4 h-4 mr-2" />
                              Top Up Wallet
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Top Up Wallet</DialogTitle>
                          <DialogDescription>
                            Add funds to your advertising wallet using mobile money or card
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="topup-amount">Amount (XAF)</Label>
                            <Input
                              id="topup-amount"
                              type="number"
                              placeholder="Enter amount"
                              value={topupAmount}
                              onChange={(e) => setTopupAmount(e.target.value)}
                              min="1000"
                              max="10000000"
                              data-testid="input-topup-amount"
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Minimum: 1,000 XAF | Maximum: 10,000,000 XAF
                            </p>
                          </div>

                          <Button 
                            onClick={handleTopupSubmit}
                            disabled={initiateTopupMutation.isPending || isProcessingPayment}
                            className="w-full"
                            data-testid="button-submit-topup"
                          >
                            {initiateTopupMutation.isPending || isProcessingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Proceed to Payment
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>View your wallet top-up transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No payments yet</h3>
                      <p className="text-muted-foreground">
                        Your payment history will appear here after you top up your wallet
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {payment.paymentType === 'wallet_topup' ? 'Wallet Top-up' : payment.paymentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {payment.amount.toLocaleString()} XAF
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    payment.status === 'successful' ? 'default' : 
                                    payment.status === 'pending' ? 'secondary' : 
                                    'destructive'
                                  }
                                  data-testid={`badge-status-${payment.id}`}
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-muted-foreground">
                                {payment.txRef}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

      {/* Delete Campaign Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign and all associated ads. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteCampaignMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteCampaignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
