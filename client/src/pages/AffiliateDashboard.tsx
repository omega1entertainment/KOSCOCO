import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import TopBar from "@/components/TopBar";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  CheckCircle
} from "lucide-react";
import { useState } from "react";
import type { Affiliate, Referral } from "@shared/schema";

export default function AffiliateDashboard() {
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

  if (authLoading || statusLoading) {
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
              Please log in to access your affiliate dashboard
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

  if (!affiliateStatus?.isAffiliate) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Enrolled</CardTitle>
            <CardDescription>
              You need to enroll in the affiliate program first
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => setLocation("/affiliate")} className="w-full" data-testid="button-enroll-redirect">
              Go to Enrollment Page
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
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const commissionRate = 0.20;
  const totalEarnings = affiliateStatus.affiliate?.totalEarnings || 0;
  const totalReferrals = affiliateStatus.affiliate?.totalReferrals || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <NavigationHeader 
        onUploadClick={() => setLocation("/upload")}
        onNavigate={(path) => setLocation(path)}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-dashboard">Affiliate Dashboard</h1>
          <p className="text-muted-foreground">
            Track your referrals and earnings
          </p>
        </div>

        <div className="space-y-8">
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-stat-earnings">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalEarnings.toLocaleString()} FCFA</div>
                <p className="text-xs text-muted-foreground">{(commissionRate * 100)}% commission rate</p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-referrals">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReferrals}</div>
                <p className="text-xs text-muted-foreground">People you've referred</p>
              </CardContent>
            </Card>

            <Card data-testid="card-stat-pending">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalReferrals > 0 ? "100%" : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Referral conversion</p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card data-testid="card-referral-code">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link with others to earn commission
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
                Share this link on social media, with friends, or anywhere you promote KOSCOCO
              </p>
            </CardContent>
          </Card>

          {/* Referrals List */}
          <Card data-testid="card-referrals">
            <CardHeader>
              <CardTitle>Your Referrals</CardTitle>
              <CardDescription>
                People who registered using your code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No referrals yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start sharing your referral code to earn commissions!
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
                        <p className="font-medium">New Referral</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(referral.createdAt).toLocaleDateString()} • 
                          Commission: {referral.commission.toLocaleString()} FCFA
                        </p>
                      </div>
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
