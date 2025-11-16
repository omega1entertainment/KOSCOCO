import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Upload, Video, Image as ImageIcon, Zap, Clock } from "lucide-react";
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

const skippableVideoAdSchema = z.object({
  adType: z.literal("skippable_instream"),
  name: z.string().min(3, "Ad name must be at least 3 characters"),
  destinationUrl: z.string().url("Must be a valid URL"),
  videoFile: z.instanceof(File, { message: "Video file is required" }),
  skipAfterSeconds: z.coerce.number().min(5).max(10),
  pricingModel: z.enum(["cpv", "cpm"]),
  bidAmount: z.coerce.number().min(10, "Minimum bid is 10 XAF"),
});

const nonSkippableVideoAdSchema = z.object({
  adType: z.literal("non_skippable_instream"),
  name: z.string().min(3, "Ad name must be at least 3 characters"),
  destinationUrl: z.string().url("Must be a valid URL"),
  videoFile: z.instanceof(File, { message: "Video file is required" }),
  pricingModel: z.enum(["cpv", "cpm"]),
  bidAmount: z.coerce.number().min(20, "Minimum bid is 20 XAF"),
});

const bumperAdSchema = z.object({
  adType: z.literal("bumper"),
  name: z.string().min(3, "Ad name must be at least 3 characters"),
  destinationUrl: z.string().url("Must be a valid URL"),
  videoFile: z.instanceof(File, { message: "Video file is required (max 6 seconds)" }),
  pricingModel: z.enum(["cpv", "cpm"]),
  bidAmount: z.coerce.number().min(15, "Minimum bid is 15 XAF"),
});

const inFeedVideoAdSchema = z.object({
  adType: z.literal("in_feed"),
  name: z.string().min(3, "Ad name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  destinationUrl: z.string().url("Must be a valid URL"),
  videoFile: z.instanceof(File, { message: "Video file is required" }),
  ctaText: z.string().min(1, "Call-to-action text is required"),
  pricingModel: z.enum(["cpv", "cpc"]),
  bidAmount: z.coerce.number().min(30, "Minimum bid is 30 XAF"),
});

type OverlayAdFormData = z.infer<typeof overlayAdSchema>;
type SkippableVideoAdFormData = z.infer<typeof skippableVideoAdSchema>;
type NonSkippableVideoAdFormData = z.infer<typeof nonSkippableVideoAdSchema>;
type BumperAdFormData = z.infer<typeof bumperAdSchema>;
type InFeedVideoAdFormData = z.infer<typeof inFeedVideoAdSchema>;

type AdType = "overlay" | "skippable_instream" | "non_skippable_instream" | "bumper" | "in_feed";

export default function CreateAd() {
  const [, params] = useRoute("/advertiser/campaign/:id/create-ad");
  const campaignId = params?.id || null;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<AdType>("overlay");
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

  const skippableVideoForm = useForm<SkippableVideoAdFormData>({
    resolver: zodResolver(skippableVideoAdSchema),
    defaultValues: {
      adType: "skippable_instream",
      name: "",
      destinationUrl: "",
      skipAfterSeconds: 5,
      pricingModel: "cpv",
      bidAmount: 10,
    },
  });

  const nonSkippableVideoForm = useForm<NonSkippableVideoAdFormData>({
    resolver: zodResolver(nonSkippableVideoAdSchema),
    defaultValues: {
      adType: "non_skippable_instream",
      name: "",
      destinationUrl: "",
      pricingModel: "cpv",
      bidAmount: 20,
    },
  });

  const bumperForm = useForm<BumperAdFormData>({
    resolver: zodResolver(bumperAdSchema),
    defaultValues: {
      adType: "bumper",
      name: "",
      destinationUrl: "",
      pricingModel: "cpv",
      bidAmount: 15,
    },
  });

  const inFeedForm = useForm<InFeedVideoAdFormData>({
    resolver: zodResolver(inFeedVideoAdSchema),
    defaultValues: {
      adType: "in_feed",
      name: "",
      description: "",
      destinationUrl: "",
      ctaText: "Learn More",
      pricingModel: "cpv",
      bidAmount: 30,
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
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

  const onSubmitSkippableVideo = (data: SkippableVideoAdFormData) => {
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

  const onSubmitNonSkippableVideo = (data: NonSkippableVideoAdFormData) => {
    const formData = new FormData();
    formData.append("adType", data.adType);
    formData.append("name", data.name);
    formData.append("destinationUrl", data.destinationUrl);
    formData.append("pricingModel", data.pricingModel);
    formData.append("bidAmount", data.bidAmount.toString());
    
    if (data.videoFile) {
      formData.append("mediaFile", data.videoFile);
    }

    createAdMutation.mutate(formData);
  };

  const onSubmitBumper = (data: BumperAdFormData) => {
    const formData = new FormData();
    formData.append("adType", data.adType);
    formData.append("name", data.name);
    formData.append("destinationUrl", data.destinationUrl);
    formData.append("pricingModel", data.pricingModel);
    formData.append("bidAmount", data.bidAmount.toString());
    formData.append("duration", "6");
    
    if (data.videoFile) {
      formData.append("mediaFile", data.videoFile);
    }

    createAdMutation.mutate(formData);
  };

  const onSubmitInFeed = (data: InFeedVideoAdFormData) => {
    const formData = new FormData();
    formData.append("adType", data.adType);
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("destinationUrl", data.destinationUrl);
    formData.append("ctaText", data.ctaText);
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

  const handleVideoChange = (formType: 'skippable' | 'non-skippable' | 'bumper' | 'in-feed') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      switch (formType) {
        case 'skippable':
          skippableVideoForm.setValue("videoFile", file);
          break;
        case 'non-skippable':
          nonSkippableVideoForm.setValue("videoFile", file);
          break;
        case 'bumper':
          bumperForm.setValue("videoFile", file);
          break;
        case 'in-feed':
          inFeedForm.setValue("videoFile", file);
          break;
      }
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
            <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as AdType)}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="overlay" data-testid="tab-overlay" className="text-xs">
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Overlay
                </TabsTrigger>
                <TabsTrigger value="skippable_instream" data-testid="tab-skippable" className="text-xs">
                  <Video className="w-3 h-3 mr-1" />
                  Skippable
                </TabsTrigger>
                <TabsTrigger value="non_skippable_instream" data-testid="tab-non-skippable" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Non-Skip
                </TabsTrigger>
                <TabsTrigger value="bumper" data-testid="tab-bumper" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Bumper
                </TabsTrigger>
                <TabsTrigger value="in_feed" data-testid="tab-in-feed" className="text-xs">
                  <Video className="w-3 h-3 mr-1" />
                  In-Feed
                </TabsTrigger>
              </TabsList>

              {/* Overlay Banner Ad */}
              <TabsContent value="overlay" className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Overlay Banner Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    Display a dismissible banner at the bottom of videos. Size: 728x90px or 970x90px.
                    Pricing: CPM (per 1,000 views) or CPC (per click). Min bid: 50-500 XAF.
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
                            <Input placeholder="Summer Sale Banner 2024" {...field} data-testid="input-overlay-name" />
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
                          data-testid="button-upload-overlay-image"
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
                          <img src={imagePreview} alt="Preview" className="h-20 border rounded" data-testid="img-overlay-preview" />
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
                            <Input placeholder="Shop our summer sale - up to 50% off" {...field} data-testid="input-alt-text" />
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
                            <Input placeholder="https://example.com/sale" {...field} data-testid="input-overlay-url" />
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

                    {isUploading && selectedType === "overlay" && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress">
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
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-overlay"
                      >
                        {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Overlay Ad
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Skippable In-Stream Video Ad */}
              <TabsContent value="skippable_instream" className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Skippable In-Stream Video Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    Play before competition videos. Users can skip after 5-10 seconds. Max 30 seconds.
                    Pricing: CPV (per view) or CPM (per 1,000 impressions). Min bid: 10-500 XAF.
                  </p>
                </div>

                <Form {...skippableVideoForm}>
                  <form onSubmit={skippableVideoForm.handleSubmit(onSubmitSkippableVideo)} className="space-y-6">
                    <FormField
                      control={skippableVideoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Product Launch Video Ad" {...field} data-testid="input-skippable-name" />
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
                          onClick={() => document.getElementById("skippable-video-upload")?.click()}
                          data-testid="button-upload-skippable-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Video
                        </Button>
                        <input
                          id="skippable-video-upload"
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={handleVideoChange('skippable')}
                        />
                        {videoPreview && selectedType === "skippable_instream" && (
                          <video src={videoPreview} controls className="h-32 border rounded" data-testid="video-skippable-preview" />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={skippableVideoForm.control}
                      name="destinationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/product" {...field} data-testid="input-skippable-url" />
                          </FormControl>
                          <FormDescription>Where users go when they click the ad</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={skippableVideoForm.control}
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
                        control={skippableVideoForm.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-skippable-pricing">
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
                        control={skippableVideoForm.control}
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
                                data-testid="input-skippable-bid"
                              />
                            </FormControl>
                            <FormDescription>
                              {skippableVideoForm.watch("pricingModel") === "cpv" ? "Per view (min 10 XAF)" : "Per 1,000 impressions (min 500 XAF)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isUploading && selectedType === "skippable_instream" && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress">
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
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-skippable"
                      >
                        {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Skippable Ad
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Non-Skippable In-Stream Video Ad */}
              <TabsContent value="non_skippable_instream" className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Non-Skippable In-Stream Video Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    Play before competition videos. Users must watch the entire ad (max 15 seconds).
                    Higher engagement guaranteed. Pricing: CPV or CPM. Min bid: 20-1,000 XAF.
                  </p>
                </div>

                <Form {...nonSkippableVideoForm}>
                  <form onSubmit={nonSkippableVideoForm.handleSubmit(onSubmitNonSkippableVideo)} className="space-y-6">
                    <FormField
                      control={nonSkippableVideoForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Brand Awareness Video" {...field} data-testid="input-non-skippable-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Video File * (Max 15 seconds, 50MB)</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("non-skippable-video-upload")?.click()}
                          data-testid="button-upload-non-skippable-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Video
                        </Button>
                        <input
                          id="non-skippable-video-upload"
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={handleVideoChange('non-skippable')}
                        />
                        {videoPreview && selectedType === "non_skippable_instream" && (
                          <video src={videoPreview} controls className="h-32 border rounded" data-testid="video-non-skippable-preview" />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={nonSkippableVideoForm.control}
                      name="destinationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/product" {...field} data-testid="input-non-skippable-url" />
                          </FormControl>
                          <FormDescription>Where users go when they click the ad</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={nonSkippableVideoForm.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-non-skippable-pricing">
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
                        control={nonSkippableVideoForm.control}
                        name="bidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bid Amount (XAF) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="20"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-non-skippable-bid"
                              />
                            </FormControl>
                            <FormDescription>
                              {nonSkippableVideoForm.watch("pricingModel") === "cpv" ? "Per view (min 20 XAF)" : "Per 1,000 impressions (min 1,000 XAF)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isUploading && selectedType === "non_skippable_instream" && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress">
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
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-non-skippable"
                      >
                        {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Non-Skippable Ad
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Bumper Ad */}
              <TabsContent value="bumper" className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Bumper Ad (6 Seconds)</h3>
                  <p className="text-sm text-muted-foreground">
                    Short, impactful 6-second video ad played before content. Non-skippable.
                    Perfect for brand awareness. Pricing: CPV or CPM. Min bid: 15-800 XAF.
                  </p>
                </div>

                <Form {...bumperForm}>
                  <form onSubmit={bumperForm.handleSubmit(onSubmitBumper)} className="space-y-6">
                    <FormField
                      control={bumperForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Quick Brand Message" {...field} data-testid="input-bumper-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Video File * (Exactly 6 seconds, 20MB max)</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("bumper-video-upload")?.click()}
                          data-testid="button-upload-bumper-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Video
                        </Button>
                        <input
                          id="bumper-video-upload"
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={handleVideoChange('bumper')}
                        />
                        {videoPreview && selectedType === "bumper" && (
                          <video src={videoPreview} controls className="h-32 border rounded" data-testid="video-bumper-preview" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Note: Video must be exactly 6 seconds long. Longer videos will be rejected.
                      </p>
                    </div>

                    <FormField
                      control={bumperForm.control}
                      name="destinationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} data-testid="input-bumper-url" />
                          </FormControl>
                          <FormDescription>Where users go when they click the ad</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={bumperForm.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-bumper-pricing">
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
                        control={bumperForm.control}
                        name="bidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bid Amount (XAF) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="15"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-bumper-bid"
                              />
                            </FormControl>
                            <FormDescription>
                              {bumperForm.watch("pricingModel") === "cpv" ? "Per view (min 15 XAF)" : "Per 1,000 impressions (min 800 XAF)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isUploading && selectedType === "bumper" && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress">
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
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-bumper"
                      >
                        {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Bumper Ad
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* In-Feed Video Ad */}
              <TabsContent value="in_feed" className="space-y-6">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">In-Feed Video Ad</h3>
                  <p className="text-sm text-muted-foreground">
                    Native video ad displayed within content feeds. Includes title, description, and CTA button.
                    Auto-plays on scroll. Pricing: CPV or CPC. Min bid: 30-100 XAF.
                  </p>
                </div>

                <Form {...inFeedForm}>
                  <form onSubmit={inFeedForm.handleSubmit(onSubmitInFeed)} className="space-y-6">
                    <FormField
                      control={inFeedForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Discover Our New Product Line" {...field} data-testid="input-in-feed-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inFeedForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell viewers about your product or service..."
                              className="resize-none"
                              rows={3}
                              {...field}
                              data-testid="input-in-feed-description"
                            />
                          </FormControl>
                          <FormDescription>Brief description shown below the video (max 200 chars)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>Video File * (Max 60 seconds, 100MB)</FormLabel>
                      <div className="mt-2 flex items-center gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("in-feed-video-upload")?.click()}
                          data-testid="button-upload-in-feed-video"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Video
                        </Button>
                        <input
                          id="in-feed-video-upload"
                          type="file"
                          accept="video/mp4,video/webm"
                          className="hidden"
                          onChange={handleVideoChange('in-feed')}
                        />
                        {videoPreview && selectedType === "in_feed" && (
                          <video src={videoPreview} controls className="h-32 border rounded" data-testid="video-in-feed-preview" />
                        )}
                      </div>
                    </div>

                    <FormField
                      control={inFeedForm.control}
                      name="destinationUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/product" {...field} data-testid="input-in-feed-url" />
                          </FormControl>
                          <FormDescription>Where users go when they click the CTA button</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={inFeedForm.control}
                      name="ctaText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Call-to-Action Button Text *</FormLabel>
                          <FormControl>
                            <Input placeholder="Learn More" {...field} data-testid="input-cta-text" />
                          </FormControl>
                          <FormDescription>Text displayed on the action button (e.g. "Learn More", "Shop Now")</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={inFeedForm.control}
                        name="pricingModel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-in-feed-pricing">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cpv">CPV (Per View)</SelectItem>
                                <SelectItem value="cpc">CPC (Per Click)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={inFeedForm.control}
                        name="bidAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bid Amount (XAF) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="30"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-in-feed-bid"
                              />
                            </FormControl>
                            <FormDescription>
                              {inFeedForm.watch("pricingModel") === "cpv" ? "Per view (min 30 XAF)" : "Per click (min 100 XAF)"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {isUploading && selectedType === "in_feed" && (
                      <div className="space-y-2 bg-muted p-4 rounded-lg" data-testid="upload-progress">
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
                        data-testid="button-cancel"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAdMutation.isPending || isUploading}
                        data-testid="button-submit-in-feed"
                      >
                        {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create In-Feed Ad
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
