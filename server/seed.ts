import { storage } from "./storage";

async function seed() {
  console.log("Seeding database...");

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
      console.log(`Created category: ${category.name}`);
    } catch (error) {
      console.log(`Category ${category.name} already exists or error:`, error);
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
      console.log(`Created phase: ${phase.name}`);
    } catch (error) {
      console.log(`Phase ${phase.name} already exists or error:`, error);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
