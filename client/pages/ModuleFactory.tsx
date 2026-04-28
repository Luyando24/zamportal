import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Plus, Save, Bot, Wand2, Layers, Briefcase, Lightbulb, ArrowRight, RefreshCw,
  Settings, Database, Layout, Shield, Eye, Trash2, ChevronRight, Sparkles, Command, 
  Terminal, MousePointer2, Type, Hash, Calendar as CalendarIcon, CheckSquare, List,
  Truck, School, Wallet, FileText, Hospital, Activity, Bell, Globe, Users
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
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

const FIELD_ICONS: Record<string, any> = {
  text: Type,
  number: Hash,
  date: CalendarIcon,
  select: List,
  textarea: FileText,
  boolean: CheckSquare
};

const DEFAULT_SUGGESTIONS = [
  { title: "Fleet Tracking", desc: "Monitor vehicles, drivers, and fuel consumption", icon: "truck" },
  { title: "Clinic Registry", desc: "Manage medical staff and critical supplies", icon: "hospital" },
  { title: "Project Vault", desc: "Track budgets, timelines, and team tasks", icon: "briefcase" }
];

const ICON_MAP: Record<string, any> = {
  truck: Truck,
  hospital: Hospital,
  school: School,
  briefcase: Briefcase,
  package: Database,
  database: Database,
  wallet: Wallet,
  "file-text": FileText,
  settings: Settings,
  layout: Layout,
  shield: Shield,
  activity: Activity,
  bell: Bell,
  globe: Globe,
  users: Users
};

export default function ModuleFactory() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("New System Module");
  const [singularEntity, setSingularEntity] = useState("Record");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("package");
  const [fields, setFields] = useState<any[]>([]);
  
  // Editing state
  const [editingField, setEditingField] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // AI state
  const [availableModels, setAvailableModels] = useState<AiModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [constructionStep, setConstructionStep] = useState<string | null>(null);
  const [suggestedModules, setSuggestedModules] = useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/config").then(res => res.json()).then(data => {
      const models: AiModel[] = data.availableModels || [];
      setAvailableModels(models);
      
      const savedModel = localStorage.getItem("admin_ai_model") as AiModel;
      if (savedModel && models.includes(savedModel)) {
        setSelectedModel(savedModel);
      } else if (models.includes("groq")) {
        setSelectedModel("groq");
      } else if (models.length > 0) {
        setSelectedModel(models[0]);
      }
    }).catch(() => {});
  }, []);

  const fetchAiSuggestions = async () => {
    if (!selectedModel || isSuggesting) return;
    
    setIsSuggesting(true);
    try {
      const token = session?.tokens?.accessToken;
      const res = await fetch("/api/ai/suggest-modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ model: selectedModel })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSuggestedModules(data);
      } else {
        // Fallback to defaults if AI returns invalid data
        setSuggestedModules(DEFAULT_SUGGESTIONS);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions", e);
      setSuggestedModules(DEFAULT_SUGGESTIONS);
    } finally {
      setIsSuggesting(false);
    }
  };

  useEffect(() => {
    // Only auto-fetch suggestions once when the model is first loaded and no fields exist
    if (selectedModel && fields.length === 0 && suggestedModules.length === 0 && !isSuggesting) {
      fetchAiSuggestions();
    }
  }, [selectedModel, fields.length]); // Added fields.length to ensure it checks after a reset

  const onModelChange = (model: AiModel) => {
    setSelectedModel(model);
    localStorage.setItem("admin_ai_model", model);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    if (!selectedModel) {
      toast.error("AI service is currently unavailable");
      return;
    }

    setIsGenerating(true);
    const steps = [
      "Analyzing System Requirements...",
      "Architecting Database Schema...",
      "Generating Operational Interfaces...",
      "Synchronizing Module Nexus...",
      "Finalizing Core Logic..."
    ];

    try {
      // Start construction animation sequence
      let stepIdx = 0;
      const stepInterval = setInterval(() => {
        if (stepIdx < steps.length) {
          setConstructionStep(steps[stepIdx]);
          stepIdx++;
        }
      }, 800);

      const token = session?.tokens?.accessToken;
      const res = await fetch("/api/ai/generate-module", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt: aiPrompt, model: selectedModel })
      });
      
      const data = await res.json();
      
      // Ensure we stay in "Building" state for at least a few seconds for the theater
      await new Promise(resolve => setTimeout(resolve, 3000));
      clearInterval(stepInterval);

      if (!res.ok) throw new Error(data.error || "Failed to generate module");

      setName(data.name);
      setSingularEntity(data.singular_entity || "Record");
      setDescription(data.description);
      setIcon(data.icon || "package");
      setFields(data.fields || []);
      setAiPrompt("");
      toast.success("AI Architecture successful!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsGenerating(false);
      setConstructionStep(null);
    }
  };

  const handlePreview = () => {
    localStorage.setItem("temp_module_preview", JSON.stringify({
      name, description, icon, schema_definition: fields, singular_entity: singularEntity
    }));
    window.open("/admin/module-preview", "_blank");
  };

  const saveModule = async () => {
    if (!name.trim()) {
      toast.error("Module name is required");
      return;
    }

    setSaving(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const res = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          singular_entity: singularEntity,
          description,
          icon,
          schema_definition: fields
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("System deployed successfully!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "Failed to save module");
    } finally {
      setSaving(false);
    }
  };

  const deleteField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, updated: any) => {
    const newFields = [...fields];
    newFields[idx] = updated;
    setFields(newFields);
  };

  const openFieldEditor = (field: any, idx: number) => {
    setEditingField({ ...field, index: idx });
    setIsEditorOpen(true);
  };

  const saveFieldEdit = () => {
    if (editingField) {
      updateField(editingField.index, editingField);
      setIsEditorOpen(false);
      setEditingField(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Sidebar - Schema Design */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <Button 
            variant="ghost" 
            className="mb-4 text-slate-500 hover:text-slate-900 dark:hover:text-white p-0 hover:bg-transparent flex items-center h-auto"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Command className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 dark:text-white leading-tight">Design Studio</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-blue-500">AI System Builder</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
            Data Schema
            <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">{fields.length}</Badge>
          </h3>
          
          <div className="space-y-2">
            {fields.length === 0 ? (
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm font-medium">
                No fields generated yet. Describe your system to begin.
              </div>
            ) : (
              fields.map((f, idx) => {
                const Icon = FIELD_ICONS[f.type] || Type;
                return (
                  <div 
                    key={idx} 
                    onClick={() => openFieldEditor(f, idx)}
                    className="group p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500/50 transition-all cursor-pointer relative"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <Icon className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{f.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{f.type} {f.required && "• Required"}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteField(idx); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {fields.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full h-10 rounded-xl border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500 font-bold text-xs"
              onClick={() => {
                const newField = { name: 'new_field', label: 'New Field', type: 'text', required: false };
                setFields([...fields, newField]);
                openFieldEditor(newField, fields.length);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Field Node
            </Button>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
        {/* Construction Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-[100] bg-white/60 dark:bg-slate-950/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
            <div className="max-w-md w-full p-8 text-center space-y-6">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-20 animate-pulse" />
                <div className="relative w-full h-full bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <RefreshCw className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Nexus Construction</h3>
                <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">
                  {constructionStep || "Initializing Architect..."}
                </p>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-[progress_3s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-48 scroll-smooth custom-scrollbar">
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 sticky top-0 z-30">
            <div className="max-w-4xl mx-auto flex justify-between items-center gap-8">
              <div className="flex-1">
                <Input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-3xl font-black bg-transparent border-none px-0 focus-visible:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 h-auto"
                  placeholder="System Name"
                />
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Briefcase className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <Input 
                      value={singularEntity}
                      onChange={(e) => setSingularEntity(e.target.value)}
                      className="h-auto p-0 border-none bg-transparent text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400 focus-visible:ring-0 w-24"
                      placeholder="Singular (e.g. Vehicle)"
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-400">
                    Schema contains {fields.length} operational fields
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  onClick={handlePreview} 
                  disabled={fields.length === 0}
                  className="h-11 px-6 font-bold rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4 mr-2" /> Live Preview
                </Button>
                <Button 
                  onClick={saveModule} 
                  disabled={saving || fields.length === 0}
                  className="h-11 px-6 font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? "Deploying..." : <><Save className="h-4 w-4 mr-2" /> Save & Deploy</>}
                </Button>
              </div>
            </div>
          </header>

          <div className="max-w-4xl mx-auto p-6 space-y-8">
            {fields.length === 0 ? (
              <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI System Architect</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                    Describe your system's purpose, and the AI will build the entire system including its data structure and operational logic.
                  </p>
                </div>
                
                <div className="space-y-4 pt-8">
                  <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                      <Lightbulb className="h-4 w-4 text-amber-500" /> Intelligent Architecture Suggestions
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={fetchAiSuggestions} 
                      disabled={isSuggesting}
                      className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600"
                    >
                      <RefreshCw className={cn("h-3 w-3 mr-1.5", isSuggesting && "animate-spin")} /> Cycle Suggestions
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {isSuggesting && suggestedModules.length === 0 ? (
                      [1, 2, 3].map(i => (
                        <Card key={i} className="dark:bg-slate-900/50 animate-pulse">
                          <CardContent className="p-6 space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                            <div className="h-3 bg-slate-50 dark:bg-slate-800/50 rounded w-full" />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      suggestedModules.map((example, i) => {
                        const Icon = ICON_MAP[example.icon?.toLowerCase()] || Briefcase;
                        return (
                          <Card key={i} className="cursor-pointer hover:border-blue-500 hover:shadow-md transition-all dark:bg-slate-900/50 group rounded-2xl overflow-hidden"
                            onClick={() => setAiPrompt(`Create a ${example.title} module: ${example.desc}`)}>
                            <CardContent className="p-6 text-left space-y-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-blue-600 transition-colors">{example.title}</div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-2">{example.desc}</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                <Card className="border-none shadow-sm dark:bg-slate-900 rounded-2xl">
                  <CardContent className="p-6 space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">System Description</Label>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Define the purpose of this system..."
                      className="resize-none border-none bg-slate-50 dark:bg-slate-800/50 text-lg font-bold focus-visible:ring-blue-500 rounded-xl p-4 min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layout className="h-5 w-5 text-blue-500" />
                    Interface Preview
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((f, idx) => {
                      const Icon = FIELD_ICONS[f.type] || Type;
                      return (
                        <Card 
                          key={idx} 
                          onClick={() => openFieldEditor(f, idx)}
                          className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 hover:border-blue-500/50 transition-all cursor-pointer relative"
                        >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">{f.label}</span>
                            <Icon className="h-4 w-4 text-slate-300 dark:text-slate-700" />
                          </div>
                          {f.field_description && (
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 mb-3 leading-tight">{f.field_description}</p>
                          )}
                        </div>
                        <div className="h-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center px-4 text-slate-400 text-xs font-medium italic">
                          {f.placeholder || (f.type === 'select' ? "Dropdown selector..." : "User entry field...")}
                        </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Assistant Chat Panel */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none z-50">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <CardContent className="p-0 flex flex-col">
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">System Architect AI</span>
                  </div>
                  <div className="flex gap-1.5">
                    {availableModels.map(model => {
                      const cfg = MODEL_CONFIG[model];
                      if (!cfg) return null;
                      return (
                        <button
                          key={model}
                          onClick={() => onModelChange(model)}
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
                    placeholder="Describe the system you want to build (e.g. 'Build a National Equipment Tracker')..."
                    className="min-h-[50px] resize-none border-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500 rounded-xl"
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
                    className="h-[50px] px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-lg shadow-blue-600/20 shrink-0"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Build System</span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Field Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-xl rounded-2xl border-none shadow-2xl p-8 bg-white dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Node Configuration
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500">Customize the properties of this system field.</DialogDescription>
          </DialogHeader>
          
          {editingField && (
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display Label</Label>
                  <Input 
                    value={editingField.label}
                    onChange={(e) => setEditingField({...editingField, label: e.target.value})}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Type</Label>
                  <select 
                    value={editingField.type}
                    onChange={(e) => setEditingField({...editingField, type: e.target.value})}
                    className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold appearance-none cursor-pointer"
                  >
                    {Object.keys(FIELD_ICONS).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Field Description / Helper Text</Label>
                <Input 
                  value={editingField.field_description || ""}
                  onChange={(e) => setEditingField({...editingField, field_description: e.target.value})}
                  className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                  placeholder="Explain what this field is for..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Placeholder</Label>
                  <Input 
                    value={editingField.placeholder || ""}
                    onChange={(e) => setEditingField({...editingField, placeholder: e.target.value})}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-medium"
                    placeholder="e.g. Enter NRC Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Validation Regex</Label>
                  <Input 
                    value={editingField.validation_regex || ""}
                    onChange={(e) => setEditingField({...editingField, validation_regex: e.target.value})}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-mono text-[10px]"
                    placeholder="e.g. ^\d{6}/\d{2}/\d{1}$"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Mandatory Entry</p>
                  <p className="text-[10px] text-slate-400">Require users to fill this field</p>
                </div>
                <input 
                  type="checkbox"
                  checked={editingField.required}
                  onChange={(e) => setEditingField({...editingField, required: e.target.checked})}
                  className="w-5 h-5 rounded border-2 border-slate-200 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {editingField.type === 'select' && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Options (Comma separated)</Label>
                  <Input 
                    value={editingField.options?.join(', ') || ""}
                    onChange={(e) => setEditingField({...editingField, options: e.target.value.split(',').map(s => s.trim())})}
                    className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4 font-bold"
                    placeholder="Option 1, Option 2..."
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsEditorOpen(false)} className="h-11 rounded-xl font-bold text-slate-500">Discard</Button>
            <Button onClick={saveFieldEdit} className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">Apply Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Label = ({ children, className }: any) => (
  <label className={cn("block text-sm font-medium", className)}>{children}</label>
);
