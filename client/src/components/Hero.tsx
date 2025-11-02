import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroBackground from "@assets/generated_images/Hero_background_competition_energy_2a99609f.png";
import seasonLogo from "@assets/kOSCOCO-SEASON 1_1762052498157.png";

interface HeroProps {
  currentPhase?: string;
  onRegisterClick?: () => void;
  onWatchClick?: () => void;
}

export default function Hero({ currentPhase = "PHASE 1: SUBMISSIONS OPEN", onRegisterClick, onWatchClick }: HeroProps) {
  return (
    <div className="relative h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <Badge 
          className="mb-6 px-6 py-2 text-sm font-bold tracking-widest"
          variant="destructive"
          data-testid="badge-phase"
        >
          {currentPhase}
        </Badge>
        
        <h1 className="font-display text-7xl md:text-8xl lg:text-9xl text-white mb-6 tracking-wide uppercase">
          the kozzii short content competition
        </h1>
        
        <div className="flex justify-center mb-6">
          <img src={seasonLogo} alt="KOSCOCO Season 1" className="h-16 md:h-20" />
        </div>
        
        <p className="text-2xl md:text-3xl text-white/90 mb-4 font-medium">
          Cameroon's Next Big Content Creator
        </p>
        
        <div className="flex items-center justify-center gap-6 text-white/80 text-sm md:text-base mb-12 flex-wrap">
          <span className="font-semibold">5 Categories</span>
          <span className="w-1 h-1 bg-white/60 rounded-full"></span>
          <span className="font-semibold">8 Weeks</span>
          <span className="w-1 h-1 bg-white/60 rounded-full"></span>
          <span className="font-semibold">Cash Prizes</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg"
            variant="default"
            className="px-12 py-6 text-lg font-bold"
            onClick={onRegisterClick}
            data-testid="button-register"
          >
            Enter Competition
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="px-12 py-6 text-lg font-bold bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
            onClick={onWatchClick}
            data-testid="button-watch"
          >
            Watch Entries
          </Button>
        </div>
      </div>
    </div>
  );
}
