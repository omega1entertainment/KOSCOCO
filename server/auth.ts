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
// Email verification disabled - accounts are auto-verified
// import {
//   generateVerificationToken,
//   getVerificationTokenExpiry,
//   sendVerificationEmail,
// } from "./emailService";

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
          const user = await storage.getUserByEmail(email);
          
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
                user = await storage.getUserByEmail(email);
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

              user = await storage.createUser({
                email,
                googleId: profile.id,
                firstName,
                lastName,
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
                user = await storage.getUserByEmail(email);
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

              user = await storage.createUser({
                email,
                facebookId: profile.id,
                firstName,
                lastName,
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
        cb(null, advertiser);
      } else {
        const user = await storage.getUser(sessionData.id);
        cb(null, user);
      }
    } catch (error) {
      cb(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "An error occurred during login" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Failed to establish session" });
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  // Signup route
  app.post("/api/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, age, parentalConsent } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      // Age validation
      if (age && age < 18 && !parentalConsent) {
        return res.status(400).json({ message: "Parental consent required for users under 18" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with auto-verified email
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        age: age || null,
        parentalConsent: parentalConsent || false,
        emailVerified: true,
      });

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
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
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

      const user = await storage.getUserByEmail(email);
      
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

      // Check if advertiser already exists
      const existingAdvertiser = await storage.getAdvertiserByEmail(email);
      if (existingAdvertiser) {
        return res.status(409).json({ message: "An advertiser account with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create advertiser (status defaults to 'pending' for admin approval)
      const advertiser = await storage.createAdvertiser({
        email,
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

      const advertiser = await storage.getAdvertiserByEmail(email);
      
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
    res.json({ advertiser: advertiserWithoutPassword });
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
