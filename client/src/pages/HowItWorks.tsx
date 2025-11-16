import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy,
  Users,
  DollarSign,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Award
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import stepImage1 from "@assets/generated_images/Registration_and_category_selection_1a167c42.png";
import stepImage2 from "@assets/generated_images/Video_upload_and_content_creation_862fb653.png";
import stepImage3 from "@assets/generated_images/Content_approval_and_moderation_42c462a4.png";
import stepImage4 from "@assets/generated_images/Public_voting_and_engagement_8d98442c.png";
import stepImage5 from "@assets/generated_images/Phase_progression_and_advancement_c5aa149a.png";
import stepImage6 from "@assets/generated_images/Winning_prizes_and_celebration_eac6a499.png";

export default function HowItWorks() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const steps = [
    {
      number: "01",
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      image: stepImage1,
      highlights: [
        t('howItWorks.step1.highlight1'),
        t('howItWorks.step1.highlight2'),
        t('howItWorks.step1.highlight3'),
        t('howItWorks.step1.highlight4'),
        t('howItWorks.step1.highlight5')
      ]
    },
    {
      number: "02",
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      image: stepImage2,
      highlights: [
        t('howItWorks.step2.highlight1'),
        t('howItWorks.step2.highlight2'),
        t('howItWorks.step2.highlight3')
      ]
    },
    {
      number: "03",
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      image: stepImage3,
      highlights: [
        t('howItWorks.step3.highlight1'),
        t('howItWorks.step3.highlight2'),
        t('howItWorks.step3.highlight3')
      ]
    },
    {
      number: "04",
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
      image: stepImage4,
      highlights: [
        t('howItWorks.step4.highlight1'),
        t('howItWorks.step4.highlight2'),
        t('howItWorks.step4.highlight3')
      ]
    },
    {
      number: "05",
      title: t('howItWorks.step5.title'),
      description: t('howItWorks.step5.description'),
      image: stepImage5,
      highlights: [
        t('howItWorks.step5.highlight1'),
        t('howItWorks.step5.highlight2'),
        t('howItWorks.step5.highlight3')
      ]
    },
    {
      number: "06",
      title: t('howItWorks.step6.title'),
      description: t('howItWorks.step6.description'),
      image: stepImage6,
      highlights: [
        t('howItWorks.step6.highlight1'),
        t('howItWorks.step6.highlight2'),
        t('howItWorks.step6.highlight3')
      ]
    }
  ];

  const features = [
    { icon: Users, title: t('howItWorks.features.categories.title'), description: t('howItWorks.features.categories.description') },
    { icon: Trophy, title: t('howItWorks.features.phases.title'), description: t('howItWorks.features.phases.description') },
    { icon: Sparkles, title: t('howItWorks.features.voting.title'), description: t('howItWorks.features.voting.description') },
    { icon: Award, title: t('howItWorks.features.judges.title'), description: t('howItWorks.features.judges.description') }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <Sparkles className="w-16 h-16 text-primary mx-auto" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6" data-testid="heading-how-it-works">
              {t('howItWorks.hero.title')}
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-8">
              {t('howItWorks.hero.subtitle')}
            </p>
            <div>
              <Button 
                size="lg" 
                onClick={() => setLocation("/register")}
                className="group"
                data-testid="button-get-started"
              >
                {t('howItWorks.hero.getStarted')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Competition Stats */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index}>
                  <Card className="text-center hover-elevate">
                    <CardContent className="pt-6">
                      <div>
                        <Icon className="w-12 h-12 text-primary mx-auto mb-3" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">{t('howItWorks.steps.badge')}</Badge>
            <h2 className="text-4xl font-bold mb-4">{t('howItWorks.steps.heading')}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('howItWorks.steps.description')}
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-12">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div key={index}>
                  <Card className="overflow-hidden">
                    <div className={`grid md:grid-cols-2 gap-0 ${isEven ? '' : 'md:flex-row-reverse'}`}>
                      {/* Content Side */}
                      <div className={`p-8 flex flex-col justify-center ${isEven ? 'md:order-1' : 'md:order-2'}`}>
                        <div>
                          <span className="inline-block bg-primary text-white text-4xl font-bold px-4 py-2 rounded-lg mb-4">
                            {step.number}
                          </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                        <p className="text-muted-foreground mb-6">{step.description}</p>
                        
                        <div className="space-y-2">
                          {step.highlights.map((highlight, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Image Side */}
                      <div className={`relative overflow-hidden bg-muted p-0 flex items-center justify-center ${isEven ? 'md:order-2' : 'md:order-1'}`}>
                        <img
                          src={step.image}
                          alt={step.title}
                          width={800}
                          height={488}
                          className="w-full h-full object-cover"
                          style={{ maxWidth: '800px', maxHeight: '488px' }}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scoring Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('howItWorks.scoring.heading')}</h2>
            <p className="text-muted-foreground text-lg">{t('howItWorks.scoring.description')}</p>
          </div>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            <div>
              <Card className="text-center h-full">
                <CardHeader>
                  <div className="mx-auto mb-4 relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Users className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-5xl font-bold text-primary mb-2">60%</CardTitle>
                  <CardTitle>{t('howItWorks.scoring.publicVotes.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('howItWorks.scoring.publicVotes.description')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="text-center h-full">
                <CardHeader>
                  <div className="mx-auto mb-4 relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-5xl font-bold text-primary mb-2">30%</CardTitle>
                  <CardTitle>{t('howItWorks.scoring.creativity.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('howItWorks.scoring.creativity.description')}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="text-center h-full">
                <CardHeader>
                  <div className="mx-auto mb-4 relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                      <Award className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-5xl font-bold text-primary mb-2">10%</CardTitle>
                  <CardTitle>{t('howItWorks.scoring.quality.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {t('howItWorks.scoring.quality.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block mb-6">
              <Trophy className="w-20 h-20 text-primary mx-auto" />
            </div>
            
            <h2 className="text-4xl font-bold mb-4">
              {t('howItWorks.cta.title')}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t('howItWorks.cta.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div>
                <Button 
                  size="lg" 
                  onClick={() => setLocation("/register")}
                  className="group"
                  data-testid="button-register-now"
                >
                  {t('howItWorks.cta.registerNow')}
                  <DollarSign className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
              
              <div>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setLocation("/categories")}
                  data-testid="button-browse-categories"
                >
                  {t('howItWorks.cta.browseCategories')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
