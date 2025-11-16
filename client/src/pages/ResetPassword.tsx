import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ResetPassword() {
  const { t } = useLanguage();
  const [, setLocationPath] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, []);

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/reset-password", "POST", {
        token,
        password,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.success'),
        description: data.message,
      });
      setTimeout(() => {
        setLocationPath("/login");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: t('auth.failed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: t('auth.missingToken'),
        description: t('auth.invalidResetToken'),
        variant: "destructive",
      });
      return;
    }

    if (!password || !confirmPassword) {
      toast({
        title: t('auth.missingInfo'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: t('auth.passwordsDontMatch'),
        description: t('auth.passwordsMatchError'),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t('auth.weakPassword'),
        description: t('auth.passwordMinLength'),
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" data-testid="link-back-to-login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.backToLogin')}
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 font-['Bebas_Neue']">{t('auth.resetPasswordTitle')}</h1>
            <p className="text-muted-foreground">
              {t('auth.enterNewPassword')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('auth.createNewPassword')}</CardTitle>
              <CardDescription>
                {t('auth.chooseStrongPassword')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.newPassword')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('auth.passwordPlaceholderSignup')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.passwordHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t('auth.reenterPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-reset-submit"
                >
                  {resetPasswordMutation.isPending ? t('auth.resetting') : t('auth.resetPassword')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
