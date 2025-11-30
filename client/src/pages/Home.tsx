import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import PhaseTimeline from "@/components/PhaseTimeline";
import VideoCard from "@/components/VideoCard";
import StatsCard from "@/components/StatsCard";
import VotePaymentModal from "@/components/VotePaymentModal";
import VideoOfTheDay from "@/components/home/VideoOfTheDay";
import { Users, Video, Trophy, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queryKeys";
import type { Category } from "@shared/schema";

import musicImage from "@assets/generated_images/male_vocalist_performing_on_stage.png";
import comedyImage from "@assets/generated_images/comedy_performer_on_stage.png";
import fashionImage from "@assets/generated_images/black_female_fashion_beauty_creator.png";
import educationImage from "@assets/generated_images/black_male_educational_content_creator.png";
import gospelImage from "@assets/generated_images/gospel_choir_performing_together.png";
import promoVideoEnglish from "@assets/Koscoco Promo Video English_1763290871496.mp4";
import promoVideoFrench from "@assets/Koscoco Promo Video French_1763290871498.mp4";
import landryGnambaImage from "@assets/LANDRY-GNAMBA-copy_1764500930213.jpg";
import nadiaImage from "@assets/Nadia-B-copy_1764501005739.jpg";
import mitoumbaImage from "@assets/EBENEZER-KEPOMBIA-MITOUMBA-cop_1764501444814.png";
import rosineImage from "@assets/ROSINE-NGUEMGAING-copy_1764501444816.jpg";
import stephanieImage from "@assets/Stephanie-Tum-copy_1764501444815.jpg";
import stanleyImage from "@assets/STANLEY-ENOW-copy_1764501444815.jpg";

const ambassadors = [
  { name: "NADIA BUARI", origin: "FROM GHANA", image: nadiaImage },
  { name: "LANDRY GNAMBA", origin: "FROM IVORY COAST", image: landryGnambaImage },
];

const cameroonianAmbassadors = [
  { name: "MITOUMBA", role: "CAMEROONION ACTOR & COMEDIAN", image: mitoumbaImage },
  { name: "ROSINE NGUEMGAING", role: "CAMEROONION ACTRESS", image: rosineImage },
  { name: "STEPHANIE TUM", role: "CAMEROONION ACTRESS & MODEL", image: stephanieImage },
  { name: "STANLEY ENOW", role: "CAMEROONION RAPPER", image: stanleyImage },
];

export default function Home() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);
  const [ambassadorIndex, setAmbassadorIndex] = useState(0);
  const [cameroonianIndex, setCameroonianIndex] = useState(0);
  const { isAuthenticated } = useAuth();

  // Fetch real categories from API
  const { data: apiCategories = [] } = useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
  });

  // Fetch video counts for each category - refetch every 5 seconds for real-time updates
  const { data: videoCounts = {} } = useQuery<Record<string, number>>({
    queryKey: queryKeys.categories.videoCounts,
    refetchInterval: 5000,
    staleTime: 0,
  });

  // Fetch home page stats
  const { data: homeStats } = useQuery<{ totalParticipants: number; videosSubmitted: number; categories: number; totalVotes: number }>({
    queryKey: queryKeys.stats.home,
  });

  // Fetch trending videos - refetch every 5 seconds for real-time updates
  const { data: trendingVideosData = [] } = useQuery({
    queryKey: ['trending-videos', apiCategories.map(c => c.id).join(',')],
    queryFn: async () => {
      if (apiCategories.length === 0) return [];
      
      const allVideos: any[] = [];
      for (const category of apiCategories) {
        try {
          const response = await fetch(`/api/videos/category/${category.id}`);
          if (response.ok) {
            const videos = await response.json();
            allVideos.push(...videos.map((v: any) => ({ ...v, categoryName: category.name })));
          }
        } catch (err) {
          console.error(`Failed to fetch videos for category ${category.id}:`, err);
        }
      }
      return allVideos;
    },
    refetchInterval: 5000,
    staleTime: 0,
    enabled: apiCategories.length > 0,
  });

  // When video stats change, invalidate trending videos to refresh
  // This is handled by queryClient.invalidateQueries in mutations

  const handleVoteClick = (videoId: string, videoTitle: string) => {
    setSelectedVideo({ id: videoId, title: videoTitle });
    setVoteModalOpen(true);
  };

  const handleCategoryClick = (categoryName: string) => {
    // Find the category by name to get its ID
    const category = apiCategories.find(cat => cat.name === categoryName);
    if (category) {
      setLocation(`/category/${category.id}`);
    }
  };

  // Build categories with real-time entry counts
  const categoryImages: Record<string, string> = {
    'Music & Dance': musicImage,
    'Comedy & Performing Arts': comedyImage,
    'Fashion & Lifestyle': fashionImage,
    'Education & Learning': educationImage,
    'Gospel Choirs': gospelImage,
  };

  const categories = apiCategories.map((category) => ({
    title: category.name,
    image: categoryImages[category.name] || musicImage,
    subcategories: category.subcategories || [],
    entryCount: videoCounts[category.id] || 0,
  }));

  // Build featured videos from real trending data
  const featuredVideos = trendingVideosData
    .sort((a, b) => {
      // Sort by engagement (views + likes + votes)
      const aScore = (a.views || 0) + (a.likeCount || 0) + (a.voteCount || 0);
      const bScore = (b.views || 0) + (b.likeCount || 0) + (b.voteCount || 0);
      return bScore - aScore;
    })
    .slice(0, 4)
    .map((video) => {
      const categoryName = video.categoryName || 'Music & Dance';
      return {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnailUrl || categoryImages[categoryName] || musicImage,
        creator: { name: 'Creator' },
        category: categoryName,
        votes: video.voteCount || 0,
        likes: video.likeCount || 0,
        views: video.views || 0,
      };
    });

  const stats = [
    { icon: Users, label: t('home.statTotalParticipants'), value: String(homeStats?.totalParticipants || 0), trend: undefined },
    { icon: Video, label: t('home.statVideosSubmitted'), value: String(homeStats?.videosSubmitted || 0), trend: undefined },
    { icon: Trophy, label: t('home.statCategories'), value: String(homeStats?.categories || 0), trend: undefined },
    { icon: TrendingUp, label: t('home.statTotalVotes'), value: String(homeStats?.totalVotes || 0), trend: undefined },
  ];

  return (
    <div>
      <Hero 
        onRegisterClick={() => setLocation("/register")}
        onWatchClick={() => console.log("Watch entries")}
        isAuthenticated={isAuthenticated}
      />
      
      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-center mb-6 md:mb-8 uppercase tracking-wide">
            {language === 'en' ? 'Koscoco Promo Video English' : 'VIDÉO PROMOTIONNELLE KOSCOCO EN FRANÇAIS'}
          </h2>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
            <video 
              controls 
              className="w-full h-full"
              data-testid="video-promo"
              poster=""
            >
              <source 
                src={language === 'en' ? promoVideoEnglish : promoVideoFrench} 
                type="video/mp4" 
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-4xl sm:text-6xl md:text-8xl text-center mb-8 md:mb-12 uppercase tracking-wide">
            Meet Our Amazing Guest Ambassadors
          </h2>
          
          <div className="relative flex items-center justify-center gap-4">
            <button 
              onClick={() => setAmbassadorIndex((i) => (i - 1 + ambassadors.length) % ambassadors.length)}
              className="absolute left-0 z-10 p-2 rounded-full hover:bg-muted transition-colors"
              data-testid="button-ambassador-prev"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="w-full max-w-2xl">
              <div className="flex gap-4 justify-center overflow-hidden px-12">
                {ambassadors.map((ambassador, idx) => {
                  const offset = (idx - ambassadorIndex + ambassadors.length) % ambassadors.length;
                  const isCenter = offset === 0;
                  const isAdjacent = offset === 1 || offset === ambassadors.length - 1;
                  
                  return (
                    <div
                      key={idx}
                      className={`flex-shrink-0 transition-all duration-300 ${
                        isCenter ? 'scale-100 opacity-100 w-96' : 
                        isAdjacent ? 'scale-75 opacity-40 w-96' : 
                        'scale-50 opacity-0 w-96'
                      }`}
                    >
                      <div className="bg-white dark:bg-muted rounded-2xl overflow-hidden shadow-lg hover-elevate">
                        <img 
                          src={ambassador.image} 
                          alt={ambassador.name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-4 text-center">
                          <p className="text-red-600 dark:text-red-500 font-bold text-sm">{ambassador.name}</p>
                          <p className="text-muted-foreground text-xs mt-1">{ambassador.origin}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setAmbassadorIndex((i) => (i + 1) % ambassadors.length)}
              className="absolute right-0 z-10 p-2 rounded-full hover:bg-muted transition-colors"
              data-testid="button-ambassador-next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {ambassadors.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setAmbassadorIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === ambassadorIndex ? 'bg-red-600' : 'bg-muted-foreground/30'
                }`}
                data-testid={`button-ambassador-dot-${idx}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-display text-4xl sm:text-6xl md:text-8xl text-center mb-12 uppercase tracking-wide">
            Meet Our Awesome Cameroonians Ambassadors
          </h2>
          
          <div className="relative flex items-center justify-center gap-4">
            <button 
              onClick={() => setCameroonianIndex((i) => (i - 1 + cameroonianAmbassadors.length) % cameroonianAmbassadors.length)}
              className="absolute left-0 z-10 p-2 rounded-full hover:bg-muted transition-colors"
              data-testid="button-cameroonians-prev"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {cameroonianAmbassadors.map((ambassador, idx) => {
                  const isVisible = Math.abs((idx - cameroonianIndex + cameroonianAmbassadors.length) % cameroonianAmbassadors.length - 0) < 2 || 
                                   cameroonianAmbassadors.length === 4;
                  
                  return (
                    <div key={idx} className={isVisible ? '' : 'hidden lg:block'}>
                      <div className="bg-white dark:bg-muted rounded-xl overflow-hidden shadow-md hover-elevate transition-all">
                        <img 
                          src={ambassador.image} 
                          alt={ambassador.name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-4 text-center">
                          <p className="text-red-600 dark:text-red-500 font-bold text-sm">{ambassador.name}</p>
                          <p className="text-muted-foreground text-xs mt-2">{ambassador.role}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button 
              onClick={() => setCameroonianIndex((i) => (i + 1) % cameroonianAmbassadors.length)}
              className="absolute right-0 z-10 p-2 rounded-full hover:bg-muted transition-colors"
              data-testid="button-cameroonians-next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {cameroonianAmbassadors.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCameroonianIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === cameroonianIndex ? 'bg-red-600' : 'bg-muted-foreground/30'
                }`}
                data-testid={`button-cameroonians-dot-${idx}`}
              />
            ))}
          </div>
        </div>
      </section>

      <VideoOfTheDay />
      
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
            {t('home.categoriesTitle')}
          </h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto text-sm md:text-base">
            {t('home.categoriesDescription')}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((category, idx) => (
              <CategoryCard
                key={idx}
                {...category}
                onClick={() => handleCategoryClick(category.title)}
                data-testid={`card-category-${idx}`}
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
                {t('home.trendingTitle')}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {t('home.trendingDescription')}
              </p>
            </div>
            <Button variant="outline" data-testid="button-view-all" className="w-full sm:w-auto">
              {t('home.viewAll')}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredVideos.map((video) => (
              <VideoCard
                key={video.id}
                {...video}
                onPlay={() => console.log(`Play ${video.id}`)}
                onVote={() => handleVoteClick(video.id, video.title)}
                onShare={() => console.log(`Share ${video.id}`)}
              />
            ))}
          </div>
        </div>
      </section>

      {selectedVideo && (
        <VotePaymentModal
          open={voteModalOpen}
          onOpenChange={setVoteModalOpen}
          videoId={selectedVideo.id}
          videoTitle={selectedVideo.title}
        />
      )}
      
      <section className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide mb-4 md:mb-6">
            {t('home.ctaTitle')}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
            {t('home.ctaDescription')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8 md:px-12" 
              onClick={() => setLocation("/register")}
              data-testid="button-register-now"
            >
              {t('home.registerNow')}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full sm:w-auto px-8 md:px-12" 
              onClick={() => console.log("Learn more")}
              data-testid="button-learn-more"
            >
              {t('home.learnMore')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
