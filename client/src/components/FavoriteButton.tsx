import { Heart, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FavoriteButtonProps {
  videoId: number;
  className?: string;
  showCount?: boolean;
}

export function FavoriteButton({ videoId, className, showCount = false }: FavoriteButtonProps) {
  const { toast } = useToast();

  const { data: favoriteData, isLoading } = useQuery<{ isFavorite: boolean; count: number }>({
    queryKey: ["/api/favorites", videoId, "status"],
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (favoriteData?.isFavorite) {
        return apiRequest(`/api/favorites/${videoId}`, "DELETE");
      } else {
        return apiRequest("/api/favorites", "POST", { videoId });
      }
    },
    onSuccess: () => {
      const wasAdded = !favoriteData?.isFavorite;
      toast({
        title: wasAdded ? "Added to favorites" : "Removed from favorites",
        description: wasAdded 
          ? "Video has been added to your favorites." 
          : "Video has been removed from your favorites.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", videoId, "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update favorite status.",
        variant: "destructive",
      });
    },
  });

  const isFavorite = favoriteData?.isFavorite ?? false;
  const favoriteCount = favoriteData?.count ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => toggleFavoriteMutation.mutate()}
      disabled={isLoading || toggleFavoriteMutation.isPending}
      data-testid={`button-favorite-${videoId}`}
    >
      {toggleFavoriteMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} 
        />
      )}
      {showCount && favoriteCount > 0 && (
        <span className="ml-1 text-xs">{favoriteCount}</span>
      )}
    </Button>
  );
}
