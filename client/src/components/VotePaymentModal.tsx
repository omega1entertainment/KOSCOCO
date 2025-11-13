import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

interface VotePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
}

const COST_PER_VOTE = 50; // XAF

export default function VotePaymentModal({
  open,
  onOpenChange,
  videoId,
  videoTitle,
}: VotePaymentModalProps) {
  const [voteCount, setVoteCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const totalAmount = voteCount * COST_PER_VOTE;

  const handleVoteCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 1000) {
      setVoteCount(value);
    }
  };

  const handlePayment = async () => {
    if (voteCount < 1) {
      toast({
        title: "Invalid Vote Count",
        description: "Please enter a valid number of votes (minimum 1).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const response = await apiRequest("/api/votes/purchase/initiate", "POST", {
        videoId,
        voteCount,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate payment");
      }

      const config = {
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY || '',
        tx_ref: data.txRef,
        amount: totalAmount,
        currency: 'XAF',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: data.customer.email,
          phone_number: data.customer.phone,
          name: data.customer.name,
        },
        customizations: {
          title: 'KOSCOCO Vote Purchase',
          description: `${voteCount} vote${voteCount > 1 ? 's' : ''} for "${videoTitle}"`,
          logo: 'https://koscoco.com/logo.png',
        },
        callback: async (response: any) => {
          console.log("Payment callback:", response);
          closePaymentModal();
          
          if (response.status === "successful") {
            toast({
              title: "Payment Successful!",
              description: `Your ${voteCount} vote${voteCount > 1 ? 's' : ''} will be recorded shortly.`,
            });
            onOpenChange(false);
          } else {
            toast({
              title: "Payment Failed",
              description: "Your payment was not successful. Please try again.",
              variant: "destructive",
            });
          }
        },
        onClose: () => {
          console.log("Payment modal closed");
          setIsProcessing(false);
        },
      };

      const handleFlutterPayment = useFlutterwave(config);
      handleFlutterPayment({
        callback: config.callback,
        onClose: config.onClose,
      });

    } catch (error: any) {
      console.error("Payment initiation error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="modal-vote-payment">
        <DialogHeader>
          <DialogTitle>Purchase Votes</DialogTitle>
          <DialogDescription>
            Support "{videoTitle}" by purchasing votes. Each vote costs {COST_PER_VOTE} XAF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="voteCount">Number of Votes</Label>
            <Input
              id="voteCount"
              type="number"
              min="1"
              max="1000"
              value={voteCount}
              onChange={handleVoteCountChange}
              placeholder="Enter number of votes"
              disabled={isProcessing}
              data-testid="input-vote-count"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: 1 vote, Maximum: 1000 votes
            </p>
          </div>

          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Votes:</span>
              <span className="font-medium" data-testid="text-vote-quantity">{voteCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost per vote:</span>
              <span className="font-medium">{COST_PER_VOTE} XAF</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between">
              <span className="font-semibold">Total Amount:</span>
              <span className="font-bold text-lg text-primary" data-testid="text-total-amount">
                {totalAmount.toLocaleString()} XAF
              </span>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isProcessing || voteCount < 1}
            data-testid="button-pay-now"
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
