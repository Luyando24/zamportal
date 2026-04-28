import { Fingerprint, Briefcase, Car, HeartPulse, GraduationCap, Users, Menu, Landmark, FileText, ArrowRight } from 'lucide-react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import { useState, useEffect } from 'react';

import Chatbot from '@/components/Landing/Chatbot';
import DemoModal from '@/components/Landing/DemoModal';

export default function Index() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [portals, setPortals] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/portals")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPortals(data);
        } else {
          console.error("Invalid portal data received:", data);
          setPortals([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch portals:", err);
        setPortals([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Chatbot />
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <header className="sticky top-0 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Zambia Coat of Arms" className="h-12 w-auto" />
            <div>
              <span className="text-2xl font-black tracking-tight leading-none">Zam<span className="text-emerald-600">Portal</span></span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">Official Government Engine</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
            <button onClick={() => setIsModalOpen(true)} className="hover:text-emerald-600 transition-all">All Services</button>
            <button onClick={() => setIsModalOpen(true)} className="hover:text-emerald-600 transition-all">Life Scenarios</button>
            <button onClick={() => setIsModalOpen(true)} className="hover:text-emerald-600 transition-all">FAQ</button>
            <button onClick={() => setIsModalOpen(true)} className="hover:text-emerald-600 transition-all">Help</button>
            <button onClick={() => setIsModalOpen(true)} className="hover:text-emerald-600 transition-all">News</button>
            
            <div className="flex items-center gap-4 border-l pl-8">
              <Button variant="ghost" onClick={() => setIsModalOpen(true)} className="font-bold">
                Register
              </Button>
              <Link to="/login">
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold px-6 shadow-lg shadow-emerald-600/20">
                  Sign In
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </nav>
          
          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button variant="default" className="rounded-full" onClick={() => setIsModalOpen(true)}>
              Login
            </Button>
            <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t">
            <nav className="flex flex-col gap-4 p-4">
              <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors py-2 text-left">All Services</button>
              <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors py-2 text-left">Life Scenarios</button>
              <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors py-2 text-left">FAQ</button>
              <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors py-2 text-left">Help</button>
              <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors py-2 text-left">News</button>
              <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors py-2 text-left">Contact us</button>
              <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
                New User
              </Button>
            </nav>
          </div>
        )}
      </header>

      <section className="relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/images/herobg.jpg')" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/70 to-green-900/10 backdrop-blur-sm"></div>
        <div className="container mx-auto relative min-h-[70vh] sm:min-h-[78vh] flex items-center justify-center px-4 z-10">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tighter">
              Seamless Access to Zambian Government Services
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-200">
              Your digital gateway to public services. Fast, simple, and available 24/7.
            </p>
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="relative">
                <input 
                  type="search" 
                  placeholder="What service are you looking for? (e.g., Passport, NRC)" 
                  className="w-full p-5 pr-16 rounded-full bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary/50 shadow-lg"
                />
                <Button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 p-0 bg-primary hover:bg-primary/90">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"></path></svg>
                </Button>
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
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Briefcase className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Business & Trade</h3>
              <p className="text-sm text-muted-foreground">Services for starting and running a business.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <HeartPulse className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Health & Wellness</h3>
              <p className="text-sm text-muted-foreground">Access to healthcare and wellness services.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Education</h3>
              <p className="text-sm text-muted-foreground">Services related to education and learning.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Transport & Driving</h3>
              <p className="text-sm text-muted-foreground">Services for drivers and vehicle owners.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Citizenship & Immigration</h3>
              <p className="text-sm text-muted-foreground">Services for citizens and immigrants.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Fingerprint className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Identity & Verification</h3>
              <p className="text-sm text-muted-foreground">Services for identity and verification.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Landmark className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lands & Housing</h3>
              <p className="text-sm text-muted-foreground">Services for property and housing.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Certificates & Records</h3>
              <p className="text-sm text-muted-foreground">Services for official documents.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>View & Apply</Button>
              </div>
            </div>
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
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">National Registration Card (NRC)</h3>
              <p className="text-muted-foreground mb-4">Apply for a new NRC, replace a lost one, or make amendments to your details.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>Apply for Service</Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Business Registration</h3>
              <p className="text-muted-foreground mb-4">Register your new company, file annual returns, and manage your business details.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>Apply for Service</Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Driver's License</h3>
              <p className="text-muted-foreground mb-4">Apply for a provisional license, book a test, or renew your existing driver's license.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>Apply for Service</Button>
            </div>
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
