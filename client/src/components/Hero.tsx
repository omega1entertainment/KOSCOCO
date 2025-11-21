import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBackground from "@assets/hero-gold-coins-background.jpeg";
import seasonLogo from "@assets/kOSCOCO-SEASON 1_1762052498157.png";

interface HeroProps {
  currentPhase?: string;
  onRegisterClick?: () => void;
  onWatchClick?: () => void;
}

export default function Hero({ currentPhase = "PHASE 1: SUBMISSIONS OPEN", onRegisterClick, onWatchClick }: HeroProps) {
  const { t } = useLanguage();
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-6 tracking-wide uppercase">
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
            onClick={onRegisterClick}
            data-testid="button-register"
          >
            {t('hero.enterCompetition')}
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            onClick={onWatchClick}
            data-testid="button-watch"
          >
            {t('hero.watchEntries')}
          </Button>
        </div>
        
        <Badge 
          className="px-6 py-2 text-sm font-bold tracking-widest"
          variant="destructive"
          data-testid="badge-phase"
        >
          {currentPhase}
        </Badge>
      </div>
    </div>
  );
}
