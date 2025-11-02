import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  CheckCircle,
  Gift,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import type { Affiliate, Referral } from "@shared/schema";

export default function AffiliateProgram() {
  const { user, isLoading: authLoading, login } = useAuth();
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

  const optInMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/affiliate/opt-in", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Enrolled Successfully!",
        description: "You're now part of our affiliate program. Start sharing your referral code!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
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
              Please log in to access the affiliate program
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

  const copyReferralCode = () => {
    if (affiliateStatus?.affiliate?.referralCode) {
      navigator.clipboard.writeText(affiliateStatus.affiliate.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const commissionRate = 0.20; // 20%
  const totalEarnings = affiliateStatus?.affiliate?.totalEarnings || 0;
  const totalReferrals = affiliateStatus?.affiliate?.totalReferrals || 0;

  const isLoading = statusLoading || referralsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-affiliate">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Earn 20% commission by referring new participants to KOSCOCO
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        ) : !affiliateStatus?.isAffiliate ? (
          <div className="max-w-4xl mx-auto">
            <Card data-testid="card-opt-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-6 w-6" />
                  Join Our Affiliate Program
                </CardTitle>
                <CardDescription>
                  Earn commission by sharing KOSCOCO with your network
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">20% Commission</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Earn 20% of every registration fee from your referrals
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Easy Sharing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Get your unique referral code and share it anywhere
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Track Earnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Monitor your referrals and earnings in real-time
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-muted p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">How It Works</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Enroll in the affiliate program (it's free!)</li>
                    <li>Share your unique referral code with friends and followers</li>
                    <li>When they register using your code, you earn 20% commission</li>
                    <li>Watch your earnings grow as more people join through your link</li>
                  </ol>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => optInMutation.mutate()}
                    disabled={optInMutation.isPending}
                    size="lg"
                    data-testid="button-opt-in"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    {optInMutation.isPending ? "Enrolling..." : "Enroll Now"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
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

            {/* Referral Code */}
            <Card data-testid="card-referral-code">
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
                <CardDescription>
                  Share this code with others to earn commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={affiliateStatus.affiliate?.referralCode || ""}
                    readOnly
                    className="font-mono text-lg"
                    data-testid="input-referral-code"
                  />
                  <Button
                    onClick={copyReferralCode}
                    variant="outline"
                    data-testid="button-copy-code"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this code on social media, with friends, or anywhere you promote KOSCOCO
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
                {referrals.length === 0 ? (
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
        )}
      </main>

      <Footer />
    </div>
  );
}
