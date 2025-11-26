import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

declare const window: any;

interface WalletTopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function WalletTopupDialog({ open, onOpenChange, onSuccess }: WalletTopupDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const presetAmounts = [500, 1000, 2000, 5000];

  const handleTopup = async () => {
    const topupAmount = parseInt(amount);
    
    if (!topupAmount || topupAmount < 100) {
      toast({ title: "Error", description: "Minimum top-up is 100 XAF", variant: "destructive" });
      return;
    }

    if (topupAmount > 1000000) {
      toast({ title: "Error", description: "Maximum top-up is 1,000,000 XAF", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch("/api/wallet/topup/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topupAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const paymentData = await response.json();

      if (!window.FlutterwaveCheckout) {
        throw new Error("Flutterwave not loaded");
      }

      // Close dialog before opening payment
      onOpenChange(false);
      setAmount("");

      // Open Flutterwave checkout in redirect mode
      const handler = window.FlutterwaveCheckout({
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
        tx_ref: paymentData.txRef,
        amount: paymentData.amount,
        currency: "XAF",
        payment_options: "card, mobilemoney, ussd",
        customer: paymentData.customer,
        customizations: {
          title: "KOZZII Wallet Top-up",
          description: `Top up your wallet with ${paymentData.amount} XAF`,
          logo: "https://checkout.flutterwave.com/img/logo.png",
        },
        callback: (response: any) => {
          console.log("Payment response:", response);
          if (response.status === "successful") {
            verifyPayment(paymentData.txRef, response.transaction_id);
          } else if (response.status === "cancelled") {
            toast({ title: "Payment Cancelled", description: "You cancelled the payment", variant: "destructive" });
          } else {
            toast({ title: "Payment Failed", description: "Please try again", variant: "destructive" });
          }
        },
        onclose: () => {
          console.log("Payment modal closed");
        },
      });

      handler.openIframe();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const verifyPayment = async (txRef: string, transactionId: string) => {
    try {
      const response = await fetch("/api/wallet/topup/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txRef, transactionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const result = await response.json();
      toast({ title: "Success", description: "Wallet topped up successfully!" });
      onSuccess?.();
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>Add funds to your wallet to send gifts</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Amount (XAF)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {presetAmounts.map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setAmount(preset.toString())}
              >
                {preset} XAF
              </Button>
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleTopup}
            disabled={!amount}
          >
            Continue to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
