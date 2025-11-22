import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function ThankYou() {
  const [, setLocation] = useLocation();
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  // Redirect to home if not authenticated (shouldn't happen, but safety check)
  useEffect(() => {
    if (user === null) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardContent className="pt-12 pb-12 px-8 text-center space-y-8">
          {/* Welcome Message */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">
              Welcome to KOSCOCO – Where Creativity Becomes Influence!
            </h1>

            <div className="prose dark:prose-invert max-w-none text-left space-y-4 text-foreground">
              <p className="text-base sm:text-lg leading-relaxed">
                Hello and welcome to KOSCOCO, Africa's bold new stage for short-content creators!
              </p>

              <p className="text-base sm:text-lg leading-relaxed">
                Whether you're here to compete, vote, discover talent, or simply enjoy powerful short inspiring stories, you're in the right place.
              </p>

              <p className="text-base sm:text-lg leading-relaxed">
                KOSCOCO celebrates creativity, culture, originality, and the fearless voices of Africa's new generation. This is more than a competition—it's a movement. A platform where everyday creators become stars, ideas become impact, and talent meets opportunity.
              </p>

              <p className="text-lg sm:text-xl font-semibold text-primary mt-6">
                Upload. Compete. Inspire. Win.
              </p>

              <p className="text-base sm:text-lg leading-relaxed">
                Your journey starts now. Show the world what only YOU can create!
              </p>

              <p className="text-base sm:text-lg font-semibold leading-relaxed">
                The future of African short content begins here.
              </p>
            </div>
          </div>

          {/* Registration CTA */}
          <div className="space-y-4 pt-8 border-t">
            <p className="text-base sm:text-lg text-foreground">
              Click the button below to register for a category or multiple categories to increase your winning chances.
            </p>

            <Button
              onClick={() => setLocation("/register")}
              size="lg"
              className="w-full sm:w-auto px-12 py-3 text-lg font-semibold"
              data-testid="button-register-category"
            >
              REGISTER
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
