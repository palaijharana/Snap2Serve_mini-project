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

// AI Proxy routes removed - now handled on frontend

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/snap2serve";
mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
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

// API Routes
 //🔐 Authentication Routes
// Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for:", username);
  try {
    // Allow login by username or email
    const user = await User.findOne({
      $or: [{ username: username }, { email: username }]
    });
    
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ error: "User not found" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for:", username);
      return res.status(401).json({ error: "Invalid password" });
    }
    
    console.log("Login successful for:", username);
    res.json({ username: user.username, email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Signup attempt for:", username, email);

  try {
    const strongRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    // ✅ FIX: properly closed block
    if (!strongRegex.test(password)) {
      return res.status(400).json({
        error: "Password must be at least 8 characters, include 1 uppercase, 1 number, and 1 special character"
      });
    }

    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      const field = existingUser.username === username ? "Username" : "Email";
      return res.status(400).json({ error: `${field} already exists` });
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

    console.log("Signup successful for:", username);
    res.json({ username: user.username, email: user.email });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});
// Get User Data (Favorites & History)
app.get("/api/user/data", async (req, res) => {
  const { username } = req.query;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ favorites: user.favorites, history: user.history });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Toggle Favorite
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
  } catch (error) {
    res.status(500).json({ error: "Failed to update favorites" });
  }
});

// Add to History
app.post("/api/user/history", async (req, res) => {
  const { username, recipe } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Remove if exists to move to top
    user.history = user.history.filter((h: any) => h.id !== recipe.id) as any;
    user.history.unshift(recipe);
    
    // Keep last 10
    if (user.history.length > 10) {
      user.history = user.history.slice(0, 10) as any;
    }
    
    await user.save();
    res.json({ history: user.history });
  } catch (error) {
    res.status(500).json({ error: "Failed to update history" });
  }
});

// Vite Middleware for Development
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
