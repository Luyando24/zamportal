import "./lib/env";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleRegister } from "./routes/auth";
import { 
  handleListCategories, 
  handleListPopularServices, 
  handleSearchServices, 
  handleListApplications,
  handleGetUserProfile
} from "./routes/mobile";
import {
  handleListPortals,
  handleGetPortalConfig,
  handleCreatePortal,
  handleUpdatePortal,
  handleAddPortalService,
  handleListAvailableServices,
  handleRemovePortalService,
  handleDeletePortal,
  handleCreateFullService
} from "./routes/portals";
import {
  handleListUsers,
  handleCreateUser,
  handleDeleteUser,
  handleAdminStats
} from "./routes/admin";
import {
  handleAdminListServices,
  handleAdminCreateService,
  handleAdminUpdateService,
  handleAdminDeleteService,
  handleAdminCreateFullService
} from "./routes/admin_services";
import {
  handleListModules,
  handleCreateModule,
  handleListModuleData,
  handleCreateModuleData,
  handleUpdateModuleData,
  handleDeleteModuleData
} from "./routes/modules";
import {
  handleAdminCreateCategory,
  handleAdminUpdateCategory,
  handleAdminDeleteCategory
} from "./routes/admin_categories";
import { query } from "./lib/db";
import {
  handleListServiceForms,
  handleGetFormById,
  handleSaveFormDefinition,
  handleSubmitApplication,
  handleListPortalApplications,
  handleUpdateApplicationStatus,
  handleGetFormBySlug,
  handleDeleteFormDefinition,
  handleGetApplications,
  handleGetApplicationHistory,
  handleGetApplicationById
} from "./routes/forms";
import { authenticate } from "./lib/auth_middleware";
import { handleGetAiConfig as handleConfig } from "./routes/ai_config";
import { 
  handleGenerateForm, 
  handleGenerateService, 
  handleSuggestServices, 
  handleSuggestModules, 
  handleGenerateModuleSchema, 
  handleGenerateInstitution,
  handleRecommendServices
} from "./routes/ai";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting to handle huge traffic and prevent abuse
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: "Too many requests from this IP, please try again after 15 minutes"
  });

  // Apply the rate limiting middleware to all API routes
  app.use("/api", limiter);

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
  app.get("/api/applications", authenticate, handleGetApplications);
  app.get("/api/profile", authenticate, handleGetUserProfile);
  
  // Portal Management
  app.get("/api/portals", handleListPortals);
  app.get("/api/portals/:slug", handleGetPortalConfig);
  app.post("/api/portals", handleCreatePortal);
  app.patch("/api/portals/:id", handleUpdatePortal);
  app.get("/api/admin/portals/:portalId/available-services", handleListAvailableServices);
  app.post("/api/admin/portals/:portalId/services/full", handleCreateFullService);
  
  // Module Factory Routes
  app.get("/api/modules", handleListModules);
  app.post("/api/modules", handleCreateModule);
  app.get("/api/modules/:slug/data", handleListModuleData);
  app.post("/api/modules/:slug/data", handleCreateModuleData);
  app.patch("/api/modules/data/:id", handleUpdateModuleData);
  app.delete("/api/modules/data/:id", handleDeleteModuleData);
  app.post("/api/portals/:portalId/services/full", handleCreateFullService);
  app.delete("/api/portals/:portalId/services/:serviceId", handleRemovePortalService);
  app.delete("/api/portals/:id", handleDeletePortal);
  
  // Super Admin - User Management
  app.get("/api/admin/users", authenticate, handleListUsers);
  app.post("/api/admin/users", authenticate, handleCreateUser);
  app.delete("/api/admin/users/:id", authenticate, handleDeleteUser);
  app.get("/api/admin/stats", authenticate, handleAdminStats);
  
  // Super Admin - Service Management
  app.get("/api/admin/services", authenticate, handleAdminListServices);
  app.post("/api/admin/services", authenticate, handleAdminCreateService);
  app.post("/api/admin/services/full", authenticate, handleAdminCreateFullService);
  app.patch("/api/admin/services/:id", authenticate, handleAdminUpdateService);
  app.delete("/api/admin/services/:id", authenticate, handleAdminDeleteService);
  
  // Super Admin - Category Management
  app.post("/api/admin/categories", authenticate, handleAdminCreateCategory);
  app.patch("/api/admin/categories/:id", authenticate, handleAdminUpdateCategory);
  app.delete("/api/admin/categories/:id", authenticate, handleAdminDeleteCategory);
  
  // Dynamic Forms & Applications
  app.get("/api/forms/:portalId/:serviceId", handleListServiceForms);
  app.get("/api/forms/slug/:portalId/:formSlug", handleGetFormBySlug);
  app.get("/api/forms/:formId", handleGetFormById);
  app.post("/api/forms", handleSaveFormDefinition);
  app.delete("/api/forms/:formId", handleDeleteFormDefinition);
  app.post("/api/applications/submit", handleSubmitApplication);
  app.get("/api/applications/portal/:portalId", handleListPortalApplications);
  app.get("/api/applications/:id", authenticate, handleGetApplicationById);
  app.get("/api/applications/:id/history", authenticate, handleGetApplicationHistory);
  app.patch("/api/applications/:id/status", authenticate, handleUpdateApplicationStatus);

  // AI Agent routes
  app.get("/api/ai/config", handleConfig);
  app.post("/api/ai/suggest-services", authenticate, handleSuggestServices);
  app.post("/api/ai/suggest-modules", authenticate, handleSuggestModules);
  app.post("/api/ai/generate-service", authenticate, handleGenerateService);
  app.post("/api/ai/generate-module", authenticate, handleGenerateModuleSchema);
  app.post("/api/ai/generate-institution", authenticate, handleGenerateInstitution);
  app.post("/api/ai/recommend-services", handleRecommendServices);

  return app;
}
