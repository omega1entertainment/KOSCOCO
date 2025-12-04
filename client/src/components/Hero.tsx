import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Play } from "lucide-react";
import heroBackground from "@assets/hero-gold-coins-background.jpeg";
import seasonLogo from "@assets/kOSCOCO-SEASON 1_1762052498157.png";

interface HeroProps {
  currentPhase?: string;
  onRegisterClick?: () => void;
  onWatchClick?: () => void;
  isAuthenticated?: boolean;
}

export default function Hero({ currentPhase = "PHASE 1: SUBMISSIONS OPEN", onRegisterClick, onWatchClick, isAuthenticated = false }: HeroProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-white mb-6 tracking-wide uppercase">
          {t('hero.title')}
        </h1>
        
        <div className="flex justify-center mb-6">
          <img src={seasonLogo} alt="KOSCOCO Season 1" className="h-16 md:h-20" />
        </div>
        
        <p className="mb-3 text-2xl sm:text-3xl md:text-4xl lg:text-5xl" style={{ fontFamily: 'Play, sans-serif', fontWeight: 600, color: '#FBBF24' }}>
          {t('hero.subtitle')}
        </p>
        
        <p className="text-white mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
          {t('hero.tagline')}
        </p>
        
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg px-6 py-3 shadow-lg inline-block" data-testid="banner-cash-prize">
            <p className="text-black text-2xl sm:text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Play, sans-serif' }}>
              {t('hero.prize')} <span className="text-primary animate-bounce inline-block">{t('hero.prizeAmount')}</span> {t('hero.prizeCurrency')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-white/80 text-sm md:text-base mb-12 flex-wrap">
          <span className="font-semibold">{t('hero.categories')}</span>
          <span className="w-1 h-1 bg-white/60 rounded-full"></span>
          <span className="font-semibold">{t('hero.weeks')}</span>
          <span className="w-1 h-1 bg-white/60 rounded-full"></span>
          <span className="font-semibold">{t('hero.cashPrizes')}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button 
            size="lg"
            variant="default"
            onClick={() => setLocation("/register")}
            data-testid="button-register"
          >
            REGISTER NOW
          </Button>
          <Button 
            size="lg"
            variant="destructive"
            onClick={onWatchClick}
            data-testid="button-watch-entries"
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Watch Entries
          </Button>
        </div>
      </div>
    </div>
  );
}
