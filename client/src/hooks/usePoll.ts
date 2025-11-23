import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useVideoPollsByTiming(videoId: string) {
  return useQuery({
    queryKey: ['/api/videos', videoId, 'polls'],
    enabled: !!videoId,
  });
}

export function usePoll(pollId: string) {
  return useQuery({
    queryKey: ['/api/polls', pollId],
    enabled: !!pollId,
  });
}

export function usePollStats(pollId: string) {
  return useQuery({
    queryKey: ['/api/polls', pollId, 'stats'],
    enabled: !!pollId,
  });
}

export function useCreatePoll(videoId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/videos/${videoId}/polls`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'polls'] });
    },
  });
}

export function useUpdatePoll(pollId: string, videoId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/polls/${pollId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/polls', pollId] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'polls'] });
    },
  });
}

export function useDeletePoll(pollId: string, videoId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () =>
      apiRequest(`/api/polls/${pollId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos', videoId, 'polls'] });
    },
  });
}

export function useRespondToPoll(pollId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { optionId: string }) =>
      apiRequest(`/api/polls/${pollId}/respond`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/polls', pollId, 'stats'] });
    },
  });
}
