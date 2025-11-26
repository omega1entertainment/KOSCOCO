import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Gift as GiftIcon,
  Wallet,
  Sparkles,
  Drum,
  Shell,
  Shirt,
  Circle,
  Theater,
  Cat,
  Crown,
  TreeDeciduous,
  Star,
} from "lucide-react";
import type { Gift, Video, User, UserWallet } from "@shared/schema";
import drumImageUrl from "@assets/Standard African drum_1764140229973.png";
import cowrieImageUrl from "@assets/Cowries_1764140169949.png";
import toguhImageUrl from "@assets/North west toguh_1764140310074.png";
import maasaiBeadsImageUrl from "@assets/zulu-necklace-removebg-preview_1764140940640.png";
import ivoryTusksImageUrl from "@assets/Elephant ivory horn_1764159964584.png";
import elephantImageUrl from "@assets/elephant_1764160633043.png";
import lionImageUrl from "@assets/Lion_1764160791058.png";
import lionVideoUrl from "@assets/media_1764161408469.mp4";

const giftIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "African Drum": Drum,
  "Cowrie Shell": Shell,
  "Kente Cloth": Shirt,
  "Maasai Beads": Circle,
  "Ivory Tusks": Theater,
  "Elephant": Cat,
  "Lion": Crown,
  "Golden Baobab": TreeDeciduous,
};

const tierColors: Record<string, string> = {
  small: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  large: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  luxury: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function GiftPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: video, isLoading: videoLoading } = useQuery<Video & { user: User }>({
    queryKey: ["/api/videos", videoId],
    enabled: !!videoId,
  });

  const { data: gifts = [], isLoading: giftsLoading } = useQuery<Gift[]>({
    queryKey: ["/api/gifts"],
  });

  const { data: wallet } = useQuery<UserWallet>({
    queryKey: ["/api/wallet"],
    enabled: !!user,
  });

  const sendGiftMutation = useMutation({
    mutationFn: async ({ giftId, quantity }: { giftId: string; quantity: number }) => {
      const response = await apiRequest(`/api/videos/${videoId}/gift`, "POST", {
        giftId,
        quantity,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "Gift sent!",
        description: `You sent ${quantity}x ${selectedGift?.name} to the creator!`,
      });
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedGift(null);
        setQuantity(1);
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send gift",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSendGift = () => {
    if (!user) {
      login();
      return;
    }
    if (!selectedGift) return;

    const totalCost = selectedGift.priceUsd * quantity;
    if (wallet && wallet.balance < totalCost) {
      toast({
        title: "Insufficient balance",
        description: "Please top up your wallet to send this gift",
        variant: "destructive",
      });
      return;
    }

    sendGiftMutation.mutate({ giftId: selectedGift.id, quantity });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (videoLoading || giftsLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4" data-testid="gift-page-loading">
        <div className="max-w-lg mx-auto">
          <Skeleton className="h-8 w-8 rounded-full mb-4" />
          <Skeleton className="h-24 w-full rounded-lg mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" data-testid="gift-page-error">
        <div className="text-center">
          <GiftIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl font-medium">Video not found</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/feed")}>
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  const groupedGifts = gifts.reduce((acc, gift) => {
    if (!acc[gift.tier]) acc[gift.tier] = [];
    acc[gift.tier].push(gift);
    return acc;
  }, {} as Record<string, Gift[]>);

  const tierOrder = ["small", "medium", "large", "luxury"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white" data-testid="gift-page">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" data-testid="gift-success-overlay">
          <div className="text-center animate-in zoom-in duration-300">
            <div className="relative">
              <Sparkles className="h-24 w-24 text-yellow-400 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                {selectedGift && giftIcons[selectedGift.name] && (
                  (() => {
                    const Icon = giftIcons[selectedGift.name];
                    return <Icon className="h-12 w-12 text-white" />;
                  })()
                )}
              </div>
            </div>
            <p className="text-2xl font-bold mt-4">Gift Sent!</p>
            <p className="text-muted-foreground">{quantity}x {selectedGift?.name}</p>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(-1 as unknown as string)}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GiftIcon className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Send Gift</h1>
          
          {user && wallet && (
            <div className="ml-auto flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
              <Wallet className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium" data-testid="text-wallet-balance">{formatCurrency(wallet.balance)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Card className="bg-white/5 border-white/10 mb-6" data-testid="card-creator-info">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary">
                <AvatarImage src={video.user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {video.user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" data-testid="text-creator-username">@{video.user?.username}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1" data-testid="text-video-title">{video.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-4 text-center">
            65% of your gift goes directly to the creator
          </p>
        </div>

        <div className="space-y-6">
          {tierOrder.map((tier) => {
            const tierGifts = groupedGifts[tier] || [];
            if (tierGifts.length === 0) return null;

            return (
              <div key={tier} data-testid={`gift-tier-${tier}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`${tierColors[tier]} capitalize`}>
                    {tier === "luxury" && <Star className="h-3 w-3 mr-1" />}
                    {tier}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {tierGifts.map((gift) => {
                    const Icon = giftIcons[gift.name] || GiftIcon;
                    const isSelected = selectedGift?.id === gift.id;

                    return (
                      <button
                        key={gift.id}
                        onClick={() => {
                          setSelectedGift(gift);
                          setQuantity(1);
                        }}
                        className={`relative p-4 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? "bg-primary/20 border-primary ring-2 ring-primary"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                        data-testid={`button-gift-${gift.id}`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white text-neutral-900">
                            {gift.name === "African Drum" ? (
                              <img src={drumImageUrl} alt="African Drum" className="h-10 w-10 object-contain" />
                            ) : gift.name === "Cowrie Shell" ? (
                              <img src={cowrieImageUrl} alt="Cowrie Shell" className="h-10 w-10 object-contain" />
                            ) : gift.name === "Toguh Cloth" || gift.name === "Kente Cloth" ? (
                              <img src={toguhImageUrl} alt="Toguh Cloth" className="h-10 w-10 object-contain" />
                            ) : gift.name === "Maasai Beads" ? (
                              <img src={maasaiBeadsImageUrl} alt="Maasai Beads" className="h-10 w-10 object-contain" />
                            ) : gift.name === "Ivory Tusks" ? (
                              <img src={ivoryTusksImageUrl} alt="Ivory Tusks" className="h-10 w-10 object-contain" />
                            ) : gift.name === "Elephant" ? (
                              <img src={elephantImageUrl} alt="Elephant" className="h-10 w-10 object-contain" />
                            ) : gift.name === "Lion" ? (
                              <video src={lionVideoUrl} autoPlay muted loop className="h-10 w-10 object-contain" />
                            ) : (
                              <Icon className="h-10 w-10" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{gift.name}</span>
                          <span className="text-xs text-muted-foreground">{formatCurrency(gift.priceUsd)}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {selectedGift && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900/95 backdrop-blur-sm border-t border-white/10" data-testid="gift-checkout-panel">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {giftIcons[selectedGift.name] && (
                      (() => {
                        const Icon = giftIcons[selectedGift.name];
                        return <Icon className="h-5 w-5 text-primary" />;
                      })()
                    )}
                    <span className="font-medium">{selectedGift.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedGift.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    data-testid="button-decrease-quantity"
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-8 text-center bg-white/10 border-white/20"
                    min={1}
                    data-testid="input-gift-quantity"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                    data-testid="button-increase-quantity"
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-semibold"
                onClick={handleSendGift}
                disabled={sendGiftMutation.isPending}
                data-testid="button-send-gift"
              >
                {sendGiftMutation.isPending ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <>
                    <GiftIcon className="h-5 w-5 mr-2" />
                    Send {quantity}x for {formatCurrency(selectedGift.priceUsd * quantity)}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-2">
                Creator receives: {formatCurrency(Math.round(selectedGift.priceUsd * quantity * 0.65))}
              </p>
            </div>
          </div>
        )}

        {!selectedGift && (
          <div className="h-24" />
        )}
      </div>
    </div>
  );
}
