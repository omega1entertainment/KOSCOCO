import { Trophy, Medal, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import grandFinaleImg from "@assets/generated_images/grand_finale_winner_trophy.png";
import top3Img from "@assets/generated_images/top_3_winners_podium_medals.png";
import top10Img from "@assets/generated_images/top_10_finalists_rewards_display.png";

export default function Prizes() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const prizeStructure = [
    {
      phase: t('prizes.grandFinale.phase'),
      badge: t('prizes.grandFinale.badge'),
      image: grandFinaleImg,
      prize: t('prizes.grandFinale.prize'),
      description: t('prizes.grandFinale.description'),
      icon: Trophy,
      gradient: "from-yellow-400 to-yellow-600",
    },
    {
      phase: t('prizes.top3.phase'),
      badge: t('prizes.top3.badge'),
      image: top3Img,
      prize: t('prizes.top3.prize'),
      description: t('prizes.top3.description'),
      icon: Medal,
      gradient: "from-gray-300 to-gray-500",
      secondary: [
        { place: t('prizes.top3.secondPlace'), amount: t('prizes.top3.secondPrize') },
        { place: t('prizes.top3.thirdPlace'), amount: t('prizes.top3.thirdPrize') },
      ],
    },
    {
      phase: t('prizes.top10.phase'),
      badge: t('prizes.top10.badge'),
      image: top10Img,
      prize: t('prizes.top10.prize'),
      description: t('prizes.top10.description'),
      icon: Award,
      gradient: "from-orange-400 to-orange-600",
    },
  ];

  const categories = [
    t('prizes.categories.musicDance'),
    t('prizes.categories.comedyPerforming'),
    t('prizes.categories.fashionLifestyle'),
    t('prizes.categories.educationLearning'),
    t('prizes.categories.gospelChoirs'),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge 
              variant="destructive" 
              className="mb-4 text-sm font-bold"
              data-testid="badge-prizes-hero"
            >
              {t('prizes.hero.badge')}
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4" data-testid="heading-prizes">
              {t('prizes.hero.title')}
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-prizes-description">
              {t('prizes.hero.description')}
            </p>
          </div>
        </section>

        {/* Prize Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="space-y-8">
              {prizeStructure.map((prize, index) => (
                <Card 
                  key={index} 
                  className="overflow-hidden"
                  data-testid={`card-prize-${index}`}
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="relative h-64 md:h-auto bg-muted">
                      <img
                        src={prize.image}
                        alt={prize.phase}
                        className="w-full h-full object-cover"
                        data-testid={`img-prize-${index}`}
                      />
                      {index === 0 && (
                        <div className="absolute inset-0 flex items-end justify-center pb-4 bg-gradient-to-t from-black/70 to-transparent">
                          <span 
                            className="text-white text-xl md:text-2xl font-bold text-center drop-shadow-lg px-4"
                            data-testid="text-ultimate-prize"
                          >
                            Ultimate Prize 5 Million FCFA
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col justify-center">
                      <Badge 
                        variant="outline" 
                        className="w-fit mb-3"
                        data-testid={`badge-prize-phase-${index}`}
                      >
                        {prize.badge}
                      </Badge>
                      
                      <h2 
                        className="text-3xl font-bold mb-3 flex items-center gap-2"
                        data-testid={`heading-prize-phase-${index}`}
                      >
                        <prize.icon className="w-8 h-8 text-primary" />
                        {prize.phase}
                      </h2>

                      <div className={`inline-flex items-center gap-2 text-4xl font-bold bg-gradient-to-r ${prize.gradient} bg-clip-text text-transparent mb-4 w-fit`}>
                        <span data-testid={`text-prize-amount-${index}`}>{prize.prize}</span>
                      </div>

                      <p 
                        className="text-muted-foreground text-lg mb-4"
                        data-testid={`text-prize-desc-${index}`}
                      >
                        {prize.description}
                      </p>

                      {prize.secondary && (
                        <div className="space-y-2 mt-4 pt-4 border-t">
                          <p className="font-semibold text-sm text-muted-foreground">{t('prizes.top3.additionalPrizesLabel')}</p>
                          {prize.secondary.map((sec, i) => (
                            <div 
                              key={i} 
                              className="flex justify-between items-center"
                              data-testid={`text-secondary-prize-${index}-${i}`}
                            >
                              <span className="font-medium">{sec.place}</span>
                              <span className="text-primary font-bold">{sec.amount}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4" data-testid="heading-categories">
              {t('prizes.categoriesSection.title')}
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('prizes.categoriesSection.description')}
            </p>
            
            <div className="grid md:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {categories.map((category, index) => (
                <Card 
                  key={index}
                  className="text-center hover-elevate"
                  data-testid={`card-category-${index}`}
                >
                  <CardHeader>
                    <CardTitle className="text-sm">{category}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Total Prize Pool */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
              <CardHeader>
                <CardDescription className="text-sm">{t('prizes.totalPool.label')}</CardDescription>
                <CardTitle className="text-5xl font-bold text-primary" data-testid="text-total-pool">
                  {t('prizes.totalPool.amount')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t('prizes.totalPool.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">{t('prizes.cta.title')}</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              {t('prizes.cta.description')}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setLocation("/register")}
                className="bg-white text-primary px-8 py-3 rounded-md font-bold hover:bg-white/90 transition-colors"
                data-testid="button-register-now"
              >
                {t('prizes.cta.registerButton')}
              </button>
              <button
                onClick={() => setLocation("/categories")}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-3 rounded-md font-bold hover:bg-white/20 transition-colors"
                data-testid="button-view-categories"
              >
                {t('prizes.cta.viewCategoriesButton')}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
