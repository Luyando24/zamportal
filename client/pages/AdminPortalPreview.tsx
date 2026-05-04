import React from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Home, FileText, Briefcase, BarChart3, Users, 
  Settings, Database, Bell, Search, Menu, X, 
  ArrowRight, Plus, Activity, Clock, ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AdminPortalPreview = () => {
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "Institutional Portal";
  const primaryColor = searchParams.get("primary") || "#006400";
  const secondaryColor = searchParams.get("secondary") || "#FFD700";

  const navItems = [
    { id: "overview", label: "Operations Dashboard", icon: Home, active: true },
    { id: "applications", label: "Citizen Applications", icon: FileText },
    { id: "services", label: "Service Catalog", icon: Briefcase },
    { id: "analytics", label: "Operational Insights", icon: BarChart3 },
    { id: "staff", label: "Staff Management", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pointer-events-none">
      <div className="fixed inset-0 bg-emerald-500/5 flex items-center justify-center z-[100] pointer-events-none">
        <div className="bg-emerald-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-2xl border-4 border-white/20 backdrop-blur-xl">
          Live Interactive Preview Mode
        </div>
      </div>

      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Zambia Coat of Arms" className="h-10 w-auto" />
            <h1 className="text-xl font-bold tracking-tight">{name} <span className="text-muted-foreground font-normal ml-1 border-l pl-2">Management</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search records..." className="pl-9 w-64 bg-slate-100 dark:bg-slate-800 border-none h-10" />
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 pl-4 border-l">
            <Avatar className="h-10 w-10 border-2" style={{ borderColor: `${primaryColor}20` }}>
              <AvatarFallback style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}>PA</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 border-r bg-white dark:bg-slate-900 h-[calc(100vh-4.6rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? 'text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                  style={item.active ? { backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}40` } : {}}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              );
            })}
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 w-72">
            <div 
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}20` }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Engine Sync</p>
              <div className="flex justify-between text-[10px] mb-1">
                <span style={{ color: `${primaryColor}CC` }}>Last Heartbeat</span>
                <span className="font-bold" style={{ color: primaryColor }}>Stable</span>
              </div>
              <Progress value={100} className="h-1.5" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-10 max-w-[1600px] mx-auto">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Institutional Operations</h2>
                <p className="text-muted-foreground mt-1 text-lg font-medium">Real-time management for {name}.</p>
              </div>
              <Button 
                className="shadow-lg h-11 px-6 font-bold rounded-xl text-white"
                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 15px -3px ${primaryColor}30` }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Service
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "Total Applications", val: "1,284", icon: FileText, color: "emerald" },
                { label: "Pending Review", val: "42", icon: Clock, color: "orange" },
                { label: "Revenue", val: "ZMW 45.2k", icon: BarChart3, color: "blue" },
                { label: "System Health", val: "Stable", icon: Activity, color: "emerald" },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</CardTitle>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}><stat.icon className="h-4 w-4" /></div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stat.val}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
              <Card className="col-span-2 border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Incoming Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500">#AP-892{i}</div>
                        <div>
                          <p className="text-sm font-bold">Sample Citizen {i}</p>
                          <p className="text-[10px] text-muted-foreground">General Inquiry</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-bold text-[10px]" style={{ color: primaryColor, borderColor: `${primaryColor}20` }}>New</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:15px_15px]" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-lg">Core Engine Sync</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center gap-3 text-emerald-500 mb-6">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Link Active</span>
                  </div>
                  <Button className="w-full bg-white text-slate-900 font-black rounded-xl h-11">
                    Push Updates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPortalPreview;
