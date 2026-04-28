import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  Search, 
  Bell, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Car,
  Users,
  Shield,
  Home,
  CreditCard,
  Settings,
  LogOut,
  Plus,
  Eye,
  Download,
  Menu,
  X,
  Activity,
  ChevronRight,
  ExternalLink,

  Zap,
  Filter,
  History,
  FileSearch,
  Check,
  CreditCard as PaymentIcon,
  Info,
  Truck,
  PackageCheck
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { Api } from "@/lib/api";

export default function MyPortal() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, userId } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appHistory, setAppHistory] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const [servicesData, appsData, catsData] = await Promise.all([
        Api.searchServices(""),
        Api.getApplications(),
        Api.getCategories()
      ]);
      
      if (Array.isArray(servicesData)) setServices(servicesData);
      if (Array.isArray(appsData)) setApplications(appsData);
      if (Array.isArray(catsData)) {
        setCategories([
          { title: 'All', icon: 'Zap' },
          ...catsData
        ]);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAppHistory = async (appId: string) => {
    try {
      const history = await Api.getApplicationHistory(appId);
      setAppHistory(history);
    } catch (error) {
      console.error("History fetch error:", error);
    }
  };

  const handleViewHistory = (app: any) => {
    setSelectedApp(app);
    fetchAppHistory(app.id);
    setIsHistoryOpen(true);
  };

  const iconMap: Record<string, any> = {
    Zap, Shield, Briefcase, Car, HeartPulse, GraduationCap, Users, FileText
  };

  // Mock user data
  const user = {
    name: "Luyando",
    email: "luyando@email.com",
    avatar: "/placeholder.svg",
    memberSince: "2023"
  };

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
      case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'processing':
      case 'shipped': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'under-review':
      case 'submitted': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'payment-pending':
      case 'additional-info-required': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'ready-for-collection': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'pending': return 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <PackageCheck className="h-4 w-4" />;
      case 'processing': return <Activity className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'under-review': return <Eye className="h-4 w-4" />;
      case 'submitted': return <Check className="h-4 w-4" />;
      case 'payment-pending': return <PaymentIcon className="h-4 w-4" />;
      case 'additional-info-required': return <Info className="h-4 w-4" />;
      case 'ready-for-collection': return <Download className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category_name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Home },
    { id: 'services', label: 'Browse Services', icon: Briefcase },
    { id: 'applications', label: 'My Applications', icon: FileText },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
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
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">My<span className="text-emerald-600">Portal</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search services..." className="pl-9 w-64 bg-slate-100 dark:bg-slate-800 border-none h-10" />
          </div>
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </Button>
          <ThemeToggle />
          <div className="relative group">
            <div className="flex items-center gap-3 pl-4 border-l cursor-pointer py-1">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Citizen Account</p>
              </div>
              <Avatar className="h-10 w-10 border-2 border-emerald-500/20 transition-transform group-hover:scale-105">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </div>

            <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 w-56 overflow-hidden">
                <div className="px-4 py-3 mb-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Digital Identity</p>
                  <p className="text-sm font-black mt-1 truncate">{user.email}</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <CreditCard className="h-4 w-4" /> Digital Wallet
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                <button 
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Secure Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "lg:translate-x-0 fixed lg:static top-[73px] left-0 z-40 lg:z-auto w-72 border-r bg-white dark:bg-slate-900 h-[calc(100vh-4.6rem)] transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                    activeSection === item.id
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.id === 'applications' && (
                    <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">
                      {applications.length}
                    </Badge>
                  )}
                </button>
              );
            })}
            
            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="px-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Support</p>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Privacy & Data</span>
              </button>
              <button 
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all mt-4"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/50">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2">Profile Integrity</p>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-emerald-700">Verified Identity</span>
                <span className="font-bold text-emerald-600">100%</span>
              </div>
              <Progress value={100} className="h-1.5 bg-emerald-200 dark:bg-emerald-900" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto overflow-x-hidden">
          {activeSection === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight">Welcome, {user.name}!</h2>
                  <p className="text-muted-foreground mt-1 text-lg">Manage your digital identity and government applications.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-11 px-6 font-bold">Download ID</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 h-11 px-6 font-bold" onClick={() => setActiveSection('services')}>
                    <Plus className="mr-2 h-4 w-4" /> New Application
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Applications</CardTitle>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-blue-600"><FileText className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{applications.filter(a => a.status !== 'completed').length}</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">+1 updated today</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Completed</CardTitle>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-600"><CheckCircle className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{applications.filter(a => a.status === 'completed').length}</div>
                    <p className="text-[10px] text-emerald-500 mt-2 font-bold uppercase tracking-widest">Ready for collection</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</CardTitle>
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-purple-600"><Activity className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">12</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Interactions this week</p>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Notifications</CardTitle>
                    <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-orange-600"><Bell className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">4</div>
                    <p className="text-[10px] text-orange-500 mt-2 font-bold uppercase tracking-widest">Awaiting action</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-xl font-bold">Recent Applications</CardTitle>
                    <Button variant="ghost" size="sm" className="text-emerald-600 font-bold" onClick={() => setActiveSection('applications')}>View All</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                      {applications.slice(0, 4).map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", getStatusStyles(app.status).split(' ')[0].replace('bg-', 'bg-opacity-10 text-'))}>
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{app.service_title}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{app.tracking_number}</p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-6">
                             <Badge variant="outline" className={cn("font-black text-[10px] uppercase tracking-widest px-3 border-none", getStatusStyles(app.status))}>
                               {app.status}
                             </Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl"
                              onClick={() => handleViewHistory(app)}
                            >
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {applications.length === 0 && (
                        <div className="p-10 text-center text-slate-400">
                          <p className="font-bold uppercase tracking-widest text-xs">No active applications</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="border-none shadow-sm bg-emerald-600 text-white overflow-hidden relative rounded-2xl">
                    <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
                    <CardHeader className="relative z-10">
                      <CardTitle className="flex items-center gap-2 text-xl font-bold uppercase tracking-tight">Public Portals</CardTitle>
                      <CardDescription className="text-emerald-100 font-medium">Access specialized ministry websites.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <Button className="w-full bg-white text-emerald-950 hover:bg-emerald-50 font-black h-12 rounded-xl" onClick={() => window.location.href='/'}>
                        Explore Now <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Deadlines</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-sm font-bold">Driving License</p>
                          <p className="text-[10px] text-orange-700/70 dark:text-orange-400 font-bold uppercase">Expires in 14 days</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-5xl font-black tracking-tight leading-none mb-3">Browse Services</h2>
                  <p className="text-muted-foreground text-xl font-medium">Access the full catalog of Zambian Digital Services.</p>
                </div>
                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                  <Input 
                    placeholder="Search by service name or category..." 
                    className="pl-12 bg-white dark:bg-slate-900 border-none shadow-xl h-14 rounded-2xl text-lg font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter Bar */}
              <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-2xl flex items-center gap-2 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                  <Filter className="h-4 w-4 text-slate-400 ml-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2 border-r pr-4">Filter By</span>
                  {categories.map((cat) => {
                    const Icon = typeof cat.icon === 'string' ? (iconMap[cat.icon] || Shield) : cat.icon;
                    return (
                      <button
                        key={cat.title}
                        onClick={() => setSelectedCategory(cat.title)}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap",
                          selectedCategory === cat.title
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {cat.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredServices.map((service) => {
                  return (
                    <Card key={service.id} className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
                      <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 group-hover:bg-emerald-600 transition-colors" />
                      <CardHeader className="p-8">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                            <Briefcase className="h-8 w-8" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-black tracking-tight">{service.title}</CardTitle>
                            <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-black text-[10px] uppercase tracking-widest px-3 mt-1">
                              {service.category_name || "General"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-8 pb-8">
                        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 h-12 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">5-7 Days</span>
                          </div>
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 font-black px-8 h-12 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                            onClick={() => navigate(`/${service.portal_slug || 'zambia'}/apply/${service.slug}`)}
                          >
                            Apply Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredServices.length === 0 && (
                <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-3xl border-4 border-dashed border-slate-50 dark:border-slate-800">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Search className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No matches found</h3>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto">We couldn't find any services matching "{searchQuery}" in the {selectedCategory} category.</p>
                  <Button variant="ghost" className="mt-8 font-black text-emerald-600" onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeSection === 'applications' && (
            <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black tracking-tight">My Applications</h2>
                  <p className="text-slate-500 font-medium mt-1">Track the real-time status of your government service requests.</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 h-10 px-6 font-black flex items-center">
                  {applications.length} Submitted Records
                </Badge>
              </div>

              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Service Request</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tracking Number</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current Status</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Submission Date</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {applications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-4">
                                <div className={cn("p-4 rounded-xl shadow-sm group-hover:scale-110 transition-transform", getStatusStyles(app.status).split(' ')[0].replace('bg-', 'bg-opacity-10 text-'))}>
                                  <FileText className="h-6 w-6" />
                                </div>
                                <p className="font-black text-xl tracking-tight text-slate-900 dark:text-white uppercase italic">
                                  {app.service_title}
                                  {app.form_name && <span className="text-emerald-500 ml-2">— {app.form_name}</span>}
                                </p>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                              <span className="font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                {app.tracking_number}
                              </span>
                            </td>
                            <td className="px-10 py-8">
                               <Badge variant="outline" className={cn("font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border-none", getStatusStyles(app.status))}>
                                 {app.status}
                               </Badge>
                            </td>
                            <td className="px-10 py-8">
                              <p className="text-sm font-black text-slate-400">{new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                            </td>
                            <td className="px-10 py-8 text-right">
                              <Link to={`/my-portal/applications/${app.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="font-black text-emerald-600 hover:bg-emerald-50 rounded-xl px-6 h-11 border-2 border-transparent hover:border-emerald-100"
                                >
                                  View Full Log <History className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {applications.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-32 text-center">
                              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <FileText className="h-12 w-12" />
                              </div>
                              <h3 className="text-2xl font-black uppercase tracking-tight mb-2">No Active Records</h3>
                              <p className="text-slate-400 font-medium max-w-sm mx-auto">You haven't submitted any service requests yet. Start your digital journey by browsing the catalog.</p>
                              <Button className="mt-8 bg-emerald-600 hover:bg-emerald-700 font-black h-12 px-8 rounded-xl shadow-lg shadow-emerald-600/20" onClick={() => setActiveSection('services')}>
                                Browse Services
                              </Button>
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

          {(activeSection === 'profile' || activeSection === 'settings') && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-3xl mb-8 flex items-center justify-center text-slate-200 border-2 border-slate-100 dark:border-slate-800">
                {activeSection === 'profile' && <User className="h-16 w-16" />}
                {activeSection === 'settings' && <Settings className="h-16 w-16" />}
              </div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">{activeSection} portal</h3>
              <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                This module is currently being finalized for your digital identity.
              </p>
              <Button 
                variant="outline" 
                className="mt-12 h-14 px-10 rounded-2xl font-black border-2 border-slate-200" 
                onClick={() => setActiveSection('dashboard')}
              >
                Return to Overview
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Status History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-slate-50 dark:bg-slate-950">
          <div className="bg-emerald-600 p-8 text-white relative">
            <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight">Application Timeline</DialogTitle>
                  <DialogDescription className="text-emerald-100 font-medium">
                    Tracking ID: <span className="font-mono font-black">{selectedApp?.tracking_number}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-8 max-h-[60vh] overflow-y-auto">
            <div className="relative border-l-2 border-emerald-100 dark:border-emerald-900 ml-4 space-y-10 py-4">
              {appHistory.map((log, index) => (
                <div key={log.id} className="relative pl-10 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Timeline Node */}
                  <div className={cn(
                    "absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-md transition-all duration-300",
                    index === 0 ? "bg-emerald-500 scale-125 shadow-emerald-500/50" : "bg-slate-300 dark:bg-slate-700"
                  )}>
                    {index === 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md group">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5", getStatusStyles(log.status))}>
                          {getStatusIcon(log.status)}
                          {log.status}
                        </Badge>
                      </div>
                      <time className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </time>
                    </div>
                    
                    {log.notes && (
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic">
                        "{log.notes}"
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                          {log.changed_by_first_name?.[0] || 'S'}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Updated By: {log.changed_by_first_name ? `${log.changed_by_first_name} ${log.changed_by_last_name}` : 'System'}
                        </span>
                      </div>
                      {index === appHistory.length - 1 && (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase">Initial Submission</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {appHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <History className="h-16 w-16 mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-sm">No history found</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="p-8 pt-0">
            <Button 
              className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-black h-14 rounded-2xl shadow-xl transition-all active:scale-95" 
              onClick={() => setIsHistoryOpen(false)}
            >
              Close Timeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}