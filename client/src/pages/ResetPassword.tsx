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

export default function ResetPassword() {
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
        title: "Success!",
        description: data.message,
      });
      setTimeout(() => {
        setLocationPath("/login");
      }, 2000);
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
    
    if (!token) {
      toast({
        title: "Missing Token",
        description: "Invalid or missing reset token.",
        variant: "destructive",
      });
      return;
    }

    if (!password || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
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
          <Link href="/login">
            <a className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6" data-testid="link-back-to-login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </a>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 font-['Bebas_Neue']">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create New Password</CardTitle>
              <CardDescription>
                Choose a strong password for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
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
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
