import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video } from "lucide-react";
import type { Category } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

import musicImage from "@assets/generated_images/male_vocalist_performing_on_stage.png";
import comedyImage from "@assets/generated_images/comedy_performer_on_stage.png";
import fashionImage from "@assets/generated_images/black_female_fashion_beauty_creator.png";
import educationImage from "@assets/generated_images/black_male_educational_content_creator.png";
import gospelImage from "@assets/generated_images/gospel_choir_performing_together.png";

const categoryImages: Record<string, string> = {
  "Music & Dance": musicImage,
  "Comedy & Performing Arts": comedyImage,
  "Fashion & Lifestyle": fashionImage,
  "Education & Learning": educationImage,
  "Gospel Choirs": gospelImage,
};

export default function Categories() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: videoCounts } = useQuery<Record<string, number>>({
    queryKey: ["/api/categories/video-counts"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    staleTime: 2000, // Consider data stale after 2 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{t('categories.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl uppercase tracking-wide mb-4">
                {t('categories.pageTitle')}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                {t('categories.pageDescription')}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {categories?.map((category) => (
                <Card 
                  key={category.id} 
                  className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all"
                  onClick={() => setLocation(`/category/${category.id}`)}
                  data-testid={`card-category-${category.id}`}
                >
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={categoryImages[category.name] || musicImage}
                      alt={category.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-2xl text-white font-bold uppercase">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {category.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.subcategories.slice(0, 3).map((sub) => (
                        <Badge key={sub} variant="outline" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                      {category.subcategories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.subcategories.length - 3} {t('categories.moreSubcategories')}
                        </Badge>
                      )}
                    </div>
                    <div className="mb-4 pt-2 border-t">
                      <p className="text-sm text-muted-foreground" data-testid={`text-video-count-${category.id}`}>
                        {videoCounts?.[category.id] || 0} {(videoCounts?.[category.id] || 0) !== 1 ? t('categories.videoCountPlural') : t('categories.videoCount')}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full group/btn"
                      onClick={() => setLocation(`/category/${category.id}`)}
                      data-testid={`button-view-category-${category.id}`}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      {t('categories.viewVideosButton')}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
    </div>
  );
}
