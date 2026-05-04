import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ExternalLink, Shield, Info, ArrowRight, 
  Menu, X, Search, Bell, Home, Briefcase, Activity, Clock,
  ChevronRight, Plus, FileText, CheckCircle, HelpCircle,
  Users, BarChart3, Settings, Database, Filter, Globe, LogOut, User, Trash2, Loader2, Send,
  ToggleRight, Power, Layers, UserPlus, Zap, ShieldCheck, Smartphone, Calendar, Sparkles
} from "lucide-react";
import ResourceManager from "@/components/admin/ResourceManager";
import UserManagement from "@/components/admin/UserManagement";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthProvider";
import { Api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface PortalData {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme_config: {
    primaryColor: string;
    secondaryColor: string;
  };
  services: Array<{
    id: string;
    title: string;
    description: string;
    slug: string;
    category_name: string;
    forms: Array<{
      id: string;
      form_name: string;
      form_slug: string;
      updated_at: string;
    }>;
  }>;
}

const PortalManagement = () => {
  const { portalSlug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { signOut, session, isSuperAdmin, isStaff, isAdmin } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [isModulesLoading, setIsModulesLoading] = useState(true);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (data?.id) {
      fetchApplications();
      fetchModules();
    }
  }, [data?.id]);

  const fetchApplications = async () => {
    if (!data?.id) return;
    setIsAppLoading(true);
    try {
      const applications = await Api.listPortalApplications(data.id);
      setApplications(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsAppLoading(false);
    }
  };

  const fetchModules = async () => {
    if (!data?.id) return;
    setIsModulesLoading(true);
    try {
      const modules = await Api.listModules(data.id);
      setModules(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setIsModulesLoading(false);
    }
  };

  const toggleModule = async (moduleSlug: string, isEnabled: boolean) => {
    setIsUpdatingModule(true);
    try {
      await Api.toggleModule({
        portalId: data.id,
        moduleSlug: moduleSlug,
        enabled: isEnabled
      });
      
      toast.success(`Module ${isEnabled ? 'enabled' : 'disabled'} successfully`);
      fetchModules();
    } catch (error) {
      toast.error("Failed to update module");
    } finally {
      setIsUpdatingModule(false);
    }
  };

  const [activeHrModule, setActiveHrModule] = useState<string | null>(null);
  
  const hrModules = modules.filter(m => {
    if (m.category !== 'HR') return false;
    if (isStaff && !isAdmin && m.slug === 'hr-management') return false;
    return true;
  });
  const activeHrModuleData = hrModules.find(m => m.slug === (activeHrModule || hrModules[0]?.slug));

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const json = await Api.getPortalConfig(portalSlug!);
        
        const userPortalId = session?.user?.app_metadata?.portal_id || session?.portal_id; 
        if (!isSuperAdmin && userPortalId && userPortalId !== json.id) {
          toast.error("Unauthorized: You do not have management rights for this portal");
          navigate("/my-portal");
          return;
        }
        
        // If staff, set default tab to staff if that's their primary role
        if (isStaff && !isAdmin) {
          setActiveTab("staff");
        }
        
        setData(json);
      } catch (err: any) {
        setError(err.message);
        if (err.message.includes("limit")) {
          toast.error("Rate limit reached. Pausing requests.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (portalSlug) fetchPortal();
  }, [portalSlug, session, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-4xl px-10">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-slate-50 dark:bg-slate-950">
        <div className="p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
            <X className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-extrabold mb-4">Management Access Denied</h2>
          <p className="text-muted-foreground mb-8">{error === "Portal not found" ? `The institutional portal for /${portalSlug} is either not provisioned or currently inactive.` : error}</p>
          <Link to="/">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full rounded-xl h-12 font-bold"><ArrowLeft className="mr-2 h-5 w-5" /> Back to Core Engine</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = data.theme_config?.primaryColor || "#006400";

  const totalApplications = applications.length;
  const pendingReview = applications.filter(a => ['pending', 'submitted', 'under-review', 'new'].includes(a.status?.toLowerCase())).length;
  const approvedApps = applications.filter(a => ['approved', 'completed', 'delivered'].includes(a.status?.toLowerCase())).length;
  const approvalRate = totalApplications > 0 ? Math.round((approvedApps / totalApplications) * 100) + '%' : 'N/A';
  const activeServicesCount = data.services?.length || 0;

  const isManagement = isAdmin || isSuperAdmin || session?.role === 'staff';
  const isRegularEmployee = session?.role === 'employee';

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home, roles: ['admin', 'super_admin', 'institutional_admin', 'staff', 'employee'] },
    { id: "applications", label: "Applications", icon: FileText, roles: ['admin', 'super_admin', 'institutional_admin', 'staff'] },
    { id: "services", label: "Services", icon: Briefcase, roles: ['admin', 'super_admin', 'institutional_admin'] },
    { id: "users", label: "Users", icon: UserPlus, roles: ['admin', 'super_admin', 'institutional_admin'] },
    { id: "analytics", label: "Analytics", icon: BarChart3, roles: ['admin', 'super_admin', 'institutional_admin'] },
    { id: "staff", label: isRegularEmployee ? "My Employment" : "People & Culture", icon: Users, roles: ['admin', 'super_admin', 'institutional_admin', 'staff', 'employee'] },
    { id: "ai", label: "Assistant", icon: Sparkles, roles: ['admin', 'super_admin', 'institutional_admin', 'staff', 'employee'] },
    { id: "settings", label: "System Settings", icon: Settings, roles: ['admin', 'super_admin', 'institutional_admin'] },
  ].filter(item => item.roles.includes(session?.role || 'user'));

  const openFormDesigner = (serviceId: string, formId: string = "new") => {
    navigate(`/dashboard/${portalSlug}/designer/${serviceId}/${formId}`);
  };

  const confirmRemoveService = (serviceId: string) => {
    setServiceToDelete(serviceId);
  };

  const executeRemoveService = async () => {
    if (!serviceToDelete) return;
    try {
      await Api.removePortalService(data.id, serviceToDelete);
      toast.success("Service removed successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to remove service");
    } finally {
      setServiceToDelete(null);
    }
  };

  const confirmRemoveForm = (formId: string) => {
    setFormToDelete(formId);
  };

  const executeRemoveForm = async () => {
    if (!formToDelete) return;
    try {
      await Api.deleteFormDefinition(formToDelete);
      toast.success("Sub-service deleted successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete sub-service");
    } finally {
      setFormToDelete(null);
    }
  };

  const openMarketplace = async () => {
    navigate(`/dashboard/${portalSlug}/marketplace`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
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
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">{data.name} <span className="text-muted-foreground font-normal ml-1 border-l pl-2">Management</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="relative group">
            <div className="flex items-center gap-3 pl-4 border-l cursor-pointer py-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{isRegularEmployee ? "Employee Portal" : isStaff ? "Portal Staff" : "Institution Admin"}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{isRegularEmployee ? "Personal Dashboard" : "Management Console"}</p>
              </div>
              <Avatar className="h-10 w-10 border-2 transition-transform group-hover:scale-105" style={{ borderColor: `${primaryColor}20` }}>
                <AvatarFallback style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>IA</AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 w-56 overflow-hidden">
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Exit Management
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:sticky top-[73px] left-0 z-40 lg:z-auto
          w-72 border-r bg-white dark:bg-slate-900 h-[calc(100vh-4.6rem)] 
          transition-transform duration-300 ease-in-out overflow-y-auto
        `}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'ai') {
                      navigate(`/dashboard/${portalSlug}/ai`);
                    } else {
                      setActiveTab(item.id);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? 'text-white shadow-lg'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                  style={activeTab === item.id ? { backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` } : {}}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto overflow-x-hidden">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                    {isRegularEmployee ? "Welcome Back" : "Administrative Hub"}
                  </p>
                  <h2 className="text-3xl font-black tracking-tight">
                    {isRegularEmployee ? `Hello, ${session?.user?.first_name || 'Staff'}` : "Institutional Operations"}
                  </h2>
                </div>
                <div className="flex gap-3">
                  {isManagement && <Button variant="outline" className="h-11 px-6 font-bold rounded-xl">Generate Report</Button>}
                  {isAdmin && (
                    <Button 
                      className="shadow-lg h-11 px-6 font-bold rounded-xl text-white"
                      style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}30` }}
                      onClick={() => navigate(`/dashboard/${portalSlug}/define-service`)}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Service
                    </Button>
                  )}
                </div>
              </div>

              {/* Operations Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {isManagement ? (
                  <>
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Applications</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><FileText className="h-4 w-4" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black">{totalApplications}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Lifetime total</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Review</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><Clock className="h-4 w-4" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black">{pendingReview}</div>
                        <p className="text-[10px] text-orange-500 mt-2 font-bold uppercase tracking-widest">Awaiting officer action</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Approval Rate</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><CheckCircle className="h-4 w-4" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black">{approvalRate}</div>
                        <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Historical Average</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Services</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><Briefcase className="h-4 w-4" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black">{activeServicesCount}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Available to citizens</p>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Applications</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><FileText className="h-4 w-4" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black">{applications.length}</div>
                        <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Total submitted</p>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Requests</CardTitle>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><Activity className="h-4 w-4" /></div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-black">{applications.filter(a => a.status === 'Pending').length}</div>
                        <p className="text-[10px] text-blue-500 mt-2 font-bold uppercase tracking-widest">Awaiting processing</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Queue */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{isRegularEmployee ? "My Recent Applications" : "Incoming Applications"}</CardTitle>
                      <CardDescription>{isRegularEmployee ? "Track the status of your submitted requests" : "Latest records from the main ZamPortal citizen engine"}</CardDescription>
                    </div>
                    {isManagement && <Button variant="ghost" size="sm" className="font-bold text-xs" style={{ color: primaryColor }} onClick={() => setActiveTab('applications')}>View Full Queue</Button>}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(isRegularEmployee ? applications.filter(a => a.user_id === session?.userId || a.user_id === (session as any)?.user?.id) : applications).length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No applications to show.</p>
                      </div>
                    ) : (
                      (isRegularEmployee ? applications.filter(a => a.user_id === session?.userId || a.user_id === (session as any)?.user?.id) : applications).slice(0, 5).map((app, idx) => (
                        <Link to={isRegularEmployee ? `/my-portal` : `/dashboard/${portalSlug}/applications/${app.id}`} key={app.id || idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">
                              {app.tracking_number ? app.tracking_number.split('-')[1] || app.tracking_number : 'N/A'}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{isRegularEmployee ? app.service_title : `${app.first_name} ${app.last_name}`}</p>
                              <p className="text-[10px] text-muted-foreground">{isRegularEmployee ? (app.form_name || 'General Application') : app.service_title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-slate-400">{new Date(app.created_at).toLocaleDateString()}</span>
                            <Badge variant="outline" className={`font-bold text-[10px] ${
                              ['approved', 'completed'].includes(app.status?.toLowerCase()) ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                              ['pending', 'new', 'submitted'].includes(app.status?.toLowerCase()) ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 
                              'text-orange-500 border-orange-500/20 bg-orange-500/5'
                            }`}>
                              {app.status}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                          </div>
                        </Link>
                      ))
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  {/* Application Tips for Employees / Service Monitor for Admins */}
                  {isManagement ? (
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Catalog Health</CardTitle>
                        <Filter className="h-4 w-4 text-slate-400" />
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Service Uptime</span>
                            <span style={{ color: primaryColor }}>100%</span>
                          </div>
                          <Progress value={100} className="h-1.5" style={{ backgroundColor: `${primaryColor}10` }} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Average TAT</span>
                            <span style={{ color: primaryColor }}>4.2d</span>
                          </div>
                          <Progress value={75} className="h-1.5" style={{ backgroundColor: `${primaryColor}10` }} />
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600">
                          Audit Catalog
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {!isManagement ? (
                        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                          <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-start h-14 rounded-2xl border-slate-100 dark:border-slate-800 hover:bg-slate-50 font-bold group"
                              onClick={() => setActiveTab('staff')}
                            >
                              <Zap className="mr-3 h-5 w-5 text-amber-500" />
                              Apply for Leave
                              <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start h-14 rounded-2xl border-slate-100 dark:border-slate-800 hover:bg-slate-50 font-bold group"
                            >
                              <Calendar className="mr-3 h-5 w-5 text-blue-500" />
                              View Payslips
                              <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start h-14 rounded-2xl border-slate-100 dark:border-slate-800 hover:bg-slate-50 font-bold group"
                            >
                              <Smartphone className="mr-3 h-5 w-5 text-emerald-500" />
                              Institutional Support
                              <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                            </Button>
                          </CardContent>
                        </Card>
                      ) : null}

                      {/* Announcements / Notifications */}
                      <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg">Notifications</CardTitle>
                          <Bell className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-4 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/20">
                            <div className="mt-1"><Info className="h-4 w-4 text-blue-500" /></div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">New Portal Feature</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">HR self-service is now live for all employees.</p>
                            </div>
                          </div>
                          <div className="flex gap-4 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/20">
                            <div className="mt-1"><ShieldCheck className="h-4 w-4 text-amber-500" /></div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Security Update</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Please update your password by the end of the week.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/10" />
                        <CardHeader className="relative z-10">
                          <CardTitle className="text-lg">Need Assistance?</CardTitle>
                          <CardDescription className="text-emerald-100">Contact your institutional HR department for support.</CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                          <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-black rounded-xl h-11" onClick={() => setActiveTab('staff')}>
                            Open HR Portal
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {isManagement && (
                    <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:15px_15px]" />
                      <CardHeader className="relative z-10">
                        <CardTitle className="text-lg">Core Engine Sync</CardTitle>
                        <CardDescription className="text-slate-400">Connected to ZamPortal Mainframe.</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <div className="flex items-center gap-3 text-emerald-500 mb-4">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold uppercase tracking-widest">Live Link Active</span>
                        </div>
                        <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl h-11">
                          Push Updates
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Application Queue</h2>
                  <p className="text-slate-400 font-medium mt-1">Manage and track service requests from citizens.</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={fetchApplications} disabled={isAppLoading} className="h-10 px-4 font-bold rounded-xl border-slate-200">
                    {isAppLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />} Refresh Queue
                  </Button>
                  <Badge className="bg-emerald-100 text-emerald-700 h-10 px-6 font-black flex items-center">
                    {applications.length} Active Requests
                  </Badge>
                </div>
              </div>

              <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Applicant</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Service</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">Submitted</th>
                          <th className="px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((app) => (
                          <tr key={app.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-emerald-500/10">
                                  <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold">{app.first_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white leading-none">{app.first_name} {app.last_name}</p>
                                  <p className="text-xs text-slate-400 mt-1 font-medium">{app.tracking_number}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-300">
                              {app.service_title}
                              {app.form_name && <span className="text-emerald-500 block text-[10px] uppercase font-black tracking-widest mt-1">{app.form_name}</span>}
                            </td>
                            <td className="px-8 py-5">
                              <Badge className={`font-black text-[10px] uppercase tracking-widest px-3 py-1 border-none ${
                                ['approved', 'completed', 'delivered'].includes(app.status.toLowerCase()) ? 'bg-emerald-100 text-emerald-700' :
                                ['processing', 'shipped'].includes(app.status.toLowerCase()) ? 'bg-blue-100 text-blue-700' :
                                ['under-review', 'submitted'].includes(app.status.toLowerCase()) ? 'bg-yellow-100 text-yellow-700' :
                                ['payment-pending', 'additional-info-required'].includes(app.status.toLowerCase()) ? 'bg-orange-100 text-orange-700' :
                                ['ready-for-collection'].includes(app.status.toLowerCase()) ? 'bg-indigo-100 text-indigo-700' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {app.status}
                              </Badge>
                            </td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-400">{new Date(app.created_at).toLocaleDateString()}</td>
                            <td className="px-8 py-5 text-right">
                              <Link to={`/dashboard/${portalSlug}/applications/${app.id}`}>
                                <Button variant="ghost" size="sm" className="font-black text-emerald-600 hover:bg-emerald-50 rounded-xl">
                                  Review Request <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {applications.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center">
                              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <FileText className="h-8 w-8" />
                              </div>
                              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No applications found in queue</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Service Catalog</h2>
                  <p className="text-slate-400 font-medium mt-1">Services currently active in your institutional portal.</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="h-12 px-6 font-black rounded-xl border-slate-200"
                    onClick={openMarketplace}
                  >
                    <Briefcase className="mr-2 h-5 w-5 text-emerald-600" /> Service Marketplace
                  </Button>
                  <Button 
                    className="h-12 px-6 font-black rounded-xl text-white shadow-lg" 
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => navigate(`/dashboard/${portalSlug}/define-service`)}
                  >
                    <Plus className="mr-2 h-5 w-5" /> Define New Service
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.services.map(service => (
                  <Card key={service.id} className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="h-1.5 w-full" style={{ backgroundColor: `${primaryColor}20` }} />
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="font-bold text-[10px] uppercase border-slate-200">{service.category_name}</Badge>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => confirmRemoveService(service.id)}
                            className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                            <Settings className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors leading-tight">{service.title}</CardTitle>
                      <CardDescription className="line-clamp-3 font-medium mt-2 min-h-[60px]">{service.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 border-t mt-4 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2 p-4">
                      <div className="w-full space-y-2 mb-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Forms</span>
                          <Badge className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 h-4">{service.forms?.length || 0}</Badge>
                        </div>
                        <div className="space-y-1">
                          {service.forms?.map(form => (
                            <button 
                              key={form.id}
                              onClick={() => openFormDesigner(service.id, form.id)}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all text-xs font-bold group/item"
                            >
                              <span className="truncate pr-2">{form.form_name}</span>
                              <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); confirmRemoveForm(form.id); }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                <ChevronRight className="h-3 w-3 text-slate-300 group-hover/item:text-emerald-500" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full justify-between font-black h-11 rounded-xl transition-all hover:bg-emerald-600 hover:text-white" 
                        variant="ghost"
                        onClick={() => openFormDesigner(service.id)}
                      >
                        New Sub-Service <Plus className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                {data.services.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <Briefcase className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Empty Catalog</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium">Your institution hasn't activated any services yet. Browse the marketplace to start serving citizens.</p>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 font-black h-12 px-8 rounded-xl"
                      onClick={openMarketplace}
                    >
                      Open Service Marketplace
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && isAdmin && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <UserManagement portalId={data.id} />
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
              {hrModules.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-3 mb-10 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-[20px] border border-slate-200/50 dark:border-slate-800/50 w-fit">
                    {hrModules.map((m) => {
                      const isActive = (activeHrModule || hrModules[0]?.slug) === m.slug;
                      const Icon = m.slug === 'hr-management' ? Users : m.slug === 'leave-management' ? Clock : Activity;
                      return (
                        <button
                          key={m.slug}
                          onClick={() => setActiveHrModule(m.slug)}
                          className={cn(
                            "flex items-center gap-2.5 px-6 py-3 rounded-[15px] font-black text-xs uppercase tracking-widest transition-all duration-300",
                            isActive 
                              ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50" 
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-slate-300")} />
                          {m.name}
                        </button>
                      );
                    })}
                  </div>

                  {activeHrModuleData && activeHrModuleData.is_enabled ? (
                    <ResourceManager key={activeHrModuleData.slug} module={activeHrModuleData} portalId={data.id} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800">
                      <div className="p-8 rounded-3xl mb-6 bg-slate-50 dark:bg-slate-800 text-slate-300">
                        <Shield className="h-12 w-12" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Module Deactivated</h3>
                      <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">
                        {activeHrModuleData?.name || "This HR module"} is currently disabled. Enable it in the System Settings to access this interface.
                      </p>
                    </div>
                  )}
                </>
              ) : isModulesLoading ? (
                <div className="flex flex-col items-center justify-center py-40 text-center">
                  <Loader2 className="h-12 w-12 text-slate-300 animate-spin mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing HR Suite...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-center">
                  <div className="p-8 rounded-3xl mb-8 bg-slate-100 dark:bg-slate-800 text-slate-300">
                    <Users className="h-16 w-16" />
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-widest text-slate-400">HR Suite Offline</h3>
                  <p className="text-slate-500 font-medium max-w-md mx-auto mt-4">
                    No Human Resource modules are currently active for this institution.
                  </p>
                </div>
              )}
            </div>
          )}


          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500 max-w-4xl">
              <div>
                <h2 className="text-3xl font-black tracking-tight">System Settings</h2>
                <p className="text-slate-400 font-medium mt-1">Configure your institution's digital infrastructure and active modules.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <Card className="group relative border-none shadow-sm dark:bg-slate-900 overflow-hidden rounded-2xl cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => window.open(`/${portalSlug}/website`, '_blank')}>
                  <div className="absolute inset-0 bg-emerald-600/0 group-hover:bg-emerald-600/5 transition-colors" />
                  <CardContent className="p-6 flex items-center justify-between relative z-10">
                    <div className="flex gap-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl text-emerald-600">
                        <Globe className="h-8 w-8" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">Institutional Website</h4>
                        <p className="text-sm text-slate-500 mt-1">Visit your institution's public-facing portal as seen by citizens.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      <ExternalLink className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm dark:bg-slate-900 overflow-hidden rounded-2xl">
                  <CardHeader className="border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-600" /> Infrastructure Modules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {modules.map((m) => (
                      <div key={m.slug} className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <div className="flex gap-4">
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm h-fit">
                            <Users className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                              {m.name}
                              {m.is_enabled && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px]">Active</Badge>}
                            </h4>
                            <p className="text-sm text-slate-500 mt-0.5 max-w-md">{m.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button 
                            variant={m.is_enabled ? "default" : "outline"}
                            onClick={() => toggleModule(m.slug, !m.is_enabled)}
                            disabled={isUpdatingModule}
                            className={cn(
                              "h-12 px-6 rounded-xl font-black transition-all",
                              m.is_enabled ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20" : "border-slate-200"
                            )}
                          >
                            {m.is_enabled ? (
                              <><Power className="mr-2 h-4 w-4" /> Enabled</>
                            ) : (
                              <><Power className="mr-2 h-4 w-4 text-slate-300" /> Disabled</>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-blue-600/5 border-none rounded-2xl p-6 flex gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg h-fit">
                    <Info className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-blue-900 dark:text-blue-400">Institutional Sovereignty</h4>
                    <p className="text-sm text-blue-700/70 dark:text-blue-400/60 mt-1">
                      Modules are provisioned per institution. Disabling a module will hide its interface from the dashboard, but your existing records will be safely preserved for when you reactivate it.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Placeholder for analytics */}
          {activeTab === 'analytics' && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div 
                className="p-8 rounded-3xl mb-8 text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                <BarChart3 className="h-16 w-16" />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-widest">{activeTab} management</h3>
              <Button variant="outline" className="mt-10 font-black h-14 px-10 rounded-2xl text-lg" onClick={() => setActiveTab('overview')}>Back to Dashboard</Button>
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Remove Service</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-base">
              Are you sure you want to remove this service from your portal? All associated workflows will remain in the system but won't be accessible from this portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl h-11 border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeRemoveService} className="font-bold rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white">
              Remove Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-red-600">Delete Sub-Service Form</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-base">
              Are you sure you want to delete this sub-service workflow? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold rounded-xl h-11 border-slate-200 dark:border-slate-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeRemoveForm} className="font-bold rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {modules.find(m => m.slug === 'institutional-ai')?.is_enabled && (
        <Button
          onClick={() => navigate(`/dashboard/${portalSlug}/ai`)}
          className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-600/40 z-[100] flex items-center justify-center animate-in zoom-in duration-500 hover:scale-110 transition-all group border-none"
        >
          <Sparkles className="h-7 w-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute right-20 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 whitespace-nowrap shadow-2xl border border-slate-100 dark:border-slate-800 pointer-events-none">
            Institutional Assistant
          </span>
        </Button>
      )}
    </div>
  );
};

export default PortalManagement;
