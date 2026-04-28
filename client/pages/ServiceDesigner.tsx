import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Plus, Save, Bot, Wand2, Layers, Briefcase, Lightbulb, ArrowRight, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/navigation/ThemeToggle";

type AiModel = "openai" | "gemini" | "claude" | "groq";

const MODEL_CONFIG: Record<AiModel, { label: string; color: string; activeClass: string }> = {
  openai:  { label: "OpenAI",  color: "#10a37f", activeClass: "bg-[#10a37f] text-white border-[#10a37f]" },
  gemini:  { label: "Gemini",  color: "#4285F4", activeClass: "bg-[#4285F4] text-white border-[#4285F4]" },
  claude:  { label: "Claude",  color: "#D97706", activeClass: "bg-amber-500 text-white border-amber-500" },
  groq:    { label: "Groq",    color: "#F55036", activeClass: "bg-[#F55036] text-white border-[#F55036]" },
};

export default function ServiceDesigner() {
  const { portalSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isSuperAdmin } = useAuth();
  
  const isAdminMode = location.pathname.startsWith("/admin") || !portalSlug;
  const [portal, setPortal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingServicesContext, setExistingServicesContext] = useState("");

  const [title, setTitle] = useState("New Service");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("business");
  const [subServices, setSubServices] = useState<any[]>([]);
  const [suggestedServices, setSuggestedServices] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // AI Agent state
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        if (isAdminMode) {
          setPortal({ name: "National Service Catalog", id: "admin" });
          // Fetch ALL existing services for context to avoid duplicates
          const res = await fetch("/api/admin/services?limit=1000");
          const data = await res.json();
          if (res.ok && data.services) {
            const serviceList = data.services.map((s: any) => s.title).join(", ");
            setExistingServicesContext(serviceList);
          }
        } else {
          const portalRes = await fetch(`/api/portals/${portalSlug}`);
          const portalData = await portalRes.json();
          
          const userPortalId = (session as any)?.user?.app_metadata?.portal_id;
          if (!isSuperAdmin && userPortalId && userPortalId !== portalData.id) {
            toast.error("Unauthorized");
            navigate("/my-portal");
            return;
          }
          setPortal(portalData);
        }
      } catch (error) {
        toast.error("Failed to load context");
      } finally {
        setLoading(false);
      }
    };
    initData();
    
    fetch("/api/ai/config").then(res => res.json()).then(data => {
      const models: AiModel[] = data.availableModels || [];
      setAvailableModels(models);
      if (models.includes("groq")) setSelectedModel("groq");
      else if (models.length > 0) setSelectedModel(models[0]);
    }).catch(() => {});
  }, [portalSlug]);

  const fetchAiSuggestions = async () => {
    if (!portal || !selectedModel || isSuggesting) return;
    
    setIsSuggesting(true);
    try {
      const token = session?.tokens?.accessToken;
      const res = await fetch("/api/ai/suggest-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          portalName: isAdminMode ? "Government of Zambia National Catalog" : (portal.name || portal.title || portalSlug), 
          existingServices: existingServicesContext,
          model: selectedModel 
        })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSuggestedServices(data);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions", e);
    } finally {
      setIsSuggesting(false);
    }
  };

  useEffect(() => {
    if (portal && selectedModel && subServices.length === 0 && suggestedServices.length === 0 && !isSuggesting) {
      fetchAiSuggestions();
    }
  }, [portal, selectedModel, subServices.length, suggestedServices.length, existingServicesContext, isAdminMode]);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    if (!selectedModel) {
      toast.error("AI service is currently unavailable");
      return;
    }

    setIsGenerating(true);
    try {
      const token = session?.tokens?.accessToken;
      const res = await fetch("/api/ai/generate-service", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt: aiPrompt, model: selectedModel })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate service");

      setTitle(data.title);
      setDescription(data.description);
      setCategorySlug(data.category_slug);
      setSubServices(data.sub_services || []);
      setAiPrompt("");
      toast.success("Service generated successfully!");
      
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveService = async () => {
    if (!title.trim()) {
      toast.error("Service title is required");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isAdminMode 
        ? "/api/admin/services/full"
        : `/api/portals/${portal.id}/services/full`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category_slug: categorySlug,
          sub_services: subServices
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Service created successfully!");
      navigate(isAdminMode ? "/admin" : `/dashboard/${portalSlug}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Left Sidebar - Sub Services List */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Button 
            variant="ghost" 
            className="mb-4 text-slate-500 hover:text-slate-900 dark:hover:text-white p-0 hover:bg-transparent flex items-center h-auto"
            onClick={() => navigate(isAdminMode ? "/admin" : `/dashboard/${portalSlug}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to {isAdminMode ? "Admin" : "Dashboard"}
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 dark:text-white leading-tight">Service Designer</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">AI Package Builder</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
            Generated Forms
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">{subServices.length}</Badge>
          </h3>
          <div className="space-y-2">
            {subServices.length === 0 ? (
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm font-medium">
                No forms generated yet. Use the AI to generate a service.
              </div>
            ) : (
              subServices.map((sub, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500/50 transition-colors">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{sub.form_name}</p>
                  <p className="text-xs text-slate-500 mt-1">{sub.fields?.length || 0} fields defined</p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative">
        <div className="flex-1 overflow-y-auto pb-48">
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 sticky top-0 z-30">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <div className="flex-1">
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-black bg-transparent border-none px-0 focus-visible:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 h-auto"
                  placeholder="Service Title"
                />
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {categorySlug}
                  </Badge>
                  <span className="text-sm font-medium text-slate-400">
                    Includes {subServices.length} sub-services
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button 
                  onClick={saveService} 
                  disabled={saving || subServices.length === 0}
                  className="h-11 px-6 font-bold rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save & Publish</>}
                </Button>
              </div>
            </div>
          </header>

          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {subServices.length === 0 ? (
              <div className="space-y-6 pt-10">
                <div className="text-center space-y-2 mb-8">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                    <Wand2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Service Architect</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                    Describe the service you want to build, and the AI will generate the full package including metadata and all required sub-forms.
                  </p>
                </div>

                {isSuggesting && suggestedServices.length === 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                      <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"/> Generating Ideas...
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="dark:bg-slate-900/50">
                          <CardContent className="p-4 flex flex-col gap-2">
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 animate-pulse" />
                            <div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-1/2 animate-pulse" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : suggestedServices.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400">
                        <Lightbulb className="h-4 w-4 text-amber-500" /> Intelligent Suggestions
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchAiSuggestions} 
                        disabled={isSuggesting}
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1.5", isSuggesting && "animate-spin")} /> Refresh Hub
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {suggestedServices.map((s, idx) => (
                        <Card 
                          key={idx} 
                          className="cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all dark:bg-slate-900/50 group"
                          onClick={() => setAiPrompt(`Generate a comprehensive service for '${s.title}' including all necessary data collection forms.`)}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">{s.title}</div>
                              <div className="text-xs text-slate-500 mt-1">{s.category_name}</div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="border-none shadow-sm dark:bg-slate-900">
                <CardContent className="p-6">
                  <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Service description..."
                    className="resize-none border-none bg-slate-50 dark:bg-slate-800 text-base focus-visible:ring-emerald-500"
                    rows={4}
                  />
                </CardContent>
              </Card>
            )}

            {/* Preview of Sub-services */}
            {subServices.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-500" />
                  Included Sub-Services Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subServices.map((sub, idx) => (
                    <Card key={idx} className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                      <CardContent className="p-4 space-y-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{sub.form_name}</div>
                        <div className="space-y-2">
                          {sub.fields?.slice(0, 3).map((f: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-1">
                              <span className="text-slate-600 dark:text-slate-400">{f.label}</span>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold">{f.type}</Badge>
                            </div>
                          ))}
                          {sub.fields?.length > 3 && (
                            <div className="text-xs text-center text-slate-400 font-medium pt-1">
                              + {sub.fields.length - 3} more fields
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* AI Assistant Chat Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none z-50">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CardContent className="p-0 flex flex-col">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">AI Service Architect</span>
                  </div>
                  <div className="flex gap-1.5">
                    {availableModels.map(model => {
                      const cfg = MODEL_CONFIG[model];
                      if (!cfg) return null;
                      return (
                        <button
                          key={model}
                          onClick={() => setSelectedModel(model)}
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border transition-all",
                            selectedModel === model 
                              ? cfg.activeClass
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                          )}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-3 flex gap-3 items-end bg-white dark:bg-slate-900">
                  <Textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the full service you want to create (e.g. 'A full suite for registering a new business including tax and licensing')..."
                    className="min-h-[50px] resize-none border-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-emerald-500 rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiGenerate();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="h-[50px] px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 shrink-0"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Generating...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Build Service</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
