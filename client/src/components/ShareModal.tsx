import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Facebook, Twitter, MessageCircle, Linkedin, Send, Mail, Link2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
}

export default function ShareModal({
  open,
  onOpenChange,
  videoId,
  videoTitle,
}: ShareModalProps) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/video/${videoId}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(videoTitle);

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          "facebook-share",
          "width=600,height=400"
        );
      },
    },
    {
      name: "Twitter",
      icon: Twitter,
      onClick: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          "twitter-share",
          "width=600,height=400"
        );
      },
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      onClick: () => {
        window.open(
          `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
          "whatsapp-share",
          "width=600,height=400"
        );
      },
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      onClick: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
          "linkedin-share",
          "width=600,height=400"
        );
      },
    },
    {
      name: "Telegram",
      icon: Send,
      onClick: () => {
        window.open(
          `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
          "telegram-share",
          "width=600,height=400"
        );
      },
    },
    {
      name: "Email",
      icon: Mail,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
      },
    },
    {
      name: "TikTok",
      icon: Music,
      onClick: () => {
        window.open(
          `https://www.tiktok.com/share/video?url=${encodedUrl}`,
          "tiktok-share",
          "width=600,height=400"
        );
      },
    },
    {
      name: "Copy Link",
      icon: Link2,
      onClick: () => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied to clipboard!" });
        onOpenChange(false);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Video</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-4 py-6">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                onClick={option.onClick}
                className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-accent transition-colors"
                data-testid={`button-share-${option.name.toLowerCase()}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs text-center font-medium">
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
