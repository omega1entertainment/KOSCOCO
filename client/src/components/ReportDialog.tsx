import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
}

export function ReportDialog({ open, onOpenChange, videoId, videoTitle }: ReportDialogProps) {
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!reason.trim()) {
        throw new Error("Please provide a reason for reporting this video");
      }

      return apiRequest("POST", "/api/reports", {
        videoId,
        reason: reason.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our platform safe. We'll review your report.",
      });
      setReason("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Submit Report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    reportMutation.mutate();
  };

  const handleClose = (newOpen: boolean) => {
    if (!reportMutation.isPending) {
      if (!newOpen) {
        setReason("");
      }
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-report">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report Video
          </DialogTitle>
          <DialogDescription>
            Report "{videoTitle}" for review. Please provide details about why you're reporting this content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue (e.g., inappropriate content, copyright violation, spam, etc.)"
              className="min-h-32 resize-none"
              disabled={reportMutation.isPending}
              data-testid="textarea-report-reason"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={reportMutation.isPending}
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!reason.trim() || reportMutation.isPending}
              data-testid="button-submit-report"
            >
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
