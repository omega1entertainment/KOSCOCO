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
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<{
    duration: number;
    fileSize: number;
    mimeType: string;
  } | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<VideoType | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to upload videos to the competition
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={login} className="w-full" data-testid="button-login">
              Log In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid Format",
        description: "Please upload an image in JPEG, PNG, or WebP format.",
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "File Too Large",
        description: "Thumbnail must be under 2MB.",
        variant: "destructive",
      });
      return;
    }

    setThumbnailFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast({
      title: "Thumbnail Selected",
      description: `${file.name} - ${(file.size / 1024).toFixed(2)}KB`,
    });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile || !videoMetadata || !selectedCategory || !selectedSubcategory || !title) {
        throw new Error("Missing required fields");
      }

      setIsUploading(true);
      setUploadProgress(0);

      const uploadPathResponse = await apiRequest("/api/videos/upload-url", "POST", {
        fileName: videoFile.name,
      });

      const { videoUrl } = await uploadPathResponse.json();

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('videoUrl', videoUrl);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

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
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

        xhr.open('POST', '/api/videos/upload');
        xhr.send(formData);
      });

      const uploadResponse = JSON.parse(xhr.responseText);
      const thumbnailUrl = uploadResponse.thumbnailUrl || null;

      const videoResponse = await apiRequest("/api/videos", "POST", {
        videoUrl,
        thumbnailUrl,
        categoryId: selectedCategory,
        subcategory: selectedSubcategory,
        title,
        description: description || null,
        duration: videoMetadata.duration,
        fileSize: videoMetadata.fileSize,
        mimeType: videoMetadata.mimeType,
      });

      const videoData = await videoResponse.json();
      return videoData;
    },
    onSuccess: (videoData: VideoType) => {
      toast({
        title: "Video Uploaded!",
        description: "Your video has been submitted for review. You can preview it below.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/user"] });
      setUploadedVideo(videoData);
      setIsUploading(false);
      setUploadProgress(100);
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
        <div className="max-w-2xl mx-auto space-y-6">
          {uploadedVideo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Upload Successful!
                </CardTitle>
                <CardDescription>
                  Your video has been uploaded and is pending review. You can preview it below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-black rounded-md overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    src={uploadedVideo.videoUrl}
                    data-testid="video-player"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{uploadedVideo.title}</h3>
                  {uploadedVideo.description && (
                    <p className="text-sm text-muted-foreground">{uploadedVideo.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Duration: {Math.floor(uploadedVideo.duration / 60)}:{(uploadedVideo.duration % 60).toString().padStart(2, '0')}</span>
                    <span>Size: {(uploadedVideo.fileSize / (1024 * 1024)).toFixed(2)}MB</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setUploadedVideo(null);
                      setSelectedCategory("");
                      setSelectedSubcategory("");
                      setTitle("");
                      setDescription("");
                      setVideoFile(null);
                      setThumbnailFile(null);
                      setThumbnailPreview(null);
                      setVideoMetadata(null);
                      setUploadProgress(0);
                    }}
                    className="flex-1"
                    data-testid="button-upload-another"
                  >
                    Upload Another Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex-1"
                    data-testid="button-go-home"
                  >
                    Back to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!uploadedVideo && (
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

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail (Optional)</Label>
                <div className="space-y-3">
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailChange}
                    disabled={isUploading || !canUploadToCategory}
                    data-testid="input-thumbnail"
                  />
                  {thumbnailPreview && (
                    <div className="relative w-full max-w-xs">
                      <img 
                        src={thumbnailPreview} 
                        alt="Thumbnail preview" 
                        className="w-full rounded-md border"
                        data-testid="img-thumbnail-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview(null);
                        }}
                        disabled={isUploading}
                        data-testid="button-remove-thumbnail"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Upload a custom thumbnail or one will be generated automatically from your video. Accepted formats: JPEG, PNG, WebP. Max 2MB.
                  </p>
                </div>
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
          )}
        </div>
      </main>
    </div>
  );
}
