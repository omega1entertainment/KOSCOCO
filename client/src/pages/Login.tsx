import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { SiFacebook, SiGoogle } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";

// Country phone format mapping
const PHONE_FORMATS: Record<string, string> = {
  "+237": "6XX XXX XXX", // Cameroon
  "+1": "(XXX) XXX-XXXX", // USA/Canada
  "+44": "XXXX XXX XXXX", // UK
  "+33": "XX XX XX XX XX", // France
  "+49": "XXXX XXXXXXX", // Germany
  "+91": "XXXXX XXXXX", // India
  "+234": "XXX XXXXXXX", // Nigeria
  "+27": "XX XXXX XXXX", // South Africa
  "+255": "XXX XXX XXXX", // Tanzania
  "+256": "XXX XXXXXX", // Uganda
  "+254": "XXX XXXXXX", // Kenya
  "+212": "6XX XXX XXX", // Morocco
  "+213": "5XX XXX XXX", // Algeria
  "+225": "XX XXXX XXX", // Ivory Coast
  "+228": "9X XXX XXX", // Togo
  "+229": "XX XXX XXX", // Benin
  "+230": "XXXX XXXX", // Mauritius
  "+243": "XXXXXXXXX", // DR Congo
  "+251": "9XX XXX XXX", // Ethiopia
  "+260": "XXXXXXXXX", // Zambia
};

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupCountryCode, setSignupCountryCode] = useState("+237");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupAge, setSignupAge] = useState("");
  const [signupParentalConsent, setSignupParentalConsent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Signup form error state
  const [signupErrors, setSignupErrors] = useState<string[]>([]);

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
        title: t("auth.welcomeBack"),
        description: t("auth.loginSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.loginFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      const fullPhone = `${signupCountryCode}${signupPhone.replace(/\D/g, '')}`;
      const response = await apiRequest("/api/signup", "POST", {
        email: signupEmail,
        password: signupPassword,
        firstName: signupFirstName,
        lastName: signupLastName,
        phone: fullPhone,
        username: signupUsername,
        age: signupAge ? parseInt(signupAge) : null,
        parentalConsent: signupParentalConsent,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t("auth.accountCreated"),
        description: t("auth.signupSuccess"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/thank-you");
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.signupFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: t("auth.missingInfo"),
        description: t("auth.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate();
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: string[] = [];

    if (!signupFirstName) errors.push("First Name");
    if (!signupLastName) errors.push("Last Name");
    if (!signupPhone) errors.push("Mobile Number");
    if (!signupUsername) errors.push("Username");
    if (!signupEmail) errors.push("Email");
    if (!signupPassword) errors.push("Password");

    if (errors.length > 0) {
      setSignupErrors(errors);
      toast({
        title: t("auth.missingInfo"),
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSignupErrors([]);

    if (signupUsername.length < 3 || signupUsername.length > 20) {
      toast({
        title: t("auth.invalidUsername"),
        description: "Username must be between 3 and 20 characters",
        variant: "destructive",
      });
      return;
    }

    if (signupPassword.length < 8) {
      toast({
        title: t("auth.weakPassword"),
        description: t("auth.passwordMinLength"),
        variant: "destructive",
      });
      return;
    }

    const age = signupAge ? parseInt(signupAge) : null;
    if (age && age < 18 && !signupParentalConsent) {
      toast({
        title: t("auth.parentalConsentRequired"),
        description: t("auth.parentalConsentMessage"),
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: t("auth.acceptTermsRequired"),
        description: t("auth.acceptTermsMessage"),
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-['Bebas_Neue']">{t("auth.welcomeTitle")}</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {t("auth.welcomeDescription")}
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login" className="data-[state=active]:bg-destructive data-[state=active]:text-white">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup" className="data-[state=active]:bg-destructive data-[state=active]:text-white">{t("auth.signUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>{t("auth.login")}</CardTitle>
                  <CardDescription>
                    {t("auth.loginDescription")}
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
                        data-testid="input-login-email"
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
                        data-testid="input-login-password"
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
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? t("auth.loggingIn") : t("auth.login")}
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
                        data-testid="button-google-login"
                        className="w-full"
                      >
                        <SiGoogle className="mr-2 h-4 w-4" />
                        {t("auth.google")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/auth/facebook"}
                        data-testid="button-facebook-login"
                        className="w-full"
                      >
                        <SiFacebook className="mr-2 h-4 w-4" />
                        {t("auth.facebook")}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>{t("auth.createAccount")}</CardTitle>
                  <CardDescription>
                    {t("auth.signupDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname">{t("auth.firstNameRequired")}</Label>
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder={t("auth.firstNamePlaceholder")}
                          value={signupFirstName}
                          onChange={(e) => setSignupFirstName(e.target.value)}
                          data-testid="input-signup-firstname"
                          className={signupErrors.includes("First Name") ? "border-red-500" : ""}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname">{t("auth.lastNameRequired")}</Label>
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder={t("auth.lastNamePlaceholder")}
                          value={signupLastName}
                          onChange={(e) => setSignupLastName(e.target.value)}
                          data-testid="input-signup-lastname"
                          className={signupErrors.includes("Last Name") ? "border-red-500" : ""}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a unique username"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        data-testid="input-signup-username"
                        className={signupErrors.includes("Username") ? "border-red-500" : ""}
                      />
                      <p className="text-xs text-muted-foreground">
                        3-20 characters, letters and numbers only
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Mobile Number *</Label>
                      <div className="flex gap-2">
                        <Select value={signupCountryCode} onValueChange={setSignupCountryCode}>
                          <SelectTrigger className="w-32" data-testid="select-country-code">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="+237">Cameroon (+237)</SelectItem>
                            <SelectItem value="+1">USA/Canada (+1)</SelectItem>
                            <SelectItem value="+44">UK (+44)</SelectItem>
                            <SelectItem value="+33">France (+33)</SelectItem>
                            <SelectItem value="+49">Germany (+49)</SelectItem>
                            <SelectItem value="+91">India (+91)</SelectItem>
                            <SelectItem value="+234">Nigeria (+234)</SelectItem>
                            <SelectItem value="+27">South Africa (+27)</SelectItem>
                            <SelectItem value="+255">Tanzania (+255)</SelectItem>
                            <SelectItem value="+256">Uganda (+256)</SelectItem>
                            <SelectItem value="+254">Kenya (+254)</SelectItem>
                            <SelectItem value="+212">Morocco (+212)</SelectItem>
                            <SelectItem value="+213">Algeria (+213)</SelectItem>
                            <SelectItem value="+225">Ivory Coast (+225)</SelectItem>
                            <SelectItem value="+228">Togo (+228)</SelectItem>
                            <SelectItem value="+229">Benin (+229)</SelectItem>
                            <SelectItem value="+230">Mauritius (+230)</SelectItem>
                            <SelectItem value="+243">DR Congo (+243)</SelectItem>
                            <SelectItem value="+251">Ethiopia (+251)</SelectItem>
                            <SelectItem value="+260">Zambia (+260)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder={PHONE_FORMATS[signupCountryCode] || "6XX XXX XXX"}
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value)}
                          data-testid="input-signup-phone"
                          className={`flex-1 ${signupErrors.includes("Mobile Number") ? "border-red-500" : ""}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t("auth.emailRequired")}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        data-testid="input-signup-email"
                        className={signupErrors.includes("Email") ? "border-red-500" : ""}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t("auth.passwordRequired")}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t("auth.passwordPlaceholderSignup")}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        data-testid="input-signup-password"
                        className={signupErrors.includes("Password") ? "border-red-500" : ""}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("auth.passwordHint")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-age">{t("auth.ageOptional")}</Label>
                      <Input
                        id="signup-age"
                        type="number"
                        placeholder={t("auth.agePlaceholder")}
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
                          {t("auth.parentalConsentLabel")}
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
                        {t("auth.acceptTermsLabel")}{" "}
                        <a 
                          href="/terms-of-service" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline" 
                          data-testid="link-terms-signup"
                        >
                          {t("auth.termsOfService")}
                        </a>
                        {" "}{t("auth.and")}{" "}
                        <a 
                          href="/privacy-policy" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline" 
                          data-testid="link-privacy-signup"
                        >
                          {t("auth.privacyPolicy")}
                        </a>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={signupMutation.isPending}
                      data-testid="button-signup-submit"
                    >
                      {signupMutation.isPending ? t("auth.creatingAccount") : t("auth.createAccount")}
                    </Button>

                    <div className="relative my-6">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-sm text-muted-foreground">
                        {t("auth.orSignUpWith")}
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
                        {t("auth.google")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.location.href = "/api/auth/facebook"}
                        data-testid="button-facebook-signup"
                        className="w-full"
                      >
                        <SiFacebook className="mr-2 h-4 w-4" />
                        {t("auth.facebook")}
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
