import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

function isStrongPassword(password: string) {
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return regex.test(password);
}

import { GoogleGenAI } from "@google/genai";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/snap2serve";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* =========================
   SCHEMAS
========================= */

const RecipeSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  ingredients: [String],
  instructions: [String],
  cookingTime: Number,
  difficulty: String,
  cuisine: String,
  calories: Number,
  dietaryInfo: [String],
  image: String,
  rating: Number
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  favorites: [RecipeSchema],
  history: [RecipeSchema]
});

const User = mongoose.model("User", UserSchema);

const VisitorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 }
});

const Visitor = mongoose.model("Visitor", VisitorSchema);


// Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Signup
app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const strongRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be strong"
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      favorites: [], 
      history: [] 
    });

    await user.save();
    res.json({ username: user.username, email: user.email });

  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

/* =========================
   USER ROUTES
========================= */

// Get User Data
app.get("/api/user/data", async (req, res) => {
  const { username } = req.query;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ favorites: user.favorites, history: user.history });
  } catch {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Favorites
app.post("/api/user/favorites", async (req, res) => {
  const { username, recipe } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const index = user.favorites.findIndex((f: any) => f.id === recipe.id);

    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.unshift(recipe);
    }

    await user.save();
    res.json({ favorites: user.favorites });

  } catch {
    res.status(500).json({ error: "Failed to update favorites" });
  }
});

// History
app.post("/api/user/history", async (req, res) => {
  const { username, recipe } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.history = user.history.filter((h: any) => h.id !== recipe.id) as any;
    user.history.unshift(recipe);

    if (user.history.length > 10) {
      user.history = user.history.slice(0, 10) as any;
    }

    await user.save();
    res.json({ history: user.history });

  } catch {
    res.status(500).json({ error: "Failed to update history" });
  }
});



// Get Visitor Count
app.get("/api/visitors", async (req, res) => {
  try {
    let visitor = await Visitor.findOne();

    if (!visitor) {
      visitor = new Visitor({ count: 0 });
      await visitor.save();
    }

    res.json({ count: visitor.count });
  } catch {
    res.status(500).json({ error: "Failed to get visitor count" });
  }
});

// Increment Visitor Count
app.post("/api/visit", async (req, res) => {
  try {
    let visitor = await Visitor.findOne();

    if (!visitor) {
      visitor = new Visitor({ count: 1 });
    } else {
      visitor.count += 1;
    }

    await visitor.save();

    res.json({ count: visitor.count });
  } catch {
    res.status(500).json({ error: "Failed to update visitor count" });
  }
});

/* =========================
   VITE SETUP
========================= */

async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
