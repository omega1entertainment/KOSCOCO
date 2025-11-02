import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiYoutube, SiLinkedin } from "react-icons/si";

interface TopBarProps {
  currentPhase?: string;
}

export default function TopBar({ currentPhase = "PHASE 2: TOP 50 ACTIVE" }: TopBarProps) {
  const socialLinks = [
    { name: "Facebook", icon: SiFacebook, url: "https://facebook.com/koscoco", testId: "link-social-facebook" },
    { name: "Instagram", icon: SiInstagram, url: "https://instagram.com/koscoco", testId: "link-social-instagram" },
    { name: "TikTok", icon: SiTiktok, url: "https://tiktok.com/@koscoco", testId: "link-social-tiktok" },
    { name: "X", icon: SiX, url: "https://x.com/koscoco", testId: "link-social-x" },
    { name: "YouTube", icon: SiYoutube, url: "https://youtube.com/@koscoco", testId: "link-social-youtube" },
    { name: "LinkedIn", icon: SiLinkedin, url: "https://linkedin.com/company/koscoco", testId: "link-social-linkedin" },
  ];

  return (
    <div className="bg-muted border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-10 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a 
                href="mailto:support@kozzii.africa"
                className="hover:text-primary transition-colors"
                data-testid="link-support-email"
              >
                support@kozzii.africa
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            <Badge 
              variant="destructive" 
              className="font-bold text-xs tracking-wide"
              data-testid="badge-phase"
            >
              {currentPhase}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-7 h-7 rounded-sm bg-primary text-white hover:opacity-80 transition-opacity"
                aria-label={social.name}
                data-testid={social.testId}
              >
                <social.icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
