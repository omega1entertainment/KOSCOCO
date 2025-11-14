import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Award, Video, Star, TrendingUp } from "lucide-react";
import type { JudgeWithStats } from "@shared/schema";

export default function JudgeProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: judge, isLoading } = useQuery<JudgeWithStats>({
    queryKey: ['/api/judges', id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="animate-pulse">
            <CardContent className="p-12">
              <div className="w-32 h-32 bg-muted rounded-full mx-auto mb-6"></div>
              <div className="h-8 bg-muted rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-8"></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!judge) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold mb-2">Judge Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The judge you're looking for doesn't exist
              </p>
              <Button onClick={() => setLocation("/judges")} data-testid="button-back-to-judges">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Judges
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayName = judge.judgeName || `${judge.firstName} ${judge.lastName}`;
  const initials = judge.judgeName
    ? judge.judgeName.slice(0, 2).toUpperCase()
    : `${judge.firstName[0]}${judge.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/judges")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Judges
        </Button>

        {/* Judge Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-32 h-32 border-2 border-border">
                <AvatarImage src={judge.judgePhotoUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-4xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold" data-testid="text-judge-name">
                    {displayName}
                  </h1>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Competition Judge
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {judge.email}
                </p>
                {judge.judgeBio ? (
                  <p className="text-muted-foreground" data-testid="text-judge-bio">
                    {judge.judgeBio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No bio available
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Judging Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Videos Scored */}
              <Card data-testid="card-stat-videos-scored">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Videos Scored
                  </CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-videos-scored">
                    {judge.totalVideosScored}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total evaluations
                  </p>
                </CardContent>
              </Card>

              {/* Average Creativity Score */}
              <Card data-testid="card-stat-creativity">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Creativity
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-creativity">
                    {judge.averageCreativityScore ? judge.averageCreativityScore.toFixed(1) : 'N/A'}/10
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average score given
                  </p>
                </CardContent>
              </Card>

              {/* Average Quality Score */}
              <Card data-testid="card-stat-quality">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Quality
                  </CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-avg-quality">
                    {judge.averageQualityScore ? judge.averageQualityScore.toFixed(1) : 'N/A'}/10
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average score given
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Overall Average */}
            <Card className="mt-4 bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Overall Average Score
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Combined creativity and quality
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-primary" data-testid="text-overall-avg">
                    {(judge.averageCreativityScore && judge.averageQualityScore) 
                      ? ((judge.averageCreativityScore + judge.averageQualityScore) / 2).toFixed(1) 
                      : 'N/A'}/10
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
