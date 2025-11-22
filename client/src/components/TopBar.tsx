import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";

interface TopBarProps {
  currentPhase?: string;
}

export default function TopBar({ currentPhase = "PHASE 2: TOP 50 ACTIVE" }: TopBarProps) {
  const { language, setLanguage } = useLanguage();
  
  const socialLinks = [
    { name: "Facebook", icon: SiFacebook, url: "https://web.facebook.com/kozziientertainment", testId: "link-social-facebook" },
    { name: "Instagram", icon: SiInstagram, url: "https://www.instagram.com/kozzii_237/", testId: "link-social-instagram" },
    { name: "TikTok", icon: SiTiktok, url: "https://www.tiktok.com/@kozzii_entertainment", testId: "link-social-tiktok" },
    { name: "X", icon: SiX, url: "https://x.com/KozziiEnte14391", testId: "link-social-x" },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <div className="bg-muted border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center md:justify-between gap-2 py-2 md:h-10 md:py-0 text-sm">
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
          
          <div className="flex items-center">
            <Badge 
              variant="destructive" 
              className="font-bold text-xs tracking-wide"
              data-testid="badge-phase"
            >
              {currentPhase}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end">
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
            <div className="w-px h-5 bg-border mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleLanguage}
              className="h-14 px-4 text-sm font-semibold text-muted-foreground hover:text-primary"
              data-testid="button-language-toggle"
            >
              {language === 'en' ? 'EN' : 'FR'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
