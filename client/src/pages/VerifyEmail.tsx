import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

export default function VerifyEmail() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage(t('auth.verificationTokenMissing'));
        return;
      }

      try {
        const response = await apiRequest("/api/verify-email", "POST", { token });
        const data = await response.json();
        
        setStatus("success");
        setMessage(data.message || t('auth.emailVerifiedSuccess'));
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || t('auth.verificationError'));
      }
    };

    verifyEmail();
  }, [t]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <CardTitle>{t('auth.verifyingEmail')}</CardTitle>
              <CardDescription>
                {t('auth.verifyEmailWait')}
              </CardDescription>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-green-700">{t('auth.emailVerified')}</CardTitle>
              <CardDescription>
                {message}
              </CardDescription>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive">{t('auth.verificationFailed')}</CardTitle>
              <CardDescription>
                {message}
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="flex flex-col gap-3">
          {status === "success" && (
            <>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="w-full"
                data-testid="button-goto-dashboard"
              >
                {t('auth.goToDashboard')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-goto-home"
              >
                {t('auth.goToHome')}
              </Button>
            </>
          )}
          
          {status === "error" && (
            <>
              <Button
                onClick={() => setLocation("/dashboard")}
                className="w-full"
                data-testid="button-goto-dashboard-error"
              >
                {t('auth.goToDashboard')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="w-full"
                data-testid="button-goto-login"
              >
                {t('auth.goToLogin')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
