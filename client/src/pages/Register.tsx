import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle } from "lucide-react";
import type { Category, Registration } from "@shared/schema";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [registeredCategoryIds, setRegisteredCategoryIds] = useState<Set<string>>(new Set());
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);
      scriptLoaded.current = true;
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    
    if (ref) {
      setReferralCode(ref);
      // Store in sessionStorage to preserve across login redirects
      sessionStorage.setItem('affiliateReferralCode', ref);
      toast({
        title: "Referral Code Applied",
        description: `You're registering with referral code: ${ref}`,
      });
    } else {
      // Check if referral code was stored from a previous login redirect
      const storedRef = sessionStorage.getItem('affiliateReferralCode');
      if (storedRef) {
        setReferralCode(storedRef);
      }
    }
  }, [toast]);

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: userRegistrations = [] } = useQuery<Registration[]>({
    queryKey: ["/api/registrations/user"],
    enabled: !!user,
  });

  // Extract already registered category IDs (approved registrations only)
  useEffect(() => {
    const approvedRegs = userRegistrations.filter(reg => reg.paymentStatus === 'approved');
    const categoryIds = new Set<string>();
    for (const reg of approvedRegs) {
      for (const catId of reg.categoryIds) {
        categoryIds.add(catId);
      }
    }
    setRegisteredCategoryIds(categoryIds);
  }, [userRegistrations]);

  const FEE_PER_CATEGORY = 2500;
  const totalAmount = selectedCategories.length * FEE_PER_CATEGORY;

  useEffect(() => {
    if (paymentData && window.FlutterwaveCheckout) {
      const config = {
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || '',
        tx_ref: `REG-${paymentData.registrationId}-${Date.now()}`,
        amount: paymentData.amount,
        currency: 'XAF',
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: user?.email || '',
          phone_number: '',
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
        },
        customizations: {
          title: 'KOSCOCO Registration',
          description: `Registration for ${paymentData.categoryCount} ${paymentData.categoryCount === 1 ? 'category' : 'categories'}`,
          logo: '',
        },
        callback: async (response: any) => {
          console.log('Payment response:', response);
          
          if (response.status === 'successful') {
            try {
              await apiRequest("/api/payments/verify", "POST", {
                transaction_id: response.transaction_id,
                registrationId: paymentData.registrationId,
              });
              
              toast({
                title: "Payment Successful!",
                description: `Your registration payment of ${paymentData.amount.toLocaleString()} FCFA has been confirmed.`,
              });
              
              queryClient.invalidateQueries({ queryKey: ["/api/registrations/user"] });
              setLocation("/dashboard");
            } catch (error: any) {
              toast({
                title: "Payment Verification Failed",
                description: error.message || "Please contact support.",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Payment Incomplete",
              description: "Your registration was created but payment was not completed. Please complete payment from your dashboard.",
              variant: "destructive",
            });
          }
          
          setPaymentData(null);
        },
        onclose: () => {
          toast({
            title: "Payment Cancelled",
            description: "Registration created but payment pending. Complete payment from your dashboard.",
          });
          queryClient.invalidateQueries({ queryKey: ["/api/registrations/user"] });
          setLocation("/dashboard");
          setPaymentData(null);
        },
      };

      window.FlutterwaveCheckout(config);
    }
  }, [paymentData, user, toast, setLocation]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/registrations", "POST", {
        categoryIds: selectedCategories,
        referralCode: referralCode || null,
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log('Registration response:', data);
      
      if (!data || !data.registration || !data.registration.id) {
        toast({
          title: "Registration Failed",
          description: "Invalid response from server. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      const referralApplied = data.referralApplied !== false;
      const paymentAmount = data.totalAmount || data.totalFee || 0;
      const registration = data.registration;
      
      // Clear stored referral code after successful registration
      sessionStorage.removeItem('affiliateReferralCode');
      
      setPaymentData({
        registrationId: registration.id,
        amount: paymentAmount,
        categoryCount: selectedCategories.length,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCategoryToggle = (categoryId: string) => {
    // Don't allow selecting already registered categories
    if (registeredCategoryIds.has(categoryId)) {
      toast({
        title: "Already Registered",
        description: "You are already registered for this category.",
        variant: "destructive",
      });
      return;
    }
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCategories.length === 0) {
      toast({
        title: "No Categories Selected",
        description: "Please select at least one category to register.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate();
  };

  if (authLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const handleLoginClick = () => {
      // Preserve referral code before login redirect
      if (referralCode) {
        sessionStorage.setItem('affiliateReferralCode', referralCode);
      }
      login();
    };

    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to register for the competition
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleLoginClick} className="w-full" data-testid="button-login">
              Log In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Register for KOSCOCO</h1>
            <p className="text-muted-foreground">
              Select the categories you want to compete in. Registration fee is 2,500 FCFA per category.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {registeredCategoryIds.size > 0 && (
              <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="pt-6 flex gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Already Registered</p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                      You have already paid for and registered in {registeredCategoryIds.size} {registeredCategoryIds.size === 1 ? 'category' : 'categories'}. You can register for new categories below.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-6 mb-6">
              {categories?.map((category) => {
                const isAlreadyRegistered = registeredCategoryIds.has(category.id);
                return (
                  <Card
                    key={category.id}
                    className={`transition-colors ${isAlreadyRegistered ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${selectedCategories.includes(category.id) ? "border-primary border-2" : ""}`}
                    onClick={() => !isAlreadyRegistered && handleCategoryToggle(category.id)}
                    data-testid={`card-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Checkbox
                          id={category.id}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => !isAlreadyRegistered && handleCategoryToggle(category.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isAlreadyRegistered}
                          data-testid={`checkbox-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={category.id}
                              className={`text-lg font-semibold ${isAlreadyRegistered ? 'cursor-not-allowed line-through' : 'cursor-pointer'}`}
                            >
                              {category.name}
                            </Label>
                            {isAlreadyRegistered && (
                              <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md font-medium">
                                Already Registered
                              </span>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {category.subcategories.map((sub, index) => (
                              <span
                                key={sub}
                                className="text-xs px-2 py-1 bg-muted rounded-md"
                                data-testid={`badge-subcategory-${index}`}
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Registration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categories Selected:</span>
                    <span className="font-medium" data-testid="text-categories-count">
                      {selectedCategories.length}
                    </span>
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="mb-2">
                      <div className="flex flex-wrap gap-2">
                        {categories
                          ?.filter(cat => selectedCategories.includes(cat.id))
                          .map(cat => (
                            <span
                              key={cat.id}
                              className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-md font-medium"
                              data-testid={`badge-selected-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {cat.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fee per Category:</span>
                    <span className="font-medium">2,500 FCFA</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span data-testid="text-total-amount">
                        {totalAmount.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={registerMutation.isPending || selectedCategories.length === 0}
                className="flex-1"
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? "Processing..." : "Proceed to Payment"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
