import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { twoFactorService } from "./twoFactorService";
import {
  generateOTP,
  getOTPExpiry,
  sendOTPEmail,
} from "./emailService";

const MemoryStore = createMemoryStore(session);
const PgSession = ConnectPgSimple(session);

function getSession() {
  if (!process.env.DATABASE_URL) {
    return session({
      secret: process.env.SESSION_SECRET || "koscoco-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
    });
  }

  return session({
    secret: process.env.SESSION_SECRET || "koscoco-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      tableName: "sessions",
    }),
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport-local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Normalize email to lowercase for case-insensitive lookup
          const normalizedEmail = email.toLowerCase().trim();
          const user = await storage.getUserByEmail(normalizedEmail);
          
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          if (!user.password) {
            return done(null, false, { message: "This account uses social login. Please login with Google or Facebook." });
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (!isPasswordValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Configure Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with Google ID
            let user = await storage.getUserByGoogleId(profile.id);
            
            if (!user) {
              // Check if user exists with same email
              const email = profile.emails?.[0]?.value;
              if (email) {
                const normalizedEmail = email.toLowerCase().trim();
                user = await storage.getUserByEmail(normalizedEmail);
                if (user) {
                  // Link Google account to existing user
                  user = await storage.updateUserGoogleId(user.id, profile.id);
                }
              }
            }

            if (!user) {
              // Create new user
              const email = profile.emails?.[0]?.value;
              const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
              const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
              const profileImageUrl = profile.photos?.[0]?.value;

              if (!email) {
                return done(new Error('Email not provided by Google'));
              }

              const normalizedEmail = email.toLowerCase().trim();
              user = await storage.createUser({
                email: normalizedEmail,
                googleId: profile.id,
                firstName,
                lastName,
                phone: '+237000000000',
                profileImageUrl,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // Configure Facebook OAuth strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/api/auth/facebook/callback",
          profileFields: ['id', 'emails', 'name', 'photos'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with Facebook ID
            let user = await storage.getUserByFacebookId(profile.id);
            
            if (!user) {
              // Check if user exists with same email
              const email = profile.emails?.[0]?.value;
              if (email) {
                const normalizedEmail = email.toLowerCase().trim();
                user = await storage.getUserByEmail(normalizedEmail);
                if (user) {
                  // Link Facebook account to existing user
                  user = await storage.updateUserFacebookId(user.id, profile.id);
                }
              }
            }

            if (!user) {
              // Create new user
              const email = profile.emails?.[0]?.value;
              const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User';
              const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
              const profileImageUrl = profile.photos?.[0]?.value;

              if (!email) {
                return done(new Error('Email not provided by Facebook'));
              }

              const normalizedEmail = email.toLowerCase().trim();
              user = await storage.createUser({
                email: normalizedEmail,
                facebookId: profile.id,
                firstName,
                lastName,
                phone: '+237000000000',
                profileImageUrl,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // Serialize user/advertiser to session
  passport.serializeUser((user: Express.User, cb) => {
    const userData = user as any;
    // Store both ID and type to differentiate between users and advertisers
    cb(null, { id: userData.id, type: userData.companyName ? 'advertiser' : 'user' });
  });

  // Deserialize user/advertiser from session
  passport.deserializeUser(async (sessionData: any, cb) => {
    try {
      if (sessionData.type === 'advertiser') {
        const advertiser = await storage.getAdvertiser(sessionData.id);
        if (!advertiser) {
          return cb(null, false);
        }
        cb(null, advertiser);
      } else {
        const user = await storage.getUser(sessionData.id);
        if (!user) {
          return cb(null, false);
        }
        cb(null, user);
      }
    } catch (error) {
      console.error('Session deserialization error:', error);
      cb(null, false);
    }
  });

  // Login route with 2FA support
  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: User | false, info: any) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ message: "An error occurred during login" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // Store user ID in session for 2FA verification
        (req.session as any).pendingTwoFactorUserId = user.id;
        return res.json({ 
          requires2FA: true,
          message: "Please enter your 2FA code"
        });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        
        // Return user without password
        const { password, twoFactorSecret, twoFactorTempSecret, twoFactorBackupCodes, ...userWithoutSensitiveData } = user;
        res.json({ user: userWithoutSensitiveData });
      });
    })(req, res, next);
  });

  // 2FA verification route to complete login
  app.post("/api/login/2fa", async (req, res) => {
    try {
      const { code, useBackupCode } = req.body;
      const pendingUserId = (req.session as any).pendingTwoFactorUserId;

      if (!pendingUserId) {
        return res.status(400).json({ message: "No pending 2FA verification. Please login again." });
      }

      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      const user = await storage.getUser(pendingUserId);
      if (!user || !user.twoFactorSecret) {
        delete (req.session as any).pendingTwoFactorUserId;
        return res.status(400).json({ message: "Invalid session. Please login again." });
      }

      let isValid = false;

      if (useBackupCode) {
        // Verify backup code
        const backupCodes = (user.twoFactorBackupCodes as string[]) || [];
        const result = twoFactorService.verifyBackupCode(code, backupCodes);
        
        if (result.valid) {
          // Remove used backup code
          const updatedCodes = [...backupCodes];
          updatedCodes.splice(result.index, 1);
          await storage.updateUser(user.id, { twoFactorBackupCodes: updatedCodes } as any);
          isValid = true;
        }
      } else {
        // Verify TOTP code
        isValid = twoFactorService.verifyToken(code, user.twoFactorSecret);
      }

      if (!isValid) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      // Clear pending state
      delete (req.session as any).pendingTwoFactorUserId;

      // Complete login
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        
        const { password, twoFactorSecret, twoFactorTempSecret, twoFactorBackupCodes, ...userWithoutSensitiveData } = user;
        res.json({ user: userWithoutSensitiveData });
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Failed to verify 2FA code" });
    }
  });

  // 2FA Setup - Generate secret and QR code
  app.post("/api/2fa/setup", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      
      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }

      const { secret, otpauthUrl, qrCodeDataUrl } = await twoFactorService.setupTwoFactor(user.email);

      // Store temp secret
      await storage.updateUser(user.id, { twoFactorTempSecret: secret } as any);

      res.json({
        qrCodeDataUrl,
        secret,
        otpauthUrl,
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // 2FA Enable - Verify code and enable 2FA
  app.post("/api/2fa/enable", isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      const user = req.user as User;

      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }

      // Get fresh user data to get temp secret
      const freshUser = await storage.getUser(user.id);
      if (!freshUser || !freshUser.twoFactorTempSecret) {
        return res.status(400).json({ message: "Please setup 2FA first" });
      }

      // Verify the code
      const isValid = twoFactorService.verifyToken(code, freshUser.twoFactorTempSecret);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      // Generate backup codes
      const backupCodes = twoFactorService.generateBackupCodes(10);
      const hashedBackupCodes = twoFactorService.hashBackupCodes(backupCodes);

      // Enable 2FA
      await storage.updateUser(user.id, {
        twoFactorEnabled: true,
        twoFactorSecret: freshUser.twoFactorTempSecret,
        twoFactorTempSecret: null,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorEnabledAt: new Date(),
      } as any);

      res.json({
        success: true,
        backupCodes,
        message: "2FA enabled successfully. Save your backup codes in a secure location.",
      });
    } catch (error) {
      console.error("2FA enable error:", error);
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  // 2FA Disable
  app.post("/api/2fa/disable", isAuthenticated, async (req: any, res) => {
    try {
      const { password, code } = req.body;
      const user = req.user as User;

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is not enabled" });
      }

      // Require password verification
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      if (!user.password) {
        return res.status(400).json({ message: "Cannot disable 2FA for social login accounts without password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Verify 2FA code or backup code
      if (!code) {
        return res.status(400).json({ message: "2FA code is required" });
      }

      const freshUser = await storage.getUser(user.id);
      if (!freshUser || !freshUser.twoFactorSecret) {
        return res.status(400).json({ message: "Invalid 2FA state" });
      }

      const isCodeValid = twoFactorService.verifyToken(code, freshUser.twoFactorSecret);
      if (!isCodeValid) {
        // Try backup code
        const backupCodes = (freshUser.twoFactorBackupCodes as string[]) || [];
        const backupResult = twoFactorService.verifyBackupCode(code, backupCodes);
        if (!backupResult.valid) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      // Disable 2FA
      await storage.updateUser(user.id, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorTempSecret: null,
        twoFactorBackupCodes: null,
        twoFactorEnabledAt: null,
      } as any);

      res.json({ success: true, message: "2FA disabled successfully" });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // 2FA Status
  app.get("/api/2fa/status", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as User;
      res.json({
        enabled: user.twoFactorEnabled,
        enabledAt: user.twoFactorEnabledAt,
      });
    } catch (error) {
      console.error("2FA status error:", error);
      res.status(500).json({ message: "Failed to get 2FA status" });
    }
  });

  // 2FA Regenerate backup codes
  app.post("/api/2fa/backup/regenerate", isAuthenticated, async (req: any, res) => {
    try {
      const { password, code } = req.body;
      const user = req.user as User;

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is not enabled" });
      }

      // Require password verification
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      if (!user.password) {
        return res.status(400).json({ message: "Cannot regenerate codes for social login accounts without password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Verify current 2FA code
      if (!code) {
        return res.status(400).json({ message: "2FA code is required" });
      }

      const freshUser = await storage.getUser(user.id);
      if (!freshUser || !freshUser.twoFactorSecret) {
        return res.status(400).json({ message: "Invalid 2FA state" });
      }

      const isCodeValid = twoFactorService.verifyToken(code, freshUser.twoFactorSecret);
      if (!isCodeValid) {
        return res.status(401).json({ message: "Invalid 2FA code" });
      }

      // Generate new backup codes
      const backupCodes = twoFactorService.generateBackupCodes(10);
      const hashedBackupCodes = twoFactorService.hashBackupCodes(backupCodes);

      await storage.updateUser(user.id, {
        twoFactorBackupCodes: hashedBackupCodes,
      } as any);

      res.json({
        success: true,
        backupCodes,
        message: "Backup codes regenerated. Save them in a secure location.",
      });
    } catch (error) {
      console.error("2FA backup regenerate error:", error);
      res.status(500).json({ message: "Failed to regenerate backup codes" });
    }
  });

  // Signup route - Step 1: Validate and send OTP
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, phone, username, age, parentalConsent } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName || !phone) {
        return res.status(400).json({ message: "All fields including phone number are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Age validation
      if (age && age < 18 && !parentalConsent) {
        return res.status(400).json({ message: "Parental consent required for users under 18" });
      }

      // Normalize email to lowercase for case-insensitive storage and lookup
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry();

      // Store pending signup data in session
      (req.session as any).pendingSignup = {
        email: normalizedEmail,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        username: username || email.split('@')[0],
        age: age || null,
        parentalConsent: parentalConsent || false,
        otp,
        otpExpiry: otpExpiry.toISOString(),
      };

      // Send OTP email
      try {
        await sendOTPEmail({
          email: normalizedEmail,
          firstName,
          otp,
        });
      } catch (emailError) {
        console.error("Failed to send OTP email:", emailError);
        return res.status(500).json({ message: "Failed to send verification code. Please try again." });
      }

      res.json({
        requiresOTP: true,
        message: "A verification code has been sent to your email address.",
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Signup route - Step 2: Verify OTP and create account
  app.post("/api/signup/verify-otp", async (req, res) => {
    try {
      const { otp } = req.body;
      const pendingSignup = (req.session as any).pendingSignup;

      if (!pendingSignup) {
        return res.status(400).json({ message: "No pending signup. Please start the registration process again." });
      }

      if (!otp) {
        return res.status(400).json({ message: "Verification code is required" });
      }

      // Check OTP expiry
      const otpExpiry = new Date(pendingSignup.otpExpiry);
      if (new Date() > otpExpiry) {
        delete (req.session as any).pendingSignup;
        return res.status(400).json({ message: "Verification code has expired. Please register again." });
      }

      // Verify OTP
      if (otp !== pendingSignup.otp) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      // Create user with verified email
      const user = await storage.createUser({
        email: pendingSignup.email,
        password: pendingSignup.password,
        firstName: pendingSignup.firstName,
        lastName: pendingSignup.lastName,
        phone: pendingSignup.phone,
        username: pendingSignup.username,
        age: pendingSignup.age,
        parentalConsent: pendingSignup.parentalConsent,
        emailVerified: true,
      });

      // Clear pending signup data
      delete (req.session as any).pendingSignup;

      // Log in the user automatically
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Account created but login failed" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
          user: userWithoutPassword,
          message: "Account created successfully!"
        });
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  // Resend OTP for signup
  app.post("/api/signup/resend-otp", async (req, res) => {
    try {
      const pendingSignup = (req.session as any).pendingSignup;

      if (!pendingSignup) {
        return res.status(400).json({ message: "No pending signup. Please start the registration process again." });
      }

      // Generate new OTP
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry();

      // Update session with new OTP
      pendingSignup.otp = otp;
      pendingSignup.otpExpiry = otpExpiry.toISOString();
      (req.session as any).pendingSignup = pendingSignup;

      // Send OTP email
      try {
        await sendOTPEmail({
          email: pendingSignup.email,
          firstName: pendingSignup.firstName,
          otp,
        });
      } catch (emailError) {
        console.error("Failed to resend OTP email:", emailError);
        return res.status(500).json({ message: "Failed to resend verification code. Please try again." });
      }

      res.json({
        message: "A new verification code has been sent to your email address.",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend verification code" });
    }
  });

  // Logout route
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // Facebook OAuth routes
  app.get(
    "/api/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // Forgot password - Request reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase().trim();
      const user = await storage.getUserByEmail(normalizedEmail);
      
      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);

      // In a real app, you would send an email here
      // For now, we'll just return the token (in production, this should be sent via email)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ 
        message: "If an account with that email exists, a password reset link has been sent.",
        // Remove this in production - only for testing
        resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const user = await storage.getUserByResetToken(token);

      if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await storage.updatePassword(user.id, hashedPassword);

      res.json({ message: "Password reset successful. You can now login with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Advertiser authentication routes
  app.post("/api/advertiser/signup", async (req, res) => {
    try {
      const { 
        email, 
        password, 
        companyName, 
        companyWebsite,
        companyDescription,
        contactName, 
        contactPhone,
        businessType,
        country 
      } = req.body;

      // Validation
      if (!email || !password || !companyName || !contactName || !businessType || !country) {
        return res.status(400).json({ message: "Required fields: email, password, company name, contact name, business type, and country" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Normalize email to lowercase for case-insensitive storage and lookup
      const normalizedEmail = email.toLowerCase().trim();

      // Check if advertiser already exists
      const existingAdvertiser = await storage.getAdvertiserByEmail(normalizedEmail);
      if (existingAdvertiser) {
        return res.status(409).json({ message: "An advertiser account with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create advertiser (status defaults to 'pending' for admin approval)
      const advertiser = await storage.createAdvertiser({
        email: normalizedEmail,
        password: hashedPassword,
        companyName,
        companyWebsite: companyWebsite || null,
        companyDescription: companyDescription || null,
        contactName,
        contactPhone: contactPhone || null,
        businessType,
        country,
        status: 'pending',
      });

      res.json({ 
        advertiser: { 
          id: advertiser.id, 
          email: advertiser.email,
          companyName: advertiser.companyName,
          status: advertiser.status 
        },
        message: "Advertiser account created! Your account is pending approval." 
      });
    } catch (error) {
      console.error("Advertiser signup error:", error);
      res.status(500).json({ message: "Failed to create advertiser account" });
    }
  });

  app.post("/api/advertiser/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Normalize email to lowercase for case-insensitive lookup
      const normalizedEmail = email.toLowerCase().trim();
      const advertiser = await storage.getAdvertiserByEmail(normalizedEmail);
      
      if (!advertiser) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (advertiser.status === 'suspended') {
        return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
      }

      if (advertiser.status === 'pending') {
        return res.status(403).json({ message: "Your account is pending approval. Please wait for admin verification." });
      }

      const isPasswordValid = await bcrypt.compare(password, advertiser.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.logIn(advertiser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        
        const { password: _, ...advertiserWithoutPassword } = advertiser;
        res.json({ advertiser: advertiserWithoutPassword });
      });
    } catch (error) {
      console.error("Advertiser login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/advertiser/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/advertiser/me", isAdvertiser, async (req, res) => {
    const advertiser = req.user as any;
    const { password: _, ...advertiserWithoutPassword } = advertiser;
    res.json(advertiserWithoutPassword);
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdvertiser: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && (req.user as any)?.companyName) {
    return next();
  }
  res.status(401).json({ message: "Advertiser authentication required" });
};
