import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ExternalLink, Shield, Info, ArrowRight, 
  Menu, X, Search, Bell, Home, Briefcase, Activity, Clock,
  ChevronRight, Plus, FileText, CheckCircle, HelpCircle,
  Users, BarChart3, Settings, Database, Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { Progress } from "@/components/ui/progress";

interface PortalData {
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
  }>;
}

const DynamicPortal = () => {
  const { portalSlug } = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const response = await fetch(`/api/portals/${portalSlug}`);
        if (!response.ok) throw new Error("Portal not found");
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (portalSlug) fetchPortal();
  }, [portalSlug]);

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
        <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-md">
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
  const secondaryColor = data.theme_config?.secondaryColor || "#FFD700";

  const navItems = [
    { id: "overview", label: "Operations Dashboard", icon: Home },
    { id: "applications", label: "Citizen Applications", icon: FileText },
    { id: "services", label: "Service Catalog", icon: Briefcase },
    { id: "analytics", label: "Operational Insights", icon: BarChart3 },
    { id: "staff", label: "Staff Management", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Dynamic Header */}
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
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search records..." className="pl-9 w-64 bg-slate-100 dark:bg-slate-800 border-none h-10" />
          </div>
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </Button>
          <ThemeToggle />
          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">Institution Admin</p>
              <p className="text-[10px] text-muted-foreground mt-1">Authorized Personnel</p>
            </div>
            <Avatar className="h-10 w-10 border-2" style={{ borderColor: `${primaryColor}20` }}>
              <AvatarFallback style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>IA</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static top-[73px] left-0 z-40 lg:z-auto
          w-72 border-r bg-white dark:bg-slate-900 h-[calc(100vh-4.6rem)] 
          transition-transform duration-300 ease-in-out
        `}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
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
                  {item.id === 'applications' && (
                    <Badge variant="secondary" className="ml-auto bg-slate-100 dark:bg-slate-800">
                      124
                    </Badge>
                  )}
                </button>
              );
            })}
            
            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
              <p className="px-4 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4">Institutional Config</p>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Settings className="h-5 w-5" />
                <span className="font-medium">Portal Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <Database className="h-5 w-5" />
                <span className="font-medium">Data Integration</span>
              </button>
            </div>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div 
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}20` }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Engine Sync</p>
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: `${primaryColor}CC` }}>Last Heartbeat</span>
                <span className="font-bold" style={{ color: primaryColor }}>Stable</span>
              </div>
              <Progress value={100} className="h-1.5" style={{ backgroundColor: `${primaryColor}20` }} />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-10 max-w-[1600px] mx-auto overflow-x-hidden">
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Institutional Operations</h2>
                  <p className="text-muted-foreground mt-1 text-lg font-medium">Real-time management for {data.name}.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-11 px-6 font-bold rounded-xl">Generate Report</Button>
                  <Button 
                    className="shadow-lg h-11 px-6 font-bold rounded-xl text-white"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}30` }}
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
            <div className="flex flex-col items-center justify-center py-40 text-center animate-in slide-in-from-bottom duration-500">
              <div className="p-8 bg-white dark:bg-slate-900 rounded-[40px] mb-8 text-slate-400 shadow-xl" style={{ border: `2px dashed ${primaryColor}20` }}>
                <FileText className="h-16 w-16" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-3xl font-black uppercase tracking-widest">Application Queue</h3>
              <p className="text-muted-foreground mt-4 max-w-sm text-lg font-medium">Processing records from the main citizen engine.</p>
              <Button variant="outline" className="mt-10 font-black h-14 px-10 rounded-2xl text-lg" onClick={() => setActiveTab('overview')}>Back to Operations</Button>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Service Catalog</h2>
                  <p className="text-muted-foreground mt-1 text-lg font-medium">Management of your institution's digital product list.</p>
                </div>
                <Button className="h-12 px-6 font-black rounded-xl text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                  <Plus className="mr-2 h-5 w-5" /> Define New Service
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.services.map(service => (
                  <Card key={service.id} className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="h-1.5 w-full" style={{ backgroundColor: `${primaryColor}20` }} />
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="font-bold text-[10px] uppercase border-slate-200">{service.category_name}</Badge>
                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
                          <Settings className="h-4 w-4" />
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors leading-tight">{service.title}</CardTitle>
                      <CardDescription className="line-clamp-3 font-medium mt-2 min-h-[60px]">{service.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 border-t mt-4 bg-slate-50/50 dark:bg-slate-800/50">
                      <Button 
                        className="w-full justify-between font-black h-12 rounded-none transition-all" 
                        variant="ghost"
                        style={{ color: primaryColor }}
                      >
                        Modify Configuration <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder for staff/analytics */}
          {(activeTab === 'staff' || activeTab === 'analytics') && (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div 
                className="p-8 rounded-[40px] mb-8 text-white shadow-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {activeTab === 'staff' ? <Users className="h-16 w-16" /> : <BarChart3 className="h-16 w-16" />}
              </div>
              <h3 className="text-3xl font-black uppercase tracking-widest">{activeTab} management</h3>
              <p className="text-muted-foreground mt-4 max-w-sm text-lg font-medium">This operational module is being synchronized with the national registry.</p>
              <Button variant="outline" className="mt-10 font-black h-14 px-10 rounded-2xl text-lg" onClick={() => setActiveTab('overview')}>Back to Dashboard</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DynamicPortal;
