import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload as UploadIcon, Video, CheckCircle2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Category, Registration, Video as VideoType } from "@shared/schema";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    fileSize: number;
    mimeType: string;
  } | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: registrations, isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: ["/api/registrations/user"],
    enabled: !!user,
  });

  const { data: userVideos } = useQuery<VideoType[]>({
    queryKey: ["/api/videos/user"],
    enabled: !!user,
  });

  const registeredCategoryIds = registrations
    ?.filter(r => r.paymentStatus === 'approved')
    .flatMap(r => r.categoryIds) || [];

  const selectedCategoryData = categories?.find(c => c.id === selectedCategory);

  const categoryVideoCount = userVideos?.filter(v => v.categoryId === selectedCategory).length || 0;
  const canUploadToCategory = categoryVideoCount < 2;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-flv'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid Format",
        description: "Please upload a video in MP4, MPEG4, WebM, MOV, or FLV format.",
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 512 * 1024 * 1024; // 512MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File Too Large",
        description: "Video must be under 512MB.",
        variant: "destructive",
      });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.floor(video.duration);

      if (duration < 60 || duration > 180) {
        toast({
          title: "Invalid Duration",
          description: "Video must be between 1 and 3 minutes long.",
          variant: "destructive",
        });
        return;
      }

      setVideoFile(file);
      setVideoMetadata({
        duration,
        fileSize: file.size,
        mimeType: file.type,
      });

      toast({
        title: "Video Validated",
        description: `Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}, Size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      });
    };

    video.onerror = () => {
      toast({
        title: "Error",
        description: "Could not load video file. Please try another file.",
        variant: "destructive",
      });
    };

    video.src = URL.createObjectURL(file);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile || !videoMetadata || !selectedCategory || !selectedSubcategory || !title) {
        throw new Error("Missing required fields");
      }

      setIsUploading(true);
      setUploadProgress(0);

      const uploadUrlResponse: any = await apiRequest("/api/videos/upload-url", "POST", {
        fileName: videoFile.name,
      });

      const { uploadUrl, videoUrl } = uploadUrlResponse;

      const xhr = new XMLHttpRequest();
      
      await new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadProgress(Math.round(progress));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error('Upload failed'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', videoFile.type);
        xhr.send(videoFile);
      });

      const videoData = await apiRequest("/api/videos", "POST", {
        videoUrl,
        categoryId: selectedCategory,
        subcategory: selectedSubcategory,
        title,
        description: description || null,
        duration: videoMetadata.duration,
        fileSize: videoMetadata.fileSize,
        mimeType: videoMetadata.mimeType,
      });

      return videoData;
    },
    onSuccess: () => {
      toast({
        title: "Video Uploaded!",
        description: "Your video has been submitted for review. You'll be notified when it's approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/user"] });
      setSelectedCategory("");
      setSelectedSubcategory("");
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setVideoMetadata(null);
      setUploadProgress(0);
      setIsUploading(false);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  if (registrationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to upload videos</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="w-full" data-testid="button-login">
              Sign In with Replit
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registeredCategoryIds.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Registrations Found</CardTitle>
            <CardDescription>
              You must register for at least one category before uploading videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/register")} className="w-full" data-testid="button-register">
              Register Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableCategories = categories?.filter(c => registeredCategoryIds.includes(c.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Upload Video</h1>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back">
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="w-5 h-5" />
                Submit Your Video
              </CardTitle>
              <CardDescription>
                Upload your competition entry. Videos must be 1-3 minutes long and under 512MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  setSelectedSubcategory("");
                }} disabled={isUploading}>
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => {
                      const videoCount = userVideos?.filter(v => v.categoryId === category.id).length || 0;
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({videoCount}/2 videos)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategoryData && (
                <>
                  {!canUploadToCategory && (
                    <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive rounded-md">
                      <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Maximum Videos Reached
                        </p>
                        <p className="text-sm text-destructive/80">
                          You have already uploaded 2 videos for this category.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory *</Label>
                    <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={isUploading || !canUploadToCategory}>
                      <SelectTrigger id="subcategory" data-testid="select-subcategory">
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategoryData.subcategories.map(sub => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Video Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a catchy title for your video"
                  disabled={isUploading || !canUploadToCategory}
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers what your video is about"
                  rows={4}
                  disabled={isUploading || !canUploadToCategory}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video">Video File *</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="video"
                    type="file"
                    accept="video/mp4,video/mpeg,video/webm,video/quicktime,video/x-flv"
                    onChange={handleFileChange}
                    disabled={isUploading || !canUploadToCategory}
                    data-testid="input-video"
                  />
                </div>
                {videoFile && videoMetadata && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {videoFile.name} - {Math.floor(videoMetadata.duration / 60)}:{(videoMetadata.duration % 60).toString().padStart(2, '0')} - {(videoMetadata.fileSize / (1024 * 1024)).toFixed(2)}MB
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: MP4, MPEG4, WebM, MOV, FLV. Max 512MB, 1-3 minutes duration.
                </p>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedCategory || !selectedSubcategory || !title || !videoFile || !videoMetadata || isUploading || !canUploadToCategory}
                className="w-full"
                data-testid="button-submit"
              >
                {isUploading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Submit Video
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
