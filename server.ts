import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); // ✅ load env FIRST

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ ================== MONGODB CONNECTION ==================
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));


// ✅ ================== SCHEMA ==================
const visitorSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
});

const Visitor = mongoose.model("Visitor", visitorSchema);


// ✅ ================== ROUTES ==================

// Test route
app.get("/test", (req, res) => {
  res.send("Server + DB working");
});

// Store visit
app.post("/api/visit", async (req, res) => {
  try {
    const visit = new Visitor();
    await visit.save();
    res.status(200).json({ message: "Visit saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save visit" });
  }
});

// Get total visits
app.get("/api/visits", async (req, res) => {
  try {
    const count = await Visitor.countDocuments();
    res.json({ total: count });
  } catch (err) {
    res.status(500).json({ error: "Failed to get count" });
  }
});


// ✅ ================== VITE SETUP ==================
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}


// ✅ ================== START SERVER ==================
setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});