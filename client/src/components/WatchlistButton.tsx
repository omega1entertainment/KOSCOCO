import { useState } from "react";
import { Plus, Check, ListPlus, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Watchlist {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  videoCount: number;
}

interface WatchlistButtonProps {
  videoId: number;
  className?: string;
}

export function WatchlistButton({ videoId, className }: WatchlistButtonProps) {
  const [open, setOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const { toast } = useToast();

  const { data: watchlists = [], isLoading: watchlistsLoading } = useQuery<Watchlist[]>({
    queryKey: ["/api/watchlists"],
  });

  const { data: videoInWatchlistsData } = useQuery<{ watchlistIds: number[] }>({
    queryKey: ["/api/watchlists", "video", videoId],
    enabled: open,
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async (watchlistId: number) => {
      return apiRequest(`/api/watchlists/${watchlistId}/videos`, "POST", { videoId });
    },
    onSuccess: (_, watchlistId) => {
      toast({
        title: "Added to watchlist",
        description: "Video has been added to your watchlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists/video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists", watchlistId, "videos"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add video to watchlist.",
        variant: "destructive",
      });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (watchlistId: number) => {
      return apiRequest(`/api/watchlists/${watchlistId}/videos/${videoId}`, "DELETE");
    },
    onSuccess: (_, watchlistId) => {
      toast({
        title: "Removed from watchlist",
        description: "Video has been removed from your watchlist.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists/video", videoId] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists", watchlistId, "videos"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove video from watchlist.",
        variant: "destructive",
      });
    },
  });

  const createWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/watchlists", "POST", {
        name: newWatchlistName,
        description: newWatchlistDescription || null,
        isPublic: false,
      });
    },
    onSuccess: () => {
      toast({
        title: "Watchlist created",
        description: "Your new watchlist has been created.",
      });
      setNewWatchlistName("");
      setNewWatchlistDescription("");
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create watchlist.",
        variant: "destructive",
      });
    },
  });

  const videoInWatchlists = videoInWatchlistsData?.watchlistIds || [];

  const handleWatchlistClick = (watchlistId: number) => {
    if (videoInWatchlists.includes(watchlistId)) {
      removeFromWatchlistMutation.mutate(watchlistId);
    } else {
      addToWatchlistMutation.mutate(watchlistId);
    }
  };

  const handleCreateWatchlist = () => {
    if (newWatchlistName.trim()) {
      createWatchlistMutation.mutate();
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={className}
            data-testid="button-add-to-watchlist"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {watchlistsLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : watchlists.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No watchlists yet
            </div>
          ) : (
            watchlists.map((watchlist) => (
              <DropdownMenuItem
                key={watchlist.id}
                onClick={() => handleWatchlistClick(watchlist.id)}
                className="flex items-center justify-between cursor-pointer"
                data-testid={`watchlist-option-${watchlist.id}`}
              >
                <span className="truncate">{watchlist.name}</span>
                {videoInWatchlists.includes(watchlist.id) ? (
                  <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                ) : (
                  <Plus className="h-4 w-4 ml-2 flex-shrink-0 opacity-50" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateDialogOpen(true)}
            className="cursor-pointer"
            data-testid="button-create-new-watchlist"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create new watchlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="watchlist-name">Name</Label>
              <Input
                id="watchlist-name"
                placeholder="Enter watchlist name"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                data-testid="input-watchlist-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="watchlist-description">Description (optional)</Label>
              <Textarea
                id="watchlist-description"
                placeholder="Enter a description"
                value={newWatchlistDescription}
                onChange={(e) => setNewWatchlistDescription(e.target.value)}
                data-testid="input-watchlist-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              data-testid="button-cancel-create-watchlist"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWatchlist}
              disabled={!newWatchlistName.trim() || createWatchlistMutation.isPending}
              data-testid="button-submit-create-watchlist"
            >
              {createWatchlistMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
