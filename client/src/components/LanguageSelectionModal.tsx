import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

const EnglishFlag = () => (
  <svg viewBox="0 0 60 30" className="w-24 h-16 rounded shadow-lg">
    <clipPath id="s">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v-15 h-30 z h-30 v15 z v-15 h30 z"/>
    </clipPath>
    <g clipPath="url(#s)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

const FrenchFlag = () => (
  <svg viewBox="0 0 60 40" className="w-24 h-16 rounded shadow-lg">
    <rect width="20" height="40" x="0" fill="#002395"/>
    <rect width="20" height="40" x="20" fill="#fff"/>
    <rect width="20" height="40" x="40" fill="#ED2939"/>
  </svg>
);

export default function LanguageSelectionModal() {
  const { setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSelectedLanguage = localStorage.getItem("language-selected");
    if (!hasSelectedLanguage) {
      setIsOpen(true);
    }
  }, []);

  const handleLanguageSelect = (lang: "en" | "fr") => {
    setLanguage(lang);
    localStorage.setItem("language-selected", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="sm:max-w-[512px] p-8"
        style={{ maxWidth: '512px', maxHeight: '256px' }}
        data-testid="dialog-language-selection"
      >
        <DialogTitle className="text-2xl font-bold text-center mb-6" style={{ fontFamily: 'Play, sans-serif' }}>
          Choose Your Language / Choisissez Votre Langue
        </DialogTitle>
        <DialogDescription className="sr-only">
          Select your preferred language for the application
        </DialogDescription>
        
        <div className="flex items-center justify-center gap-12">
            <Card 
              className="p-6 hover-elevate active-elevate-2 cursor-pointer border-2 hover:border-primary transition-colors"
              onClick={() => handleLanguageSelect("en")}
              data-testid="button-language-english"
            >
              <div className="flex flex-col items-center gap-3">
                <EnglishFlag />
                <span className="font-semibold text-lg">English</span>
              </div>
            </Card>

            <Card 
              className="p-6 hover-elevate active-elevate-2 cursor-pointer border-2 hover:border-primary transition-colors"
              onClick={() => handleLanguageSelect("fr")}
              data-testid="button-language-french"
            >
              <div className="flex flex-col items-center gap-3">
                <FrenchFlag />
                <span className="font-semibold text-lg">Français</span>
              </div>
            </Card>
          </div>
      </DialogContent>
    </Dialog>
  );
}
