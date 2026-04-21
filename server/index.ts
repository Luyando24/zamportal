import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleRegister } from "./routes/auth";
import { 
  handleListCategories, 
  handleListPopularServices, 
  handleSearchServices, 
  handleListApplications,
  handleGetUserProfile
} from "./routes/mobile";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);

  // Mobile App / Portal routes
  app.get("/api/categories", handleListCategories);
  app.get("/api/services/popular", handleListPopularServices);
  app.get("/api/services/search", handleSearchServices);
  app.get("/api/applications", handleListApplications);
  app.get("/api/profile", handleGetUserProfile);

  return app;
}
