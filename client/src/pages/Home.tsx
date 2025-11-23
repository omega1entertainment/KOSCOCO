import { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import CategoryCard from "@/components/CategoryCard";
import PhaseTimeline from "@/components/PhaseTimeline";
import VideoCard from "@/components/VideoCard";
import StatsCard from "@/components/StatsCard";
import VotePaymentModal from "@/components/VotePaymentModal";
import VideoOfTheDay from "@/components/home/VideoOfTheDay";
import { Users, Video, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@shared/schema";

import musicImage from "@assets/generated_images/male_vocalist_performing_on_stage.png";
import comedyImage from "@assets/generated_images/comedy_performer_on_stage.png";
import fashionImage from "@assets/generated_images/black_female_fashion_beauty_creator.png";
import educationImage from "@assets/generated_images/black_male_educational_content_creator.png";
import gospelImage from "@assets/generated_images/gospel_choir_performing_together.png";
import promoVideoEnglish from "@assets/Koscoco Promo Video English_1763290871496.mp4";
import promoVideoFrench from "@assets/Koscoco Promo Video French_1763290871498.mp4";

export default function Home() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);

  // Fetch real categories from API
  const { data: apiCategories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch video counts for each category
  const { data: videoCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ['/api/categories/video-counts'],
  });

  // Fetch home page stats
  const { data: homeStats } = useQuery<{ totalParticipants: number; videosSubmitted: number; categories: number; totalVotes: number }>({
    queryKey: ['/api/stats/home'],
  });

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

  const categories = [
    {
      title: t('home.categoryMusicDance'),
      image: musicImage,
      subcategories: [t('home.subcategorySinging'), t('home.subcategoryDancing')],
      entryCount: videoCounts['Music & Dance'] || 0,
    },
    {
      title: t('home.categoryComedyArts'),
      image: comedyImage,
      subcategories: [t('home.subcategorySkits'), t('home.subcategoryStandup'), t('home.subcategoryMonologue'), t('home.subcategoryActing'), t('home.subcategoryMovieContent')],
      entryCount: videoCounts['Comedy & Performing Arts'] || 0,
    },
    {
      title: t('home.categoryFashionLifestyle'),
      image: fashionImage,
      subcategories: [t('home.subcategoryCooking'), t('home.subcategoryEvents'), t('home.subcategoryDecor'), t('home.subcategorySports'), t('home.subcategoryTravel'), t('home.subcategoryVlogging'), t('home.subcategoryFashion'), t('home.subcategoryHair'), t('home.subcategoryMakeup'), t('home.subcategoryBeauty'), t('home.subcategoryReviews')],
      entryCount: videoCounts['Fashion & Lifestyle'] || 0,
    },
    {
      title: t('home.categoryEducationLearning'),
      image: educationImage,
      subcategories: [t('home.subcategoryDIY'), t('home.subcategoryTutorials'), t('home.subcategoryDocumentary'), t('home.subcategoryBusinessFinance'), t('home.subcategoryNews'), t('home.subcategoryMotivational')],
      entryCount: videoCounts['Education & Learning'] || 0,
    },
    {
      title: t('home.categoryGospelChoirs'),
      image: gospelImage,
      subcategories: [t('home.subcategoryAcapella'), t('home.subcategoryChoirMusic')],
      entryCount: videoCounts['Gospel Choirs'] || 0,
    },
  ];

  const featuredVideos = [
    {
      id: '1',
      title: t('home.sampleVideo1Title'),
      thumbnail: musicImage,
      creator: { name: t('home.sampleVideo1Creator') },
      category: t('home.categoryMusicDance'),
      votes: 0,
      likes: 0,
      views: 0,
    },
    {
      id: '2',
      title: t('home.sampleVideo2Title'),
      thumbnail: comedyImage,
      creator: { name: t('home.sampleVideo2Creator') },
      category: t('home.sampleVideo2Category'),
      votes: 0,
      likes: 0,
      views: 0,
    },
    {
      id: '3',
      title: t('home.sampleVideo3Title'),
      thumbnail: fashionImage,
      creator: { name: t('home.sampleVideo3Creator') },
      category: t('home.categoryFashionLifestyle'),
      votes: 0,
      likes: 0,
      views: 0,
    },
    {
      id: '4',
      title: t('home.sampleVideo4Title'),
      thumbnail: educationImage,
      creator: { name: t('home.sampleVideo4Creator') },
      category: t('home.sampleVideo4Category'),
      votes: 0,
      likes: 0,
      views: 0,
    },
  ];

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
