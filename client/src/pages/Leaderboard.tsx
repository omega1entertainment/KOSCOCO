import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Check, Eye, Play, Star, Award, Heart } from "lucide-react";
import { useState } from "react";
import type { LeaderboardEntry, Category, Phase } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPermalink } from "@/lib/slugUtils";

export default function Leaderboard() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: phases = [] } = useQuery<Phase[]>({
    queryKey: ["/api/phases"],
  });

  const queryParams = new URLSearchParams();
  if (selectedCategory !== "all") {
    queryParams.set("categoryId", selectedCategory);
  }
  if (selectedPhase !== "all") {
    queryParams.set("phaseId", selectedPhase);
  }
  const queryString = queryParams.toString();
  const leaderboardUrl = `/api/leaderboard${queryString ? `?${queryString}` : ""}`;

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: [leaderboardUrl],
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || t('leaderboard.unknownCategory');
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-600";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2" data-testid="text-leaderboard-title">
              <Trophy className="w-8 h-8 text-yellow-500" />
              {t('leaderboard.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('leaderboard.description')}
            </p>
          </div>

          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-64" data-testid="select-category">
                <SelectValue placeholder={t('leaderboard.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('leaderboard.allCategories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger className="w-full md:w-64" data-testid="select-phase">
                <SelectValue placeholder={t('leaderboard.selectPhase')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('leaderboard.allPhases')}</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">{t('leaderboard.loading')}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">{t('leaderboard.emptyTitle')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('leaderboard.emptyDescription')}
                </p>
                <Button onClick={() => setLocation("/upload")} data-testid="button-upload-first">
                  {t('leaderboard.uploadYourVideo')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((video) => {
                const rank = video.rank;
                const videoUrl = video.videoUrl.startsWith('/objects/') 
                  ? video.videoUrl 
                  : `/objects/${video.videoUrl}`;

                // Calculate contributions to overall score
                // Judge scores are in 0-10 scale, multiply by 10 to get 0-100 scale
                const voteContribution = 0.60 * video.normalizedVotes;
                const creativityContribution = 0.30 * (video.avgCreativityScore * 10);
                const qualityContribution = 0.10 * (video.avgQualityScore * 10);

                return (
                  <Card 
                    key={video.id} 
                    className={`overflow-hidden hover-elevate cursor-pointer ${rank <= 3 ? 'border-primary/50' : ''}`}
                    onClick={() => setLocation(`/video/${createPermalink(video.id, video.title)}`)}
                    data-testid={`card-video-${rank}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                      <div className="md:col-span-1 flex items-center justify-center">
                        <div className={`text-2xl md:text-3xl lg:text-4xl font-bold ${getRankColor(rank)}`}>
                          #{rank}
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <div className="aspect-video bg-black rounded-md overflow-hidden relative group">
                          <video className="w-full h-full object-cover">
                            <source src={videoUrl} type="video/mp4" />
                          </video>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-8">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-1" data-testid={`text-video-title-${rank}`}>
                              {video.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">{getCategoryName(video.categoryId)}</Badge>
                              <Badge variant="outline">{video.subcategory}</Badge>
                              <Badge variant="default" className="font-bold" data-testid={`badge-overall-score-${rank}`}>
                                {video.overallScore.toFixed(1)}% {t('leaderboard.overall')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {video.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {video.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 font-semibold text-primary" data-testid={`text-votes-${rank}`}>
                              <Check className="w-4 h-4" />
                              {video.voteCount.toLocaleString()} {t('leaderboard.votes').toLowerCase()}
                            </div>
                            <div className="flex items-center gap-1 text-red-500" data-testid={`text-likes-${rank}`}>
                              <Heart className="w-4 h-4 fill-red-500" />
                              {video.likeCount.toLocaleString()} {t('leaderboard.likes')}
                            </div>
                            <div className="flex items-center gap-1" data-testid={`text-creativity-${rank}`}>
                              <Star className="w-4 h-4 text-yellow-500" />
                              {video.avgCreativityScore.toFixed(1)}/10 {t('leaderboard.creativity')}
                            </div>
                            <div className="flex items-center gap-1" data-testid={`text-quality-${rank}`}>
                              <Award className="w-4 h-4 text-blue-500" />
                              {video.avgQualityScore.toFixed(1)}/10 {t('leaderboard.quality')}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              {video.views.toLocaleString()} {t('leaderboard.views')}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground flex gap-3">
                            <span>{t('leaderboard.scoreBreakdown.votes')} {voteContribution.toFixed(1)}%</span>
                            <span>{t('leaderboard.scoreBreakdown.creativity')} {creativityContribution.toFixed(1)}%</span>
                            <span>{t('leaderboard.scoreBreakdown.quality')} {qualityContribution.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
