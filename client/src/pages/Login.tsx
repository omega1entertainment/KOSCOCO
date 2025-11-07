import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SiFacebook, SiGoogle } from "react-icons/si";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupAge, setSignupAge] = useState("");
  const [signupParentalConsent, setSignupParentalConsent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

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
        title: "Welcome Back!",
        description: "You have successfully logged in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/signup", "POST", {
        email: signupEmail,
        password: signupPassword,
        firstName: signupFirstName,
        lastName: signupLastName,
        age: signupAge ? parseInt(signupAge) : null,
        parentalConsent: signupParentalConsent,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created!",
        description: "Welcome to KOSCOCO! You're now logged in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword || !signupFirstName || !signupLastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    const age = signupAge ? parseInt(signupAge) : null;
    if (age && age < 18 && !signupParentalConsent) {
      toast({
        title: "Parental Consent Required",
        description: "Users under 18 must have parental consent.",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Accept Terms Required",
        description: "You must accept the Terms of Service and Privacy Policy to create an account.",
        variant: "destructive",
      });
      return;
    }

    signupMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-['Bebas_Neue']">Welcome to KOSCOCO</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Login to your account or create a new one
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your email and password to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        data-testid="input-login-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        data-testid="input-login-password"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>

                    <div className="relative my-6">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                        Or continue with
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/auth/google"}
                        data-testid="button-google-login"
                        className="w-full"
                      >
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/auth/facebook"}
                        data-testid="button-facebook-login"
                        className="w-full"
                      >
                        <SiFacebook className="mr-2 h-4 w-4" />
                        Facebook
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Fill in your details to create a new account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">First Name *</Label>
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="John"
                          value={signupFirstName}
                          onChange={(e) => setSignupFirstName(e.target.value)}
                          data-testid="input-signup-firstname"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname">Last Name *</Label>
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder="Doe"
                          value={signupLastName}
                          onChange={(e) => setSignupLastName(e.target.value)}
                          data-testid="input-signup-lastname"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email *</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        data-testid="input-signup-email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="At least 8 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        data-testid="input-signup-password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-age">Age (Optional)</Label>
                      <Input
                        id="signup-age"
                        type="number"
                        placeholder="18"
                        value={signupAge}
                        onChange={(e) => setSignupAge(e.target.value)}
                        data-testid="input-signup-age"
                      />
                    </div>

                    {signupAge && parseInt(signupAge) < 18 && (
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="parental-consent"
                          checked={signupParentalConsent}
                          onCheckedChange={(checked) => setSignupParentalConsent(checked as boolean)}
                          data-testid="checkbox-parental-consent"
                        />
                        <Label htmlFor="parental-consent" className="text-sm cursor-pointer">
                          I have parental consent to participate (required for users under 18)
                        </Label>
                      </div>
                    )}

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="accept-terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                        data-testid="checkbox-accept-terms"
                      />
                      <Label htmlFor="accept-terms" className="text-sm cursor-pointer">
                        I agree to the{" "}
                        <a 
                          href="/terms-of-service" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline" 
                          data-testid="link-terms-signup"
                        >
                          Terms of Service
                        </a>
                        {" "}and{" "}
                        <a 
                          href="/privacy-policy" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline" 
                          data-testid="link-privacy-signup"
                        >
                          Privacy Policy
                        </a>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signupMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>

                    <div className="relative my-6">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                        Or sign up with
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/auth/google"}
                        data-testid="button-google-signup"
                        className="w-full"
                      >
                        <SiGoogle className="mr-2 h-4 w-4" />
                        Google
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/auth/facebook"}
                        data-testid="button-facebook-signup"
                        className="w-full"
                      >
                        <SiFacebook className="mr-2 h-4 w-4" />
                        Facebook
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
