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
  { number: 1, name: 'TOP 100', description: 'Initial submissions', status: 'completed' },
  { number: 2, name: 'TOP 50', description: 'Top performers advance', status: 'active' },
  { number: 3, name: 'TOP 10', description: 'Final selections', status: 'upcoming' },
  { number: 4, name: 'TOP 3', description: 'Category winners', status: 'upcoming' },
  { number: 5, name: 'GRAND FINALE', description: 'Ultimate winner', status: 'upcoming' },
];

export default function PhaseTimeline({ phases = defaultPhases }: PhaseTimelineProps) {
  return (
    <div className="py-24">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="font-display text-5xl md:text-6xl text-center mb-4 uppercase tracking-wide">
          Competition Flow
        </h2>
        <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
          Follow the journey from submission to ultimate victory across 5 exciting phases
        </p>
        
        <div className="relative">
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-border" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {phases.map((phase, idx) => (
              <div key={phase.number} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div 
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 border-4 transition-all ${
                      phase.status === 'completed' 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : phase.status === 'active'
                        ? 'bg-background border-primary text-primary ring-4 ring-primary/20'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                    data-testid={`phase-badge-${phase.number}`}
                  >
                    {phase.status === 'completed' ? (
                      <Check className="w-10 h-10" />
                    ) : (
                      <span className="font-display text-4xl">{phase.number}</span>
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
                  
                  <h3 className="font-display text-2xl mb-2 tracking-wide">
                    {phase.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
                
                {idx < phases.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-10 w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
