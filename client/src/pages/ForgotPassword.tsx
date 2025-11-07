import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const forgotPasswordMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/auth/forgot-password", "POST", { email });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset Email Sent",
        description: data.message,
      });
      // In development, show the token
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    forgotPasswordMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" data-testid="link-back-to-login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 font-['Bebas_Neue']">Forgot Password</h1>
            <p className="text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                We'll send you instructions to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-forgot-email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-forgot-submit"
                >
                  {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                </Button>

                {resetToken && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm font-medium mb-2">Development Mode - Reset Token:</p>
                    <code className="text-xs break-all">{resetToken}</code>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use this token at <Link href={`/reset-password?token=${resetToken}`} className="text-primary hover:underline">Reset Password</Link>
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
