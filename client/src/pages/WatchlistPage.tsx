import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ListVideo, 
  Heart, 
  Plus, 
  Trash2, 
  Edit2, 
  Globe, 
  Lock, 
  Play,
  MoreVertical,
  Loader2,
  Clock,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TopBar from "@/components/TopBar";
import NavigationHeader from "@/components/NavigationHeader";
import Footer from "@/components/Footer";

interface Watchlist {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  videoCount?: number;
}

interface WatchlistVideo {
  id: number;
  videoId: number;
  addedAt: string;
  video?: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    views: number;
    duration: number;
  };
}

interface Favorite {
  id: number;
  videoId: number;
  createdAt: string;
  video?: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    views: number;
    duration: number;
  };
}

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState("watchlists");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [viewWatchlistId, setViewWatchlistId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });
  const { toast } = useToast();

  const { data: watchlists = [], isLoading: watchlistsLoading } = useQuery<Watchlist[]>({
    queryKey: ["/api/watchlists"],
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<Favorite[]>({
    queryKey: ["/api/favorites"],
  });

  const { data: watchlistVideosData, isLoading: videosLoading } = useQuery<{ videos: WatchlistVideo[] }>({
    queryKey: ["/api/watchlists", viewWatchlistId, "videos"],
    enabled: !!viewWatchlistId,
  });

  const createWatchlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/watchlists", "POST", formData);
    },
    onSuccess: () => {
      toast({ title: "Watchlist created", description: "Your new watchlist has been created." });
      setCreateDialogOpen(false);
      setFormData({ name: "", description: "", isPublic: false });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create watchlist.", variant: "destructive" });
    },
  });

  const updateWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWatchlist) return;
      return apiRequest(`/api/watchlists/${selectedWatchlist.id}`, "PATCH", formData);
    },
    onSuccess: () => {
      toast({ title: "Watchlist updated", description: "Your watchlist has been updated." });
      setEditDialogOpen(false);
      setSelectedWatchlist(null);
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update watchlist.", variant: "destructive" });
    },
  });

  const deleteWatchlistMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWatchlist) return;
      return apiRequest(`/api/watchlists/${selectedWatchlist.id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Watchlist deleted", description: "Your watchlist has been deleted." });
      setDeleteDialogOpen(false);
      setSelectedWatchlist(null);
      if (viewWatchlistId === selectedWatchlist?.id) {
        setViewWatchlistId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete watchlist.", variant: "destructive" });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (videoId: number) => {
      return apiRequest(`/api/favorites/${videoId}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Removed from favorites", description: "Video has been removed from favorites." });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove from favorites.", variant: "destructive" });
    },
  });

  const removeFromWatchlistMutation = useMutation({
    mutationFn: async ({ watchlistId, videoId }: { watchlistId: number; videoId: number }) => {
      return apiRequest(`/api/watchlists/${watchlistId}/videos/${videoId}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Video removed", description: "Video has been removed from the watchlist." });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists", viewWatchlistId, "videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/watchlists"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove video.", variant: "destructive" });
    },
  });

  const watchlistVideos = watchlistVideosData?.videos || [];
  const selectedViewWatchlist = watchlists.find(w => w.id === viewWatchlistId);

  const handleEdit = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setFormData({
      name: watchlist.name,
      description: watchlist.description || "",
      isPublic: watchlist.isPublic,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (watchlist: Watchlist) => {
    setSelectedWatchlist(watchlist);
    setDeleteDialogOpen(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const VideoCard = ({ video, onRemove }: { video: { id: number; title: string; thumbnailUrl: string | null; views: number; duration: number }; onRemove: () => void }) => (
    <div className="flex gap-3 p-3 rounded-lg hover-elevate border" data-testid={`video-card-${video.id}`}>
      <div className="relative w-32 h-20 flex-shrink-0 rounded overflow-hidden bg-muted">
        {video.thumbnailUrl ? (
          <img 
            src={video.thumbnailUrl} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
          {formatDuration(video.duration)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/video/${video.id}`}>
          <h4 className="font-medium truncate hover:underline cursor-pointer">{video.title}</h4>
        </Link>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {video.views.toLocaleString()} views
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        data-testid={`button-remove-video-${video.id}`}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <NavigationHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Collections</h1>
            <p className="text-muted-foreground">Manage your watchlists and favorites</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-watchlist">
            <Plus className="h-4 w-4 mr-2" />
            New Watchlist
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="watchlists" className="gap-2" data-testid="tab-watchlists">
              <ListVideo className="h-4 w-4" />
              Watchlists ({watchlists.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2" data-testid="tab-favorites">
              <Heart className="h-4 w-4" />
              Favorites ({favorites.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlists" className="space-y-6">
            {viewWatchlistId && selectedViewWatchlist ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setViewWatchlistId(null)} data-testid="button-back-to-watchlists">
                    Back to Watchlists
                  </Button>
                  <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      {selectedViewWatchlist.name}
                      {selectedViewWatchlist.isPublic ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </h2>
                    {selectedViewWatchlist.description && (
                      <p className="text-sm text-muted-foreground">{selectedViewWatchlist.description}</p>
                    )}
                  </div>
                </div>

                {videosLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : watchlistVideos.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ListVideo className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No videos in this watchlist yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add videos by clicking the watchlist button on any video
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {watchlistVideos.map((item) => item.video && (
                      <VideoCard
                        key={item.id}
                        video={item.video}
                        onRemove={() => removeFromWatchlistMutation.mutate({ 
                          watchlistId: viewWatchlistId, 
                          videoId: item.videoId 
                        })}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {watchlistsLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-40" />
                    ))}
                  </div>
                ) : watchlists.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <ListVideo className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No watchlists yet</p>
                      <Button 
                        onClick={() => setCreateDialogOpen(true)} 
                        className="mt-4"
                        data-testid="button-create-first-watchlist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first watchlist
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {watchlists.map((watchlist) => (
                      <Card 
                        key={watchlist.id} 
                        className="hover-elevate cursor-pointer"
                        data-testid={`watchlist-card-${watchlist.id}`}
                      >
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setViewWatchlistId(watchlist.id)}
                          >
                            <CardTitle className="text-lg truncate">{watchlist.name}</CardTitle>
                            <CardDescription className="truncate mt-1">
                              {watchlist.description || "No description"}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(watchlist)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(watchlist)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardHeader>
                        <CardContent onClick={() => setViewWatchlistId(watchlist.id)}>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Play className="h-4 w-4" />
                              {watchlist.videoCount || 0} videos
                            </span>
                            {watchlist.isPublic ? (
                              <Badge variant="secondary" className="gap-1">
                                <Globe className="h-3 w-3" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Private
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-4">
            {favoritesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No favorites yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the heart icon on any video to add it to your favorites
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {favorites.map((favorite) => favorite.video && (
                  <VideoCard
                    key={favorite.id}
                    video={favorite.video}
                    onRemove={() => removeFavoriteMutation.mutate(favorite.videoId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                placeholder="Enter watchlist name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-create-watchlist-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description (optional)</Label>
              <Textarea
                id="create-description"
                placeholder="Enter a description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-create-watchlist-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="create-public">Make public</Label>
              <Switch
                id="create-public"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                data-testid="switch-create-watchlist-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createWatchlistMutation.mutate()}
              disabled={!formData.name.trim() || createWatchlistMutation.isPending}
              data-testid="button-submit-create-watchlist"
            >
              {createWatchlistMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-edit-watchlist-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-edit-watchlist-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-public">Make public</Label>
              <Switch
                id="edit-public"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                data-testid="switch-edit-watchlist-public"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateWatchlistMutation.mutate()}
              disabled={!formData.name.trim() || updateWatchlistMutation.isPending}
              data-testid="button-submit-edit-watchlist"
            >
              {updateWatchlistMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Watchlist</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{selectedWatchlist?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteWatchlistMutation.mutate()}
              disabled={deleteWatchlistMutation.isPending}
              data-testid="button-confirm-delete-watchlist"
            >
              {deleteWatchlistMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
