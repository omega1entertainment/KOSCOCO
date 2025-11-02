import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import ConnectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import type { SelectUser } from "@shared/schema";

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

  // Serialize user to session
  passport.serializeUser((user: Express.User, cb) => {
    cb(null, (user as SelectUser).id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, cb) => {
    try {
      const user = await storage.getUser(id);
      cb(null, user);
    } catch (error) {
      cb(error);
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
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

      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        age: age || null,
        parentalConsent: parentalConsent || false,
      });

      // Log in the user automatically
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Account created but login failed" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
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
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
