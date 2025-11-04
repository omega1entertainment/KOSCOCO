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
import stepImage1 from "@assets/generated_images/Registration_and_category_selection_1a167c42.png";
import stepImage2 from "@assets/generated_images/Video_upload_and_content_creation_862fb653.png";
import stepImage3 from "@assets/generated_images/Content_approval_and_moderation_42c462a4.png";
import stepImage4 from "@assets/generated_images/Public_voting_and_engagement_8d98442c.png";
import stepImage5 from "@assets/generated_images/Phase_progression_and_advancement_c5aa149a.png";
import stepImage6 from "@assets/generated_images/Winning_prizes_and_celebration_eac6a499.png";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      number: "01",
      title: "Register & Choose Categories",
      description: "Sign up and select from 5 exciting categories. Pay just 2,500 FCFA per category to enter the competition.",
      image: stepImage1,
      highlights: ["Music & Dance", "Comedy & Performing Arts", "Fashion & Lifestyle", "Education & Learning", "Gospel Choirs"]
    },
    {
      number: "02",
      title: "Upload Your Best Content",
      description: "Create and upload your 1-3 minute video showcasing your talent. Up to 2 videos per category!",
      image: stepImage2,
      highlights: ["1-3 minutes duration", "512MB max file size", "MP4, WebM, MOV supported"]
    },
    {
      number: "03",
      title: "Get Approved & Go Live",
      description: "Our team reviews your submission to ensure quality. Once approved, your video goes live for the world to see!",
      image: stepImage3,
      highlights: ["Quick review process", "Quality assurance", "Public visibility"]
    },
    {
      number: "04",
      title: "Public Voting Begins",
      description: "Share your video and gather votes! Public votes count for 60% of your total score. Get your network engaged!",
      image: stepImage4,
      highlights: ["60% of total score", "Share on social media", "Unlimited voting"]
    },
    {
      number: "05",
      title: "Progress Through Phases",
      description: "Compete through 5 exciting phases: TOP 100 → TOP 50 → TOP 10 → TOP 3 → GRAND FINALE",
      image: stepImage5,
      highlights: ["Phase-based progression", "Multiple chances to shine", "Fair competition"]
    },
    {
      number: "06",
      title: "Win Amazing Prizes!",
      description: "Top performers in each category and the grand winner receive incredible prizes and recognition!",
      image: stepImage6,
      highlights: ["Category winners", "Grand prize", "Fame & recognition"]
    }
  ];

  const features = [
    { icon: Users, title: "5 Categories", description: "Multiple talent categories to choose from" },
    { icon: Trophy, title: "5 Phases", description: "Exciting progression through competition stages" },
    { icon: Sparkles, title: "Public Voting", description: "60% of score from audience votes" },
    { icon: Award, title: "Judge Scores", description: "40% from creativity and quality assessment" }
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
              How KOSCOCO Works
            </h1>
            <p className="text-base md:text-xl text-muted-foreground mb-8">
              Your journey from registration to stardom in 6 simple steps
            </p>
            <div>
              <Button 
                size="lg" 
                onClick={() => setLocation("/register")}
                className="group"
                data-testid="button-get-started"
              >
                Get Started Now
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
            <Badge variant="outline" className="mb-4">Step by Step Guide</Badge>
            <h2 className="text-4xl font-bold mb-4">Your Path to Victory</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Follow these six steps to showcase your talent and compete for amazing prizes
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
            <h2 className="text-4xl font-bold mb-4">How Winners Are Chosen</h2>
            <p className="text-muted-foreground text-lg">Your score is based on three key factors</p>
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
                  <CardTitle>Public Votes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The audience decides! Share your video to get maximum votes from supporters.
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
                  <CardTitle>Creativity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our judges assess your originality, uniqueness, and creative expression.
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
                  <CardTitle>Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Judges evaluate production quality, clarity, and overall execution.
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
              Ready to Showcase Your Talent?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators competing for amazing prizes. Register now and start your journey to stardom!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div>
                <Button 
                  size="lg" 
                  onClick={() => setLocation("/register")}
                  className="group"
                  data-testid="button-register-now"
                >
                  Register Now
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
                  Browse Categories
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
