import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Upload } from "lucide-react";

type CreatorProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  location: string | null;
  age: number | null;
  emailVerified: boolean;
  createdAt: Date;
};

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation_] = useState("");
  const [age, setAge] = useState("");

  // Fetch creator profile
  const { data: profile, isLoading: profileLoading } = useQuery<CreatorProfile>({
    queryKey: ["/api/creator/profile"],
    enabled: !!user,
  });

  // Update form when profile data loads
  if (profile && !firstName) {
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setLocation_(profile.location || "");
    setAge(profile.age ? profile.age.toString() : "");
    if (profile.profileImageUrl) {
      setProfileImagePreview(profile.profileImageUrl);
    }
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // First, update the profile data
      const response = await fetch("/api/creator/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          bio,
          location,
          age: age ? parseInt(age, 10) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      // If there's a profile image file, upload it separately
      if (profileImageFile) {
        const formData = new FormData();
        formData.append("profileImage", profileImageFile);

        const photoResponse = await fetch("/api/creator/profile-photo", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!photoResponse.ok) {
          const error = await photoResponse.json();
          throw new Error(error.message || "Failed to upload profile photo");
        }

        return photoResponse.json();
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creator/profile"] });
      setLocation("/creator");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/creator")}
            data-testid="button-back-to-creator"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate();
              }}
              className="space-y-6"
            >
              {/* Profile Image */}
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profileImagePreview || ""} />
                    <AvatarFallback>
                      {firstName[0]}{lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                      id="profile-image-input"
                      data-testid="input-profile-image"
                    />
                    <label htmlFor="profile-image-input">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById("profile-image-input")?.click()}
                        className="cursor-pointer"
                        data-testid="button-upload-image"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  data-testid="input-username"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself (max 500 characters)"
                  maxLength={500}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none"
                  rows={4}
                  data-testid="input-bio"
                />
                <p className="text-xs text-muted-foreground">{bio.length}/500</p>
              </div>

              {/* Location and Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation_(e.target.value)}
                    placeholder="Enter your location"
                    data-testid="input-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Enter your age"
                    min="0"
                    max="150"
                    data-testid="input-age"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/creator")}
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
