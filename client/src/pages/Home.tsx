import { useLocation } from "wouter";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import PhaseTimeline from "@/components/PhaseTimeline";
import VideoCard from "@/components/VideoCard";
import StatsCard from "@/components/StatsCard";
import { Users, Video, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

import musicImage from "@assets/generated_images/Music_and_Dance_category_e223aa7f.png";
import comedyImage from "@assets/generated_images/Comedy_and_Performing_Arts_ede3bf3d.png";
import fashionImage from "@assets/generated_images/Fashion_and_Lifestyle_category_d45cea92.png";
import educationImage from "@assets/generated_images/Education_and_Learning_category_c4ef1c1d.png";
import gospelImage from "@assets/generated_images/Gospel_Choirs_category_e7d0b06c.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const categories = [
    {
      title: 'Music & Dance',
      image: musicImage,
      subcategories: ['Singing', 'Dancing'],
      entryCount: 234,
    },
    {
      title: 'Comedy & Performing Arts',
      image: comedyImage,
      subcategories: ['Skits', 'Stand-up', 'Monologue', 'Acting', 'Movie content'],
      entryCount: 187,
    },
    {
      title: 'Fashion & Lifestyle',
      image: fashionImage,
      subcategories: ['Cooking', 'Events', 'Decor', 'Sports', 'Travel', 'Vlogging', 'Fashion', 'Hair', 'Makeup', 'Beauty', 'Reviews'],
      entryCount: 312,
    },
    {
      title: 'Education & Learning',
      image: educationImage,
      subcategories: ['DIY', 'Tutorials', 'Documentary', 'Business & Finance', 'News', 'Motivational Speaking'],
      entryCount: 156,
    },
    {
      title: 'Gospel Choirs',
      image: gospelImage,
      subcategories: ['Acapella', 'Choir Music'],
      entryCount: 89,
    },
  ];

  const featuredVideos = [
    {
      id: '1',
      title: 'Amazing Afrobeats Dance Routine',
      thumbnail: musicImage,
      creator: { name: 'Marie Kouam' },
      category: 'Music & Dance',
      votes: 1247,
      views: 5832,
    },
    {
      id: '2',
      title: 'Hilarious Cameroonian Comedy Skit',
      thumbnail: comedyImage,
      creator: { name: 'Jean Baptiste' },
      category: 'Comedy',
      votes: 892,
      views: 4125,
    },
    {
      id: '3',
      title: 'Traditional Fashion Showcase',
      thumbnail: fashionImage,
      creator: { name: 'Grace Nkeng' },
      category: 'Fashion & Lifestyle',
      votes: 1056,
      views: 6234,
    },
    {
      id: '4',
      title: 'Tech Tutorial: Web Development',
      thumbnail: educationImage,
      creator: { name: 'Paul Ndikum' },
      category: 'Education',
      votes: 743,
      views: 3892,
    },
  ];

  const stats = [
    { icon: Users, label: 'Total Participants', value: '1,247', trend: { value: '12%', positive: true } },
    { icon: Video, label: 'Videos Submitted', value: '978', trend: { value: '8%', positive: true } },
    { icon: Trophy, label: 'Categories', value: '5', trend: undefined },
    { icon: TrendingUp, label: 'Total Votes', value: '45.2K', trend: { value: '24%', positive: true } },
  ];

  return (
    <div>
      <Hero 
        onRegisterClick={() => setLocation("/register")}
        onWatchClick={() => console.log("Watch entries")}
      />
      
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, idx) => (
              <StatsCard key={idx} {...stat} />
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center mb-4 uppercase tracking-wide">
            Competition Categories
          </h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto text-sm md:text-base">
            Choose your category and showcase your talent to Cameroon and the world
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((category, idx) => (
              <CategoryCard
                key={idx}
                {...category}
                onClick={() => console.log(`View ${category.title}`)}
              />
            ))}
          </div>
        </div>
      </section>
      
      <PhaseTimeline />
      
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 md:mb-12">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide mb-2">
                Trending Entries
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Watch the most popular submissions this week
              </p>
            </div>
            <Button variant="outline" data-testid="button-view-all" className="w-full sm:w-auto">
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredVideos.map((video) => (
              <VideoCard
                key={video.id}
                {...video}
                onPlay={() => console.log(`Play ${video.id}`)}
                onVote={() => console.log(`Vote ${video.id}`)}
                onShare={() => console.log(`Share ${video.id}`)}
              />
            ))}
          </div>
        </div>
      </section>
      
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide mb-4 md:mb-6">
            Ready to Compete?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
            Register now for just 2,500 FCFA per category and join Cameroon's biggest content competition
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8 md:px-12" 
              onClick={() => setLocation("/register")}
              data-testid="button-register-now"
            >
              Register Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto px-8 md:px-12" 
              onClick={() => console.log("Learn more")}
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
