import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/phases', async (req, res) => {
    try {
      const phases = await storage.getAllPhases();
      res.json(phases);
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ message: "Failed to fetch phases" });
    }
  });

  app.get('/api/phases/active', async (req, res) => {
    try {
      const phase = await storage.getActivePhase();
      res.json(phase);
    } catch (error) {
      console.error("Error fetching active phase:", error);
      res.status(500).json({ message: "Failed to fetch active phase" });
    }
  });

  app.post('/api/seed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }

      const categories = [
        {
          name: "Music & Dance",
          description: "Showcase your musical and dance talents",
          subcategories: ["Singing", "Dancing"],
        },
        {
          name: "Comedy & Performing Arts",
          description: "Make us laugh and entertain",
          subcategories: ["Skits", "Stand-up", "Monologue", "Acting", "Movie content"],
        },
        {
          name: "Fashion & Lifestyle",
          description: "Share your style and lifestyle content",
          subcategories: ["Cooking", "Events", "Decor", "Sports", "Travel", "Vlogging", "Fashion", "Hair", "Makeup", "Beauty", "Reviews"],
        },
        {
          name: "Education & Learning",
          description: "Educate and inspire through your content",
          subcategories: ["DIY", "Tutorials", "Documentary", "Business & Finance", "News", "Motivational Speaking"],
        },
        {
          name: "Gospel Choirs",
          description: "Share gospel music and choir performances",
          subcategories: ["Acapella", "Choir Music"],
        },
      ];

      for (const category of categories) {
        try {
          await storage.createCategory(category);
        } catch (error) {
          console.log(`Category ${category.name} might already exist`);
        }
      }

      const phases = [
        {
          name: "TOP 100",
          description: "Initial submissions",
          number: 1,
          status: "active",
        },
        {
          name: "TOP 50",
          description: "Top performers advance",
          number: 2,
          status: "upcoming",
        },
        {
          name: "TOP 10",
          description: "Final selections",
          number: 3,
          status: "upcoming",
        },
        {
          name: "TOP 3",
          description: "Category winners",
          number: 4,
          status: "upcoming",
        },
        {
          name: "GRAND FINALE",
          description: "Ultimate winner",
          number: 5,
          status: "upcoming",
        },
      ];

      for (const phase of phases) {
        try {
          await storage.createPhase(phase);
        } catch (error) {
          console.log(`Phase ${phase.name} might already exist`);
        }
      }

      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
