import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Sparkles, 
  X, 
  Play,
  Eye,
  ThumbsUp,
  Clock,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RecommendedVideo {
  id: string;
  videoId: string;
  score: number;
  reason: string | null;
  shown: boolean;
  clicked: boolean;
  dismissed: boolean;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    views: number;
    duration: number;
    categoryId: string;
  };
}

interface RecommendedVideosProps {
  limit?: number;
  showTitle?: boolean;
  horizontal?: boolean;
}

export function RecommendedVideos({ 
  limit = 6, 
  showTitle = true,
  horizontal = false 
}: RecommendedVideosProps) {
  const { toast } = useToast();

  const { data: recommendations = [], isLoading, refetch, isFetching } = useQuery<RecommendedVideo[]>({
    queryKey: ["/api/recommendations"],
  });

  const markClickedMutation = useMutation({
    mutationFn: async (recId: string) => {
      return apiRequest(`/api/recommendations/${recId}/click`, "POST");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (recId: string) => {
      return apiRequest(`/api/recommendations/${recId}/dismiss`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to dismiss recommendation.", 
        variant: "destructive" 
      });
    },
  });

  const handleVideoClick = (rec: RecommendedVideo) => {
    markClickedMutation.mutate(rec.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const displayedRecommendations = recommendations.slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recommended for You</h2>
          </div>
        )}
        <div className={horizontal ? "flex gap-4 overflow-x-auto pb-4" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
          {[1, 2, 3, 4, 5, 6].slice(0, limit).map((i) => (
            <Skeleton key={i} className={horizontal ? "w-64 h-48 flex-shrink-0" : "h-48"} />
          ))}
        </div>
      </div>
    );
  }

  if (displayedRecommendations.length === 0) {
    return null;
  }

  const VideoCard = ({ rec }: { rec: RecommendedVideo }) => (
    <Card 
      className={`group relative overflow-hidden hover-elevate ${horizontal ? "w-64 flex-shrink-0" : ""}`}
      data-testid={`recommendation-${rec.id}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dismissMutation.mutate(rec.id);
        }}
        data-testid={`button-dismiss-${rec.id}`}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <Link 
        href={`/video/${rec.video.id}`} 
        onClick={() => handleVideoClick(rec)}
      >
        <div className="relative aspect-video bg-muted">
          {rec.video.thumbnailUrl ? (
            <img 
              src={rec.video.thumbnailUrl} 
              alt={rec.video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(rec.video.duration)}
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {rec.video.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatViews(rec.video.views)}
            </span>
          </div>
          {rec.reason && (
            <Badge variant="outline" className="mt-2 text-xs">
              {rec.reason}
            </Badge>
          )}
        </CardContent>
      </Link>
    </Card>
  );

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Recommended for You</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh-recommendations"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      )}

      {horizontal ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {displayedRecommendations.map((rec) => (
              <VideoCard key={rec.id} rec={rec} />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedRecommendations.map((rec) => (
            <VideoCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
