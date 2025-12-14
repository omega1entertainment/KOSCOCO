// Cloudflare Turnstile verification helper

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
}

export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    return { success: false, error: "Turnstile not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteip) {
      formData.append("remoteip", remoteip);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (data.success) {
      return { success: true };
    } else {
      const errorCodes = data["error-codes"] || [];
      console.error("Turnstile verification failed:", errorCodes);
      return { 
        success: false, 
        error: errorCodes.length > 0 ? `Verification failed: ${errorCodes.join(", ")}` : "Verification failed" 
      };
    }
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, error: "Failed to verify captcha" };
  }
}

// Middleware to verify Turnstile token
export function requireTurnstile(req: any, res: any, next: any) {
  const token = req.body?.turnstileToken;
  const remoteip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress;

  if (!token) {
    return res.status(400).json({ message: "Please complete the captcha verification" });
  }

  verifyTurnstileToken(token, remoteip)
    .then((result) => {
      if (result.success) {
        next();
      } else {
        res.status(400).json({ message: result.error || "Captcha verification failed" });
      }
    })
    .catch((error) => {
      console.error("Turnstile middleware error:", error);
      res.status(500).json({ message: "Failed to verify captcha" });
    });
}
