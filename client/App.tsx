import "./global.css";
import "./styles/card-animations.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AiAssistant from "./pages/AiAssistant";
import NotFound from "./pages/NotFound";
import AuthLogin from "./pages/AuthLogin";
import AdminLogin from "./pages/AdminLogin";
import AuthRegister from "./pages/AuthRegister";
import MyPortal from "./pages/MyPortal";
import AdminPortals from "./pages/AdminPortals";
import PortalManagement from "./pages/PortalManagement";
import ServiceMarketplace from "./pages/ServiceMarketplace";
import FormDesigner from "./pages/FormDesigner";
import ServiceDesigner from "./pages/ServiceDesigner";
import ModuleFactory from "./pages/ModuleFactory";
import ModulePreview from "./pages/ModulePreview";
import PortalPublic from "./pages/PortalPublic";
import ServiceApplication from "./pages/ServiceApplication";
import ApplicationReview from "./pages/ApplicationReview";
import ApplicationStatus from "./pages/ApplicationStatus";
import { useEffect } from "react";
import { syncService } from "@/lib/sync";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    syncService.start();
    return () => syncService.stop();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<AuthLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/register" element={<AuthRegister />} />
                <Route path="/assistant" element={<AiAssistant />} />
                
                {/* Protected Citizen Dashboard */}
                <Route path="/my-portal" element={<ProtectedRoute><MyPortal /></ProtectedRoute>} />
                <Route path="/my-portal/applications/:appId" element={<ProtectedRoute><ApplicationStatus /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><MyPortal /></ProtectedRoute>} />
                
                {/* Protected Super Admin */}
                <Route path="/admin" element={<ProtectedRoute requireSuperAdmin><AdminPortals /></ProtectedRoute>} />
                <Route path="/admin/portals" element={<ProtectedRoute requireSuperAdmin><AdminPortals /></ProtectedRoute>} />
                <Route path="/admin/define-service" element={<ProtectedRoute requireSuperAdmin><ServiceDesigner /></ProtectedRoute>} />
                <Route path="/admin/module-factory" element={<ProtectedRoute requireSuperAdmin><ModuleFactory /></ProtectedRoute>} />
                <Route path="/admin/module-preview" element={<ProtectedRoute requireSuperAdmin><ModulePreview /></ProtectedRoute>} />
                
                {/* Institutional & Service Routes */}
                <Route path="/dashboard/:portalSlug" element={<ProtectedRoute requireAdmin><PortalManagement /></ProtectedRoute>} />
                <Route path="/dashboard/:portalSlug/marketplace" element={<ProtectedRoute requireAdmin><ServiceMarketplace /></ProtectedRoute>} />
                <Route path="/dashboard/:portalSlug/define-service" element={<ProtectedRoute requireAdmin><ServiceDesigner /></ProtectedRoute>} />
                <Route path="/dashboard/:portalSlug/designer/:serviceId/:formId" element={<ProtectedRoute requireAdmin><FormDesigner /></ProtectedRoute>} />
                <Route path="/dashboard/:portalSlug/applications/:appId" element={<ProtectedRoute requireAdmin><ApplicationReview /></ProtectedRoute>} />
                <Route path="/:portalSlug/apply/:serviceSlug" element={<ProtectedRoute><ServiceApplication /></ProtectedRoute>} />
                <Route path="/:portalSlug" element={<PortalPublic />} />
                <Route path="/:portalSlug/website" element={<PortalPublic />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
