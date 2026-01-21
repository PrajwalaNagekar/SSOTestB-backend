import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth.routes.js";
import connectDB from "./db.js";

dotenv.config();

const startServer = async () => {
  console.log("SERVER FILE LOADED");

  const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173', // App B frontend
    'http://localhost:5174', // App A frontend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
  app.use(express.json());

  // 🔥 THIS LINE IS THE KEY
  await connectDB();

  app.use("/auth", authRoutes);

  app.listen(8000, () => {
    console.log("🚀 SSO Auth Server running on port 8000");
  });
};

startServer();
