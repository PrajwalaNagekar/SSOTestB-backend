import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./auth.routes.js";
import connectDB from "./db.js";

dotenv.config();

const startServer = async () => {
  console.log("SERVER FILE LOADED");

  const app = express();
  app.use(cors());
  app.use(express.json());

  // 🔥 THIS LINE IS THE KEY
  await connectDB();

  app.use("/auth", authRoutes);

  app.listen(8000, () => {
    console.log("🚀 SSO Auth Server running on port 5000");
  });
};

startServer();
