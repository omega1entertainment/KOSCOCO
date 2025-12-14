import { useState, useEffect, useCallback } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if iOS Safari
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Check if user previously dismissed the banner
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (dismissedTime > oneDayAgo) {
        setDismissed(true);
      } else {
        localStorage.removeItem("pwa-install-dismissed");
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log("[PWA] App installed successfully");
    });

    // Show iOS banner after a short delay
    if (ios && !standalone && !wasDismissed) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        console.log("[PWA] User accepted install prompt");
      } else {
        console.log("[PWA] User dismissed install prompt");
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error("[PWA] Install prompt error:", error);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  // Don't show if: already installed, dismissed, or neither iOS nor has install prompt
  if (isStandalone || dismissed || (!showBanner)) {
    return null;
  }

  // iOS Safari specific banner
  if (isIOS) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-pb"
        data-testid="pwa-install-banner"
      >
        <div className="mx-auto max-w-md rounded-xl bg-card border shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <img
                src="/icons/icon-192x192.png"
                alt="KOSCOCO"
                className="w-8 h-8 rounded"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">
                Install KOSCOCO App
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tap <Share className="inline w-4 h-4 mx-1" /> then "Add to Home Screen" for the best experience
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 -mt-1 -mr-1"
              onClick={handleDismiss}
              data-testid="button-dismiss-install"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chrome, Edge, Android install banner
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-pb"
      data-testid="pwa-install-banner"
    >
      <div className="mx-auto max-w-md rounded-xl bg-card border shadow-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <img
              src="/icons/icon-192x192.png"
              alt="KOSCOCO"
              className="w-8 h-8 rounded"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">
              Install KOSCOCO
            </h3>
            <p className="text-xs text-muted-foreground">
              Get quick access from your home screen
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              data-testid="button-dismiss-install"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="gap-1"
              data-testid="button-install-app"
            >
              <Download className="w-4 h-4" />
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
