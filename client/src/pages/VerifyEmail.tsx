import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing from the URL.");
        return;
      }

      try {
        const response = await apiRequest("/api/verify-email", "POST", { token });
        const data = await response.json();
        
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "Failed to verify email. The link may be invalid or expired.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying Email...</CardTitle>
              <CardDescription>
                Please wait while we verify your email address
              </CardDescription>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-green-700">Email Verified!</CardTitle>
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
              <CardTitle className="text-destructive">Verification Failed</CardTitle>
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
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-goto-home"
              >
                Go to Home
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
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/login")}
                className="w-full"
                data-testid="button-goto-login"
              >
                Go to Login
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
