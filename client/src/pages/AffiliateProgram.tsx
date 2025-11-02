import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TopBar from "@/components/TopBar";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";
import { 
  Gift,
  UserPlus,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import type { Affiliate } from "@shared/schema";

const affiliateFormSchema = z.object({
  website: z.string().optional(),
  promotionMethod: z.string().min(10, "Please describe how you plan to promote KOSCOCO (minimum 10 characters)"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

type AffiliateFormData = z.infer<typeof affiliateFormSchema>;

export default function AffiliateProgram() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<AffiliateFormData>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: {
      website: "",
      promotionMethod: "",
      agreeToTerms: false
    }
  });

  const { data: affiliateStatus, isLoading: statusLoading } = useQuery<{
    isAffiliate: boolean;
    affiliate: Affiliate | null;
  }>({
    queryKey: ["/api/affiliate/status"],
    enabled: !!user,
  });

  const optInMutation = useMutation({
    mutationFn: async (data: AffiliateFormData) => {
      return await apiRequest("/api/affiliate/opt-in", "POST", data);
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

  const onSubmit = (data: AffiliateFormData) => {
    optInMutation.mutate(data);
  };

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
        <TopBar />
        <NavigationHeader 
          onUploadClick={() => setLocation("/upload")}
          onNavigate={(path) => setLocation(path)}
        />
        
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please log in to join our affiliate program
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button 
                onClick={() => setLocation("/login")} 
                className="w-full" 
                data-testid="button-login"
              >
                Log In to Continue
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => setLocation("/register")}
                  className="text-primary underline-offset-4 hover:underline"
                  data-testid="link-register"
                >
                  Register here
                </button>
              </p>
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
      <TopBar />
      <NavigationHeader 
        onUploadClick={() => setLocation("/upload")}
        onNavigate={(path) => setLocation(path)}
      />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-affiliate">
            Join the KOSCOCO Affiliate Program
          </h1>
          <p className="text-muted-foreground text-lg">
            Earn 20% commission by referring new participants to KOSCOCO
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">20% Commission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Earn 500 FCFA for every participant you refer (20% of 2,500 FCFA registration fee)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get your unique referral link and share it on social media, websites, or anywhere online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">Track Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Monitor your referrals and earnings in real-time through your affiliate dashboard
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>Fill out the form below to join the affiliate program (it's free!)</li>
                <li>Get your unique referral link from your affiliate dashboard</li>
                <li>Share your link with friends, followers, and your network</li>
                <li>Earn 500 FCFA commission for every participant who registers using your link</li>
                <li>Track all your referrals and earnings in your dashboard</li>
              </ol>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card data-testid="card-signup-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                Create Your Affiliate Account
              </CardTitle>
              <CardDescription>
                Fill in the details below to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* User Info - Auto-filled from auth */}
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          value={`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || ""} 
                          disabled 
                          data-testid="input-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Your name from your account
                      </FormDescription>
                    </FormItem>

                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          value={user.email || ""} 
                          disabled 
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormDescription>
                        Your email from your account
                      </FormDescription>
                    </FormItem>
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website or Social Media (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://yourwebsite.com or @yoursocialmedia" 
                            {...field}
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormDescription>
                          Where will you share your referral link? (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="promotionMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How Will You Promote KOSCOCO?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your promotion strategy (e.g., social media posts, blog articles, email newsletters, WhatsApp groups, etc.)"
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-promotion-method"
                          />
                        </FormControl>
                        <FormDescription>
                          Describe your plan to promote KOSCOCO to potential participants
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-terms"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to the{" "}
                            <a 
                              href="/affiliate-terms" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline" 
                              data-testid="link-affiliate-terms"
                            >
                              Affiliate Terms of Use
                            </a>
                          </FormLabel>
                          <FormDescription>
                            By joining the affiliate program, you agree to promote KOSCOCO ethically and follow our guidelines.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center pt-4">
                    <Button
                      type="submit"
                      disabled={optInMutation.isPending}
                      size="lg"
                      data-testid="button-submit-affiliate"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      {optInMutation.isPending ? "Creating Account..." : "Create Affiliate Account"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
