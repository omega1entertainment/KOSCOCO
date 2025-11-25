import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Wallet,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Building,
  Phone,
} from "lucide-react";
import type { CreatorWallet, WalletTransaction, CreatorWithdrawal } from "@shared/schema";

type WalletData = {
  id: string;
  userId: string;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  currency: string;
  lastWithdrawalAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  pendingWithdrawals: number;
  recentTransactions: WalletTransaction[];
};

const withdrawalSchema = z.object({
  amount: z.number().min(2500, "Minimum withdrawal is $25.00 (2500 cents)"),
  paymentMethod: z.enum(["mobile_money", "bank_transfer"]),
  phoneNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function CreatorWallet() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 2500,
      paymentMethod: "mobile_money",
      phoneNumber: "",
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery<WalletData>({
    queryKey: ["/api/creator/wallet"],
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<WalletTransaction[]>({
    queryKey: ["/api/creator/wallet/transactions"],
    enabled: !!user,
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<CreatorWithdrawal[]>({
    queryKey: ["/api/creator/wallet/withdrawals"],
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const response = await apiRequest("/api/creator/wallet/withdraw", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal request submitted",
        description: "Your withdrawal request is being processed. You'll be notified once it's approved.",
      });
      setShowWithdrawForm(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/creator/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/wallet/withdrawals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmitWithdrawal = (data: WithdrawalFormData) => {
    withdrawMutation.mutate(data);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><AlertCircle className="h-3 w-3 mr-1" /> Processing</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "gift_received":
        return <Gift className="h-5 w-5 text-green-500" />;
      case "exclusive_sale":
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case "withdrawal":
        return <ArrowUpRight className="h-5 w-5 text-red-500" />;
      default:
        return <DollarSign className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl" data-testid="wallet-loading">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-4xl" data-testid="wallet-login-prompt">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to access your wallet</h2>
            <p className="text-muted-foreground mb-4">View your earnings and request withdrawals</p>
            <Button onClick={() => login()} data-testid="button-login">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableBalance = wallet ? wallet.availableBalance : 0;
  const canWithdraw = availableBalance >= 2500;

  return (
    <div className="container mx-auto p-4 max-w-4xl" data-testid="creator-wallet-page">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/creator")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Creator Wallet
          </h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card data-testid="card-total-balance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-balance">
                {formatCurrency(wallet?.availableBalance || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Available: {formatCurrency(availableBalance)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-lifetime-earnings">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-lifetime-earnings">
                {formatCurrency(wallet?.totalEarnings || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total gifts received
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-withdrawals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {walletLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-pending-withdrawals">
                {formatCurrency(wallet?.pendingWithdrawals || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting processing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button
          size="lg"
          className="flex-1"
          disabled={!canWithdraw}
          onClick={() => setShowWithdrawForm(!showWithdrawForm)}
          data-testid="button-withdraw"
        >
          <ArrowUpRight className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
        {!canWithdraw && (
          <p className="text-sm text-muted-foreground self-center">
            Minimum withdrawal: $25.00
          </p>
        )}
      </div>

      {showWithdrawForm && (
        <Card className="mb-6" data-testid="withdrawal-form">
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <CardDescription>
              Withdraw your earnings to your mobile money or bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitWithdrawal)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2500"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-withdrawal-amount"
                        />
                      </FormControl>
                      <FormDescription>
                        {formatCurrency(field.value)} | Max: {formatCurrency(availableBalance)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-method">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mobile_money">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Mobile Money (MTN/Orange)
                            </div>
                          </SelectItem>
                          <SelectItem value="bank_transfer">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              Bank Transfer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentMethod === "mobile_money" && (
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+237 6XX XXX XXX"
                            {...field}
                            data-testid="input-phone-number"
                          />
                        </FormControl>
                        <FormDescription>
                          Enter your MTN or Orange Money number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {paymentMethod === "bank_transfer" && (
                  <>
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Ecobank, UBA"
                              {...field}
                              data-testid="input-bank-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter account number"
                              {...field}
                              data-testid="input-account-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter name on account"
                              {...field}
                              data-testid="input-account-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={withdrawMutation.isPending}
                    data-testid="button-submit-withdrawal"
                  >
                    {withdrawMutation.isPending ? "Processing..." : "Submit Withdrawal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowWithdrawForm(false);
                      form.reset();
                    }}
                    data-testid="button-cancel-withdrawal"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" data-testid="tab-transactions">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="withdrawals" data-testid="tab-withdrawals">
            Withdrawals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card data-testid="card-transactions">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your earnings from gifts and exclusive content sales</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Earnings from gifts will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="p-2 rounded-full bg-background">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </p>
                      </div>
                      <div className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <Card data-testid="card-withdrawals">
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>Track the status of your withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawalsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No withdrawals yet</p>
                  <p className="text-sm">Your withdrawal history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`withdrawal-${withdrawal.id}`}
                    >
                      <div className="p-2 rounded-full bg-background">
                        {withdrawal.paymentMethod === "mobile_money" ? (
                          <Phone className="h-5 w-5 text-primary" />
                        ) : (
                          <Building className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                          {getStatusBadge(withdrawal.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.paymentMethod === "mobile_money" ? "Mobile Money" : "Bank Transfer"}
                          {" • "}
                          {formatDate(withdrawal.requestedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6" data-testid="card-info">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">About Creator Earnings</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You receive 65% of all gifts sent to your videos</li>
                <li>• Minimum withdrawal is $25.00 (2500 cents)</li>
                <li>• Withdrawals are processed within 3-5 business days</li>
                <li>• Mobile Money (MTN/Orange) and Bank Transfer supported</li>
                <li>• KOZZII INC, Limbe, Cameroon • WhatsApp: +237676951397</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
