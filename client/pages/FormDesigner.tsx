import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, Plus, Trash2, Database, 
  Settings, Save, Fingerprint, Layout,
  Type, Hash, Calendar, Upload, List, AlertCircle,
  Bot, Wand2, ChevronDown, ChevronUp, ArrowUp
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

type Draft = {
  id: string;
  name: string;
  fields: any[];
  updatedAt: number;
};

const FormDesigner = () => {
  const { portalSlug, serviceId, formId } = useParams();
  const navigate = useNavigate();
  const { session, isSuperAdmin, loading: authLoading } = useAuth();
  
  const [portal, setPortal] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drafts state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const activeDraft = drafts.find(d => d.id === activeDraftId);
  const formName = activeDraft?.name || "New Sub-Service";
  const formFields = activeDraft?.fields || [];

  const updateActiveDraft = (updates: Partial<Draft>) => {
    if (!activeDraftId) return;
    setDrafts(prev => prev.map(d => d.id === activeDraftId ? { ...d, ...updates, updatedAt: Date.now() } : d));
  };

  // AI Agent state
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [lastUsedModel, setLastUsedModel] = useState<AiModel | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchAiConfig = async () => {
    try {
      const res = await fetch("/api/ai/config");
      const data = await res.json();
      const models: AiModel[] = data.availableModels || [];
      setAvailableModels(models);
      
      if (models.includes("groq")) {
        setSelectedModel("groq");
      } else if (models.length > 0) {
        setSelectedModel(models[0]);
      }
    } catch {
      // AI config fetch failure is non-critical
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        // Load drafts from local storage
        const saved = localStorage.getItem(`drafts_${portalSlug}_${serviceId}`);
        let initialDrafts: Draft[] = [];
        if (saved) {
          try { initialDrafts = JSON.parse(saved); setDrafts(initialDrafts); } catch (e) {}
        }

        // 1. Get Portal
        const portalRes = await fetch(`/api/portals/${portalSlug}`);
        const portalData = await portalRes.json();
        
        // Security check
        const userPortalId = (session as any)?.user?.app_metadata?.portal_id;
        if (!isSuperAdmin && userPortalId && userPortalId !== portalData.id) {
          toast.error("Unauthorized: You do not have management rights for this portal");
          navigate("/my-portal");
          return;
        }
        setPortal(portalData);

        // 2. Find Service
        const svc = portalData.services?.find((s: any) => s.id === serviceId);
        if (svc) setService(svc);

        // 3. Load DB form if provided
        if (formId && formId !== "new") {
          const formRes = await fetch(`/api/forms/${formId}`);
          const formData = await formRes.json();
          
          const existingDraft = initialDrafts.find(d => d.id === formId);
          if (existingDraft) {
            setActiveDraftId(formId);
          } else {
            const newDraft = { id: formId, name: formData.form_name, fields: formData.form_definition || [], updatedAt: Date.now() };
            setDrafts([newDraft, ...initialDrafts]);
            setActiveDraftId(formId);
          }
        }
      } catch (error) {
        toast.error("Failed to load designer");
      } finally {
        setLoading(false);
      }
    };
    initData();
    fetchAiConfig();
  }, [portalSlug, serviceId, formId]);

  // Save drafts to local storage whenever they change
  useEffect(() => {
    if (drafts.length > 0) {
      localStorage.setItem(`drafts_${portalSlug}_${serviceId}`, JSON.stringify(drafts));
    }
  }, [drafts, portalSlug, serviceId]);

  const addFormField = () => {
    let targetDraftId = activeDraftId;
    if (!targetDraftId) {
      targetDraftId = uuidv4();
      const newDraft = { id: targetDraftId, name: "New Sub-Service", fields: [], updatedAt: Date.now() };
      setDrafts(prev => [newDraft, ...prev]);
      setActiveDraftId(targetDraftId);
    }
    setDrafts(prev => prev.map(d => {
      if (d.id === targetDraftId) {
        return { 
          ...d, 
          fields: [...d.fields, { id: uuidv4(), label: "New Field", type: "text", required: false, options: [] }],
          updatedAt: Date.now()
        };
      }
      return d;
    }));
  };

  const updateField = (id: string, updates: any) => {
    if (!activeDraftId) return;
    setDrafts(prev => prev.map(d => {
      if (d.id === activeDraftId) {
        return {
          ...d,
          fields: d.fields.map(f => f.id === id ? { ...f, ...updates } : f),
          updatedAt: Date.now()
        };
      }
      return d;
    }));
  };

  const removeField = (id: string) => {
    if (!activeDraftId) return;
    setDrafts(prev => prev.map(d => {
      if (d.id === activeDraftId) {
        return {
          ...d,
          fields: d.fields.filter(f => f.id !== id),
          updatedAt: Date.now()
        };
      }
      return d;
    }));
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error("Please describe the sub-service first."); return; }
    if (!selectedModel) { toast.error("Please select an AI model."); return; }
    setIsGenerating(true);
    try {
      // Artificial delay to smooth out the UI transition and show the generation animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const token = session?.tokens?.accessToken;
      const requestBody = {
        prompt: aiPrompt,
        serviceName: service?.title || "",
        model: selectedModel,
        existingForm: formFields.length > 0 ? { formName, fields: formFields } : undefined
      };

      const res = await fetch("/api/ai/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      if (!activeDraftId) {
        const newId = uuidv4();
        setDrafts(prev => [{ id: newId, name: data.form_name, fields: data.fields, updatedAt: Date.now() }, ...prev]);
        setActiveDraftId(newId);
      } else {
        updateActiveDraft({ fields: data.fields });
      }

      setLastUsedModel(selectedModel);
      setShowSuccessModal(true);
      setAiPrompt(""); // Clear prompt on success
    } catch (err: any) {
      toast.error(err.message || "The AI service is temporarily unavailable. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };



  const saveForm = async () => {
    if (!formName.trim()) {
      toast.error("Please provide a name for this sub-service");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: formId === "new" ? undefined : formId,
          portal_id: portal.id,
          service_id: serviceId,
          form_name: formName,
          form_definition: formFields
        })
      });

      if (res.ok) {
        toast.success("Sub-service configuration saved successfully!");
        navigate(`/dashboard/${portalSlug}`);
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-black uppercase tracking-widest text-xs text-slate-400">Initializing Designer Fabric...</p>
      </div>
    );
  }

  const primaryColor = portal?.theme_config?.primaryColor || "#006400";

  return (
    <div className="h-[100dvh] h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-none sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/dashboard/${portalSlug}`)}
            className="rounded-xl font-bold hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <div className="h-6 w-px bg-slate-200 hidden md:block" />
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Layout className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Service Designer</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Configuring: {service?.title}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button 
            onClick={saveForm} 
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 font-black h-11 px-8 rounded-xl text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Publish Workflow
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden pb-16">
        {/* Left Sidebar: Drafts & History */}
        <aside className="w-72 lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hidden md:flex flex-col z-40 relative">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Button 
              onClick={() => { setActiveDraftId(null); setAiPrompt(""); }} 
              className="w-full justify-start rounded-xl font-bold h-12 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 shadow-sm transition-all"
            >
               <Plus className="mr-3 h-5 w-5" /> New AI Conversation
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Recent Drafts</h3>
            {drafts.map(draft => (
              <button 
                key={draft.id}
                onClick={() => setActiveDraftId(draft.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all duration-300 flex flex-col gap-1.5",
                  activeDraftId === draft.id 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 shadow-sm" 
                    : "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 border-2 border-transparent"
                )}
              >
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate pr-2">{draft.name}</span>
                <span className="text-xs text-slate-500 font-medium">{draft.fields.length} fields • {new Date(draft.updatedAt).toLocaleDateString()}</span>
              </button>
            ))}
            {drafts.length === 0 && (
              <div className="text-center p-8 mt-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm font-bold">No drafts yet</p>
                <p className="text-slate-400 text-xs mt-1">Start a conversation to save history.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto relative bg-slate-50 dark:bg-slate-950">
          <div className={cn("mx-auto", formFields.length === 0 || isGenerating ? "max-w-4xl p-6 lg:p-10" : "max-w-5xl p-6 lg:p-10")}>
            {isGenerating ? (
          /* Sleek generation skeleton */
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-in fade-in duration-500 py-20">
            <div className="flex flex-col items-center gap-6">
               <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
                  <Bot className="h-16 w-16 text-violet-500 relative z-10 animate-bounce" />
               </div>
               <h3 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 animate-pulse">
                 Crafting your service workflow...
               </h3>
               <p className="text-slate-400 font-medium max-w-md text-center">
                 {selectedModel ? MODEL_CONFIG[selectedModel].label : "AI"} is analyzing your requirements and designing the optimal data collection schema.
               </p>
            </div>
            
            <div className="w-full space-y-6 opacity-60">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-8 rounded-[32px] border border-white/20 shadow-sm flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-200/50 dark:bg-slate-700/50 animate-pulse" />
                  <div className="flex-1 space-y-4 pt-2">
                    <div className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded-full w-1/4 animate-pulse" />
                    <div className="h-12 bg-slate-200/50 dark:bg-slate-700/50 rounded-[16px] w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : formFields.length === 0 ? (
          /* ChatGPT style Hero */
          <div className="flex flex-col items-center justify-center min-h-[70vh] py-10 px-4 animate-in fade-in zoom-in-95 duration-700">
             <div className="mb-10 text-center space-y-5">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-xl shadow-violet-500/20 mb-4 hover:scale-110 transition-transform">
                   <Bot className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100">
                  What service can I help you build?
                </h2>
                <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto">
                  Describe your workflow requirements below, and AI will automatically generate the perfect form.
                </p>
             </div>

             <div className="w-full max-w-2xl relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-violet-400/20 to-indigo-400/20 rounded-[32px] blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
                   <Textarea
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     placeholder="e.g. A service to register a new business. Need company name, directors, and upload of IDs..."
                     className="min-h-[160px] max-h-[400px] border-0 bg-transparent resize-none focus-visible:ring-0 text-lg font-medium p-6 placeholder:text-slate-400/60"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleAiGenerate();
                       }
                     }}
                   />
                   <div className="p-3 px-4 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex flex-wrap gap-2">
                        {availableModels.map((m) => {
                           const cfg = MODEL_CONFIG[m];
                           const active = selectedModel === m;
                           return (
                             <button
                               key={m}
                               onClick={() => setSelectedModel(m)}
                               className={cn(
                                 "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                                 active 
                                  ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-md scale-105" 
                                  : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                               )}
                             >
                               {cfg.label}
                             </button>
                           );
                        })}
                      </div>
                      <Button
                        onClick={handleAiGenerate}
                        disabled={!aiPrompt.trim() || !selectedModel}
                        className={cn(
                          "rounded-full h-10 w-10 p-0 transition-all duration-300 shadow-sm",
                          aiPrompt.trim() && selectedModel ? "bg-violet-600 hover:bg-violet-700 text-white hover:scale-110 shadow-violet-500/30 shadow-lg" : "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
                        )}
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                   </div>
                </div>
             </div>
             
             <div className="mt-14">
               <Button 
                  variant="ghost" 
                  onClick={addFormField} 
                  className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold rounded-2xl h-14 px-8 text-base transition-colors"
                >
                 Or skip AI and build from scratch
               </Button>
             </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Sub-Service Identity */}
            <section className="space-y-4 relative z-20">
              <div className="flex items-center gap-3 mb-2 pl-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <Fingerprint className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Sub-Service Identity</h2>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 p-8 rounded-[32px] shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Form / Sub-Service Name</Label>
                    <Input 
                      value={formName}
                      onChange={(e) => updateActiveDraft({ name: e.target.value })}
                      placeholder="e.g. NRC Renewal, Lost Document Report"
                      className="h-16 text-xl font-bold rounded-[20px] border-slate-200/50 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all placeholder:text-slate-300"
                    />
                  </div>
                  <div className="p-6 rounded-[24px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-100 dark:border-emerald-900/30 h-full flex items-center">
                    <div className="flex items-start gap-4 text-emerald-800 dark:text-emerald-300">
                      <div className="mt-0.5 p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full shrink-0">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        This name will be prominently displayed to citizens when they select a service path under <span className="font-bold border-b border-emerald-300 dark:border-emerald-700">{service?.title}</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Form Structure */}
            <section className="space-y-6 relative z-10">
              <div className="flex justify-between items-center mb-2 pl-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Data Collection Schema</h2>
                </div>
                <Button 
                  onClick={addFormField}
                  variant="outline"
                  className="rounded-xl font-black border-emerald-100 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/50 dark:hover:bg-emerald-900/20 shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {formFields.map((field, index) => (
                  <div key={field.id} className="group relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 p-8 rounded-[32px] shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 dark:bg-slate-700 group-hover:bg-emerald-500 rounded-l-[32px] transition-colors duration-500" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
                      <div className="md:col-span-1 flex items-center justify-center pt-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100/80 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 text-lg shadow-inner group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors duration-300">
                          {index + 1}
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question / Field Label</Label>
                        <Input 
                          value={field.label} 
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="What information do you need?"
                          className="font-bold text-base rounded-[16px] border-slate-200/50 dark:border-slate-700 bg-white dark:bg-slate-800/80 h-14 shadow-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10 transition-all"
                        />
                      </div>

                      <div className="md:col-span-3 space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Input Type</Label>
                        <Select 
                          value={field.type} 
                          onValueChange={(value) => updateField(field.id, { type: value })}
                        >
                          <SelectTrigger className="font-bold text-sm rounded-[16px] border-slate-200/50 dark:border-slate-700 bg-white dark:bg-slate-800/80 h-14 shadow-sm focus:ring-emerald-400/20">
                            <div className="flex items-center gap-3">
                              {field.type === 'text' && <Type className="h-4 w-4 text-emerald-500" />}
                              {field.type === 'textarea' && <List className="h-4 w-4 text-emerald-500" />}
                              {field.type === 'number' && <Hash className="h-4 w-4 text-emerald-500" />}
                              {field.type === 'date' && <Calendar className="h-4 w-4 text-emerald-500" />}
                              {field.type === 'file' && <Upload className="h-4 w-4 text-emerald-500" />}
                              {field.type === 'select' && <ChevronDown className="h-4 w-4 text-emerald-500" />}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-[20px] border-white/40 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 p-2">
                            <SelectItem value="text" className="rounded-xl font-bold py-2.5">Short Text</SelectItem>
                            <SelectItem value="textarea" className="rounded-xl font-bold py-2.5">Long Description</SelectItem>
                            <SelectItem value="number" className="rounded-xl font-bold py-2.5">Numeric Value</SelectItem>
                            <SelectItem value="date" className="rounded-xl font-bold py-2.5">Date Picker</SelectItem>
                            <SelectItem value="file" className="rounded-xl font-bold py-2.5">Media Upload (All Types)</SelectItem>
                            <SelectItem value="select" className="rounded-xl font-bold py-2.5">Dropdown Menu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="md:col-span-3 flex items-center justify-between h-full pt-6 md:pt-9">
                        <div className="flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-800/50 py-2 px-4 rounded-xl border border-slate-100 dark:border-slate-700">
                          <Switch 
                            checked={field.required} 
                            onCheckedChange={(checked) => updateField(field.id, { required: checked })} 
                            className="data-[state=checked]:bg-emerald-500"
                          />
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer" onClick={() => updateField(field.id, { required: !field.required })}>Mandatory</Label>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeField(field.id)}
                          className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl h-12 w-12 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-6 pb-2 flex justify-center">
                  <Button 
                    onClick={addFormField}
                    variant="ghost"
                    className="h-16 px-10 rounded-[20px] border-2 border-dashed border-slate-300/50 dark:border-slate-700/50 text-slate-400 hover:text-emerald-600 hover:border-emerald-400/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all font-black text-lg shadow-sm hover:shadow-md"
                  >
                    <Plus className="mr-3 h-6 w-6" /> Append Another Field
                  </Button>
                </div>
              </div>
            </section>

            {/* AI Assistant (Sticky Bottom / Chat-like) */}
            <section className="space-y-4 relative z-10 sticky bottom-4">
               <div className="bg-gradient-to-r from-violet-50/50 to-indigo-50/50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-violet-100 dark:border-violet-800/30 rounded-[28px] p-6 shadow-2xl backdrop-blur-xl">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">AI Assistant</h3>
                      <p className="text-xs text-slate-500 font-medium">Add more fields or modify the form using AI.</p>
                    </div>
                    {lastUsedModel && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-none text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                        ✓ Last generation by {MODEL_CONFIG[lastUsedModel].label}
                      </Badge>
                    )}
                 </div>
                 
                 <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                   <Textarea
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     placeholder="Need to add or change something?"
                     className="min-h-[80px] max-h-[200px] border-0 bg-transparent resize-none focus-visible:ring-0 text-sm font-medium p-4"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleAiGenerate();
                       }
                     }}
                   />
                   <div className="p-2 px-3 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex flex-wrap gap-1">
                        {availableModels.map((m) => {
                           const cfg = MODEL_CONFIG[m];
                           const active = selectedModel === m;
                           return (
                             <button
                               key={m}
                               onClick={() => setSelectedModel(m)}
                               className={cn(
                                 "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                                 active ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                               )}
                             >
                               {cfg.label}
                             </button>
                           );
                        })}
                      </div>
                      <Button
                        onClick={handleAiGenerate}
                        disabled={!aiPrompt.trim() || !selectedModel}
                        size="sm"
                        className={cn(
                          "rounded-full h-8 w-8 p-0 transition-all",
                          aiPrompt.trim() && selectedModel ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600"
                        )}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                   </div>
                 </div>
               </div>
            </section>
          </div>
        )}
          </div>
      </main>

      {/* Success Feedback Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
          <div className="p-8">
            <DialogHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-2">
                <Wand2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <DialogTitle className="text-2xl font-black text-center tracking-tight text-slate-800 dark:text-slate-100">Form Successfully Designed!</DialogTitle>
              <DialogDescription className="text-center text-slate-500 font-medium text-base">
                The AI has generated <strong className="text-slate-700 dark:text-slate-300">{formFields.length} fields</strong> for <em className="text-slate-700 dark:text-slate-300">"{formName}"</em>. What would you like to do next?
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 mt-8">
              <Button 
                onClick={() => setShowSuccessModal(false)}
                className="h-14 rounded-[20px] bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-300 font-bold text-base transition-colors"
              >
                <Layout className="mr-2 h-5 w-5" /> Review & Refine Fields
              </Button>
              <Button 
                onClick={() => {
                  setShowSuccessModal(false);
                  saveForm();
                }}
                className="h-14 rounded-[20px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/20 transition-colors"
              >
                <Save className="mr-2 h-5 w-5" /> Save & Publish
              </Button>
              <Button 
                onClick={() => {
                  setShowSuccessModal(false);
                  // Remove the active draft if discarding? No, just clear it.
                  if (activeDraftId) {
                    setDrafts(prev => prev.filter(d => d.id !== activeDraftId));
                    setActiveDraftId(null);
                  }
                }}
                variant="ghost"
                className="h-14 rounded-[20px] text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors mt-2"
              >
                <Trash2 className="mr-2 h-5 w-5" /> Discard & Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Persistence Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t p-4 px-10 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Settings className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Portal: <span className="text-slate-900 dark:text-white">{portal?.name}</span></span>
        </div>
        <div className="flex items-center gap-6">
          <p className="text-xs font-bold text-slate-400 italic">Unsaved changes will be lost if you exit.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Sync Active</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default FormDesigner;
