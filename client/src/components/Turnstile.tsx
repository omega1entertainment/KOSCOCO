import { useEffect, useRef, useState } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: "light" | "dark";
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

export function Turnstile({ onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Load Turnstile script
    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => onError?.("Failed to load Turnstile");
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }

    return () => {
      // Cleanup widget if component unmounts
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onError]);

  useEffect(() => {
    if (isLoaded && window.turnstile && containerRef.current && !widgetIdRef.current) {
      const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
      
      if (!sitekey) {
        onError?.("Turnstile site key not configured");
        return;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme: "light",
          callback: onVerify,
          "error-callback": () => onError?.("Turnstile verification failed"),
          "expired-callback": onExpire,
        });
      } catch (error) {
        onError?.("Failed to initialize Turnstile");
      }
    }
  }, [isLoaded, onVerify, onError, onExpire]);

  return <div ref={containerRef} />;
}
