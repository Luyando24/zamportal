import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Settings, Globe, Trash2, Layout, Palette, 
  Home, Server, Users, BarChart3, Shield, Menu, X, 
  Search, Bell, LogOut, ExternalLink, MoreVertical,
  Activity, CheckCircle, AlertCircle, Clock, User, Database,
  Zap, Sparkles, Wand2
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import ResourceManager from "@/components/admin/ResourceManager";

interface Service {
  id: string;
  title: string;
  category_name: string;
}

interface Portal {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  theme_config: any;
  is_active: boolean;
  created_at: string;
}

interface UserRecord {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
  app_metadata: {
    role?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
}

const AdminPortals = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [portals, setPortals] = useState<Portal[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [adminServices, setAdminServices] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [serviceSearch, setServiceSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalApplications: 0,
    approved: 0,
    pending: 0,
    actionRequired: 0
  });
  const [aiModel, setAiModel] = useState<string>(localStorage.getItem("admin_ai_model") || "groq");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();

  // Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => {}
  });



  useEffect(() => {
    fetchData();
    fetchModules();
    fetchAiConfig();
    if (activeTab === 'users' || activeTab === 'overview') {
      fetchUsers();
      fetchDashboardStats();
    }
    if (activeTab === 'services_mgmt') {
      fetchAdminServices();
      fetchCategories();
    }
  }, [activeTab, serviceSearch]);

  const fetchAiConfig = async () => {
    try {
      const res = await fetch("/api/ai/config");
      const data = await res.json();
      if (data.defaultModel) {
        setAiModel(data.defaultModel);
      }
    } catch (error) {
      console.error("Failed to fetch AI config:", error);
    }
  };

  const authFetch = async (url: string, init?: RequestInit) => {
    const savedSession = localStorage.getItem('zamportal_session');
    let token = null;
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        token = parsed.tokens?.accessToken;
      } catch (e) {}
    }

    return fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        "Authorization": token ? `Bearer ${token}` : ""
      }
    });
  };

  const fetchModules = async () => {
    try {
      const res = await authFetch("/api/modules");
      const data = await res.json();
      if (Array.isArray(data)) setModules(data);
    } catch (error) {
      console.error("Failed to fetch modules:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await authFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    }
  };



  const fetchAdminServices = async () => {
    try {
      const res = await authFetch(`/api/admin/services?search=${serviceSearch}`);
      const data = await res.json();
      if (data.services) {
        setAdminServices(data.services);
        setTotalServices(data.total);
      }
    } catch (error) {
      toast({ title: "Fetch Error", description: "Could not load services catalog", variant: "destructive" });
    }
  };

  const fetchData = async () => {
    try {
      const [portalsRes, servicesRes] = await Promise.all([
        fetch("/api/portals"),
        fetch("/api/services/search?query=")
      ]);
      const portalsData = await portalsRes.json();
      const servicesData = await servicesRes.json();
      
      if (Array.isArray(portalsData)) setPortals(portalsData);
      if (Array.isArray(servicesData)) setServices(servicesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ title: "Fetch Error", description: "Could not load system data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch("/api/admin/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (error) {
      toast({ title: "Fetch Error", description: "Could not load user data", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    setConfirmConfig({
      open: true,
      title: "Delete User Account",
      description: "Are you sure you want to permanently delete this user account? This action cannot be undone.",
      action: async () => {
        try {
          const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast({ title: "Success", description: "User deleted successfully" });
            fetchUsers();
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to delete user", variant: "destructive" });
        }
      }
    });
  };

  const handleDeleteService = async (id: string) => {
    setConfirmConfig({
      open: true,
      title: "Remove Service from Catalog",
      description: "Remove this service from the national catalog? All associated sub-services and forms will be deleted.",
      action: async () => {
        try {
          const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast({ title: "Success", description: "Service removed from catalog" });
            fetchAdminServices();
          }
        } catch (error) {
          toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
        }
      }
    });
  };

  const handleDeletePortal = async (id: string, name: string) => {
    setConfirmConfig({
      open: true,
      title: "Terminate Institutional Portal",
      description: `CRITICAL ACTION: Are you sure you want to completely delete the ${name} portal? This will permanently remove ALL associated users, sub-services, and application data. This cannot be undone.`,
      action: async () => {
        try {
          const res = await fetch(`/api/portals/${id}`, { method: "DELETE" });
          if (res.ok) {
            toast({ title: "Success", description: "Institution and all related data purged" });
            fetchData();
          } else {
            const err = await res.json();
            throw new Error(err.error);
          }
        } catch (error: any) {
          toast({ title: "Purge Failed", description: error.message, variant: "destructive" });
        }
      }
    });
  };

  const handleSaveService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    
    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
      const method = editingService ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        toast({ title: "Success", description: "Service catalog updated" });
        setIsServiceDialogOpen(false);
        fetchAdminServices();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save service", variant: "destructive" });
    }
  };

  const navItems = [

    { id: "overview", label: "System Overview", icon: Home },
    { id: "portals", label: "Portal Management", icon: Globe },
    { id: "services", label: "Total Services", icon: Server },
    { id: "analytics", label: "System Analytics", icon: BarChart3 },
    { id: "security", label: "Security & Audit", icon: Shield },
    { id: "settings", label: "Total Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Zambia Coat of Arms" className="h-10 w-auto" />
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">ZamPortal <span className="text-emerald-600">Admin</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search system..." className="pl-9 w-64 bg-slate-100 dark:bg-slate-800 border-none" />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </Button>
          <ThemeToggle />
          <div className="relative group">
            <div className="flex items-center gap-3 pl-4 border-l cursor-pointer py-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">System Admin</p>
                <p className="text-[10px] text-muted-foreground mt-1">Super User</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-emerald-500/20 transition-transform group-hover:scale-105">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </div>
            
            {/* Dropdown Menu on Hover */}
            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 w-56 overflow-hidden">
                <div className="px-4 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authorized Session</p>
                  <p className="text-sm font-black mt-1 truncate">admin@zamportal.gov.zm</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Settings className="h-4 w-4" /> System Config
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Terminate Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:sticky top-[4.1rem] left-0 z-40 lg:z-auto
          w-72 border-r bg-white dark:bg-slate-900 h-[calc(100vh-4.1rem)] 
          transition-transform duration-300 ease-in-out overflow-y-auto
        `}>
          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === "overview" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
            >
              <Layout className="h-5 w-5" />
              <span className="font-bold">System Overview</span>
            </button>
            <button 
              onClick={() => setActiveTab("portals")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === "portals" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
            >
              <Globe className="h-5 w-5" />
              <span className="font-bold">Institutional Portals</span>
            </button>
            <button 
              onClick={() => setActiveTab("services_mgmt")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === "services_mgmt" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
            >
              <Server className="h-5 w-5" />
              <span className="font-bold">Service Catalog</span>
            </button>
            <button 
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === "users" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
            >
              <Users className="h-5 w-5" />
              <span className="font-bold">User Management</span>
            </button>
            <button 
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === "settings" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
            >
              <Settings className="h-5 w-5" />
              <span className="font-bold">System Settings</span>
            </button>
            
            <button 
              onClick={() => navigate("/admin/module-factory")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 mt-4 border border-blue-100 dark:border-blue-900/30 border-dashed"
            >
              <Database className="h-5 w-5" />
              <span className="font-bold">Design Studio</span>
            </button>

            {modules.length > 0 && (
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="px-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Deployed Modules</p>
                {modules.map(mod => (
                  <button 
                    key={mod.id}
                    onClick={() => setActiveTab(`module_${mod.slug}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeTab === `module_${mod.slug}` ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="font-medium">{mod.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="px-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Account</p>
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/50">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2">System Health</p>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-emerald-700">Database Connection</span>
                <span className="font-bold text-emerald-600">Stable</span>
              </div>
              <Progress value={98} className="h-1.5 bg-emerald-200 dark:bg-emerald-900" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto overflow-x-hidden">
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">System Overview</h2>
                </div>
                <div className="flex gap-3">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={() => navigate("/admin/portals/provision")}>
                    <Plus className="mr-2 h-4 w-4" /> Provision New Portal
                  </Button>

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Portals</CardTitle>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600"><Globe className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{portals.length}</div>
                    <div className="flex items-center text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">
                      <CheckCircle className="h-3 w-3 mr-1" /> All Systems Online
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Services</CardTitle>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-600"><Server className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{services.length}</div>
                    <div className="flex items-center text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">
                      <Activity className="h-3 w-3 mr-1 text-emerald-500" /> Active Registry
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-purple-600"><Users className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{users.length}</div>
                    <div className="flex items-center text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">
                      System Accounts
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Modules</CardTitle>
                    <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-orange-600"><Database className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{modules.length}</div>
                    <div className="flex items-center text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">
                      <CheckCircle className="h-3 w-3 mr-1 text-emerald-500" /> Factory Built
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Deployments</CardTitle>
                      <CardDescription>Latest institutional systems provisioned</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {portals.slice(0, 5).map((portal) => (
                        <div key={portal.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110 duration-300"
                              style={{ backgroundColor: portal.theme_config?.primaryColor || '#10b981' }}
                            >
                              {portal.name[0]}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{portal.name}</p>
                              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                <Globe className="h-3 w-3" /> zamportal.gov.zm/{portal.slug}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-6">
                            <div className="hidden sm:block">
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900">Active</Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {portals.length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-950/50">
                          <p className="text-muted-foreground italic">No systems provisioned yet.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Quick Action</CardTitle>
                      <CardDescription className="text-emerald-100">Instantly deploy a standard government portal template.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <Button className="w-full bg-white text-emerald-950 hover:bg-emerald-50 font-bold" onClick={() => navigate("/admin/portals/provision")}>
                        Launch Setup Wizard
                      </Button>

                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                    <CardHeader>
                      <CardTitle>Total Applications</CardTitle>
                      <CardDescription>System-wide processing pipeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">Approved & Completed</span>
                          <span className="text-emerald-500">{dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.approved / dashboardStats.totalApplications) * 100) : 0}%</span>
                        </div>
                        <Progress value={dashboardStats.totalApplications > 0 ? (dashboardStats.approved / dashboardStats.totalApplications) * 100 : 0} className="h-1.5 [&>div]:bg-emerald-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">Pending Review</span>
                          <span className="text-blue-500">{dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.pending / dashboardStats.totalApplications) * 100) : 0}%</span>
                        </div>
                        <Progress value={dashboardStats.totalApplications > 0 ? (dashboardStats.pending / dashboardStats.totalApplications) * 100 : 0} className="h-1.5 [&>div]:bg-blue-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">Action Required</span>
                          <span className="text-orange-500">{dashboardStats.totalApplications > 0 ? Math.round((dashboardStats.actionRequired / dashboardStats.totalApplications) * 100) : 0}%</span>
                        </div>
                        <Progress value={dashboardStats.totalApplications > 0 ? (dashboardStats.actionRequired / dashboardStats.totalApplications) * 100 : 0} className="h-1.5 [&>div]:bg-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeTab === "portals" && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Institutional Portals</h2>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={() => navigate("/admin/portals/provision")}>
                  <Plus className="mr-2 h-4 w-4" /> Deploy New System
                </Button>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portals.map(portal => (
                  <Card key={portal.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white dark:bg-slate-900">
                    <div 
                      className="h-2 w-full" 
                      style={{ backgroundColor: portal.theme_config?.primaryColor || "#006400" }} 
                    />
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                            style={{ backgroundColor: portal.theme_config?.primaryColor || '#10b981' }}
                          >
                            {portal.name[0]}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{portal.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-0.5">
                              <Globe className="h-3 w-3" /> /{portal.slug}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={portal.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500"}>
                            {portal.is_active ? "Active" : "Draft"}
                          </Badge>
                          <Badge variant="outline" className={portal.is_website_enabled ? "text-blue-500 border-blue-500/20" : "text-slate-400 border-slate-200"}>
                            {portal.is_website_enabled ? "Website Live" : "Website Offline"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10 font-medium">
                        {portal.description || "Official government portal system deployed for institutional service delivery."}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex gap-1.5">
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: portal.theme_config?.primaryColor }} />
                          <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: portal.theme_config?.secondaryColor }} />
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 transition-colors" onClick={() => window.open(`/${portal.slug}`, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 transition-colors">
                            <Palette className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 transition-colors"
                            onClick={() => handleDeletePortal(portal.id, portal.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-0">
                      <Link to={`/dashboard/${portal.slug}`} className="w-full">
                        <Button className="w-full rounded-none h-12 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-emerald-600 hover:text-white transition-all border-none">
                          Manage Operations <Settings className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Identity & Access View */}
          {activeTab === "users" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">System Users</h2>
                  <p className="text-slate-500 font-medium mt-1">Manage administrative and citizen access across the platform.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" onClick={() => setIsUserDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add System User
                </Button>
              </div>
              
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">User</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Role</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Joined</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm">
                                  <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                                  <AvatarFallback>{user.email[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{user.user_metadata?.full_name || 'System User'}</p>
                                  <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <Badge variant="outline" className={cn(
                                "font-bold text-[10px] uppercase tracking-widest",
                                user.app_metadata?.role === 'super_admin' ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                              )}>
                                {user.app_metadata?.role?.replace('_', ' ') || 'Citizen'}
                              </Badge>
                            </td>
                            <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl" 
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Service Management View */}
          {activeTab === "services_mgmt" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">National Service Catalog</h2>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg" onClick={() => navigate("/admin/define-service")}>
                  <Plus className="mr-2 h-4 w-4" /> Register New Service
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Search across thousands of government services..." 
                  className="h-16 pl-12 rounded-[24px] border-none shadow-xl bg-white dark:bg-slate-900 text-lg font-medium"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold px-3 py-1">
                    {totalServices} Total Services
                  </Badge>
                </div>
              </div>

              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Service Title</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Category</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Type</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminServices.map((service) => (
                          <tr key={service.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                  <Server className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white leading-none">{service.title}</p>
                                  <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-1">{service.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-widest bg-slate-100 dark:bg-slate-800">
                                {service.category_name || 'Uncategorized'}
                              </Badge>
                            </td>
                            <td className="px-8 py-5">
                              {service.is_popular ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-[10px] uppercase tracking-widest">
                                  Popular
                                </Badge>
                              ) : (
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Standard</span>
                              )}
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Operational</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl" onClick={() => {
                                  setEditingService(service);
                                  setIsServiceDialogOpen(true);
                                }}>
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl" onClick={() => handleDeleteService(service.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab View */}
          {activeTab === "settings" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <h2 className="text-3xl font-black tracking-tight">System Settings</h2>
                <p className="text-muted-foreground mt-2">Configure global platform parameters and AI integration.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[32px] bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">AI Integration</CardTitle>
                        <CardDescription>Choose your preferred LLM provider</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Default AI Model</Label>
                      <Select 
                        value={aiModel} 
                        onValueChange={async (val) => {
                          setAiModel(val);
                          localStorage.setItem("admin_ai_model", val);
                          try {
                            await authFetch("/api/ai/config", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ 
                                defaultModel: val,
                                availableModels: ["openai", "gemini", "groq", "claude"]
                              })
                            });
                            toast({ title: "System Settings Synchronized", description: `Default AI model globally set to ${val}` });
                          } catch (e) {
                            toast({ title: "Sync Failed", description: "Could not persist settings to database.", variant: "destructive" });
                          }
                        }}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                          <SelectItem value="groq" className="py-3 rounded-xl">Groq (Llama 3.1) - Fastest</SelectItem>
                          <SelectItem value="gemini" className="py-3 rounded-xl">Google Gemini 1.5 - Vision Capable</SelectItem>
                          <SelectItem value="openai" className="py-3 rounded-xl">OpenAI GPT-4o - Precision</SelectItem>
                          <SelectItem value="claude" className="py-3 rounded-xl">Anthropic Claude 3 - Creative</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground font-medium italic">
                        All system-wide generation tasks (Portals, Services, Modules) will use this provider.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl rounded-[32px] bg-white dark:bg-slate-900 overflow-hidden opacity-50 grayscale pointer-events-none">
                  <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Platform Security</CardTitle>
                        <CardDescription>Advanced access & audit controls</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8">
                    <p className="text-sm text-center py-10 font-medium text-slate-400">Coming soon in the Enterprise release.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {(activeTab === "analytics" || activeTab === "security") && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-full mb-6 text-slate-400 animate-pulse">
                {activeTab === "analytics" && <BarChart3 className="h-12 w-12" />}
                {activeTab === "security" && <Shield className="h-12 w-12" />}
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-widest">{activeTab} module</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">This management module is currently being optimized for high-performance scale.</p>
              <Button variant="outline" className="mt-8" onClick={() => setActiveTab('overview')}>Return to Overview</Button>
            </div>
          )}
        </main>
      </div>



      {/* User Registration Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Register Authorized User</DialogTitle>
            <DialogDescription>
              Create a new account with specific access levels.
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4 py-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData);
            
            // Find slug for the selected portal
            if (data.portal_id) {
              const selectedPortal = portals.find(p => p.id === data.portal_id);
              if (selectedPortal) {
                (data as any).portal_slug = selectedPortal.slug;
              }
            }
            
            const cleanData = { ...data };
            if (cleanData.portal_id === "") {
              delete cleanData.portal_id;
              delete (cleanData as any).portal_slug;
            }
            
            try {
              const res = await authFetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cleanData)
              });
              
              if (res.ok) {
                toast({ title: "Success", description: "User registered successfully" });
                setIsUserDialogOpen(false);
                fetchUsers();
              } else {
                const err = await res.json();
                throw new Error(err.error);
              }
            } catch (err: any) {
              toast({ title: "Registration Failed", description: err.message, variant: "destructive" });
            }
          }}>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</Label>
              <Input name="full_name" placeholder="John Doe" required className="rounded-xl h-12 bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Official Email</Label>
              <Input name="email" type="email" placeholder="john.doe@gov.zm" required className="rounded-xl h-12 bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Temporary Password</Label>
              <Input name="password" type="password" placeholder="••••••••" required className="rounded-xl h-12 bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Role / Access Level</Label>
              <select name="role" className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 font-bold text-sm">
                <option value="institutional_admin">Institutional Administrator</option>
                <option value="super_admin">System Administrator</option>
                <option value="user">Citizen User</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Assigned Institution</Label>
              <select name="portal_id" className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 font-bold text-sm">
                <option value="">None (System Wide)</option>
                {portals.map(portal => (
                  <option key={portal.id} value={portal.id}>{portal.name}</option>
                ))}
              </select>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 font-bold shadow-lg">
                Finalize Registration
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Service Registration Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingService ? "Modify Catalog Entry" : "Register New Service"}</DialogTitle>
            <DialogDescription>
              Manage this service in the national digital infrastructure catalog.
            </DialogDescription>
          </DialogHeader>
          
          <form className="space-y-4 py-4" onSubmit={handleSaveService}>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Service Title</Label>
              <Input name="title" defaultValue={editingService?.title} placeholder="e.g. Passport Renewal" className="h-12 rounded-xl bg-slate-50 border-slate-200" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">URL Slug</Label>
              <Input name="slug" defaultValue={editingService?.slug} placeholder="e.g. passport-renewal" className="h-12 rounded-xl bg-slate-50 border-slate-200" required />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Classification</Label>
              <select name="category_id" defaultValue={editingService?.category_id} className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 font-bold text-sm" required>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</Label>
              <Textarea name="description" defaultValue={editingService?.description} placeholder="Describe the service purpose and requirements..." className="min-h-[100px] rounded-xl bg-slate-50 border-slate-200" required />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Mark as Popular</Label>
                <p className="text-[10px] text-muted-foreground">Highlight this service in the main portal</p>
              </div>
              <Switch name="is_popular" defaultChecked={editingService?.is_popular} />
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-600 font-bold shadow-lg">
                {editingService ? "Update Catalog" : "Add to Catalog"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Confirmation Dialog */}
      <AlertDialog open={confirmConfig.open} onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500 mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-2xl font-black">{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-lg leading-relaxed pt-2">
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 font-bold px-8 border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmConfig.action}
              className="rounded-2xl h-12 font-bold px-8 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
            >
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPortals;
