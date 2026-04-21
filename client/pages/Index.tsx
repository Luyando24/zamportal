import { Fingerprint, Briefcase, Car, HeartPulse, GraduationCap, Users, Menu, Landmark, FileText } from 'lucide-react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import { useState } from 'react';

import Chatbot from '@/components/Landing/Chatbot';
import DemoModal from '@/components/Landing/DemoModal';

export default function Index() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0">
      <Chatbot />
      <DemoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <header className="sticky top-0 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 z-50 shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="ZamPortal Logo" className="h-10 w-auto" />
            <div>
              <span className="text-2xl font-bold">ZamPortal</span>
              <p className="text-xs text-muted-foreground">Government services at your fingertips</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-base font-medium">
            <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">All Services</button>
            <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">Life Scenarios</button>
            <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">FAQ</button>
            <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">Help</button>
            <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">News</button>
            <button onClick={() => setIsModalOpen(true)} className="text-muted-foreground hover:text-primary transition-colors">Contact us</button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIsModalOpen(true)}>
                Register
              </Button>
              <Button variant="default" className="rounded-full" onClick={() => setIsModalOpen(true)}>
                Login
              </Button>
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
            {/* Category 1 */}
              <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <Briefcase className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Business & Trade</h3>
                <p className="text-sm text-muted-foreground">Services for starting and running a business.</p>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button onClick={() => setIsModalOpen(true)}>
                    View & Apply
                  </Button>
                </div>
              </div>
            {/* Category 2 */}
              <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <HeartPulse className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Health & Wellness</h3>
                <p className="text-sm text-muted-foreground">Access to healthcare and wellness services.</p>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button onClick={() => setIsModalOpen(true)}>
                    View & Apply
                  </Button>
                </div>
              </div>
            {/* Category 3 */}
              <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Education</h3>
                <p className="text-sm text-muted-foreground">Services related to education and learning.</p>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button onClick={() => setIsModalOpen(true)}>
                  View & Apply
                </Button>
                </div>
              </div>
            {/* Category 4 */}
              <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <Car className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Transport & Driving</h3>
                <p className="text-sm text-muted-foreground">Services for drivers and vehicle owners.</p>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button onClick={() => setIsModalOpen(true)}>
                  View & Apply
                </Button>
                </div>
              </div>
            {/* Category 5 */}
              <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Citizenship & Immigration</h3>
                <p className="text-sm text-muted-foreground">Services for citizens and immigrants.</p>
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button onClick={() => setIsModalOpen(true)}>
                  View & Apply
                </Button>
                </div>
              </div>
            {/* Category 6 */}
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Fingerprint className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Identity & Verification</h3>
              <p className="text-sm text-muted-foreground">Services for identity and verification.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>
                  View & Apply
                </Button>
              </div>
            </div>
             {/* Category 7 */}
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <Landmark className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lands & Housing</h3>
              <p className="text-sm text-muted-foreground">Services for property and housing.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>
                  View & Apply
                </Button>
              </div>
            </div>
             {/* Category 8 */}
            <div className="group relative text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow overflow-hidden">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Certificates & Records</h3>
              <p className="text-sm text-muted-foreground">Services for official documents.</p>
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button onClick={() => setIsModalOpen(true)}>
                  View & Apply
                </Button>
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
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Apply for Service
              </Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Business Registration</h3>
              <p className="text-muted-foreground mb-4">Register your new company, file annual returns, and manage your business details.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Apply for Service
              </Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Driver's License</h3>
              <p className="text-muted-foreground mb-4">Apply for a provisional license, book a test, or renew your existing driver's license.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Apply for Service
              </Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Health Services</h3>
              <p className="text-muted-foreground mb-4">Access your health records, book appointments at public clinics, and view test results.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Apply for Service
              </Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Education Services</h3>
              <p className="text-muted-foreground mb-4">Verify academic qualifications, apply for student loans, and access e-learning resources.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Apply for Service
              </Button>
            </div>
            <div className="bg-background rounded-lg p-6 text-center transition-all duration-300 shadow-xl -translate-y-2 border border-primary/30">
              <h3 className="text-xl font-semibold mb-2">Community Services</h3>
              <p className="text-muted-foreground mb-4">Report local issues, apply for social benefits, and find information on community projects.</p>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                Apply for Service
              </Button>
            </div>
          </div>
        </div>
      </section>



        {/* News & Updates Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold tracking-tight">News & Updates</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-2">Stay informed with the latest news and announcements from the government.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* News 1 */}
              <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                <img src="/images/citizens.jpg" alt="" className="w-full h-48 object-cover" />
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">June 1, 2024</p>
                  <h3 className="text-lg font-semibold mb-2">New Digital Services Launched</h3>
                  <p className="text-sm text-muted-foreground mb-4">The government has launched new digital services to improve citizen access to information.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-primary font-semibold hover:underline">Read More</button>
                </div>
              </div>
              {/* News 2 */}
              <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                <img src="/images/business.jpg" alt="" className="w-full h-48 object-cover" />
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">May 25, 2024</p>
                  <h3 className="text-lg font-semibold mb-2">Public Health Campaign</h3>
                  <p className="text-sm text-muted-foreground mb-4">A new public health campaign has been launched to promote wellness and disease prevention.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-primary font-semibold hover:underline">Read More</button>
                </div>
              </div>
              {/* News 3 */}
              <div className="bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow">
                <img src="/images/civil.jpg" alt="" className="w-full h-48 object-cover" />
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">May 15, 2024</p>
                  <h3 className="text-lg font-semibold mb-2">Infrastructure Development Update</h3>
                  <p className="text-sm text-muted-foreground mb-4">An update on the progress of major infrastructure projects across the country.</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-primary font-semibold hover:underline">Read More</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Contact Support</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions or need help? Our support team is here for you.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div className="space-y-8">
              <h3 className="text-2xl font-semibold">Support Channels</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Email</div>
                    <div className="text-muted-foreground">support@zamportal.gov.zm</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Phone</div>
                    <div className="text-muted-foreground">+260 211 123456</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-lg">Address</div>
                    <div className="text-muted-foreground">
                      Government Complex, Independence Avenue<br />
                      Lusaka, Zambia
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-muted/30 rounded-lg p-8">
              <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="john.doe@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Help with NRC Application"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea 
                    rows={5}
                    className="w-full px-4 py-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Please describe your issue in detail..."
                  />
                </div>
                
                <Button type="submit" className="w-full py-3 text-base">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold mb-4">About ZamPortal</h3>
              <p className="text-muted-foreground text-sm">
                Your one-stop platform for accessing government services online. We are committed to providing efficient and transparent services to all citizens.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Home</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Services</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">FAQs</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></a>
                <a href="#" className="text-muted-foreground hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 2.8 3.2 3 5.2-1.4 1.2-3 2-5 2h-1.5c-1.2 0-2.3-.4-3.2-1.2.9-1.6 1.7-3.2 2.2-4.8-1.6-1.4-3-2.8-4-4 .7-1.3 1.5-2.5 2.5-3.5C13.4 5.1 15 6.5 17 8c-1.2-1.8-2-3.8-2-6h2c.5 2.2 1.5 4.2 3 6Z"></path><path d="M2 22s.7-2.1 2-3.4c-1.6-1.4-2.8-3.2-3-5.2 1.4-1.2 3-2 5-2h1.5c1.2 0 2.3.4 3.2-1.2-.9 1.6-1.7 3.2-2.2 4.8 1.6 1.4 3 2.8 4 4-.7 1.3-1.5 2.5-2.5 3.5C8.6 18.9 7 17.5 5 16c1.2 1.8 2 3.8 2 6H5c-.5-2.2-1.5-4.2-3-6Z"></path></svg></a>
                <a href="#" className="text-muted-foreground hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
            &copy; 2024 ZamPortal. All rights reserved.
          </div>
        </div>
      </footer>
      <MobileBottomNav 
        onMenuClick={() => {
          const element = document.getElementById('services');
          if (element) element.scrollIntoView({ behavior: 'smooth' });
        }}
        onLoginClick={() => setIsModalOpen(true)}
      />
    </div>
  );
}
