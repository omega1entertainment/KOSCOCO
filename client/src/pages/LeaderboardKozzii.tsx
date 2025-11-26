import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, TrendingUp, Gift, Heart, Eye, Check } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

interface TopCreator extends User {
  followerCount: number;
  videoCount: number;
  totalEarnings: number;
}

export default function LeaderboardKozzii() {
  const [, setLocation] = useLocation();
  const [metric, setMetric] = useState<'views' | 'likes' | 'votes' | 'gifts'>('views');

  const { data: topCreators = [], isLoading: creatorsLoading } = useQuery<TopCreator[]>({
    queryKey: ['/api/leaderboard/top-creators'],
  });

  const { data: topVideos = [], isLoading: videosLoading } = useQuery<any[]>({
    queryKey: [`/api/leaderboard/top-videos/${metric}`],
  });

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'views':
        return <Eye className="w-4 h-4" />;
      case 'likes':
        return <Heart className="w-4 h-4" />;
      case 'votes':
        return <Check className="w-4 h-4" />;
      case 'gifts':
        return <Gift className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3" data-testid="text-kozzii-leaderboard-title">
            <Trophy className="w-10 h-10 text-yellow-500" />
            KOZZII Leaderboards
          </h1>
          <p className="text-muted-foreground">
            Discover the top creators and trending videos on the platform
          </p>
        </div>

        <Tabs defaultValue="creators" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" data-testid="tabs-leaderboard">
            <TabsTrigger value="creators" data-testid="tab-top-creators">
              <Users className="w-4 h-4 mr-2" />
              Top Creators
            </TabsTrigger>
            <TabsTrigger value="videos" data-testid="tab-top-videos">
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="creators" className="space-y-4">
            {creatorsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCreators.map((creator, index) => (
                  <Card key={creator.id} className="hover-elevate cursor-pointer" data-testid={`card-creator-${index + 1}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={creator.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {creator.firstName?.charAt(0)}{creator.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-1 -right-1 bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              #{index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate" data-testid={`text-creator-name-${index + 1}`}>
                              {creator.username || `${creator.firstName || ''} ${creator.lastName || ''}`.trim()}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">@{creator.username || 'user'}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground text-xs">Followers</p>
                          <p className="font-semibold" data-testid={`text-followers-${index + 1}`}>
                            {formatNumber(creator.followerCount)}
                          </p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                          <p className="text-muted-foreground text-xs">Videos</p>
                          <p className="font-semibold" data-testid={`text-videos-${index + 1}`}>
                            {creator.videoCount}
                          </p>
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-muted-foreground text-xs">Total Earnings</p>
                        <p className="font-semibold text-primary" data-testid={`text-earnings-${index + 1}`}>
                          {formatNumber(creator.totalEarnings)} XAF
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="flex gap-2 mb-4">
              {(['views', 'likes', 'votes', 'gifts'] as const).map((m) => (
                <Button
                  key={m}
                  variant={metric === m ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMetric(m)}
                  data-testid={`button-metric-${m}`}
                  className="gap-2"
                >
                  {getMetricIcon(m)}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Button>
              ))}
            </div>

            {videosLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {topVideos.map((video, index) => (
                  <Card
                    key={video.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setLocation(`/video/${video.id}`)}
                    data-testid={`card-video-${index + 1}`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
                      <div className="md:col-span-1 flex items-center justify-center">
                        <div className="text-2xl font-bold text-yellow-500">#{index + 1}</div>
                      </div>

                      <div className="md:col-span-3">
                        <div className="aspect-video bg-black rounded-md overflow-hidden">
                          <video className="w-full h-full object-cover">
                            <source src={video.videoUrl} type="video/mp4" />
                          </video>
                        </div>
                      </div>

                      <div className="md:col-span-8">
                        <h3 className="text-lg font-semibold mb-2" data-testid={`text-video-title-${index + 1}`}>
                          {video.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {video.description}
                        </p>

                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-blue-500" />
                            <span data-testid={`text-views-${index + 1}`}>
                              {formatNumber(video.views)} views
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span data-testid={`text-likes-${index + 1}`}>
                              {formatNumber(video.likeCount || 0)} likes
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Check className="w-4 h-4 text-green-500" />
                            <span data-testid={`text-votes-${index + 1}`}>
                              {formatNumber(video.voteCount || 0)} votes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
