import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ExternalLink, Shield, Info, ArrowRight, 
  Menu, X, Search, Bell, Home, Briefcase, Activity, Clock,
  ChevronRight, Plus, FileText, CheckCircle, HelpCircle,
  Globe, Mail, Phone, MapPin, Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface PortalData {
  name: string;
  slug: string;
  description: string;
  summary: string;
  is_website_enabled: boolean;
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

const PortalPublic = () => {
  const { portalSlug } = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { session, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRoleError, setShowRoleError] = useState(false);

  useEffect(() => {
    const fetchPortal = async () => {
      try {
        const response = await fetch(`/api/portals/${portalSlug}`);
        if (response.status === 429) {
          throw new Error("System is currently busy. Please refresh in a few seconds.");
        }
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
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

  if (error || !data || !data.is_website_enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-slate-50 dark:bg-slate-950">
        <div className="p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md border-2 border-red-500/10">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
            <Globe className="h-10 w-10 opacity-20 absolute" />
            <X className="h-10 w-10 relative" />
          </div>
          <h2 className="text-3xl font-black mb-4">Website Offline</h2>
          <p className="text-muted-foreground mb-8">
            The public website for <span className="font-bold text-slate-900 dark:text-white">{data?.name || `/${portalSlug}`}</span> is currently deactivated by the administrator.
          </p>
          <Link to="/">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full rounded-2xl h-14 font-black shadow-xl"><ArrowLeft className="mr-2 h-5 w-5" /> Back to ZamPortal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = data.theme_config?.primaryColor || "#006400";
  const secondaryColor = data.theme_config?.secondaryColor || "#FFD700";

  const filteredServices = data.services.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApply = (serviceSlug: string) => {
    if (!session) {
      // Redirect to login, but tell it where to come back
      navigate("/login", { state: { from: location } });
      return;
    }

    if (isAdmin) {
      // User is an admin, they shouldn't apply for services
      setShowRoleError(true);
      return;
    }

    // Is citizen, proceed to apply
    navigate(`/${portalSlug}/apply/${serviceSlug}`);
  };

  const handleSwitchAccount = async () => {
    await signOut();
    navigate("/login", { state: { from: location } });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/logo.png" alt="Zambia Coat of Arms" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight">{data.name}</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Official Government Website</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#services" className="text-sm font-bold hover:text-emerald-600 transition-colors uppercase tracking-widest">Digital Services</a>
            <a href="#about" className="text-sm font-bold hover:text-emerald-600 transition-colors uppercase tracking-widest">About Us</a>
            <a href="#contact" className="text-sm font-bold hover:text-emerald-600 transition-colors uppercase tracking-widest">Contact</a>
            <Link to="/" className="text-sm font-bold text-emerald-600 hover:underline uppercase tracking-widest ml-4">Core Portal</Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {session ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Active Session</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">{session.role === 'admin' ? 'Administrator' : 'Citizen'}</p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-emerald-500/20">
                  <AvatarFallback className="font-bold">U</AvatarFallback>
                </Avatar>
              </div>
            ) : (
              <Link to="/login" state={{ from: location }}>
                <Button className="rounded-xl font-black px-6 shadow-lg" style={{ backgroundColor: primaryColor }}>
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-slate-900 border-b">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
          <Globe className="w-full h-full text-slate-900 dark:text-white" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-6 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest border-none shadow-sm" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
              Republic of Zambia
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-8 leading-tight uppercase italic">
              Transforming {data.name} <br/>
              <span style={{ color: primaryColor }}>Through Digital Excellence.</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
              {data.summary || data.description || `Welcome to the official web portal for ${data.name}. We are dedicated to providing efficient, transparent, and accessible digital services to every citizen across the nation.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-all" style={{ backgroundColor: primaryColor }}>
                Explore Services <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl font-black text-lg border-2">
                Download Charter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-xl">
              <h3 className="text-4xl font-black tracking-tight mb-4">Digital Service Catalog</h3>
              <p className="text-muted-foreground font-medium text-lg">Browse and apply for institutional services directly from your device.</p>
            </div>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search for a service..." 
                className="pl-12 h-14 bg-white dark:bg-slate-900 border-none shadow-xl rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <Card key={service.id} className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
                <div className="h-2 w-full bg-slate-100 group-hover:bg-emerald-500 transition-colors" style={{ backgroundColor: `${primaryColor}20` }} />
                <CardHeader className="p-8">
                  <Badge variant="outline" className="w-fit mb-4 border-emerald-500/20 text-emerald-600 font-bold text-[10px] uppercase tracking-widest px-3 py-1">{service.category_name}</Badge>
                  <CardTitle className="text-2xl group-hover:text-emerald-600 transition-colors leading-tight mb-4">{service.title}</CardTitle>
                  <CardDescription className="line-clamp-3 font-medium text-base text-slate-500 dark:text-slate-400 leading-relaxed">{service.description}</CardDescription>
                </CardHeader>
                <CardFooter className="p-8 pt-0">
                  <Button 
                    className="w-full justify-between font-black h-14 rounded-2xl shadow-lg hover:shadow-xl transition-all" 
                    variant="ghost" 
                    style={{ color: primaryColor, backgroundColor: `${primaryColor}08` }}
                    onClick={() => handleApply(service.slug)}
                  >
                    Apply Now <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-dashed">
                <p className="text-xl font-bold text-slate-400 italic">No services match your search in this catalog.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/10 rounded-3xl blur-2xl" />
              <div className="relative aspect-video rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-8 border-white dark:border-slate-900 shadow-2xl">
                <img src="/images/herobg.jpg" alt="About Institution" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="h-32 w-32 text-slate-300 dark:text-slate-700" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-black tracking-tight mb-8">Our Commitment to Excellence</h3>
              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Efficiency Driven</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Reducing processing times through end-to-end digital workflows.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Secure & Transparent</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Your data is protected by the national security standards of ZamPortal.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 rounded-xl bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Citizen Focused</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Built to serve every Zambian, regardless of location or device.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 text-white py-20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_emerald]" />
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-4 mb-8">
                <img src="/images/logo.png" alt="Zambia Logo" className="h-10 w-auto brightness-0 invert" />
                <h4 className="text-xl font-black tracking-tight">{data.name}</h4>
              </div>
              <p className="text-slate-400 font-medium leading-relaxed mb-8">
                The official digital gateway for {data.name} services, powered by the national ZamPortal engine.
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors cursor-pointer"><Mail className="h-5 w-5" /></div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-emerald-500 transition-colors cursor-pointer"><Phone className="h-5 w-5" /></div>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold uppercase tracking-widest text-slate-500 text-xs mb-8">Navigation</h5>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors font-medium">Home</a></li>
                <li><a href="#services" className="text-slate-300 hover:text-white transition-colors font-medium">Services</a></li>
                <li><a href="#about" className="text-slate-300 hover:text-white transition-colors font-medium">About Agency</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors font-medium">Media Center</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-widest text-slate-500 text-xs mb-8">Quick Links</h5>
              <ul className="space-y-4">
                <li><Link to="/" className="text-slate-300 hover:text-white transition-colors font-medium">Core ZamPortal</Link></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors font-medium">Government Directory</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors font-medium">Terms of Use</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white transition-colors font-medium">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-widest text-slate-500 text-xs mb-8">Official Contact</h5>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <MapPin className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-300 font-medium text-sm">Government Complex, Independence Ave, Lusaka, Zambia</p>
                </div>
                <div className="flex gap-4">
                  <Phone className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-300 font-medium text-sm">+260 211 123456</p>
                </div>
                <div className="flex gap-4">
                  <Mail className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-slate-300 font-medium text-sm">contact@gov.zm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm font-medium">
              &copy; {new Date().getFullYear()} Government of the Republic of Zambia. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Built by</span>
              <span className="text-emerald-500 font-black tracking-tighter text-lg">ZamPortal Engine</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Role Error Dialog */}
      <Dialog open={showRoleError} onOpenChange={setShowRoleError}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="h-2 w-full bg-amber-500" />
          <div className="p-10 text-center">
            <div className="w-20 h-20 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-6">
              <Shield className="h-10 w-10" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tight mb-2">Switch Account Required</DialogTitle>
              <DialogDescription className="text-lg font-medium">
                You are currently logged in as an <span className="text-amber-600 font-bold">Administrator</span>. 
                Service applications are only available to <span className="text-emerald-600 font-bold">Citizen</span> accounts.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 space-y-3">
              <Button 
                onClick={handleSwitchAccount}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20"
              >
                Logout & Login as Citizen
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowRoleError(false)}
                className="w-full h-14 font-black rounded-2xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortalPublic;
