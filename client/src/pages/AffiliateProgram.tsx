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
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Gift,
  UserPlus,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import type { Affiliate } from "@shared/schema";

const createAffiliateFormSchema = (t: (key: string) => string, isAuthenticated: boolean = false) => {
  const baseSchema = {
    website: z.string().optional(),
    promotionMethod: z.string().min(10, t('affiliateProgram.validation.promotionMethodMin')),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: t('affiliateProgram.validation.termsRequired')
    })
  };

  if (isAuthenticated) {
    return z.object({
      ...baseSchema,
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    });
  }

  return z.object({
    ...baseSchema,
    firstName: z.string().min(2, t('affiliateProgram.validation.firstNameMin')),
    lastName: z.string().min(2, t('affiliateProgram.validation.lastNameMin')),
    email: z.string().email(t('affiliateProgram.validation.invalidEmail')),
    username: z.string().min(3, t('affiliateProgram.validation.usernameMin')),
    password: z.string().min(6, t('affiliateProgram.validation.passwordMin')),
  });
};

type AffiliateFormData = z.infer<ReturnType<typeof createAffiliateFormSchema>>;

export default function AffiliateProgram() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const affiliateFormSchema = createAffiliateFormSchema(t, !!user);

  const form = useForm<AffiliateFormData>({
    resolver: zodResolver(affiliateFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
      password: "",
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
      // For authenticated users, only send the fields that the backend expects
      const payload = user 
        ? { website: data.website, promotionMethod: data.promotionMethod }
        : data;
      return await apiRequest("/api/affiliate/opt-in", "POST", payload);
    },
    onSuccess: () => {
      toast({
        title: t('affiliateProgram.toast.enrolledTitle'),
        description: t('affiliateProgram.toast.enrolledDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/status"] });
      setTimeout(() => {
        setLocation("/affiliate/dashboard");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: t('affiliateProgram.toast.enrollmentFailed'),
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

  // Redirect if already an affiliate (only for authenticated users)
  useEffect(() => {
    if (user && !statusLoading && affiliateStatus?.isAffiliate) {
      setLocation("/affiliate/dashboard");
    }
  }, [user, statusLoading, affiliateStatus, setLocation]);

  if (authLoading || (user && statusLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('affiliateProgram.loading')}</p>
        </div>
      </div>
    );
  }

  if (user && affiliateStatus?.isAffiliate) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-affiliate">
            {t('affiliateProgram.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('affiliateProgram.subtitle')}
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Benefits Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <DollarSign className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">{t('affiliateProgram.benefits.commission.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('affiliateProgram.benefits.commission.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">{t('affiliateProgram.benefits.sharing.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('affiliateProgram.benefits.sharing.description')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <TrendingUp className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-xl">{t('affiliateProgram.benefits.tracking.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('affiliateProgram.benefits.tracking.description')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{t('affiliateProgram.howItWorks.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                <li>{t('affiliateProgram.howItWorks.step1')}</li>
                <li>{t('affiliateProgram.howItWorks.step2')}</li>
                <li>{t('affiliateProgram.howItWorks.step3')}</li>
                <li>{t('affiliateProgram.howItWorks.step4')}</li>
                <li>{t('affiliateProgram.howItWorks.step5')}</li>
              </ol>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card data-testid="card-signup-form">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                {t('affiliateProgram.form.title')}
              </CardTitle>
              <CardDescription>
                {t('affiliateProgram.form.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {!user && (
                    <>
                      <div className="bg-muted/50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-muted-foreground">
                          <strong className="text-foreground">{t('affiliateProgram.form.newUserMessage')}</strong>{t('affiliateProgram.form.newUserDescription')}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('affiliateProgram.form.firstName')}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t('affiliateProgram.form.firstNamePlaceholder')}
                                  {...field}
                                  data-testid="input-first-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('affiliateProgram.form.lastName')}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t('affiliateProgram.form.lastNamePlaceholder')}
                                  {...field}
                                  data-testid="input-last-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('affiliateProgram.form.email')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder={t('affiliateProgram.form.emailPlaceholder')}
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('affiliateProgram.form.username')}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t('affiliateProgram.form.usernamePlaceholder')}
                                  {...field}
                                  data-testid="input-username"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('affiliateProgram.form.password')}</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder={t('affiliateProgram.form.passwordPlaceholder')}
                                  {...field}
                                  data-testid="input-password"
                                />
                              </FormControl>
                              <FormDescription>
                                {t('affiliateProgram.form.passwordHint')}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}

                  {user && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormItem>
                        <FormLabel>{t('affiliateProgram.form.name')}</FormLabel>
                        <FormControl>
                          <Input 
                            value={`${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || ""} 
                            disabled 
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('affiliateProgram.form.nameDescription')}
                        </FormDescription>
                      </FormItem>

                      <FormItem>
                        <FormLabel>{t('affiliateProgram.form.email')}</FormLabel>
                        <FormControl>
                          <Input 
                            value={user.email || ""} 
                            disabled 
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('affiliateProgram.form.emailDescription')}
                        </FormDescription>
                      </FormItem>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('affiliateProgram.form.website')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('affiliateProgram.form.websitePlaceholder')}
                            {...field}
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('affiliateProgram.form.websiteDescription')}
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
                        <FormLabel>{t('affiliateProgram.form.promotionMethod')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('affiliateProgram.form.promotionMethodPlaceholder')}
                            className="min-h-[100px]"
                            {...field}
                            data-testid="textarea-promotion-method"
                          />
                        </FormControl>
                        <FormDescription>
                          {t('affiliateProgram.form.promotionMethodDescription')}
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
                            {t('affiliateProgram.form.agreeToTerms')}{" "}
                            <a 
                              href="/affiliate-terms" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline" 
                              data-testid="link-affiliate-terms"
                            >
                              {t('affiliateProgram.form.affiliateTerms')}
                            </a>
                          </FormLabel>
                          <FormDescription>
                            {t('affiliateProgram.form.agreeDescription')}
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
                      {optInMutation.isPending ? t('affiliateProgram.form.submitting') : t('affiliateProgram.form.submitButton')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
