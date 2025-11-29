import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, UserPlus } from "lucide-react";
import type { VideoWithStats, Category } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";

interface VideoWithCreator extends VideoWithStats {
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  category?: Category;
  isFollowing?: boolean;
}

export default function TikTokFeed() {
  const { user: currentUser } = useAuth();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: videosData = [], isLoading } = useQuery<VideoWithCreator[]>({
    queryKey: queryKeys.videos.all,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  const { data: followingIds = [] } = useQuery<string[]>({
    queryKey: ["/api/user/following"],
    enabled: !!currentUser,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/user/follow`, "POST", { userId });
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/following"] });
      toast({
        title: "Following",
        description: "You are now following this creator",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/user/unfollow`, "POST", { userId });
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/following"] });
      toast({
        title: "Unfollowed",
        description: "You have unfollowed this creator",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        setCurrentVideoIndex((prev) =>
          prev < videosData.length - 1 ? prev + 1 : prev
        );
      } else {
        setCurrentVideoIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setCurrentVideoIndex((prev) =>
          prev < videosData.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        setCurrentVideoIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [videosData.length]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-white">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (videosData.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <p className="text-lg">No videos available</p>
        </div>
      </div>
    );
  }

  const video = videosData[currentVideoIndex];
  const category = categories.find((c) => c.id === video.categoryId);
  const isFollowing = followingIds.includes(video.userId);

  return (
    <div
      ref={containerRef}
      className="h-screen bg-black overflow-hidden snap-y snap-mandatory"
    >
      <div className="h-screen flex flex-col items-center justify-center relative">
        {/* Video Player */}
        <video
          key={video.id}
          src={video.videoUrl}
          className="w-full h-full object-contain"
          controls
          autoPlay
          data-testid={`video-${video.id}`}
        />

        {/* Creator Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              {/* Creator Profile */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary">
                  <AvatarImage src={video.creator?.profileImageUrl} />
                  <AvatarFallback className="bg-primary text-white">
                    {video.creator?.firstName?.[0]}
                    {video.creator?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">
                    {video.creator?.firstName} {video.creator?.lastName}
                  </h3>
                  {category && (
                    <Badge variant="secondary" className="mt-1">
                      {category.name}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Video Title */}
              {video.title && (
                <p className="text-white text-sm line-clamp-2 mb-3">
                  {video.title}
                </p>
              )}
            </div>

            {/* Follow Button */}
            {currentUser?.id !== video.userId && (
              <Button
                size="icon"
                variant={isFollowing ? "outline" : "default"}
                onClick={() => {
                  if (isFollowing) {
                    unfollowMutation.mutate(video.userId);
                  } else {
                    followMutation.mutate(video.userId);
                  }
                }}
                disabled={
                  followMutation.isPending || unfollowMutation.isPending
                }
                className="rounded-full h-12 w-12"
                data-testid={`button-follow-${video.userId}`}
              >
                {isFollowing ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Video Counter */}
        <div className="absolute top-6 right-6 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
          {currentVideoIndex + 1} / {videosData.length}
        </div>

        {/* Navigation Hint */}
        {videosData.length > 1 && (
          <div className="absolute bottom-6 right-6 text-white/60 text-xs text-center">
            <p>Scroll or use</p>
            <p>arrow keys</p>
          </div>
        )}
      </div>
    </div>
  );
}
