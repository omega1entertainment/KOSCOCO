import { Trophy, Medal, Award, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import NavigationHeader from "@/components/NavigationHeader";
import { useLocation } from "wouter";
import grandFinaleImg from "@assets/generated_images/Grand_finale_winner_trophy_e9b20746.png";
import top3Img from "@assets/generated_images/Top_3_category_winners_podium_0b933e0e.png";
import top10Img from "@assets/generated_images/Top_10_finalists_rewards_a3219779.png";

export default function Prizes() {
  const [, setLocation] = useLocation();

  const prizeStructure = [
    {
      phase: "GRAND FINALE",
      badge: "1st Place Overall",
      image: grandFinaleImg,
      prize: "5,000,000 FCFA",
      description: "The ultimate champion across all categories",
      icon: Trophy,
      gradient: "from-yellow-400 to-yellow-600",
    },
    {
      phase: "TOP 3 FINALISTS",
      badge: "Per Category",
      image: top3Img,
      prize: "500,000 FCFA",
      description: "1st place winner in each of the 5 categories",
      icon: Medal,
      gradient: "from-gray-300 to-gray-500",
      secondary: [
        { place: "2nd Place", amount: "300,000 FCFA" },
        { place: "3rd Place", amount: "150,000 FCFA" },
      ],
    },
    {
      phase: "TOP 10 FINALISTS",
      badge: "Recognition Prize",
      image: top10Img,
      prize: "50,000 FCFA",
      description: "Each finalist advancing to TOP 10 phase",
      icon: Award,
      gradient: "from-orange-400 to-orange-600",
    },
  ];

  const categories = [
    "Music & Dance",
    "Comedy & Performing Arts",
    "Fashion & Lifestyle",
    "Education & Learning",
    "Gospel Choirs",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar />
      <NavigationHeader
        onUploadClick={() => setLocation("/upload")}
        onRegisterClick={() => setLocation("/register")}
        onLoginClick={() => window.location.href = "/api/login"}
        onNavigate={(path) => setLocation(path)}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge 
              variant="destructive" 
              className="mb-4 text-sm font-bold"
              data-testid="badge-prizes-hero"
            >
              COMPETITION PRIZES
            </Badge>
            <h1 className="text-5xl font-bold mb-4" data-testid="heading-prizes">
              Win Big with KOSCOCO
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-prizes-description">
              Compete for amazing prizes across 5 categories and 5 exciting phases. 
              The more you advance, the bigger the rewards!
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
                        <DollarSign className="w-8 h-8 text-primary" />
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
                          <p className="font-semibold text-sm text-muted-foreground">Additional Category Prizes:</p>
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
              5 Competition Categories
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              Each category offers equal prize opportunities. Choose your passion and compete for glory!
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
                <CardDescription className="text-sm">TOTAL PRIZE POOL</CardDescription>
                <CardTitle className="text-5xl font-bold text-primary" data-testid="text-total-pool">
                  15,000,000+ FCFA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  With prizes distributed across 5 categories and multiple phases, 
                  this is Cameroon's biggest short content competition!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Ready to Compete?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Register now and start your journey to becoming KOSCOCO's next champion!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setLocation("/register")}
                className="bg-white text-primary px-8 py-3 rounded-md font-bold hover:bg-white/90 transition-colors"
                data-testid="button-register-now"
              >
                Register Now
              </button>
              <button
                onClick={() => setLocation("/categories")}
                className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-8 py-3 rounded-md font-bold hover:bg-white/20 transition-colors"
                data-testid="button-view-categories"
              >
                View Categories
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
