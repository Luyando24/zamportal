import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, Briefcase, Car, HeartPulse, GraduationCap, Users, Menu, 
  Landmark, FileText, ArrowRight, X, Bot, RefreshCw, Sparkles, Search, Send,
  Truck, Hospital, School, Wallet, Globe, Shield, Activity, Bell, FileSearch 
} from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

import Chatbot from '@/components/Landing/Chatbot';
import { cn } from "@/lib/utils";

export default function Index() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [portals, setPortals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"normal" | "ai">("ai");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portalsRes, categoriesRes, popularRes] = await Promise.all([
          fetch("/api/portals"),
          fetch("/api/categories"),
          fetch("/api/services/popular")
        ]);

        const portalsData = await portalsRes.json();
        const categoriesData = await categoriesRes.json();
        const popularData = await popularRes.json();

        if (Array.isArray(portalsData)) setPortals(portalsData);
        if (Array.isArray(categoriesData)) setCategories(categoriesData);
        if (Array.isArray(popularData)) setPopularServices(popularData);
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'briefcase': Briefcase,
      'heart-pulse': HeartPulse,
      'graduation-cap': GraduationCap,
      'car': Car,
      'users': Users,
      'fingerprint': Fingerprint,
      'landmark': Landmark,
      'file-text': FileText,
      'truck': Truck,
      'hospital': Hospital,
      'school': School,
      'wallet': Wallet,
      'globe': Globe,
      'shield': Shield,
      'activity': Activity,
      'bell': Bell,
      'file-search': FileSearch
    };
    return icons[iconName?.toLowerCase()] || FileSearch;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Chatbot />
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <img src="/images/logo.png" alt="Zambia Coat of Arms" className="h-12 w-auto transition-transform group-hover:scale-110 duration-500" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight leading-none uppercase italic">Zam<span className="text-emerald-600">Portal</span></h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">Republic of Zambia</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <Link to="/services" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 transition-all">Digital Services</Link>
            <Link to="/services" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 transition-all">Life Scenarios</Link>
            <Link to="/services" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-emerald-600 transition-all">News & Updates</Link>
            
            <div className="flex items-center gap-4 ml-6 pl-10 border-l border-slate-100 dark:border-slate-800">
              <ThemeToggle />
              <Link to="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-black px-8 rounded-2xl h-12 shadow-xl shadow-emerald-600/20 text-sm uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                  Sign In
                </Button>
              </Link>
            </div>
          </nav>
          
          {/* Mobile Navigation Toggle */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Dropdown */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b shadow-2xl animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col p-6 space-y-4">
              <Link to="/services" className="text-sm font-black uppercase tracking-widest py-4 border-b border-slate-50 dark:border-slate-800 text-left">Digital Services</Link>
              <Link to="/services" className="text-sm font-black uppercase tracking-widest py-4 border-b border-slate-50 dark:border-slate-800 text-left">Life Scenarios</Link>
              <Link to="/services" className="text-sm font-black uppercase tracking-widest py-4 border-b border-slate-50 dark:border-slate-800 text-left">News</Link>
              <Link to="/login" className="pt-4">
                <Button className="w-full bg-emerald-600 h-14 font-black rounded-2xl text-lg shadow-xl shadow-emerald-600/20">
                  Secure Sign In
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <section className="relative bg-cover bg-center bg-no-repeat overflow-hidden" style={{ backgroundImage: "url('/images/herobg.jpg')" }}>
        {/* Advanced Blending Stack for Maximum Focus */}
        <div className="absolute inset-0 bg-[#050A0F]/85 backdrop-blur-[3px] z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#050A0F]/60 via-transparent to-[#050A0F] z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050A0F_100%)] opacity-80 z-0"></div>
        <div className="absolute inset-0 bg-emerald-950/10 mix-blend-overlay z-0"></div>

        <div className="relative pt-12 pb-20 sm:pt-32 sm:pb-48 flex items-center justify-center px-4 sm:px-12 z-10 w-full">
          <div className="text-center text-white w-full max-w-screen-xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tighter drop-shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
              Digital Access <br className="sm:hidden" /> to Services
            </h1>
            <p className="mt-4 sm:mt-8 text-sm sm:text-2xl text-white/60 sm:text-white/80 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
              The official gateway to Zambian public services. <span className="hidden sm:inline">Fast, simple, and available 24/7.</span>
            </p>

            <div className="mt-8 sm:mt-14 w-full max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <button 
                  onClick={() => setSearchMode("ai")}
                  className={cn(
                    "px-6 py-2 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 border border-white/10",
                    searchMode === "ai" 
                      ? "bg-emerald-600 text-white shadow-2xl scale-105" 
                      : "bg-white/5 text-white/40 hover:bg-white/10 backdrop-blur-md"
                  )}
                >
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> AI Assistant
                </button>
                <button 
                  onClick={() => setSearchMode("normal")}
                  className={cn(
                    "px-6 py-2 sm:px-8 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 border border-white/10",
                    searchMode === "normal" 
                      ? "bg-white text-emerald-950 shadow-2xl scale-105" 
                      : "bg-white/5 text-white/40 hover:bg-white/10 backdrop-blur-md"
                  )}
                >
                  Search
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!searchQuery.trim()) return;
                  if (searchMode === "ai") {
                    navigate(`/assistant?q=${encodeURIComponent(searchQuery)}`);
                  } else {
                    navigate(`/services?q=${encodeURIComponent(searchQuery)}`);
                  }
                }} 
                className="relative group"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-[2.5rem] blur-xl opacity-50"></div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchMode === "ai" ? "Ask anything..." : "Search services..."} 
                    className="w-full p-6 sm:p-8 pr-16 sm:pr-20 rounded-2xl sm:rounded-[2.5rem] bg-white/10 backdrop-blur-3xl border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 shadow-2xl transition-all h-16 sm:h-24 text-base sm:text-xl font-medium"
                  />
                  <Button 
                    type="submit" 
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 rounded-xl sm:rounded-2xl h-12 w-12 sm:h-14 sm:w-14 p-0 bg-emerald-600 hover:bg-emerald-500 transition-all shadow-xl"
                  >
                    <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </div>
              </form>

              <div className="hidden sm:flex mt-8 flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                {[
                  { label: "Business", query: "I want to register a new company", icon: Briefcase },
                  { label: "Students", query: "I need information about bursaries and education", icon: School },
                  { label: "Health", query: "Find me health services and clinic registries", icon: Hospital },
                  { label: "Travel", query: "I need to apply for or renew my passport", icon: Globe },
                  { label: "Identity", query: "I lost my NRC and need a replacement", icon: Fingerprint }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      if (searchMode === "ai") {
                        navigate(`/assistant?q=${encodeURIComponent(chip.query)}`);
                      } else {
                        navigate(`/services?q=${encodeURIComponent(chip.query)}`);
                      }
                    }}
                    className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-emerald-500/50 text-white/80 hover:text-white backdrop-blur-md transition-all text-[11px] font-black uppercase tracking-[0.15em] shadow-lg group"
                  >
                    <chip.icon className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
            <div className="p-4 rounded-lg transition-all duration-300">
              <h3 className="text-4xl font-bold text-primary">40</h3>
              <p className="text-muted-foreground mt-2">Service Providers</p>
            </div>
            <div className="p-4 rounded-lg transition-all duration-300">
              <h3 className="text-4xl font-bold text-primary">368</h3>
              <p className="text-muted-foreground mt-2">Services</p>
            </div>
            <div className="p-4 rounded-lg transition-all duration-300">
              <h3 className="text-4xl font-bold text-primary">6M+</h3>
              <p className="text-muted-foreground mt-2">Cases</p>
            </div>
            <div className="p-4 rounded-lg transition-all duration-300">
              <h3 className="text-4xl font-bold text-primary">3M+</h3>
              <p className="text-muted-foreground mt-2">Bills</p>
            </div>
            <div className="p-4 rounded-lg transition-all duration-300">
              <h3 className="text-4xl font-bold text-primary">986K+</h3>
              <p className="text-muted-foreground mt-2">Customers</p>
            </div>
            <div className="p-4 rounded-lg transition-all duration-300">
              <h3 className="text-4xl font-bold text-primary">6.4B+</h3>
              <p className="text-muted-foreground mt-2">ZMW Revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight">Service Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-2">Explore a wide range of government services organized by category.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"></div>
              ))
            ) : categories.map((category) => {
              const Icon = getIcon(category.icon);
              return (
                <div key={category.id} className="group relative text-center p-8 rounded-3xl border bg-white dark:bg-slate-900 hover:shadow-2xl transition-all duration-500 overflow-hidden border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-50 dark:bg-slate-800 text-emerald-600 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-black mb-2 uppercase tracking-tight italic">{category.title}</h3>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed line-clamp-2">{category.description}</p>
                  <div className="absolute inset-0 bg-emerald-600/90 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 p-6">
                    <p className="text-white text-xs font-black uppercase tracking-[0.2em] mb-4 text-center">Enter {category.title} Registry</p>
                    <Link to="/services" className="w-full">
                      <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl font-black h-12 shadow-xl">
                        Open Catalog
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Popular Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Quickly access essential government services online. From identity documents to business permits, we have you covered.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularServices.map((service) => (
              <div key={service.id} className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-left transition-all duration-500 shadow-sm hover:shadow-2xl border border-slate-100 dark:border-slate-800 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  {getIcon(service.icon) && React.createElement(getIcon(service.icon), { className: "h-20 w-20" })}
                </div>
                <Badge className="mb-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-none px-3 py-1 font-bold text-[10px] uppercase tracking-widest">
                  {service.category_name}
                </Badge>
                <h3 className="text-xl font-black mb-3 italic tracking-tight">{service.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-bold text-[11px] uppercase tracking-widest leading-relaxed line-clamp-2">{service.description}</p>
                <Link to={service.portal_slug ? `/${service.portal_slug}/apply/${service.slug}` : "/services"}>
                  <Button variant="ghost" className="w-full justify-between h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all">
                    Launch Application <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Portals Section */}
      <section className="py-20 bg-emerald-950 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.png')] bg-repeat"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-2xl text-left">
              <Badge className="mb-4 bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                One Zambia, One Digital Portal
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Institutional Portals</h2>
              <p className="text-emerald-100/70 mt-4 text-lg">
                Access dedicated systems for government ministries and agencies, all connected to the unified ZamPortal engine.
              </p>
            </div>
            <Link to="/admin">
              <Button className="bg-white text-emerald-950 hover:bg-emerald-100 font-bold px-8 py-6 rounded-xl shadow-xl">
                Manage Systems
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {portals.map((portal) => (
              <Link 
                key={portal.id} 
                to={`/${portal.slug}`}
                className="group bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-all duration-500 relative overflow-hidden"
              >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-40"
                  style={{ backgroundColor: portal.theme_config?.primaryColor || '#10b981' }}
                />
                <div className="relative z-10">
                  <div 
                    className="w-12 h-12 rounded-xl mb-6 flex items-center justify-center font-bold text-2xl shadow-lg border border-white/20"
                    style={{ backgroundColor: portal.theme_config?.primaryColor || '#10b981' }}
                  >
                    {portal.name[0]}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-400 transition-colors">
                    {portal.name}
                  </h3>
                  <p className="text-emerald-100/50 text-sm line-clamp-3 mb-6">
                    {portal.description || `Official digital gateway for ${portal.name}. Access all institutional services securely.`}
                  </p>
                  <div className="flex items-center text-xs font-bold tracking-widest uppercase text-emerald-400">
                    Enter Portal <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* News & Updates Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight">News & Updates</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-2">Stay informed with the latest news and announcements from the government.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
              <img src="/images/citizens.jpg" alt="" className="w-full h-48 object-cover" />
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-2">June 1, 2024</p>
                <h3 className="text-lg font-semibold mb-2 text-left">New Digital Services Launched</h3>
                <p className="text-sm text-muted-foreground mb-4 text-left">The government has launched new digital services to improve citizen access to information.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-primary font-semibold hover:underline block">Read More</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Contact Support</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Have questions or need help? Our support team is here for you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="space-y-8 text-left">
              <h3 className="text-2xl font-semibold">Support Channels</h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="text-primary h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Email</div>
                  <div className="text-muted-foreground">support@zamportal.gov.zm</div>
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
              <form className="space-y-4">
                <Button type="submit" className="w-full py-3 text-base">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-muted/30 border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">&copy; 2024 ZamPortal. All rights reserved.</p>
        </div>
      </footer>
      <MobileBottomNav onLoginClick={() => setIsModalOpen(true)} />
    </div>
  );
}
