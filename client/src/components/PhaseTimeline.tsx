import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Phase {
  number: number;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface PhaseTimelineProps {
  phases?: Phase[];
}

export default function PhaseTimeline({ phases }: PhaseTimelineProps) {
  const { t } = useLanguage();
  
  const translatedPhases: Phase[] = [
    { number: 1, name: t('phaseTimeline.phase1Name'), description: t('phaseTimeline.phase1Desc'), status: 'active' },
    { number: 2, name: t('phaseTimeline.phase2Name'), description: t('phaseTimeline.phase2Desc'), status: 'upcoming' },
    { number: 3, name: t('phaseTimeline.phase3Name'), description: t('phaseTimeline.phase3Desc'), status: 'upcoming' },
    { number: 4, name: t('phaseTimeline.phase4Name'), description: t('phaseTimeline.phase4Desc'), status: 'upcoming' },
    { number: 5, name: t('phaseTimeline.phase5Name'), description: t('phaseTimeline.phase5Desc'), status: 'upcoming' },
    { number: 6, name: t('phaseTimeline.phase6Name'), description: t('phaseTimeline.phase6Desc'), status: 'upcoming' },
    { number: 7, name: t('phaseTimeline.phase7Name'), description: t('phaseTimeline.phase7Desc'), status: 'upcoming' },
  ];

  const displayPhases = phases ?? translatedPhases;

  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-display text-5xl md:text-6xl text-center mb-4 uppercase tracking-wide">
          {t('phaseTimeline.title')}
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          {t('phaseTimeline.description')}
        </p>
        
        <div className="relative">
          <div className="hidden xl:block absolute top-12 left-0 right-0 h-0.5 bg-border" />
          
          <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible gap-6 md:gap-4 lg:gap-5 xl:gap-3 relative sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth hide-scrollbar">
            {displayPhases.map((phase, idx) => (
              <div key={phase.number} className="relative flex-shrink-0 w-32 sm:w-auto sm:flex-shrink">
                <div className="flex flex-col items-center text-center">
                  <div 
                    className={`w-20 h-20 xl:w-24 xl:h-24 rounded-full flex items-center justify-center mb-4 border-4 transition-all ${
                      phase.status === 'completed' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : phase.status === 'active'
                        ? 'bg-background border-primary text-primary ring-4 ring-primary/20'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                    data-testid={`phase-badge-${phase.number}`}
                  >
                    {phase.status === 'completed' ? (
                      <Check className="w-8 h-8 xl:w-10 xl:h-10" />
                    ) : (
                      <span className="font-display text-3xl xl:text-4xl">{phase.number}</span>
                    )}
                  </div>
                  
                  {phase.status === 'active' && (
                    <Badge 
                      variant="destructive" 
                      className="mb-3 font-bold text-xs"
                      data-testid="badge-active"
                    >
                      {t('phaseTimeline.activeNow')}
                    </Badge>
                  )}
                  
                  <h3 className="font-display text-xl xl:text-2xl mb-2 tracking-wide">
                    {phase.name}
                  </h3>
                  <p className="text-xs xl:text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
                
                {idx < displayPhases.length - 1 && (
                  <ChevronRight className="hidden xl:block absolute top-8 -right-6 2xl:-right-10 w-6 h-6 2xl:w-8 2xl:h-8 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
