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
import { DragDropUpload } from "@/components/DragDropUpload";
import type { Category, Registration, Video as VideoType } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, login } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
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
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>{t('upload.authRequired')}</CardTitle>
            <CardDescription>
              {t('upload.authDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={login} className="w-full" data-testid="button-login">
              {t('upload.loginToContinue')}
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

  const handleVideoFileSelect = (file: File) => {
    const ALLOWED_TYPES = ['video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-flv'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: t('upload.error.invalidFormat'),
        description: t('upload.error.invalidVideoFormat'),
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 512 * 1024 * 1024; // 512MB
    if (file.size > MAX_SIZE) {
      toast({
        title: t('upload.error.fileTooLarge'),
        description: t('upload.error.videoTooLarge'),
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
          title: t('upload.error.invalidDuration'),
          description: t('upload.error.durationRequirement'),
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
        title: t('upload.success.videoValidated'),
        description: `${t('upload.duration')}: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}, ${t('upload.size')}: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      });
    };

    video.onerror = () => {
      toast({
        title: t('upload.toast.error'),
        description: t('upload.error.videoLoadError'),
        variant: "destructive",
      });
    };

    video.src = URL.createObjectURL(file);
  };

  const handleThumbnailFileSelect = (file: File) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: t('upload.error.invalidFormat'),
        description: t('upload.error.invalidImageFormat'),
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      toast({
        title: t('upload.error.fileTooLarge'),
        description: t('upload.error.thumbnailTooLarge'),
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
      title: t('upload.success.thumbnailSelected'),
      description: `${file.name} - ${(file.size / 1024).toFixed(2)}KB`,
    });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile || !videoMetadata || !selectedCategory || !selectedSubcategory || !title) {
        throw new Error(t('upload.error.requiredFields'));
      }
      if (!thumbnailFile) {
        throw new Error(t('upload.error.thumbnailRequired'));
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
      formData.append('thumbnail', thumbnailFile);

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
              reject(new Error(errorData.message || t('upload.error.uploadFailed')));
            } catch {
              reject(new Error(`${t('upload.error.uploadFailedStatus')} ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => reject(new Error(t('upload.error.networkError'))));
        xhr.addEventListener('abort', () => reject(new Error(t('upload.error.uploadCancelled'))));

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
        title: t('upload.success.videoUploaded'),
        description: t('upload.success.videoSubmitted'),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/user"] });
      // Invalidate category video counts to refresh in real-time
      queryClient.invalidateQueries({ queryKey: ["/api/categories/video-counts"] });
      setUploadedVideo(videoData);
      setIsUploading(false);
      setUploadProgress(100);
    },
    onError: (error: Error) => {
      toast({
        title: t('upload.toast.uploadFailed'),
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
          <p className="mt-4 text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('upload.signInRequired')}</CardTitle>
            <CardDescription>{t('upload.signInDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={login} className="w-full" data-testid="button-login">
              {t('upload.signInWithReplit')}
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
            <CardTitle>{t('upload.noRegistrations')}</CardTitle>
            <CardDescription>
              {t('upload.noRegistrationsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/register")} className="w-full" data-testid="button-register">
              {t('upload.registerNow')}
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
            <h1 className="text-2xl font-bold">{t('upload.pageTitle')}</h1>
            <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-back">
              {t('upload.backToHome')}
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
                  {t('upload.uploadSuccessful')}
                </CardTitle>
                <CardDescription>
                  {t('upload.uploadSuccessDescription')}
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
                    {t('upload.browserNotSupported')}
                  </video>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{uploadedVideo.title}</h3>
                  {uploadedVideo.description && (
                    <p className="text-sm text-muted-foreground">{uploadedVideo.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{t('upload.duration')}: {Math.floor(uploadedVideo.duration / 60)}:{(uploadedVideo.duration % 60).toString().padStart(2, '0')}</span>
                    <span>{t('upload.size')}: {(uploadedVideo.fileSize / (1024 * 1024)).toFixed(2)}MB</span>
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
                    {t('upload.uploadAnother')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/")}
                    className="flex-1"
                    data-testid="button-go-home"
                  >
                    {t('upload.backToHome')}
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
                  {t('upload.submitTitle')}
                </CardTitle>
                <CardDescription>
                  {t('upload.submitDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">{t('upload.categoryLabel')}</Label>
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  setSelectedSubcategory("");
                }} disabled={isUploading}>
                  <SelectTrigger id="category" data-testid="select-category">
                    <SelectValue placeholder={t('upload.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(category => {
                      const videoCount = userVideos?.filter(v => v.categoryId === category.id).length || 0;
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} ({videoCount}/2 {t('upload.videoCountLabel')})
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
                          {t('upload.maxVideosReached')}
                        </p>
                        <p className="text-sm text-destructive/80">
                          {t('upload.maxVideosDescription')}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subcategory">{t('upload.subcategoryLabel')}</Label>
                    <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory} disabled={isUploading || !canUploadToCategory}>
                      <SelectTrigger id="subcategory" data-testid="select-subcategory">
                        <SelectValue placeholder={t('upload.subcategoryPlaceholder')} />
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
                <Label htmlFor="title">{t('upload.videoTitleLabel')}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('upload.videoTitlePlaceholder')}
                  disabled={isUploading || !canUploadToCategory}
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('upload.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('upload.descriptionPlaceholder')}
                  rows={4}
                  disabled={isUploading || !canUploadToCategory}
                  data-testid="input-description"
                />
              </div>

              <div className="space-y-2">
                <Label>{t('upload.videoFileLabel')}</Label>
                <DragDropUpload
                  accept="video/mp4,video/mpeg,video/webm,video/quicktime,video/x-flv"
                  onFileSelect={handleVideoFileSelect}
                  disabled={isUploading || !canUploadToCategory}
                  currentFile={videoFile}
                  onClear={() => {
                    setVideoFile(null);
                    setVideoMetadata(null);
                  }}
                  label={t('upload.uploadVideo')}
                  description={t('upload.dragDropVideo')}
                  type="video"
                  maxSizeMB={512}
                />
                {videoFile && videoMetadata && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {t('upload.duration')}: {Math.floor(videoMetadata.duration / 60)}:{(videoMetadata.duration % 60).toString().padStart(2, '0')} • {t('upload.size')}: {(videoMetadata.fileSize / (1024 * 1024)).toFixed(2)}MB
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('upload.videoRequirements')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t('upload.thumbnailLabel')}</Label>
                <DragDropUpload
                  accept="image/jpeg,image/png,image/webp"
                  onFileSelect={handleThumbnailFileSelect}
                  disabled={isUploading || !canUploadToCategory}
                  currentFile={thumbnailFile}
                  onClear={() => {
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
                  }}
                  label={t('upload.uploadThumbnail')}
                  description={t('upload.dragDropThumbnail')}
                  type="image"
                  maxSizeMB={2}
                />
                {thumbnailPreview && (
                  <div className="relative w-full max-w-xs">
                    <img 
                      src={thumbnailPreview} 
                      alt={t('upload.thumbnailPreview')} 
                      className="w-full rounded-md border"
                      data-testid="img-thumbnail-preview"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('upload.thumbnailRequirements')}
                </p>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{t('upload.uploading')}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <Button
                onClick={() => uploadMutation.mutate()}
                disabled={!selectedCategory || !selectedSubcategory || !title || !videoFile || !videoMetadata || !thumbnailFile || isUploading || !canUploadToCategory}
                className="w-full"
                data-testid="button-submit"
              >
                {isUploading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('upload.uploading')}
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    {t('upload.submitVideo')}
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
