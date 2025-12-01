import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  CheckCircle,
  Wallet,
  Clock,
  XCircle,
  Shield
} from "lucide-react";
import { useState } from "react";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import type { Affiliate, Referral, PayoutRequest } from "@shared/schema";

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: affiliateStatus, isLoading: statusLoading } = useQuery<{
    isAffiliate: boolean;
    affiliate: Affiliate | null;
  }>({
    queryKey: ["/api/affiliate/status"],
    enabled: !!user,
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/affiliate/referrals"],
    enabled: !!user && affiliateStatus?.isAffiliate,
  });

  const { data: payoutData, isLoading: payoutLoading } = useQuery<{
    payoutRequests: PayoutRequest[];
    availableBalance: number;
    totalEarnings: number;
  }>({
    queryKey: ["/api/affiliate/payout/history"],
    enabled: !!user && affiliateStatus?.isAffiliate,
  });

  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [accountDetails, setAccountDetails] = useState("");

  const payoutMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethod: string; accountDetails: string }) => {
      return await apiRequest("/api/affiliate/payout/request", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: t('affiliate.toast.payoutRequested'),
        description: t('affiliate.toast.payoutRequestedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/payout/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/status"] });
      setPayoutDialogOpen(false);
      setPayoutAmount("");
      setPaymentMethod("");
      setAccountDetails("");
    },
    onError: (error: Error) => {
      toast({
        title: t('affiliate.toast.requestFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePayoutRequest = () => {
    const amount = parseInt(payoutAmount);
    if (!amount || amount <= 0) {
      toast({
        title: t('affiliate.toast.invalidAmount'),
        description: t('affiliate.toast.invalidAmountDescription'),
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: t('affiliate.toast.paymentMethodRequired'),
        description: t('affiliate.toast.paymentMethodRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    if (!accountDetails) {
      toast({
        title: t('affiliate.toast.accountDetailsRequired'),
        description: t('affiliate.toast.accountDetailsRequiredDescription'),
        variant: "destructive",
      });
      return;
    }

    payoutMutation.mutate({ amount, paymentMethod, accountDetails });
  };

  if (authLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('affiliate.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t('affiliate.auth.required')}</CardTitle>
            <CardDescription>
              {t('affiliate.auth.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => setLocation("/affiliate/login")} className="w-full" data-testid="button-login">
              {t('affiliate.auth.loginButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!affiliateStatus?.isAffiliate) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t('affiliate.notEnrolled.title')}</CardTitle>
            <CardDescription>
              {t('affiliate.notEnrolled.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => setLocation("/affiliate")} className="w-full" data-testid="button-enroll-redirect">
              {t('affiliate.notEnrolled.button')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const referralLink = affiliateStatus.affiliate?.referralCode 
    ? `${window.location.origin}/register?ref=${affiliateStatus.affiliate.referralCode}`
    : "";

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: t('affiliate.toast.copied'),
        description: t('affiliate.toast.copiedDescription'),
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const commissionRate = 0.20;
  const totalEarnings = affiliateStatus.affiliate?.totalEarnings || 0;
  const totalReferrals = affiliateStatus.affiliate?.totalReferrals || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard">{t('affiliate.dashboard')}</h1>
          <p className="text-muted-foreground">
            {t('affiliate.subtitle')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-stat-earnings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('affiliate.stats.totalEarnings')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEarnings.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">{(commissionRate * 100)}% {t('affiliate.stats.commissionRate')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-referrals">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('affiliate.stats.totalReferrals')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground">{t('affiliate.stats.peopleReferred')}</p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-pending">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('affiliate.stats.conversionRate')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalReferrals > 0 ? "100%" : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">{t('affiliate.stats.referralConversion')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card data-testid="card-referral-code">
            <CardHeader>
              <CardTitle>{t('affiliate.referralLink.title')}</CardTitle>
              <CardDescription>
                {t('affiliate.referralLink.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-referral-link"
                />
                <Button
                  onClick={copyReferralLink}
                  variant="outline"
                  data-testid="button-copy-link"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t('affiliate.referralLink.shareDescription')}
              </p>
            </CardContent>
          </Card>

          {/* Payout Section */}
          <Card data-testid="card-payout-balance">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('affiliate.balance.title')}</CardTitle>
                  <CardDescription>
                    {t('affiliate.balance.description')}
                  </CardDescription>
                </div>
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    {payoutData?.availableBalance?.toLocaleString() || '0'} FCFA
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('affiliate.balance.minimum')}
                  </p>
                </div>

                <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={(payoutData?.availableBalance || 0) < 5000}
                      data-testid="button-request-payout"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t('affiliate.balance.requestButton')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('affiliate.payout.dialogTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('affiliate.payout.dialogDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount">{t('affiliate.payout.amountLabel')}</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder={t('affiliate.payout.amountPlaceholder')}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          min="5000"
                          max={payoutData?.availableBalance || 0}
                          data-testid="input-payout-amount"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('affiliate.payout.available')} {payoutData?.availableBalance?.toLocaleString() || '0'} FCFA
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="payment-method">{t('affiliate.payout.paymentMethodLabel')}</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger id="payment-method" data-testid="select-payment-method">
                            <SelectValue placeholder={t('affiliate.payout.paymentMethodPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mobile Money">{t('affiliate.payout.mobileMoney')}</SelectItem>
                            <SelectItem value="Bank Transfer">{t('affiliate.payout.bankTransfer')}</SelectItem>
                            <SelectItem value="PayPal">{t('affiliate.payout.paypal')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="account-details">{t('affiliate.payout.accountDetailsLabel')}</Label>
                        <Textarea
                          id="account-details"
                          placeholder={t('affiliate.payout.accountDetailsPlaceholder')}
                          value={accountDetails}
                          onChange={(e) => setAccountDetails(e.target.value)}
                          rows={3}
                          data-testid="textarea-account-details"
                        />
                      </div>

                      <Button 
                        onClick={handlePayoutRequest} 
                        disabled={payoutMutation.isPending}
                        className="w-full"
                        data-testid="button-submit-payout"
                      >
                        {payoutMutation.isPending ? t('affiliate.payout.processing') : t('affiliate.payout.submitButton')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card data-testid="card-payout-history">
            <CardHeader>
              <CardTitle>{t('affiliate.payoutHistory.title')}</CardTitle>
              <CardDescription>
                {t('affiliate.payoutHistory.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : !payoutData?.payoutRequests || payoutData.payoutRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('affiliate.payoutHistory.empty')}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('affiliate.payoutHistory.emptyDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payoutData.payoutRequests.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`payout-${payout.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{payout.amount.toLocaleString()} FCFA</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.requestedAt).toLocaleDateString()} • {payout.paymentMethod}
                        </p>
                        {payout.status === 'rejected' && payout.rejectionReason && (
                          <p className="text-sm text-destructive mt-1">
                            {t('affiliate.payoutHistory.reason')} {payout.rejectionReason}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={
                          payout.status === 'approved' ? 'default' : 
                          payout.status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }
                        data-testid={`badge-status-${payout.id}`}
                      >
                        {payout.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {payout.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {payout.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {payout.status === 'pending' && t('affiliate.payoutHistory.statusPending')}
                        {payout.status === 'approved' && t('affiliate.payoutHistory.statusApproved')}
                        {payout.status === 'rejected' && t('affiliate.payoutHistory.statusRejected')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card data-testid="card-referrals">
            <CardHeader>
              <CardTitle>{t('affiliate.referrals.title')}</CardTitle>
              <CardDescription>
                {t('affiliate.referrals.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('affiliate.referrals.empty')}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('affiliate.referrals.emptyDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`referral-${referral.id}`}
                    >
                      <div>
                        <p className="font-medium">{t('affiliate.referrals.newReferral')}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString()} • 
                          {t('affiliate.referrals.commission')} {referral.commission.toLocaleString()} FCFA
                        </p>
                      </div>
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('affiliate.referrals.paid')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Settings - 2FA */}
          <div className="mt-8" data-testid="section-security">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Account Security
            </h2>
            <TwoFactorSettings userType="affiliate" />
          </div>
        </div>
      </main>
    </div>
  );
}
