import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Award, TrendingUp, Star } from "lucide-react";
import type { JudgeProfile } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Judges() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: judges, isLoading } = useQuery<JudgeProfile[]>({
    queryKey: ['/api/judges'],
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold" data-testid="heading-judges">
              {t('judges.title')}
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-judges-description">
            {t('judges.description')}
          </p>
        </div>

        {/* Judges Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !judges || judges.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t('judges.emptyTitle')}</h3>
              <p className="text-muted-foreground">
                {t('judges.emptyDescription')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {judges.map((judge) => {
              const displayName = judge.judgeName || `${judge.firstName} ${judge.lastName}`;
              const initials = judge.judgeName
                ? judge.judgeName.slice(0, 2).toUpperCase()
                : `${judge.firstName[0]}${judge.lastName[0]}`.toUpperCase();

              return (
                <Card
                  key={judge.id}
                  className="hover-elevate active-elevate-2 cursor-pointer transition-all group"
                  onClick={() => setLocation(`/judges/${judge.id}`)}
                  data-testid={`card-judge-${judge.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="w-24 h-24 mb-4 border-2 border-border">
                        <AvatarImage src={judge.judgePhotoUrl || undefined} alt={displayName} />
                        <AvatarFallback className="text-2xl">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-xl mb-1" data-testid={`text-judge-name-${judge.id}`}>
                        {displayName}
                      </CardTitle>
                      <CardDescription>
                        {t('judges.judgeRole')}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {judge.judgeBio ? (
                      <p className="text-sm text-muted-foreground text-center line-clamp-3 mb-4" data-testid={`text-judge-bio-${judge.id}`}>
                        {judge.judgeBio}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center italic mb-4">
                        {t('judges.noBio')}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full group-hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/judges/${judge.id}`);
                      }}
                      data-testid={`button-view-judge-${judge.id}`}
                    >
                      {t('judges.viewProfile')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
