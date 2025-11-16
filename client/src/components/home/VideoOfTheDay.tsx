import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Star, ThumbsUp, Trophy } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { VideoWithStats, Category } from "@shared/schema";

export default function VideoOfTheDay() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: video, isLoading } = useQuery<VideoWithStats>({
    queryKey: ["/api/videos/video-of-the-day"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!video) {
    return null;
  }

  const category = categories.find((c) => c.id === video.categoryId);

  return (
    <section className="py-12 bg-gradient-to-b from-muted/50 to-background" data-testid="section-video-of-the-day">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">
              {t('home.videoOfTheDay.title')}
            </h2>
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">
            {t('home.videoOfTheDay.description')}
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden hover-elevate" data-testid="card-video-of-the-day">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative aspect-video md:aspect-auto bg-muted group">
              {video.thumbnailUrl ? (
                <>
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <Button
                      size="icon"
                      className="w-16 h-16 rounded-full"
                      onClick={() => setLocation(`/videos/${video.id}`)}
                      data-testid="button-play-video"
                    >
                      <Play className="w-8 h-8 fill-current" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            <CardContent className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {category && (
                    <Badge variant="default" data-testid="badge-category">
                      {category.name}
                    </Badge>
                  )}
                  <Badge variant="outline" data-testid="badge-featured">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {t('home.videoOfTheDay.featured')}
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold mb-3" data-testid="text-video-title">
                  {video.title}
                </h3>

                {video.description && (
                  <p className="text-muted-foreground mb-4 line-clamp-3" data-testid="text-video-description">
                    {video.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span data-testid="text-like-count">{video.likeCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    <span data-testid="text-vote-count">{video.voteCount || 0}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setLocation(`/videos/${video.id}`)}
                data-testid="button-watch-now"
              >
                <Play className="w-4 h-4 mr-2" />
                {t('home.videoOfTheDay.watchNow')}
              </Button>
            </CardContent>
          </div>
        </Card>
      </div>
    </section>
  );
}
