import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Clock, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PollOption {
  text: string;
  isCorrect?: boolean;
}

interface PollManagerProps {
  videoId: string;
  onSuccess?: () => void;
}

export function PollManager({ videoId, onSuccess }: PollManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [question, setQuestion] = useState('');
  const [type, setType] = useState<'poll' | 'quiz'>('poll');
  const [timingSeconds, setTimingSeconds] = useState('0');
  const [duration, setDuration] = useState('30');
  const [isRequired, setIsRequired] = useState(false);
  const [options, setOptions] = useState<PollOption[]>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const { toast } = useToast();

  const handleAddOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], text };
    setOptions(updated);
  };

  const handleCorrectChange = (index: number) => {
    const updated = [...options];
    // For quiz, only allow one correct answer
    if (type === 'quiz') {
      updated.forEach((opt, i) => {
        opt.isCorrect = i === index;
      });
    } else {
      updated[index].isCorrect = !updated[index].isCorrect;
    }
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      if (!question.trim()) {
        toast({ title: 'Error', description: 'Question is required', variant: 'destructive' });
        return;
      }

      if (options.some(o => !o.text.trim())) {
        toast({ title: 'Error', description: 'All options must have text', variant: 'destructive' });
        return;
      }

      if (type === 'quiz' && !options.some(o => o.isCorrect)) {
        toast({ title: 'Error', description: 'Quiz must have at least one correct answer', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/videos/${videoId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          type,
          timingSeconds: parseInt(timingSeconds),
          duration: parseInt(duration),
          isRequired,
          options: options.map(opt => ({
            text: opt.text,
            isCorrect: opt.isCorrect || false,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      toast({ title: 'Success', description: 'Poll created successfully' });
      setQuestion('');
      setOptions([{ text: '', isCorrect: false }, { text: '', isCorrect: false }]);
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating poll:', error);
      toast({ title: 'Error', description: 'Failed to create poll', variant: 'destructive' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" data-testid="button-create-poll">
          <Plus className="w-4 h-4 mr-2" />
          Add Poll/Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-poll-manager">
        <DialogHeader>
          <DialogTitle>Create Interactive Poll or Quiz</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-poll">
          <div>
            <label className="block text-sm font-medium mb-2" data-testid="label-question">
              Question
            </label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              data-testid="input-question"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" data-testid="label-type">
                Type
              </label>
              <Select value={type} onValueChange={(v) => setType(v as 'poll' | 'quiz')}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poll">Poll</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2" data-testid="label-timing">
                <Clock className="w-4 h-4" />
                Show at (seconds)
              </label>
              <Input
                type="number"
                value={timingSeconds}
                onChange={(e) => setTimingSeconds(e.target.value)}
                min="0"
                data-testid="input-timing"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2" data-testid="label-duration">
                <Zap className="w-4 h-4" />
                Duration (seconds)
              </label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                data-testid="input-duration"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" data-testid="label-required">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="mr-2"
                  data-testid="checkbox-required"
                />
                Required to answer
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3" data-testid="label-options">
              Options
            </label>
            <div className="space-y-3">
              {options.map((option, idx) => (
                <div key={idx} className="flex gap-2 items-center" data-testid={`row-option-${idx}`}>
                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    data-testid={`input-option-${idx}`}
                  />
                  {type === 'quiz' && (
                    <Button
                      type="button"
                      variant={option.isCorrect ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCorrectChange(idx)}
                      data-testid={`button-correct-${idx}`}
                    >
                      ✓
                    </Button>
                  )}
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(idx)}
                      data-testid={`button-remove-option-${idx}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddOption}
              className="mt-3"
              data-testid="button-add-option"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
