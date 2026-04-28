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
  Users, BarChart3, Settings, Database, Filter, Globe, LogOut, User, Trash2, Loader2, Send
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthProvider";
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
  const { signOut, session, isSuperAdmin } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'applications' && data?.id) {
      fetchApplications();
    }
  }, [activeTab, data?.id]);

  const fetchApplications = async () => {
    if (!data?.id) return;
    setIsAppLoading(true);
    try {
      const res = await fetch(`/api/applications/portal/${data.id}`);
      const apps = await res.json();
      if (Array.isArray(apps)) setApplications(apps);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setIsAppLoading(false);
    }
  };

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const response = await fetch(`/api/portals/${portalSlug}`);
        if (!response.ok) throw new Error("Portal not found");
        const json = await response.json();
        
        const userPortalId = session?.user?.app_metadata?.portal_id;
        if (!isSuperAdmin && userPortalId && userPortalId !== json.id) {
          toast.error("Unauthorized: You do not have management rights for this portal");
          navigate("/my-portal");
          return;
        }
        
        setData(json);
      } catch (err: any) {
        setError(err.message);
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
          <p className="text-muted-foreground mb-8">The institutional portal for <span className="font-bold text-slate-900 dark:text-white">/{portalSlug}</span> is either not provisioned or currently inactive.</p>
          <Link to="/">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full rounded-xl h-12 font-bold"><ArrowLeft className="mr-2 h-5 w-5" /> Back to Core Engine</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = data.theme_config?.primaryColor || "#006400";

  const navItems = [
    { id: "overview", label: "Operations Dashboard", icon: Home },
    { id: "applications", label: "Citizen Applications", icon: FileText },
    { id: "services", label: "Service Catalog", icon: Briefcase },
    { id: "website", label: "Public Website", icon: Globe },
    { id: "analytics", label: "Operational Insights", icon: BarChart3 },
    { id: "staff", label: "Staff Management", icon: Users },
  ];

  const openFormDesigner = (serviceId: string, formId: string = "new") => {
    navigate(`/dashboard/${portalSlug}/designer/${serviceId}/${formId}`);
  };

  const confirmRemoveService = (serviceId: string) => {
    setServiceToDelete(serviceId);
  };

  const executeRemoveService = async () => {
    if (!serviceToDelete) return;
    try {
      const res = await fetch(`/api/portals/${data?.id}/services/${serviceToDelete}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Service removed successfully");
        window.location.reload();
      }
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
      const res = await fetch(`/api/forms/${formToDelete}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Sub-service deleted successfully");
        window.location.reload();
      }
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
                <p className="text-sm font-bold leading-none">Institution Admin</p>
                <p className="text-[10px] text-muted-foreground mt-1">Authorized Personnel</p>
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
                    if (item.id === 'website') {
                      window.open(`/${portalSlug}/website`, '_blank');
                      return;
                    }
                    setActiveTab(item.id);
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
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Institutional Operations</h2>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-11 px-6 font-bold rounded-xl">Generate Report</Button>
                  <Button 
                    className="shadow-lg h-11 px-6 font-bold rounded-xl text-white"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}30` }}
                    onClick={() => navigate(`/dashboard/${portalSlug}/define-service`)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Service
                  </Button>
                </div>
              </div>

              {/* Operations Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Applications</CardTitle>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><FileText className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">1,284</div>
                    <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">+12% this month</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Review</CardTitle>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><Clock className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">42</div>
                    <p className="text-[10px] text-orange-500 mt-2 font-bold uppercase tracking-widest">Awaiting officer action</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue Collected</CardTitle>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><BarChart3 className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">ZMW 45.2k</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Settled via ZamPay</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Health</CardTitle>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><Activity className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">Stable</div>
                    <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Full Engine Sync</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Queue */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Incoming Applications</CardTitle>
                      <CardDescription>Latest records from the main ZamPortal citizen engine</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="font-bold text-xs" style={{ color: primaryColor }}>View Full Queue</Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { id: "#AP-8921", citizen: "John Doe", service: "License Renewal", time: "2m ago", status: "New" },
                      { id: "#AP-8920", citizen: "Sarah Mwale", service: "Permit Issue", time: "15m ago", status: "Review" },
                      { id: "#AP-8919", citizen: "Chanda Kapika", service: "Registration", time: "1h ago", status: "Pending" },
                      { id: "#AP-8918", citizen: "Mubita L.", service: "Certification", time: "3h ago", status: "New" },
                    ].map((app, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-500">{app.id}</div>
                          <div>
                            <p className="text-sm font-bold">{app.citizen}</p>
                            <p className="text-[10px] text-muted-foreground">{app.service}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-bold text-slate-400">{app.time}</span>
                          <Badge variant="outline" className={`font-bold text-[10px] ${app.status === 'New' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-orange-500 border-orange-500/20'}`}>
                            {app.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  {/* Service Monitor */}
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

          {/* Placeholder for staff/analytics */}
          {(activeTab === 'staff' || activeTab === 'analytics') && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div 
                className="p-8 rounded-3xl mb-8 text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {activeTab === 'staff' ? <Users className="h-16 w-16" /> : <BarChart3 className="h-16 w-16" />}
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
    </div>
  );
};

export default PortalManagement;
