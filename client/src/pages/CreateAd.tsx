import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Upload, Video, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const overlayAdSchema = z.object({
  adType: z.literal("overlay"),
  name: z.string().min(3, "Ad name must be at least 3 characters"),
  destinationUrl: z.string().url("Must be a valid URL"),
  imageFile: z.instanceof(File, { message: "Image file is required" }),
  altText: z.string().min(1, "Alt text is required"),
  pricingModel: z.enum(["cpm", "cpc"]),
  bidAmount: z.coerce.number().min(50, "Minimum bid is 50 XAF"),
});

const videoAdSchema = z.object({
  adType: z.literal("skippable_instream"),
  name: z.string().min(3, "Ad name must be at least 3 characters"),
  destinationUrl: z.string().url("Must be a valid URL"),
  videoFile: z.instanceof(File, { message: "Video file is required" }),
  skipAfterSeconds: z.coerce.number().min(5).max(10),
  pricingModel: z.enum(["cpv", "cpm"]),
  bidAmount: z.coerce.number().min(10, "Minimum bid is 10 XAF"),
});

type OverlayAdFormData = z.infer<typeof overlayAdSchema>;
type VideoAdFormData = z.infer<typeof videoAdSchema>;

export default function CreateAd() {
  const [, params] = useRoute("/advertiser/campaign/:id/create-ad");
  const campaignId = params?.id || null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<"overlay" | "skippable_instream">("overlay");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const { data: campaign, isLoading: loadingCampaign } = useQuery<{ id: string; name: string }>({
    queryKey: ["/api/advertiser/campaigns", campaignId],
    enabled: !!campaignId,
  });

  const overlayForm = useForm<OverlayAdFormData>({
    resolver: zodResolver(overlayAdSchema),
    defaultValues: {
      adType: "overlay",
      name: "",
      destinationUrl: "",
      altText: "",
      pricingModel: "cpm",
      bidAmount: 500,
    },
  });

  const videoForm = useForm<VideoAdFormData>({
    resolver: zodResolver(videoAdSchema),
    defaultValues: {
      adType: "skippable_instream",
      name: "",
      destinationUrl: "",
      skipAfterSeconds: 5,
      pricingModel: "cpv",
      bidAmount: 10,
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          setIsUploading(false);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || 'Upload failed'));
            } catch (e) {
              reject(new Error('Upload failed'));
            }
          }
        });
        
        xhr.addEventListener('error', () => {
          setIsUploading(false);
          reject(new Error('Network error occurred'));
        });
        
        xhr.addEventListener('abort', () => {
          setIsUploading(false);
          reject(new Error('Upload cancelled'));
        });
        
        xhr.open('POST', `/api/advertiser/campaigns/${campaignId}/ads`);
        xhr.withCredentials = true;
        setIsUploading(true);
        setUploadProgress(0);
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertiser/campaigns", campaignId] });
      toast({
        title: "Ad created successfully!",
        description: "Your ad is pending admin approval.",
      });
      setUploadProgress(0);
      setLocation("/advertiser/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create ad",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setIsUploading(false);
    },
  });

  const onSubmitOverlay = (data: OverlayAdFormData) => {
    const formData = new FormData();
    formData.append("adType", data.adType);
    formData.append("name", data.name);
    formData.append("destinationUrl", data.destinationUrl);
    formData.append("altText", data.altText);
    formData.append("pricingModel", data.pricingModel);
    formData.append("bidAmount", data.bidAmount.toString());
    
    if (data.imageFile) {
      formData.append("mediaFile", data.imageFile);
    }

    createAdMutation.mutate(formData);
  };

  const onSubmitVideo = (data: VideoAdFormData) => {
    const formData = new FormData();
    formData.append("adType", data.adType);
    formData.append("name", data.name);
    formData.append("destinationUrl", data.destinationUrl);
    formData.append("skipAfterSeconds", data.skipAfterSeconds.toString());
    formData.append("pricingModel", data.pricingModel);
    formData.append("bidAmount", data.bidAmount.toString());
    
    if (data.videoFile) {
      formData.append("mediaFile", data.videoFile);
    }

    createAdMutation.mutate(formData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      overlayForm.setValue("imageFile", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      videoForm.setValue("videoFile", file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  if (!campaignId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Campaign</CardTitle>
            <CardDescription>Campaign ID is missing</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/advertiser/dashboard")} data-testid="button-back-dashboard">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingCampaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/advertiser/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Ad</CardTitle>
            <CardDescription>
              Campaign: {campaign?.name || "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overlay" data-testid="tab-overlay">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Overlay Banner
                </TabsTrigger>
                <TabsTrigger value="skippable_instream" data-testid="tab-video">
                  <Video className="w-4 h-4 mr-2" />
                  Video Ad
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overlay" className="space-y-6 mt-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Overlay Banner Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    Display a banner at the bottom of videos. Recommended size: 728x90px or 970x90px.
                    Pricing: CPM (per 1,000 views) or CPC (per click).
                  </p>
                </div>

                <Form {...overlayForm}>
                  <form onSubmit={overlayForm.handleSubmit(onSubmitOverlay)} className="space-y-6">
                    <FormField
                      control={overlayForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Summer Sale Banner 2024"
                              {...field}
                              data-testid="input-overlay-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Banner Image * (728x90 or 970x90 recommended)</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("overlay-image-upload")?.click()}
                          data-testid="button-upload-image"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Image
                        </Button>
                        <input
                          id="overlay-image-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        {imagePreview && (
                          <img src={imagePreview} alt="Preview" className="h-20 border rounded" />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={overlayForm.control}
                      name="altText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image Description / Alt Text *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Shop our summer sale - up to 50% off"
                              {...field}
                              data-testid="input-alt-text"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={overlayForm.control}
                      name="destinationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/sale"
                              {...field}
                              data-testid="input-overlay-url"
                            />
                          </FormControl>
                          <FormDescription>Where users go when they click the ad</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={overlayForm.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-overlay-pricing">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cpm">CPM (Per 1,000 Views)</SelectItem>
                                <SelectItem value="cpc">CPC (Per Click)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={overlayForm.control}
                        name="bidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bid Amount (XAF) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="500"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-overlay-bid"
                              />
                            </FormControl>
                            <FormDescription>
                              {overlayForm.watch("pricingModel") === "cpm" ? "Per 1,000 views (min 500 XAF)" : "Per click (min 50 XAF)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress-overlay">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Uploading ad...</span>
                          <span className="text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/advertiser/dashboard")}
                        disabled={isUploading}
                        data-testid="button-cancel-overlay"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-overlay"
                      >
                        {createAdMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Overlay Ad
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="skippable_instream" className="space-y-6 mt-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Skippable In-Stream Video Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    Play before competition videos. Users can skip after 5-10 seconds.
                    Max duration: 30 seconds. Pricing: CPV (per view) or CPM (per 1,000 impressions).
                  </p>
                </div>

                <Form {...videoForm}>
                  <form onSubmit={videoForm.handleSubmit(onSubmitVideo)} className="space-y-6">
                    <FormField
                      control={videoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Product Launch Video Ad"
                              {...field}
                              data-testid="input-video-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Video File * (Max 30 seconds, 50MB)</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("video-upload")?.click()}
                          data-testid="button-upload-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Video
                        </Button>
                        <input
                          id="video-upload"
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={handleVideoChange}
                        />
                        {videoPreview && (
                          <video src={videoPreview} controls className="h-32 border rounded" />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={videoForm.control}
                      name="destinationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/product"
                              {...field}
                              data-testid="input-video-url"
                            />
                          </FormControl>
                          <FormDescription>Where users go when they click the ad</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={videoForm.control}
                      name="skipAfterSeconds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allow Skip After (seconds) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="5"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-skip-seconds"
                            />
                          </FormControl>
                          <FormDescription>Users can skip after this many seconds (5-10)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={videoForm.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-video-pricing">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cpv">CPV (Per View)</SelectItem>
                                <SelectItem value="cpm">CPM (Per 1,000 Impressions)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={videoForm.control}
                        name="bidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bid Amount (XAF) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-video-bid"
                              />
                            </FormControl>
                            <FormDescription>
                              {videoForm.watch("pricingModel") === "cpv" ? "Per view (min 10 XAF)" : "Per 1,000 impressions (min 500 XAF)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress-video">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Uploading ad...</span>
                          <span className="text-muted-foreground">{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setLocation("/advertiser/dashboard")}
                        disabled={isUploading}
                        data-testid="button-cancel-video"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-video"
                      >
                        {createAdMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Create Video Ad
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
