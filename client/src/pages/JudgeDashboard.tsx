import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Clock, CheckCircle, AlertCircle, Upload, User as UserIcon } from "lucide-react";
import type { VideoForJudging, JudgeScoreWithVideo } from "@shared/schema";

//Profile form schema
const profileFormSchema = z.object({
  judgeName: z.string().min(2, "Name must be at least 2 characters").max(80, "Name must be less than 80 characters"),
  judgeBio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function JudgeDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  
  // Profile photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Fetch pending videos
  const { data: pendingVideos, isLoading: pendingLoading } = useQuery<VideoForJudging[]>({
    queryKey: ['/api/judge/videos/pending'],
    enabled: activeTab === "pending",
  });

  // Fetch completed scores
  const { data: completedScores, isLoading: completedLoading } = useQuery<JudgeScoreWithVideo[]>({
    queryKey: ['/api/judge/videos/completed'],
    enabled: activeTab === "completed",
  });

  // Fetch summary
  const { data: summary } = useQuery<{ pendingCount: number; completedCount: number }>({
    queryKey: ['/api/judge/summary'],
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      judgeName: user?.judgeName || "",
      judgeBio: user?.judgeBio || "",
    },
  });

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      
      const response = await fetch("/api/judge/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload photo");
      }
      
      return await response.json();
    },
    onSuccess: (data: { photoUrl: string }) => {
      setPhotoPreview(URL.createObjectURL(photoFile!));
      // Update the profile with new photo
      updateProfileMutation.mutate({ judgePhotoUrl: data.photoUrl });
      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<ProfileFormValues & { judgePhotoUrl?: string }>) => {
      return await apiRequest("/api/judge/profile", "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Photo must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setPhotoFile(file);
    uploadPhotoMutation.mutate(file);
  };

  const handleProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  // Score submission
  const [scoringVideoId, setScoringVideoId] = useState<string | null>(null);
  const [creativityScore, setCreativityScore] = useState("");
  const [qualityScore, setQualityScore] = useState("");
  const [comments, setComments] = useState("");

  const scoreMutation = useMutation({
    mutationFn: async ({ videoId, creativity, quality, comment }: {
      videoId: string;
      creativity: number;
      quality: number;
      comment?: string;
    }) => {
      return await apiRequest(`/api/judge/videos/${videoId}/score`, "POST", {
        creativityScore: creativity,
        qualityScore: quality,
        comments: comment || undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Score Submitted",
        description: "Your score has been recorded successfully",
      });
      setScoringVideoId(null);
      setCreativityScore("");
      setQualityScore("");
      setComments("");
      queryClient.invalidateQueries({ queryKey: ['/api/judge/videos/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/judge/videos/completed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/judge/summary'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit score",
        variant: "destructive",
      });
    },
  });

  const handleScoreSubmit = (videoId: string) => {
    const creativity = parseInt(creativityScore);
    const quality = parseInt(qualityScore);

    if (isNaN(creativity) || isNaN(quality)) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid numbers for both scores",
        variant: "destructive",
      });
      return;
    }

    if (creativity < 0 || creativity > 10 || quality < 0 || quality > 10) {
      toast({
        title: "Invalid Range",
        description: "Scores must be between 0 and 10",
        variant: "destructive",
      });
      return;
    }

    scoreMutation.mutate({
      videoId,
      creativity,
      quality,
      comment: comments.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="heading-judge-dashboard">
            Judge Dashboard
          </h1>
          <p className="text-muted-foreground" data-testid="text-dashboard-description">
            Review and score competition videos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card data-testid="card-stat-pending">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Videos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {summary?.pendingCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Videos awaiting your score</p>
            </CardContent>
          </Card>

          <Card data-testid="card-stat-completed">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed-count">
                {summary?.completedCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Videos you've scored</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="pending" data-testid="tab-pending">
              Pending ({summary?.pendingCount || 0})
            </TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">
              Completed ({summary?.completedCount || 0})
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="mt-6">
            {pendingLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading pending videos...</p>
                </CardContent>
              </Card>
            ) : !pendingVideos || pendingVideos.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    You've scored all available videos
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {pendingVideos.map((video) => {
                  const isScoring = scoringVideoId === video.id;
                  const videoUrl = video.videoUrl.startsWith('/objects/')
                    ? video.videoUrl
                    : `/objects/${video.videoUrl}`;

                  return (
                    <Card key={video.id} data-testid={`card-pending-video-${video.id}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        {/* Video Preview */}
                        <div className="md:col-span-1">
                          <div className="aspect-video bg-black rounded-md overflow-hidden relative group">
                            {video.thumbnailUrl ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-16 w-16 rounded-full bg-white/90 hover:bg-white"
                                    onClick={() => setLocation(`/video/${video.id}`)}
                                    data-testid={`button-play-${video.id}`}
                                  >
                                    <Play className="w-8 h-8 text-primary fill-current ml-1" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <video
                                controls
                                preload="metadata"
                                className="w-full h-full"
                                data-testid={`video-preview-${video.id}`}
                              >
                                <source src={videoUrl} type="video/mp4" />
                              </video>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                            <span>Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/video/${video.id}`)}
                              data-testid={`button-view-full-${video.id}`}
                            >
                              View Full
                            </Button>
                          </div>
                        </div>

                        {/* Video Details */}
                        <div className="md:col-span-2">
                          <div className="mb-4">
                            <h3 className="text-2xl font-bold mb-2" data-testid={`text-video-title-${video.id}`}>
                              {video.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {video.category && (
                                <Badge variant="secondary" data-testid={`badge-category-${video.id}`}>
                                  {video.category.name}
                                </Badge>
                              )}
                              <Badge variant="outline" data-testid={`badge-subcategory-${video.id}`}>
                                {video.subcategory}
                              </Badge>
                            </div>
                            {video.creator && (
                              <p className="text-sm text-muted-foreground mb-2">
                                By: {video.creator.firstName} {video.creator.lastName}
                              </p>
                            )}
                            {video.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {video.description}
                              </p>
                            )}
                          </div>

                          {/* Scoring Form */}
                          {isScoring ? (
                            <div className="space-y-4 border-t pt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`creativity-${video.id}`}>
                                    Creativity Score (0-10)
                                  </Label>
                                  <Input
                                    id={`creativity-${video.id}`}
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={creativityScore}
                                    onChange={(e) => setCreativityScore(e.target.value)}
                                    placeholder="0-10"
                                    data-testid={`input-creativity-${video.id}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`quality-${video.id}`}>
                                    Quality Score (0-10)
                                  </Label>
                                  <Input
                                    id={`quality-${video.id}`}
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={qualityScore}
                                    onChange={(e) => setQualityScore(e.target.value)}
                                    placeholder="0-10"
                                    data-testid={`input-quality-${video.id}`}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`comments-${video.id}`}>
                                  Comments (Optional)
                                </Label>
                                <Textarea
                                  id={`comments-${video.id}`}
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  placeholder="Add any comments about this video..."
                                  rows={3}
                                  data-testid={`textarea-comments-${video.id}`}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleScoreSubmit(video.id)}
                                  disabled={scoreMutation.isPending}
                                  data-testid={`button-submit-score-${video.id}`}
                                >
                                  {scoreMutation.isPending ? "Submitting..." : "Submit Score"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setScoringVideoId(null);
                                    setCreativityScore("");
                                    setQualityScore("");
                                    setComments("");
                                  }}
                                  data-testid={`button-cancel-score-${video.id}`}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setScoringVideoId(video.id)}
                              className="mt-4"
                              data-testid={`button-score-video-${video.id}`}
                            >
                              Score This Video
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed" className="mt-6">
            {completedLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Loading completed scores...</p>
                </CardContent>
              </Card>
            ) : !completedScores || completedScores.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Completed Scores</h3>
                  <p className="text-muted-foreground">
                    You haven't scored any videos yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {completedScores.map((score) => {
                  const video = score.video;
                  const totalScore = score.creativityScore + score.qualityScore;

                  return (
                    <Card key={score.id} data-testid={`card-completed-score-${score.id}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        {/* Video Preview */}
                        <div className="md:col-span-1">
                          <div 
                            className="aspect-video bg-muted rounded-md overflow-hidden cursor-pointer hover-elevate"
                            onClick={() => setLocation(`/video/${video.id}`)}
                          >
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
                          </div>
                        </div>

                        {/* Video Details & Score */}
                        <div className="md:col-span-2">
                          <h3 className="text-2xl font-bold mb-2" data-testid={`text-completed-title-${score.id}`}>
                            {video.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {video.category && (
                              <Badge variant="secondary">
                                {video.category.name}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {video.subcategory}
                            </Badge>
                          </div>
                          {video.creator && (
                            <p className="text-sm text-muted-foreground mb-4">
                              By: {video.creator.firstName} {video.creator.lastName}
                            </p>
                          )}

                          <div className="space-y-3 border-t pt-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Creativity</p>
                                <p className="text-2xl font-bold" data-testid={`text-creativity-score-${score.id}`}>
                                  {score.creativityScore}/10
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Quality</p>
                                <p className="text-2xl font-bold" data-testid={`text-quality-score-${score.id}`}>
                                  {score.qualityScore}/10
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Total</p>
                                <p className="text-2xl font-bold text-primary" data-testid={`text-total-score-${score.id}`}>
                                  {totalScore}/20
                                </p>
                              </div>
                            </div>
                            {score.comments && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Your Comments</p>
                                <p className="text-sm" data-testid={`text-comments-${score.id}`}>
                                  {score.comments}
                                </p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Scored on {new Date(score.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle data-testid="heading-profile">My Profile</CardTitle>
                <CardDescription>
                  Update your judge profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Photo Upload Section */}
                  <div className="flex flex-col items-center gap-4 pb-6 border-b">
                    <Avatar className="h-32 w-32" data-testid="avatar-profile">
                      <AvatarImage 
                        src={photoPreview || user?.judgePhotoUrl || undefined} 
                        alt={user?.judgeName || "Judge"} 
                      />
                      <AvatarFallback className="text-3xl">
                        <UserIcon className="h-16 w-16" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <Input
                        ref={photoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        data-testid="input-photo-file"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={uploadPhotoMutation.isPending}
                        data-testid="button-upload-photo"
                      >
                        {uploadPhotoMutation.isPending ? (
                          <>Uploading...</>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New Photo
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPEG, PNG, or WebP • Max 5MB
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="judgeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Judge Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your display name" 
                                {...field} 
                                data-testid="input-judge-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="judgeBio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell the contestants about yourself..."
                                rows={5}
                                className="resize-none"
                                {...field}
                                data-testid="textarea-judge-bio"
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground">
                              {(field.value?.length || 0)}/500 characters
                            </p>
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </form>
                  </Form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
