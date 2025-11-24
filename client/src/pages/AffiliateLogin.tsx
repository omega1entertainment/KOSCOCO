import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { SiFacebook, SiGoogle } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AffiliateLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/login", "POST", {
        email: loginEmail,
        password: loginPassword,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to your affiliate account.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/affiliate/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-['Bebas_Neue']">Affiliate Login</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Log in to your affiliate account and manage your referrals
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("auth.login")}</CardTitle>
              <CardDescription>
                Enter your credentials to access your affiliate dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t("auth.email")}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    data-testid="input-affiliate-login-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">{t("auth.password")}</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    data-testid="input-affiliate-login-password"
                  />
                </div>

                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-affiliate-login-submit"
                >
                  {loginMutation.isPending ? "Logging in..." : t("auth.login")}
                </Button>

                <div className="relative my-6">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                    {t("auth.orContinueWith")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = "/api/auth/google"}
                    data-testid="button-affiliate-google-login"
                    className="w-full"
                  >
                    <SiGoogle className="mr-2 h-4 w-4" />
                    {t("auth.google")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.href = "/api/auth/facebook"}
                    data-testid="button-affiliate-facebook-login"
                    className="w-full"
                  >
                    <SiFacebook className="mr-2 h-4 w-4" />
                    {t("auth.facebook")}
                  </Button>
                </div>

                <div className="text-center text-sm">
                  <p className="text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setLocation("/register")}
                      className="text-primary hover:underline font-medium"
                      data-testid="button-affiliate-signup-redirect"
                    >
                      Create one here
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/affiliate" className="text-sm text-muted-foreground hover:text-primary" data-testid="link-back-to-affiliate">
              ← Back to Affiliate Program
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
