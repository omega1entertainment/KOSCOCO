import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type AdvertiserAccount = {
  id: string;
  email: string;
  companyName: string;
  status: string;
  walletBalance: number;
  totalSpent: number;
};

export default function Advertise() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Check if user has advertiser account
  const { data: advertiser, isLoading: advertiserLoading } = useQuery<AdvertiserAccount | null>({
    queryKey: ["/api/advertiser/current"],
    enabled: !!user,
    retry: false,
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Grow Your Business with KOSCOCO Advertising</h1>
            <p className="text-xl text-muted-foreground">
              Reach millions of video enthusiasts and contestants in Cameroon
            </p>
          </div>

          <Card className="mb-8 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Login Required
              </CardTitle>
              <CardDescription>
                You need to be logged in to access advertising features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Create an account or log in to start advertising on KOSCOCO. Your advertiser account is completely
                separate from your creator account.
              </p>
              <div className="flex gap-4">
                <Button onClick={() => setLocation("/advertiser/login")} className="flex-1">
                  Login
                </Button>
                <Button onClick={() => setLocation("/advertiser/signup")} variant="outline" className="flex-1">
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Targeted Reach
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Target videos by category, subcategory, or audience demographics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Real-Time Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track impressions, clicks, and ROI with detailed performance metrics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Setup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create campaigns and launch ads in minutes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  5 Ad Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  In-stream, overlay banners, and more to suit your needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated - check if they have advertiser account
  if (advertiserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading advertiser account...</p>
        </div>
      </div>
    );
  }

  // User has advertiser account
  if (advertiser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold">Advertiser Dashboard</h1>
              <Badge
                variant={advertiser.status === "approved" ? "default" : "secondary"}
                className="text-base px-4 py-2"
              >
                {advertiser.status === "approved" && <CheckCircle className="h-4 w-4 mr-2" />}
                {advertiser.status.charAt(0).toUpperCase() + advertiser.status.slice(1)}
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground">
              Welcome back, {advertiser.companyName}
            </p>
          </div>

          {/* Account Status Alert */}
          {advertiser.status !== "approved" && (
            <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                  <Clock className="h-5 w-5" />
                  Account Pending Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="text-yellow-800 dark:text-yellow-200">
                <p>
                  Your advertiser account is under review. You'll be able to create campaigns once it's verified.
                  This usually takes 1-2 business days.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  FCFA {advertiser.walletBalance.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  FCFA {advertiser.totalSpent.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          {advertiser.status === "approved" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setLocation("/advertiser/dashboard")}
                size="lg"
                className="h-12"
                data-testid="button-go-to-dashboard"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Button>
              <Button
                onClick={() => setLocation("/advertiser/campaign/create")}
                size="lg"
                variant="outline"
                className="h-12"
                data-testid="button-create-campaign"
              >
                <Zap className="h-5 w-5 mr-2" />
                Create Campaign
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User is authenticated but has no advertiser account
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Ready to Advertise on KOSCOCO?</h1>
          <p className="text-xl text-muted-foreground">
            Your advertiser account is separate from your creator account
          </p>
        </div>

        {/* Why Advertise */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why Advertise on KOSCOCO?</CardTitle>
            <CardDescription>
              Reach engaged video creators and viewers across Cameroon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Target millions of active video viewers and creators</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>5 different ad types to match your marketing goals</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Real-time analytics and performance tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Category and demographic-based targeting</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Flexible budgets and wallet-based payments</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Get Started with Advertising
            </CardTitle>
            <CardDescription>
              Create your advertiser account in minutes and start reaching customers today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Step 1: Create Account</h4>
                <p className="text-sm text-muted-foreground">
                  Set up your advertiser profile with company details
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 2: Get Verified</h4>
                <p className="text-sm text-muted-foreground">
                  Our team reviews and approves your account (1-2 business days)
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 3: Add Funds</h4>
                <p className="text-sm text-muted-foreground">
                  Top up your wallet to start creating campaigns
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Step 4: Launch Ads</h4>
                <p className="text-sm text-muted-foreground">
                  Create campaigns and launch ads to reach your audience
                </p>
              </div>
            </div>

            <Button
              onClick={() => setLocation("/advertiser/signup")}
              size="lg"
              className="w-full h-12"
              data-testid="button-create-advertiser-account"
            >
              <Zap className="h-5 w-5 mr-2" />
              Create Advertiser Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
