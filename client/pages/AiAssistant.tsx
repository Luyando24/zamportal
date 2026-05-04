import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { 
  Bot, Send, User, Sparkles, ArrowLeft, RefreshCw, 
  MessageSquare, History, Shield, Info, ArrowRight, 
  X, Menu, Brain, Cpu, ChevronDown, Plus, Search,
  RotateCcw, Copy, ThumbsUp, ThumbsDown, Square,
  FileSearch, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";
import { Api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  services?: any[];
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

export default function AiAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [globalDefaultModel, setGlobalDefaultModel] = useState<string>("openai");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("openai");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Suggestion Flow State
  const [canSuggest, setCanSuggest] = useState(false);
  const [isCrafting, setIsCrafting] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [thinkingStage, setThinkingStage] = useState(0);
  const thinkingStages = [
    "Searching government service directory...",
    "Identifying relevant administrative procedures...",
    "Checking eligibility requirements...",
    "Structuring guided assistance...",
    "Finalizing response..."
  ];

  // Load conversations from localStorage and global config
  useEffect(() => {
    const saved = localStorage.getItem("zamportal_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
      } catch (e) {
        console.error("Failed to load chats:", e);
      }
    }

    // Load global AI config
    Api.getAiConfig().then(config => {
      setAvailableModels(config.availableModels);
      if (config.defaultModel) {
        setGlobalDefaultModel(config.defaultModel);
        setSelectedModel(config.defaultModel);
      }
    }).catch(() => {});
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("zamportal_chats", JSON.stringify(conversations));
    }
  }, [conversations]);

  // Thinking stage interval
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setThinkingStage(prev => (prev + 1) % thinkingStages.length);
      }, 2500);
    } else {
      setThinkingStage(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Initialize or load conversation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialQuery = params.get("q");
    
    if (initialQuery) {
      const newId = Date.now().toString();
      const newConv: Conversation = {
        id: newId,
        title: initialQuery.substring(0, 30) + (initialQuery.length > 30 ? "..." : ""),
        messages: [],
        updatedAt: new Date().toISOString()
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveId(newId);
      handleSendMessage(initialQuery, newId);
    } else if (conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
      setMessages(conversations[0].messages);
    } else if (!activeId) {
      startNewChat();
    }
  }, []);

  // Update messages when activeId changes
  useEffect(() => {
    if (activeId) {
      const conv = conversations.find(c => c.id === activeId);
      if (conv) {
        setMessages(conv.messages);
      }
    }
  }, [activeId]);

  const startNewChat = () => {
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      title: "New Conversation",
      messages: [
        {
          role: "assistant",
          content: "Hello! I am your **ZamPortal Assistant**. \n\nI can help you find government services, explain application procedures, and guide you through institutional requirements. How can I assist you today?",
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveId(newId);
    setMessages(newConv.messages);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text?: string, targetId?: string) => {
    const messageContent = text || input;
    const currentId = targetId || activeId;
    if (!messageContent.trim() || !currentId || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    let newMessages = [...messages];
    if (!text) {
      newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
    }
    
    setIsLoading(true);
    setCanSuggest(false);
    setSuggestion(null);

    try {
      const res = await fetch("/api/ai/recommend-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: messageContent, 
          model: selectedModel,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      const data = await res.json();
      const fullResponse = data.response || "I've found some services that might help you.";
      const services = data.services || [];
      
      let typedResponse = "";
      const placeholderMessage: Message = {
        role: "assistant",
        content: "",
        services: [],
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, placeholderMessage]);
      setIsLoading(false);
      setCanSuggest(!!data.canSuggest);

      const words = fullResponse.split(" ");
      for (let i = 0; i < words.length; i++) {
        typedResponse += words[i] + (i === words.length - 1 ? "" : " ");
        setMessages(prev => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: typedResponse,
              services: i === words.length - 1 ? services : []
            };
          }
          return next;
        });
        const delay = words[i].length > 8 ? 40 : 25;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Final update to conversations list
      const finalAssistantMessage: Message = {
        role: "assistant",
        content: fullResponse,
        services: services,
        timestamp: new Date().toISOString()
      };

      setConversations(prev => prev.map(c => {
        if (c.id === currentId) {
          const updatedMessages = [...newMessages, finalAssistantMessage];
          return {
            ...c,
            title: c.title === "New Conversation" ? messageContent.substring(0, 30) + (messageContent.length > 30 ? "..." : "") : c.title,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Assistant encountered an error.");
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      const htmlContent = await marked.parse(content);
      const richHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #000000; line-height: 1.6;">
          ${htmlContent}
        </div>
      `;
      const blobHtml = new Blob([richHtml], { type: 'text/html' });
      const blobText = new Blob([content], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })
      ]);
      toast.success("Copied with formatting");
    } catch (err) {
      navigator.clipboard.writeText(content);
      toast.success("Copied as plain text");
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      if (messages[messages.length - 1].role === 'assistant') {
        setMessages(prev => prev.slice(0, -1));
      }
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    
    if (activeId === id) {
      if (updated.length > 0) {
        setActiveId(updated[0].id);
        setMessages(updated[0].messages);
      } else {
        startNewChat();
      }
    }
    toast.success("Conversation deleted");
  };

  const handleStartSuggestion = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;

    setIsCrafting(true);
    setCanSuggest(false);

    try {
      const res = await fetch("/api/ai/craft-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lastUserMessage.content, model: selectedModel })
      });
      const data = await res.json();
      setSuggestion(data);
    } catch (err) {
      console.error("Craft error:", err);
    } finally {
      setIsCrafting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!suggestion) return;
    setIsSubmitting(true);
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");

    try {
      await fetch("/api/ai/submit-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_query: lastUserMessage?.content || "Unknown",
          suggested_service: suggestion.suggested_service,
          description: suggestion.description,
          crafted_message: suggestion.crafted_message
        })
      });
      setHasSubmitted(true);
      toast.success("Suggestion submitted to Digital Transformation Dept.");
      setTimeout(() => {
        setSuggestion(null);
        setHasSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to submit suggestion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] flex font-sans overflow-hidden h-[100dvh] text-sm">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#171717] border-r border-white/5 z-[70] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 flex flex-col gap-2">
          <Link to="/" className="flex items-center gap-2 px-3 mb-4">
             <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-white" />
             </div>
             <span className="text-xs font-black uppercase tracking-widest italic">ZamPortal</span>
          </Link>
          
          <Button 
            onClick={() => {
              startNewChat();
              setIsSidebarOpen(false);
            }}
            variant="ghost"
            className="w-full justify-start text-sm font-medium h-10 rounded-lg hover:bg-white/5 gap-3 px-3"
          >
            <Plus className="h-4 w-4" /> New chat
          </Button>

          <div className="relative group/search mt-2">
            <Search className="h-4 w-4 absolute left-3 top-3 text-white/20 group-focus-within/search:text-white/60 transition-colors" />
            <input 
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border-none rounded-lg h-10 pl-10 pr-4 text-xs font-medium placeholder:text-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-hide">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">History</span>
          </div>
          {conversations
            .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(conv => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg transition-all group relative truncate text-[14px] font-medium flex items-center justify-between",
                activeId === conv.id 
                  ? "bg-white/10 text-white" 
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="truncate pr-6">{conv.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 hover:text-red-500 rounded-md absolute right-1"
                onClick={(e) => handleDeleteConversation(conv.id, e)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold">
              CZ
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold truncate">Citizen User</p>
              <p className="text-[10px] text-white/40 font-medium">Public Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#212121]">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 z-50">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-8 w-8 text-white/60"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer">
              <span className="text-sm font-medium text-white/60">ZamPortal Assistant</span>
              <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500/60 h-4 px-1.5 uppercase font-bold tracking-tighter">Citizen</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-white/60 hover:text-white">
              Guide
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto pt-8 pb-40 space-y-10 scrollbar-hide"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex flex-col gap-3 animate-in fade-in duration-300 group",
                  msg.role === "user" ? "items-end" : "items-start"
                )}
              >
                {msg.role === "user" ? (
                  <div className="bg-[#2f2f2f] px-4 py-2.5 rounded-2xl max-w-[85%] text-[17px] font-medium text-white/90">
                    {msg.content}
                  </div>
                ) : (
                  <div className="w-full space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                         <Bot className="h-3 w-3 text-white/40" />
                      </div>
                      <div className="flex-1">
                        <div className="prose prose-invert max-w-none 
                          font-serif text-[17px] leading-relaxed text-[#ececec]
                          prose-p:mb-4 last:prose-p:mb-0
                          prose-headings:text-white prose-headings:font-bold prose-headings:text-base prose-headings:mb-4
                          prose-strong:text-white prose-strong:font-bold
                          prose-code:text-white prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                        ">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Service Cards if any */}
                        {msg.services && msg.services.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 animate-in slide-in-from-bottom-2 duration-500">
                            {msg.services.map((service, sidx) => (
                              <Link 
                                key={sidx}
                                to={service.portal_slug ? `/${service.portal_slug}/apply/${service.slug}` : "/services"}
                                className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <Badge className="bg-emerald-600/20 text-emerald-400 border-none font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 mb-2">
                                    {service.category_name}
                                  </Badge>
                                  <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">{service.title}</h4>
                                  <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{service.reason}</p>
                                </div>
                                <div className="mt-4 flex items-center text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                  Access Service <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/5 text-white/40"
                            onClick={() => handleCopy(msg.content)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/5 text-white/40">
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </Button>
                          {idx === messages.length - 1 && (
                            <Button 
                              variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/5 text-white/40"
                              onClick={handleRetry}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1">
                   <Bot className="h-3 w-3 text-white/20" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500/60 ml-2 animate-pulse">
                      Searching records
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white/30 italic">
                    {thinkingStages[thinkingStage]}
                  </p>
                </div>
              </div>
            )}

            {/* Suggestion CTA */}
            {canSuggest && !isLoading && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8">
                <div className="bg-emerald-600/5 border border-emerald-500/10 rounded-2xl p-6 text-center backdrop-blur-sm">
                   <h3 className="text-sm font-bold mb-2 text-white/90">Couldn't find the service?</h3>
                   <p className="text-xs text-white/40 mb-6 max-w-md mx-auto">
                     If you're looking for a specific government service that isn't yet on ZamPortal, you can suggest it to the authorities.
                   </p>
                   <Button 
                    onClick={handleStartSuggestion}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-10 px-8 font-bold text-xs shadow-lg shadow-emerald-600/20"
                   >
                     Suggest this service
                   </Button>
                </div>
              </div>
            )}

            {/* Suggestion Crafting / Review */}
            {(isCrafting || suggestion) && (
              <div className="animate-in zoom-in-95 duration-500 pt-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                  {isCrafting ? (
                    <div className="text-center py-4 space-y-4">
                      <RefreshCw className="h-8 w-8 text-emerald-500 mx-auto animate-spin" />
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 animate-pulse">Crafting official proposal...</h3>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                          <FileSearch className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Service Proposal</h4>
                          <h3 className="text-base font-bold text-white">{suggestion.suggested_service}</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Proposal Summary</label>
                        <div className="bg-black/20 p-5 rounded-xl italic text-white/70 text-xs leading-relaxed font-medium">
                          "{suggestion.crafted_message}"
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <p className="text-[9px] text-white/30 font-medium max-w-[150px]">Your suggestion will be sent for official review.</p>
                        <Button 
                          disabled={isSubmitting || hasSubmitted}
                          onClick={handleFinalSubmit}
                          className={cn(
                            "rounded-xl h-10 px-6 font-bold text-xs transition-all",
                            hasSubmitted ? "bg-green-600 hover:bg-green-600" : "bg-emerald-600 hover:bg-emerald-500"
                          )}
                        >
                          {isSubmitting ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : null}
                          {hasSubmitted ? "Proposal Sent" : "Submit Proposal"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="absolute bottom-6 left-0 right-0 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto relative">
              <div className="bg-[#2f2f2f] rounded-[24px] p-2 flex flex-col shadow-lg border border-white/5 focus-within:border-white/10 transition-colors">
                <Textarea 
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask about government services..."
                  className="bg-transparent border-none focus-visible:ring-0 text-[17px] px-4 py-2 placeholder:text-white/30 font-medium resize-none min-h-[44px] max-h-[200px]"
                  rows={1}
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 text-white/40">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center ml-2">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 gap-1.5 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
                          >
                            {selectedModel === 'openai' ? (
                              <Sparkles className="h-3 w-3 text-emerald-500" />
                            ) : selectedModel === 'gemini' ? (
                              <Brain className="h-3 w-3 text-blue-400" />
                            ) : (
                              <Cpu className="h-3 w-3 text-purple-400" />
                            )}
                            {selectedModel === 'openai' ? 'OpenAI GPT-4o' : 
                             selectedModel === 'gemini' ? 'Google Gemini' : 
                             selectedModel === 'claude' ? 'Anthropic Claude' : 'Groq Llama 3.1'}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-[#262626] border-white/5 text-white/90 rounded-xl p-1 shadow-2xl min-w-[140px] z-[100]">
                          {(availableModels.length > 0 ? availableModels : ['openai', 'gemini', 'groq']).map(m => (
                            <DropdownMenuItem 
                              key={m}
                              onClick={() => setSelectedModel(m)}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest cursor-pointer transition-colors focus:bg-white/10 focus:text-white",
                                selectedModel === m ? "bg-white/5 text-white" : "text-white/40"
                              )}
                            >
                              {m === 'openai' ? (
                                <Sparkles className="h-3 w-3 text-emerald-500" />
                              ) : m === 'gemini' ? (
                                <Brain className="h-3 w-3 text-blue-400" />
                              ) : (
                                <Cpu className="h-3 w-3 text-purple-400" />
                              )}
                              {m === 'openai' ? 'OpenAI GPT-4o' : 
                               m === 'gemini' ? 'Google Gemini' : 
                               m === 'claude' ? 'Anthropic Claude' : 'Groq Llama 3.1'}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                       <Button 
                        size="icon"
                        className="h-8 w-8 rounded-lg bg-white/5 text-white/40"
                       >
                         <Square className="h-3 w-3 fill-current" />
                       </Button>
                    ) : (
                      <Button 
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim()}
                        className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:bg-transparent"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-center mt-3 text-[10px] text-white/20 font-medium">
                ZamPortal Assistant can make mistakes. Please check important info.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
