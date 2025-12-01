import { useQuery, useMutation } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NotificationPreferences } from "@shared/schema";
import { Bell, Mail, MessageSquare, Smartphone, Trophy, Users, Vote } from "lucide-react";

export function NotificationSettings() {
  const { toast } = useToast();

  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      return apiRequest("/api/notifications/preferences", "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how and when you want to be notified
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            Notification Channels
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-enabled">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences?.emailEnabled ?? true}
                onCheckedChange={(checked) => handleToggle("emailEnabled", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-email-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="push-enabled">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    In-app notifications and browser alerts
                  </p>
                </div>
              </div>
              <Switch
                id="push-enabled"
                checked={preferences?.pushEnabled ?? true}
                onCheckedChange={(checked) => handleToggle("pushEnabled", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-push-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="sms-enabled">SMS Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications via text message
                  </p>
                </div>
              </div>
              <Switch
                id="sms-enabled"
                checked={preferences?.smsEnabled ?? false}
                onCheckedChange={(checked) => handleToggle("smsEnabled", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-sms-notifications"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-6 space-y-4">
          <h4 className="text-sm font-medium">Notification Types</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vote className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="vote-notifications">Votes</Label>
                  <p className="text-xs text-muted-foreground">
                    When someone votes for your video
                  </p>
                </div>
              </div>
              <Switch
                id="vote-notifications"
                checked={preferences?.voteNotifications ?? true}
                onCheckedChange={(checked) => handleToggle("voteNotifications", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-vote-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="comment-notifications">Comments</Label>
                  <p className="text-xs text-muted-foreground">
                    When someone comments on your video
                  </p>
                </div>
              </div>
              <Switch
                id="comment-notifications"
                checked={preferences?.commentNotifications ?? true}
                onCheckedChange={(checked) => handleToggle("commentNotifications", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-comment-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="milestone-notifications">Milestones</Label>
                  <p className="text-xs text-muted-foreground">
                    When you reach view or vote milestones
                  </p>
                </div>
              </div>
              <Switch
                id="milestone-notifications"
                checked={preferences?.milestoneNotifications ?? true}
                onCheckedChange={(checked) => handleToggle("milestoneNotifications", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-milestone-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="phase-notifications">Phase Updates</Label>
                  <p className="text-xs text-muted-foreground">
                    Competition phase changes and achievements
                  </p>
                </div>
              </div>
              <Switch
                id="phase-notifications"
                checked={preferences?.phaseNotifications ?? true}
                onCheckedChange={(checked) => handleToggle("phaseNotifications", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-phase-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label htmlFor="subscription-notifications">Subscriptions</Label>
                  <p className="text-xs text-muted-foreground">
                    When creators you follow post new content
                  </p>
                </div>
              </div>
              <Switch
                id="subscription-notifications"
                checked={preferences?.subscriptionNotifications ?? true}
                onCheckedChange={(checked) => handleToggle("subscriptionNotifications", checked)}
                disabled={updateMutation.isPending}
                data-testid="switch-subscription-notifications"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
