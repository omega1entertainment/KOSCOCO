import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Clock, 
  Calendar, 
  Trash2, 
  Edit2, 
  Video, 
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";

interface ScheduledVideo {
  id: string;
  videoId: string;
  userId: string;
  scheduledAt: string;
  status: string;
  publishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  video?: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
  };
}

interface UserVideo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
}

export function ScheduledVideoManager() {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledVideo | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");
  const { toast } = useToast();

  const { data: scheduledVideos = [], isLoading: schedulesLoading } = useQuery<ScheduledVideo[]>({
    queryKey: ["/api/creator/scheduled-videos"],
  });

  const { data: userVideos = [] } = useQuery<UserVideo[]>({
    queryKey: ["/api/creator/videos"],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      return apiRequest("/api/creator/scheduled-videos", "POST", {
        videoId: selectedVideoId,
        scheduledAt,
      });
    },
    onSuccess: () => {
      toast({ title: "Video scheduled", description: "Your video has been scheduled for publishing." });
      setScheduleDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/creator/scheduled-videos"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule video.", variant: "destructive" });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSchedule) return;
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      return apiRequest(`/api/creator/scheduled-videos/${selectedSchedule.id}`, "PATCH", {
        scheduledAt,
      });
    },
    onSuccess: () => {
      toast({ title: "Schedule updated", description: "The scheduled time has been updated." });
      setEditDialogOpen(false);
      setSelectedSchedule(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/creator/scheduled-videos"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update schedule.", variant: "destructive" });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSchedule) return;
      return apiRequest(`/api/creator/scheduled-videos/${selectedSchedule.id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Schedule cancelled", description: "The scheduled publishing has been cancelled." });
      setDeleteDialogOpen(false);
      setSelectedSchedule(null);
      queryClient.invalidateQueries({ queryKey: ["/api/creator/scheduled-videos"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to cancel schedule.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedVideoId("");
    setScheduledDate("");
    setScheduledTime("");
  };

  const handleEdit = (schedule: ScheduledVideo) => {
    setSelectedSchedule(schedule);
    const date = parseISO(schedule.scheduledAt);
    setScheduledDate(format(date, "yyyy-MM-dd"));
    setScheduledTime(format(date, "HH:mm"));
    setEditDialogOpen(true);
  };

  const handleDelete = (schedule: ScheduledVideo) => {
    setSelectedSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Scheduled</Badge>;
      case "published":
        return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3" />Published</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const draftVideos = userVideos.filter(v => v.status === "draft" || v.status === "pending");

  const isValidSchedule = selectedVideoId && scheduledDate && scheduledTime && 
    new Date(`${scheduledDate}T${scheduledTime}`) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Scheduled Publishing</h2>
          <p className="text-sm text-muted-foreground">Schedule when your videos go live</p>
        </div>
        <Button onClick={() => setScheduleDialogOpen(true)} data-testid="button-schedule-video">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Video
        </Button>
      </div>

      {schedulesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : scheduledVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No scheduled videos</p>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule when your videos should be published
            </p>
            <Button 
              onClick={() => setScheduleDialogOpen(true)} 
              className="mt-4"
              data-testid="button-schedule-first-video"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule your first video
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scheduledVideos.map((schedule) => (
            <Card key={schedule.id} data-testid={`scheduled-video-${schedule.id}`}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {schedule.video?.thumbnailUrl ? (
                    <img 
                      src={schedule.video.thumbnailUrl} 
                      alt={schedule.video?.title || "Video"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">
                    {schedule.video?.title || `Video ${schedule.videoId}`}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(parseISO(schedule.scheduledAt), "PPP")}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{format(parseISO(schedule.scheduledAt), "p")}</span>
                  </div>
                  {schedule.errorMessage && (
                    <p className="text-sm text-destructive mt-1">{schedule.errorMessage}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(schedule.status)}
                  {(schedule.status === "pending" || schedule.status === "scheduled") && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(schedule)}
                        data-testid={`button-edit-schedule-${schedule.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(schedule)}
                        data-testid={`button-delete-schedule-${schedule.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Video Publishing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-select">Select Video</Label>
              <select
                id="video-select"
                className="w-full px-3 py-2 border rounded-md bg-background"
                value={selectedVideoId}
                onChange={(e) => setSelectedVideoId(e.target.value)}
                data-testid="select-video-to-schedule"
              >
                <option value="">Select a video...</option>
                {draftVideos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.title}
                  </option>
                ))}
              </select>
              {draftVideos.length === 0 && (
                <p className="text-sm text-muted-foreground">No draft videos available to schedule</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduledDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-schedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-schedule-time"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setScheduleDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createScheduleMutation.mutate()}
              disabled={!isValidSchedule || createScheduleMutation.isPending}
              data-testid="button-confirm-schedule"
            >
              {createScheduleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Update the scheduled time for "{selectedSchedule?.video?.title || "this video"}"
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={scheduledDate}
                  min={format(new Date(), "yyyy-MM-dd")}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-edit-schedule-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-edit-schedule-time"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedSchedule(null); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={() => updateScheduleMutation.mutate()}
              disabled={!scheduledDate || !scheduledTime || updateScheduleMutation.isPending}
              data-testid="button-confirm-edit-schedule"
            >
              {updateScheduleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Publishing</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to cancel the scheduled publishing for "{selectedSchedule?.video?.title || "this video"}"? 
            The video will remain as a draft.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setSelectedSchedule(null); }}>
              Keep Schedule
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteScheduleMutation.mutate()}
              disabled={deleteScheduleMutation.isPending}
              data-testid="button-confirm-cancel-schedule"
            >
              {deleteScheduleMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Publishing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
