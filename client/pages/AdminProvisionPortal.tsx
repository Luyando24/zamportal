import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { 
  ChevronLeft, Wand2, Globe, Server, Sparkles, 
  Search, CheckCircle, Activity, Layout, Palette,
  Shield, BarChart3, AlertCircle, ArrowRight, Zap,
  Monitor, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";



const AdminProvisionPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [provisionStep, setProvisionStep] = useState<'details' | 'branding' | 'services'>('details');

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiModel, setAiModel] = useState<string>(localStorage.getItem("admin_ai_model") || "groq");

  
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    summary: "",
    primaryColor: "#006400",
    secondaryColor: "#FFD700",
    is_website_enabled: true,
    selectedServices: [] as string[]
  });

  const [generatedNewServices, setGeneratedNewServices] = useState<any[]>([]);
  const [selectedNewServices, setSelectedNewServices] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    fetchCatalogData();
  }, [serviceSearch, formData.name, provisionStep]);


  const fetchCatalogData = async () => {
    try {
      const url = `/api/admin/services?search=${encodeURIComponent(serviceSearch)}&provider=${encodeURIComponent(formData.name)}`;
      const sRes = await authFetch(url);
      if (sRes.ok) {
        const data = await sRes.json();
        setServices(data.services || []);
      }

      
      const cRes = await authFetch("/api/categories");
      if (cRes.ok) setCategories(await cRes.json());
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  const authFetch = async (url: string, options: any = {}) => {
    const savedSession = localStorage.getItem('zamportal_session');
    let token = null;
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        token = parsed.tokens?.accessToken;
      } catch (e) {}
    }
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        "Authorization": token ? `Bearer ${token}` : ""
      }
    });
  };


  const handleAIGenerate = async () => {
    if (!formData.name) {
      toast({ 
        title: "Name Required", 
        description: "Please enter an institution name first so the AI knows what to generate.", 
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    try {
      // 1. Generate basic institution config (colors, slug, description)
      const configRes = await authFetch("/api/ai/generate-institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: formData.name, model: aiModel })
      });
      
      if (!configRes.ok) throw new Error("Institution Config Generation failed");
      const configData = await configRes.json();

      // 2. Generate comprehensive services (existing & new)
      const servicesRes = await authFetch("/api/ai/generate-comp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: formData.name, 
          description: configData.description || formData.description,
          model: aiModel 
        })
      });

      if (!servicesRes.ok) throw new Error("Comprehensive Services Generation failed");
      const servicesData = await servicesRes.json();
      
      setFormData(prev => ({
        ...prev,
        description: configData.description || prev.description,
        summary: configData.summary || prev.summary,
        slug: configData.slug || prev.slug,
        primaryColor: configData.primaryColor || prev.primaryColor,
        secondaryColor: configData.secondaryColor || prev.secondaryColor,
        selectedServices: servicesData.existingServiceIds || []
      }));

      setGeneratedNewServices(servicesData.newServiceProposals || []);
      setSelectedNewServices((servicesData.newServiceProposals || []).map((s: any) => s.id));


      toast({ 
        title: "AI Magic Applied!", 
        description: `Generated configuration and ${servicesData.newServiceProposals?.length || 0} new services for ${formData.name}.`,
      });
    } catch (err) {
      console.error("AI Generation Error:", err);
      toast({ title: "AI Error", description: "Failed to generate portal configuration.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleService = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(id)
        ? prev.selectedServices.filter(s => s !== id)
        : [...prev.selectedServices, id]
    }));
  };

  const handleCreatePortal = async () => {
    if (!formData.name || !formData.slug) return;
    
    setIsGenerating(true);
    try {
      // 1. Create Portal and Link Existing Services
      const res = await authFetch("/api/portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          summary: formData.summary,
          logo_url: "",
          theme_config: { primaryColor: formData.primaryColor, secondaryColor: formData.secondaryColor },
          is_website_enabled: formData.is_website_enabled,
          service_ids: formData.selectedServices
        })
      });
      
      if (!res.ok) throw new Error("Failed to create portal");
      const portal = await res.json();

      // 2. Provision newly generated services
      const servicesToProvision = generatedNewServices.filter(s => selectedNewServices.includes(s.id));
      
      if (servicesToProvision.length > 0) {
        toast({ title: "Portal Created", description: "Provisioning newly generated services..." });
        
        for (const serviceProposal of servicesToProvision) {
          await authFetch(`/api/admin/portals/${portal.id}/services/full`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(serviceProposal)
          });
        }
      }

      toast({ 
        title: "Deployment Successful", 
        description: `Portal for ${formData.name} is now live with ${formData.selectedServices.length + servicesToProvision.length} active services.` 
      });
      navigate("/admin/portals");
    } catch (err: any) {
      toast({ title: "Deployment Error", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/portals")} className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Provision New Portal
                <Badge variant="outline" className="ml-2 font-bold bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-widest text-[10px]">
                  Step {provisionStep === 'details' ? '1' : provisionStep === 'branding' ? '2' : '3'} of 3
                </Badge>
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {provisionStep === 'details' ? "Institutional Identity" : provisionStep === 'branding' ? "Brand Architecture" : "Service Catalog Activation"}
              </p>

            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <Zap className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">AI Provider</span>
                <Select 
                  value={aiModel} 
                  onValueChange={(val) => {
                    setAiModel(val);
                    localStorage.setItem("admin_ai_model", val);
                  }}
                >
                  <SelectTrigger className="h-6 p-0 border-none bg-transparent shadow-none focus:ring-0 text-xs font-bold w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl border-slate-200">
                    <SelectItem value="groq" className="text-xs font-bold py-2">Groq (Llama 3.1)</SelectItem>
                    <SelectItem value="gemini" className="text-xs font-bold py-2">Google Gemini 1.5</SelectItem>
                    <SelectItem value="openai" className="text-xs font-bold py-2">OpenAI GPT-4o</SelectItem>
                    <SelectItem value="claude" className="text-xs font-bold py-2">Anthropic Claude 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className={`h-2 w-8 rounded-full transition-all ${provisionStep === 'details' ? 'bg-emerald-500 w-12' : 'bg-slate-200'}`} />
              <div className={`h-2 w-8 rounded-full transition-all ${provisionStep === 'branding' ? 'bg-emerald-500 w-12' : 'bg-slate-200'}`} />
              <div className={`h-2 w-8 rounded-full transition-all ${provisionStep === 'services' ? 'bg-emerald-500 w-12' : 'bg-slate-200'}`} />
            </div>

            
            <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800 mx-2" />
            
            <Button variant="ghost" onClick={() => {
              if (provisionStep === 'branding') setProvisionStep('details');
              else if (provisionStep === 'services') setProvisionStep('branding');
              else navigate("/admin/portals");
            }} className="font-bold text-slate-400">
              {provisionStep === 'details' ? "Cancel" : "Back"}
            </Button>

            {provisionStep === 'details' ? (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 rounded-xl h-11"
                onClick={() => setProvisionStep('branding')}
                disabled={!formData.name || !formData.slug}
              >
                Next: Branding <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : provisionStep === 'branding' ? (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 rounded-xl h-11"
                onClick={() => setProvisionStep('services')}
              >
                Next: Services <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-8 rounded-xl h-11"
                onClick={handleCreatePortal}
                disabled={isGenerating}
              >
                {isGenerating ? "Deploying..." : "Finalize & Deploy"}
              </Button>
            )}

          </div>
        </div>
      </header>



      <main className="max-w-5xl mx-auto px-6 pt-12">
        <div className="mb-10">
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
            {provisionStep === 'details' ? "Institutional Identity" : provisionStep === 'branding' ? "Brand Architecture" : "Activated Services"}
          </h2>
          <p className="text-lg text-slate-500 font-medium mt-2">
            {provisionStep === 'details' 
              ? "Define the core identity and digital presence of the new institution."
              : provisionStep === 'branding'
              ? "Customize the visual appearance and UI theme of the institutional dashboard."
              : "Review and customize the services that will be available in the institutional marketplace."}
          </p>

        </div>

        {provisionStep === 'details' ? (
          <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[40px] overflow-hidden">
              <CardContent className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Institution Name</Label>
                    <div className="relative">
                      <Input 
                        placeholder="e.g. Ministry of Health" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="h-16 rounded-3xl bg-slate-50 border-slate-100 text-lg font-bold px-6 focus:ring-emerald-500"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-3 top-3 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl h-10 w-10"
                        onClick={handleAIGenerate}
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Activity className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">URL Slug</Label>
                    <div className="flex items-center">
                      <div className="h-16 px-6 flex items-center bg-slate-100 border border-r-0 rounded-l-3xl text-slate-400 font-black text-lg">/</div>
                      <Input 
                        placeholder="health" 
                        className="h-16 rounded-l-none rounded-r-3xl bg-slate-50 border-slate-100 text-lg font-bold focus:ring-emerald-500"
                        value={formData.slug}
                        onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-8 bg-emerald-50/50 rounded-[32px] border border-emerald-100/50">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-emerald-900">Enable Public Website</h4>
                    <p className="text-sm text-emerald-600 font-bold opacity-80">A dedicated landing page will be provisioned at zamportal.gov.zm/{formData.slug || 'slug'}</p>
                  </div>
                  <Switch 
                    checked={formData.is_website_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, is_website_enabled: checked})}
                    className="data-[state=checked]:bg-emerald-600 h-8 w-14"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Mission Description</Label>
                  <Textarea 
                    placeholder="Provide a professional mission statement for this institution..." 
                    className="h-40 rounded-[32px] bg-slate-50 border-slate-100 text-lg font-medium p-8 leading-relaxed focus:ring-emerald-500"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : provisionStep === 'branding' ? (
          <div className="grid gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[40px] overflow-hidden">
              <CardContent className="p-10 space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Institutional Branding</h4>
                      <p className="text-sm text-slate-500 font-medium mb-8">Select colors that represent the institution's official identity. These will be applied globally across the portal dashboard.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Primary Identity</p>
                        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                          <Input 
                            type="color" 
                            className="w-16 h-16 p-0 bg-transparent border-none cursor-pointer rounded-2xl overflow-hidden" 
                            value={formData.primaryColor}
                            onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                          />
                          <span className="font-mono text-sm font-black text-slate-600">{formData.primaryColor}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Secondary Accent</p>
                        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                          <Input 
                            type="color" 
                            className="w-16 h-16 p-0 bg-transparent border-none cursor-pointer rounded-2xl overflow-hidden" 
                            value={formData.secondaryColor}
                            onChange={e => setFormData({...formData, secondaryColor: e.target.value})}
                          />
                          <span className="font-mono text-sm font-black text-slate-600">{formData.secondaryColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800 p-10">
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-10">Live Brand Preview</h4>
                    <div className="relative">
                      <div className="absolute -inset-10 bg-white/50 dark:bg-slate-800/50 rounded-[60px] blur-3xl" />
                      <div className="relative flex gap-8">
                        <div className="w-32 h-32 rounded-[40px] shadow-2xl flex items-center justify-center text-white font-black text-5xl transform -rotate-6 transition-transform hover:rotate-0 duration-500" style={{ backgroundColor: formData.primaryColor }}>
                          {formData.name[0] || '?'}
                        </div>
                        <div className="w-32 h-32 rounded-[40px] shadow-2xl opacity-40 transform rotate-12 scale-90" style={{ backgroundColor: formData.secondaryColor }} />
                      </div>
                    </div>
                    <div className="mt-12 text-center">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Sample Brand Application</p>
                       <div className="flex gap-2">
                          <div className="h-2 w-8 rounded-full" style={{ backgroundColor: formData.primaryColor }} />
                          <div className="h-2 w-12 rounded-full" style={{ backgroundColor: formData.secondaryColor }} />
                          <div className="h-2 w-6 rounded-full" style={{ backgroundColor: formData.primaryColor, opacity: 0.3 }} />
                       </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-emerald-500" />
                      Dashboard Interactive Preview
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">Generate a live, interactive preview of the dashboard with your selected branding.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="h-14 px-8 rounded-2xl border-2 font-black text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-lg shadow-emerald-500/5"
                    onClick={() => {
                      const params = new URLSearchParams({
                        name: formData.name,
                        primary: formData.primaryColor,
                        secondary: formData.secondaryColor
                      });
                      window.open(`/admin/portals/preview?${params.toString()}`, '_blank');
                    }}
                  >
                    Launch Interactive Preview <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (

          <div className="space-y-16 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
            {/* Existing Services Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <Server className="h-6 w-6 text-blue-500" />
                    Existing Catalog Services
                  </h3>
                  <p className="text-slate-500 font-medium">Activate services already available in the national catalog.</p>
                </div>
                <div className="relative w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search national catalog..." 
                    className="pl-11 h-12 rounded-2xl bg-white border-slate-200" 
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                  />
                </div>

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => {
                  const isSelected = formData.selectedServices.includes(service.id);
                  return (
                    <Card 
                      key={service.id} 
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "group relative p-6 rounded-[32px] border-2 transition-all cursor-pointer hover:shadow-xl",
                        isSelected 
                          ? "bg-emerald-50/50 border-emerald-500 ring-4 ring-emerald-50 shadow-emerald-500/10" 
                          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-colors",
                          isSelected ? "bg-emerald-600 border-emerald-600" : "border-slate-200"
                        )}>
                          {isSelected && <CheckCircle className="h-5 w-5 text-white" />}
                        </div>
                        <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-widest">{service.category_name}</Badge>
                      </div>
                      <h4 className={cn("font-black text-lg", isSelected ? "text-emerald-900" : "text-slate-900")}>{service.title}</h4>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">{service.description}</p>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Newly Generated Services Section */}
            <section className="space-y-8 p-10 bg-slate-900 rounded-[48px] text-white">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                    Newly Recommended Services
                    <Badge className="ml-4 bg-purple-500/20 text-purple-300 border-purple-500/30 uppercase tracking-widest text-[10px] font-black">AI Proposed</Badge>
                  </h3>
                  <p className="text-slate-400 font-medium">Custom services generated by AI specifically for this institution.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {generatedNewServices.map((service, idx) => {
                  const isSelected = selectedNewServices.includes(service.id);
                  return (
                    <Card 
                      key={service.id} 
                      className={cn(
                        "rounded-[40px] overflow-hidden transition-all border-none bg-white/5 backdrop-blur-sm",
                        isSelected 
                          ? "ring-4 ring-purple-500/50 scale-[1.02] shadow-2xl shadow-purple-500/20" 
                          : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                      )}
                    >
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                              <Layout className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                              <Input 
                                value={service.title} 
                                className="font-black text-xl h-9 p-0 border-none bg-transparent text-white focus-visible:ring-0"
                                onChange={(e) => {
                                  const updated = [...generatedNewServices];
                                  updated[idx].title = e.target.value;
                                  setGeneratedNewServices(updated);
                                }}
                              />
                              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-black text-[9px] uppercase tracking-widest">
                                {service.category_slug}
                              </Badge>
                            </div>
                          </div>
                          <Switch 
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelectedNewServices(prev => 
                                checked ? [...prev, service.id] : prev.filter(id => id !== service.id)
                              );
                            }}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 pt-4 space-y-6">
                        <Textarea 
                          value={service.description}
                          className="text-base font-medium text-slate-300 border-none bg-white/5 rounded-3xl p-6 min-h-[100px] focus-visible:ring-0 leading-relaxed"
                          onChange={(e) => {
                            const updated = [...generatedNewServices];
                            updated[idx].description = e.target.value;
                            setGeneratedNewServices(updated);
                          }}
                        />
                        <div className="flex flex-wrap gap-3">
                          {service.sub_services?.map((sub: any, sIdx: number) => (
                            <Badge key={sIdx} variant="secondary" className="bg-white/10 text-white border-white/10 font-bold text-[10px] px-4 py-2 rounded-2xl">
                              {sub.form_name}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {generatedNewServices.length === 0 && (
                  <div className="col-span-2 py-24 text-center bg-white/5 rounded-[48px] border-4 border-dashed border-white/10">
                    <Sparkles className="h-16 w-16 text-white/10 mx-auto mb-6" />
                    <p className="text-white/40 font-black text-xl uppercase tracking-widest">No service proposals generated yet.</p>
                    <p className="text-white/20 font-bold mt-2">Enter a mission description and click the magic wand on Step 1.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProvisionPortal;
