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

  const handleExpire = () => {
    onVerify("");
    onExpire?.();
  };

  useEffect(() => {
    // Load Turnstile script
    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Turnstile script loaded successfully");
        setIsLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Turnstile script");
        onError?.("Failed to load Turnstile");
      };
      document.head.appendChild(script);
    } else {
      console.log("Turnstile already exists in window");
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
    console.log("Render effect - isLoaded:", isLoaded, "hasWindow:", !!window.turnstile, "hasContainer:", !!containerRef.current, "hasWidgetId:", !!widgetIdRef.current);
    
    if (isLoaded && window.turnstile && containerRef.current && !widgetIdRef.current) {
      const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
      console.log("Sitekey value:", sitekey ? "***configured***" : "NOT CONFIGURED");
      
      if (!sitekey) {
        console.error("Turnstile site key is missing");
        onError?.("Turnstile site key not configured");
        return;
      }

      try {
        console.log("Attempting to render Turnstile widget");
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          theme: "light",
          callback: onVerify,
          "error-callback": () => onError?.("Turnstile verification failed"),
          "expired-callback": handleExpire,
        });
        console.log("Turnstile widget rendered with ID:", widgetIdRef.current);
      } catch (error) {
        console.error("Failed to render Turnstile:", error);
        onError?.("Failed to initialize Turnstile");
      }
    }
  }, [isLoaded, onVerify, onError, onExpire]);

  return <div ref={containerRef} />;
}
