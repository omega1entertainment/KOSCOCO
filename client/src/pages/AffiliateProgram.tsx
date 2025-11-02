import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import { 
  Gift,
  UserPlus
} from "lucide-react";
import type { Affiliate } from "@shared/schema";

export default function AffiliateProgram() {
  const { user, isLoading: authLoading, login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: affiliateStatus, isLoading: statusLoading } = useQuery<{
    isAffiliate: boolean;
    affiliate: Affiliate | null;
  }>({
    queryKey: ["/api/affiliate/status"],
    enabled: !!user,
  });

  const optInMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/affiliate/opt-in", "POST");
    },
    onSuccess: () => {
      toast({
        title: "Enrolled Successfully!",
        description: "You're now part of our affiliate program. Redirecting to your dashboard...",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/status"] });
      setTimeout(() => {
        setLocation("/affiliate/dashboard");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!statusLoading && affiliateStatus?.isAffiliate) {
      setLocation("/affiliate/dashboard");
    }
  }, [statusLoading, affiliateStatus, setLocation]);

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
      <div className="min-h-screen flex flex-col bg-background">
        <NavigationHeader 
          onUploadClick={() => setLocation("/upload")}
          onRegisterClick={() => setLocation("/register")}
          onLoginClick={() => window.location.href = "/api/login"}
          onNavigate={(path) => setLocation(path)}
        />
        
        <div className="flex-1 flex items-center justify-center px-4">
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
        
        <Footer />
      </div>
    );
  }

  if (affiliateStatus?.isAffiliate) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavigationHeader 
        onUploadClick={() => setLocation("/upload")}
        onRegisterClick={() => setLocation("/register")}
        onLoginClick={() => window.location.href = "/api/login"}
        onNavigate={(path) => setLocation(path)}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-affiliate">Affiliate Program</h1>
          <p className="text-muted-foreground">
            Earn 20% commission by referring new participants to KOSCOCO
          </p>
        </div>

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
      </main>

      <Footer />
    </div>
  );
}
