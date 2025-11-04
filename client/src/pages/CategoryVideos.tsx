import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Eye, ThumbsUp, ArrowLeft, Filter } from "lucide-react";
import type { Category, Video } from "@shared/schema";

export default function CategoryVideos() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/category/:id");
  const categoryId = params?.id;
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos/category", categoryId],
    enabled: !!categoryId,
  });

  const category = categories?.find(c => c.id === categoryId);

  const filteredVideos = selectedSubcategory === "all" 
    ? videos 
    : videos?.filter(v => v.subcategory === selectedSubcategory);

  if (videosLoading || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/categories")}
              className="mb-6"
              data-testid="button-back-categories"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>

            <div className="max-w-4xl">
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl uppercase tracking-wide mb-4">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-base md:text-lg text-muted-foreground mb-6">
                  {category.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-subcategory-filter">
                      <SelectValue placeholder="Filter by subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subcategories</SelectItem>
                      {category.subcategories.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline" data-testid="badge-video-count">
                  {filteredVideos?.length || 0} videos
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            {filteredVideos && filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredVideos.map((video) => (
                  <Card 
                    key={video.id} 
                    className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all"
                    onClick={() => setLocation(`/video/${video.id}`)}
                    data-testid={`card-video-${video.id}`}
                  >
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Play className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-8 h-8 text-primary ml-1" />
                          </div>
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2" data-testid={`text-video-title-${video.id}`}>
                        {video.title}
                      </h3>
                      <Badge variant="outline" className="mb-3 text-xs">
                        {video.subcategory}
                      </Badge>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          0
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Videos Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to upload a video in this {selectedSubcategory === "all" ? "category" : "subcategory"}!
                </p>
                <Button onClick={() => setLocation("/upload")} data-testid="button-upload-first">
                  Upload Your Video
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
