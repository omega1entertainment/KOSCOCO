import { useState, useEffect } from "react";
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
import type { Category } from "@shared/schema";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

export default function Register() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      toast({
        title: "Referral Code Applied",
        description: `You're registering with referral code: ${ref}`,
      });
    }
  }, [toast]);

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const FEE_PER_CATEGORY = 2500;
  const totalAmount = selectedCategories.length * FEE_PER_CATEGORY;
  const [paymentData, setPaymentData] = useState<any>(null);

  const config = {
    public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || '',
    tx_ref: paymentData ? `REG-${paymentData.registrationId}-${Date.now()}` : Date.now().toString(),
    amount: paymentData ? paymentData.amount : totalAmount,
    currency: 'XAF',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: user?.email || '',
      phone_number: '',
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
    },
    customizations: {
      title: 'KOSCOCO Registration',
      description: paymentData 
        ? `Registration for ${paymentData.categoryCount} ${paymentData.categoryCount === 1 ? 'category' : 'categories'}`
        : 'Competition Registration Payment',
      logo: '',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

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
      
      // Set payment data and trigger payment modal
      setPaymentData({
        registrationId: registration.id,
        amount: paymentAmount,
        categoryCount: selectedCategories.length,
      });

      // Trigger payment modal
      setTimeout(() => {
        handleFlutterPayment({
          callback: async (response: any) => {
            console.log('Payment response:', response);
            
            if (response.status === 'successful') {
              try {
                await apiRequest("/api/payments/verify", "POST", {
                  transaction_id: response.transaction_id,
                  registrationId: registration.id,
                });
                
                toast({
                  title: "Payment Successful!",
                  description: `Your registration payment of ${paymentAmount.toLocaleString()} FCFA has been confirmed.`,
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
            
            closePaymentModal();
            setPaymentData(null);
          },
          onClose: () => {
            toast({
              title: "Payment Cancelled",
              description: "Registration created but payment pending. Complete payment from your dashboard.",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/registrations/user"] });
            setLocation("/dashboard");
            setPaymentData(null);
          },
        });
      }, 100);
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
            <Button onClick={login} className="w-full" data-testid="button-login">
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
            <div className="grid gap-6 mb-6">
              {categories?.map((category) => (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-colors ${selectedCategories.includes(category.id) ? "border-primary border-2" : ""}`}
                  onClick={() => handleCategoryToggle(category.id)}
                  data-testid={`card-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={category.id}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`checkbox-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={category.id}
                          className="text-lg font-semibold cursor-pointer"
                        >
                          {category.name}
                        </Label>
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
              ))}
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Referral Code (Optional)</CardTitle>
                <CardDescription>
                  If you have a referral code, enter it here to support an affiliate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  data-testid="input-referralcode"
                />
              </CardContent>
            </Card>

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
