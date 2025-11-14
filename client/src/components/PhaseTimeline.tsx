import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight } from "lucide-react";

interface Phase {
  number: number;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
}

interface PhaseTimelineProps {
  phases?: Phase[];
}

const defaultPhases: Phase[] = [
  { number: 1, name: 'TOP 500', description: 'Initial submissions', status: 'completed' },
  { number: 2, name: 'TOP 100', description: 'Best entries advance', status: 'active' },
  { number: 3, name: 'TOP 50', description: 'Top performers', status: 'upcoming' },
  { number: 4, name: 'TOP 25', description: 'Elite contenders', status: 'upcoming' },
  { number: 5, name: 'TOP 10', description: 'Final selections', status: 'upcoming' },
  { number: 6, name: 'TOP 3', description: 'Category winners', status: 'upcoming' },
  { number: 7, name: 'GRANDE FINALE', description: 'Ultimate champion', status: 'upcoming' },
];

export default function PhaseTimeline({ phases = defaultPhases }: PhaseTimelineProps) {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-display text-5xl md:text-6xl text-center mb-4 uppercase tracking-wide">
          Competition Flow
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Follow the journey from submission to ultimate victory across 7 exciting phases
        </p>
        
        <div className="relative">
          <div className="hidden xl:block absolute top-12 left-0 right-0 h-0.5 bg-border" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 md:gap-4 lg:gap-5 xl:gap-3 relative">
            {phases.map((phase, idx) => (
              <div key={phase.number} className="relative">
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
                      ACTIVE NOW
                    </Badge>
                  )}
                  
                  <h3 className="font-display text-xl xl:text-2xl mb-2 tracking-wide">
                    {phase.name}
                  </h3>
                  <p className="text-xs xl:text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
                
                {idx < phases.length - 1 && (
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
