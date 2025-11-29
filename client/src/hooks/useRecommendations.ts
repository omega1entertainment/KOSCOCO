import { useQuery } from "@tanstack/react-query";
import type { Video } from "@shared/schema";

export function usePersonalizedRecommendations(limit: number = 10) {
  return useQuery({
    queryKey: ["/api/videos/recommendations/personalized", limit],
    queryFn: async () => {
      const response = await fetch(`/api/videos/recommendations/personalized?limit=${limit}`);
      if (!response.ok) throw new Error("Failed to fetch recommendations");
      return response.json() as Promise<Video[]>;
    },
  });
}
