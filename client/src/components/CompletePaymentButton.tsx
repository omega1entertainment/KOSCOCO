import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Registration } from "@shared/schema";

interface CompletePaymentButtonProps {
  registration: Registration;
  userEmail: string;
  userName: string;
}

export default function CompletePaymentButton({ 
  registration, 
  userEmail,
  userName 
}: CompletePaymentButtonProps) {
  const { toast } = useToast();

  // Validate Flutterwave public key
  const publicKey = import.meta.env.VITE_FLW_PUBLIC_KEY;
  
  // Build stable Flutterwave config from props
  const config = {
    public_key: publicKey || '',
    tx_ref: `REG-${registration.id}-${Date.now()}`,
    amount: registration.totalFee,
    currency: 'XAF',
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email: userEmail,
      phone_number: '',
      name: userName || 'User',
    },
    customizations: {
      title: 'KOSCOCO Registration Payment',
      description: `Payment for ${registration.categoryIds.length} ${registration.categoryIds.length === 1 ? 'category' : 'categories'}`,
      logo: '',
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleCompletePayment = () => {
    if (!publicKey) {
      toast({
        title: "Payment Configuration Error",
        description: "Payment system is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    handleFlutterPayment({
      callback: async (response: any) => {
        if (response.status === 'successful') {
          try {
            await apiRequest("/api/payments/verify", "POST", {
              transaction_id: response.transaction_id,
              registrationId: registration.id,
            });
            
            toast({
              title: "Payment Successful!",
              description: `Your payment of ${registration.totalFee.toLocaleString()} FCFA has been confirmed.`,
            });
            
            queryClient.invalidateQueries({ queryKey: ["/api/registrations/user"] });
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
            description: "Payment was not completed. Please try again.",
            variant: "destructive",
          });
        }
        
        closePaymentModal();
      },
      onClose: () => {
        toast({
          title: "Payment Cancelled",
          description: "You can retry payment anytime from your dashboard.",
        });
      },
    });
  };

  return (
    <Button
      size="sm"
      onClick={handleCompletePayment}
      data-testid={`button-complete-payment-${registration.id}`}
    >
      <CreditCard className="w-4 h-4 mr-2" />
      Complete Payment
    </Button>
  );
}
