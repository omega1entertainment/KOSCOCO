import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Play, Eye, Heart, Loader2 } from "lucide-react";
import { useState, useEffect, FormEvent } from "react";
import type { Category } from "@shared/schema";

interface VideoResult {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl: string;
  views: number;
  likeCount: number;
  voteCount: number;
  creatorUsername: string | null;
  creatorFirstName: string | null;
  creatorLastName: string | null;
  categoryId: string;
  slug: string | null;
}

interface SearchResponse {
  videos: VideoResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('categoryId') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  useEffect(() => {
    setSearchQuery(initialQuery);
    setCategoryFilter(initialCategory);
    setPage(1);
  }, [initialQuery, initialCategory]);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter);
    params.set('page', page.toString());
    params.set('limit', '20');
    return `/api/videos/search?${params.toString()}`;
  };

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: ['/api/videos/search', searchQuery, categoryFilter, page],
    queryFn: async () => {
      const res = await fetch(buildSearchUrl());
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter);
    setLocation(`/search?${params.toString()}`);
    setPage(1);
  };

  const getCreatorName = (video: VideoResult) => {
    if (video.creatorFirstName && video.creatorLastName) {
      return `${video.creatorFirstName} ${video.creatorLastName}`;
    }
    return video.creatorUsername || 'Unknown Creator';
  };

  const getVideoLink = (video: VideoResult) => {
    return video.slug ? `/video/${video.slug}` : `/video/${video.id}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="text-search-title">Search Videos</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button type="submit" data-testid="button-search-submit">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive" data-testid="text-search-error">
          Failed to search videos. Please try again.
        </div>
      )}

      {data && !isLoading && (
        <>
          <p className="text-muted-foreground mb-6" data-testid="text-search-count">
            {data.total === 0 
              ? 'No videos found' 
              : `Found ${data.total} video${data.total === 1 ? '' : 's'}`}
            {initialQuery && ` for "${initialQuery}"`}
          </p>

          {data.videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.videos.map((video) => (
                <Link key={video.id} href={getVideoLink(video)}>
                  <Card className="hover-elevate cursor-pointer overflow-hidden" data-testid={`card-video-${video.id}`}>
                    <div className="relative aspect-video bg-muted">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-1" data-testid={`text-video-title-${video.id}`}>
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-video-creator-${video.id}`}>
                        {getCreatorName(video)}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {video.likeCount || 0}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
