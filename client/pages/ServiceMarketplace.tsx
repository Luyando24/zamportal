import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Search, Briefcase, Plus, CheckCircle, 
  Filter, Globe, Loader2, Zap, Building2, X
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ServiceMarketplace = () => {
  const { portalSlug } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  
  const [portal, setPortal] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [portalSlug]);

  const fetchData = async () => {
    try {
      const portalRes = await fetch(`/api/portals/${portalSlug}`);
      const portalData = await portalRes.json();
      
      // Security check: Institutional admins can only access marketplace for their own portal
      const { session, isSuperAdmin } = useAuth();
      const userPortalId = session?.user?.app_metadata?.portal_id;
      if (!isSuperAdmin && userPortalId && userPortalId !== portalData.id) {
        toast.error("Unauthorized: You do not have management rights for this portal");
        navigate("/my-portal");
        return;
      }
      
      setPortal(portalData);

      const servicesRes = await fetch(`/api/portals/${portalData.id}/available-services`);
      const servicesData = await servicesRes.json();
      if (Array.isArray(servicesData)) setAvailableServices(servicesData);
    } catch (error) {
      console.error("Marketplace fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const activateService = async (serviceId: string) => {
    setActivatingId(serviceId);
    try {
      const res = await fetch(`/api/portals/${portal.id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId })
      });
      if (res.ok) {
        // Refresh available services
        const servicesRes = await fetch(`/api/portals/${portal.id}/available-services`);
        const servicesData = await servicesRes.json();
        if (Array.isArray(servicesData)) setAvailableServices(servicesData);
      }
    } catch (error) {
      console.error("Activation error:", error);
    } finally {
      setActivatingId(null);
    }
  };

  const filteredServices = availableServices.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
        <p className="font-black uppercase tracking-widest text-xs text-slate-400">Loading Marketplace Catalog...</p>
      </div>
    );
  }

  const primaryColor = portal?.theme_config?.primaryColor || "#006400";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/dashboard/${portalSlug}`)}
            className="rounded-xl font-bold hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit Marketplace
          </Button>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Zap className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-black tracking-tight">National <span className="text-emerald-600">Service Marketplace</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Avatar className="h-10 w-10 border-2 border-emerald-500/10">
            <AvatarFallback className="font-bold">IA</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
        {/* Banner */}
        <div className="relative rounded-[48px] bg-slate-900 text-white p-10 lg:p-16 overflow-hidden mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Globe className="h-64 w-64 rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1 mb-6">
              Global Catalog Access
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Empower your portal with <span className="text-emerald-500">National Services.</span>
            </h2>
            <p className="text-slate-400 text-lg lg:text-xl font-medium mb-10 leading-relaxed">
              Instantly activate government-standardized services for the <span className="text-white underline decoration-emerald-500 decoration-2 underline-offset-4">{portal?.name}</span>. No development required.
            </p>
            
            <div className="relative group max-w-xl">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500 transition-colors group-hover:text-emerald-500" />
              <Input 
                placeholder="Search global services by title, category, or description..." 
                className="pl-14 h-16 bg-white/10 border-white/10 rounded-2xl text-lg font-medium backdrop-blur-md focus:bg-white focus:text-slate-900 transition-all placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8 px-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-black uppercase tracking-widest text-slate-400">
              Showing {filteredServices.length} available services
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="font-bold text-xs">Recently Added</Button>
            <Button variant="ghost" size="sm" className="font-bold text-xs text-slate-400">Most Popular</Button>
          </div>
        </div>

        {/* Marketplace Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <Card key={service.id} className="group border-none shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden rounded-[32px]">
              <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 transition-colors group-hover:bg-emerald-500" />
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                    {service.category_name}
                  </Badge>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-black leading-tight mb-3 transition-colors group-hover:text-emerald-600">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-base font-medium text-slate-500 leading-relaxed line-clamp-3 min-h-[72px]">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Level</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Real-time</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                    <span className="text-xs font-bold text-emerald-600">Verified</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 font-black rounded-2xl text-lg group-active:scale-95 transition-all"
                  onClick={() => activateService(service.id)}
                  disabled={activatingId === service.id}
                >
                  {activatingId === service.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Activate Service <Plus className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}

          {filteredServices.length === 0 && !loading && (
            <div className="col-span-full py-40 text-center">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-3xl font-black mb-2">No matches found</h3>
              <p className="text-slate-400 max-w-md mx-auto font-medium">We couldn't find any global services matching "{searchQuery}". Try refining your keywords.</p>
              <Button variant="link" className="mt-4 font-black text-emerald-600" onClick={() => setSearchQuery("")}>
                Clear Search Results
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t p-4 px-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Managing: <span className="text-slate-900 dark:text-white">{portal?.name}</span></span>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-xs font-bold text-slate-400">ZamPortal Unified Service Fabric v1.0</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Engine Stable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceMarketplace;
