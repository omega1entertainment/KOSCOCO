import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, BarChart3 } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface Poll {
  id: string;
  videoId: string;
  question: string;
  type: 'poll' | 'quiz';
  timingSeconds: number;
  duration: number;
  isRequired: boolean;
  options: PollOption[];
}

interface PollViewerProps {
  poll: Poll;
  onRespond?: (pollId: string, optionId: string) => void;
}

export function PollViewer({ poll, onRespond }: PollViewerProps) {
  const [responded, setResponded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleRespond = async (optionId: string) => {
    if (responded) return;
    
    setIsPending(true);
    try {
      const response = await fetch(`/api/polls/${poll.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit response');
      }

      setResponded(true);
      setSelectedOption(optionId);

      // Fetch stats after responding
      const statsResponse = await fetch(`/api/polls/${poll.id}/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
        setShowStats(true);
      }

      onRespond?.(poll.id, optionId);
      toast({ title: 'Success', description: 'Response recorded' });
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit response',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const getOptionStats = (optionId: string) => {
    if (!stats) return null;
    const option = stats.options.find((o: any) => o.id === optionId);
    return option;
  };

  return (
    <Card className="w-full p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20" data-testid={`card-poll-${poll.id}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary" data-testid={`badge-type-${poll.type}`}>
                {poll.type === 'quiz' ? 'Quiz' : 'Poll'}
              </span>
              {poll.isRequired && (
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/20 text-destructive" data-testid="badge-required">
                  Required
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold" data-testid={`text-question-${poll.id}`}>
              {poll.question}
            </h3>
          </div>
          {showStats && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              data-testid="button-toggle-stats"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showStats ? 'Hide' : 'Show'} Results
            </Button>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          {poll.options.map((option) => {
            const isSelected = selectedOption === option.id;
            const optionStats = getOptionStats(option.id);
            const percentage = optionStats?.percentage || 0;

            return (
              <button
                key={option.id}
                onClick={() => handleRespond(option.id)}
                disabled={responded || isPending}
                className={`w-full relative text-left transition-all ${
                  responded
                    ? 'cursor-default'
                    : 'hover:translate-x-1 cursor-pointer'
                } ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-card/80'
                } p-3 rounded-lg border ${
                  isSelected ? 'border-primary' : 'border-border'
                }`}
                data-testid={`button-option-${option.id}`}
              >
                {/* Progress bar for stats */}
                {showStats && optionStats && (
                  <div
                    className="absolute inset-0 bg-primary/10 rounded-lg transition-all"
                    style={{ width: `${percentage}%` }}
                    data-testid={`bar-progress-${option.id}`}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <span className="font-medium">{option.text}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" data-testid={`icon-selected-${option.id}`} />}
                </div>

                {/* Stats display */}
                {showStats && optionStats && (
                  <div className="relative mt-1 text-xs opacity-75 flex items-center gap-2" data-testid={`stats-${option.id}`}>
                    <span>{optionStats.responseCount} response{optionStats.responseCount !== 1 ? 's' : ''}</span>
                    <span>({percentage.toFixed(1)}%)</span>
                    {poll.type === 'quiz' && option.isCorrect && (
                      <span className="text-green-600 font-semibold">Correct Answer</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Status message */}
        {responded && (
          <div className={`text-sm font-medium text-center p-2 rounded ${
            poll.type === 'quiz'
              ? selectedOption && poll.options.find(o => o.id === selectedOption)?.isCorrect
                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
          }`} data-testid="text-response-status">
            {poll.type === 'quiz'
              ? selectedOption && poll.options.find(o => o.id === selectedOption)?.isCorrect
                ? '✓ Correct!'
                : 'Incorrect answer'
              : 'Thank you for voting!'}
          </div>
        )}

        {/* Total responses */}
        {showStats && stats && (
          <div className="text-xs text-muted-foreground text-center" data-testid="text-total-responses">
            Total responses: {stats.totalResponses}
          </div>
        )}
      </div>
    </Card>
  );
}
