import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Gift, DollarSign } from "lucide-react";

export interface GiftItem {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  priceUsd: number;
  tier: "small" | "medium" | "large" | "luxury";
}

interface GiftCatalogProps {
  videoId: string;
  creatorId: string;
  onGiftSent?: () => void;
}

export default function GiftCatalog({ videoId, creatorId, onGiftSent }: GiftCatalogProps) {
  const { toast } = useToast();
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: gifts = [], isLoading } = useQuery<GiftItem[]>({
    queryKey: ["/api/gifts/catalog"],
  });

  const sendGiftMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGift) throw new Error("Select a gift");
      const response = await apiRequest(`/api/gifts/send`, "POST", {
        videoId,
        creatorId,
        giftId: selectedGift.id,
        quantity,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Gift sent successfully!" });
      setSelectedGift(null);
      setQuantity(1);
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      onGiftSent?.();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send gift", description: error.message, variant: "destructive" });
    },
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "small": return "bg-green-500/10 text-green-500";
      case "medium": return "bg-blue-500/10 text-blue-500";
      case "large": return "bg-purple-500/10 text-purple-500";
      case "luxury": return "bg-yellow-500/10 text-yellow-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading gifts...</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
      {gifts.map((gift) => (
        <Card
          key={gift.id}
          className={`cursor-pointer transition-all ${selectedGift?.id === gift.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => setSelectedGift(gift)}
        >
          <CardContent className="p-3">
            <img src={gift.iconUrl} alt={gift.name} className="w-12 h-12 mx-auto mb-2 object-contain" />
            <p className="text-xs font-semibold text-center mb-1">{gift.name}</p>
            <div className="flex items-center justify-between text-xs">
              <Badge variant="outline" className={getTierColor(gift.tier)}>
                {gift.tier}
              </Badge>
              <span className="font-bold flex items-center gap-0.5">
                <DollarSign className="w-3 h-3" />
                {((gift.priceUsd || 0) / 100).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {selectedGift && (
        <div className="col-span-2 sm:col-span-3 border-t pt-3 mt-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold flex-1">Quantity:</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button size="sm" variant="outline" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>
          </div>
          <div className="text-sm mb-2">
            Total: ${(((selectedGift.priceUsd || 0) * quantity) / 100).toFixed(2)}
            <span className="text-xs text-muted-foreground ml-1">(Creator gets 65%)</span>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() => sendGiftMutation.mutate()}
            disabled={sendGiftMutation.isPending}
            data-testid="button-send-gift"
          >
            <Gift className="w-4 h-4 mr-1" />
            {sendGiftMutation.isPending ? "Sending..." : "Send Gift"}
          </Button>
        </div>
      )}
    </div>
  );
}
