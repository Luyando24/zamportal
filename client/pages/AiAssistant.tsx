import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Bot, Send, User, Sparkles, ArrowLeft, RefreshCw, MessageSquare, History, Shield, Info, ArrowRight, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canSuggest, setCanSuggest] = useState(false);
  const [isCrafting, setIsCrafting] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load conversations from localStorage
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
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("zamportal_chats", JSON.stringify(conversations));
    }
  }, [conversations]);

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
          content: "Hello! I am your ZamPortal AI Assistant. How can I help you with government services today?",
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string, targetId?: string) => {
    const currentId = targetId || activeId;
    if (!text.trim() || !currentId) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const savedModel = localStorage.getItem("admin_ai_model") || "groq";

    try {
      const res = await fetch("/api/ai/recommend-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text, model: savedModel })
      });
      
      const data = await res.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "I've found some services that might help you.",
        services: data.services || [],
        timestamp: new Date().toISOString()
      };

      setCanSuggest(!!data.canSuggest);

      const updatedMessages = [...messages, userMessage, assistantMessage];
      setMessages(updatedMessages);

      // Update conversations list
      setConversations(prev => prev.map(c => {
        if (c.id === currentId) {
          return {
            ...c,
            title: c.title === "New Conversation" ? text.substring(0, 30) + (text.length > 30 ? "..." : "") : c.title,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSuggestion = async () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMessage) return;

    setIsCrafting(true);
    setCanSuggest(false);
    const savedModel = localStorage.getItem("admin_ai_model") || "groq";

    try {
      const res = await fetch("/api/ai/craft-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: lastUserMessage.content, model: savedModel })
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
      setTimeout(() => {
        setSuggestion(null);
        setHasSubmitted(false);
      }, 3000);
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A0F] text-white flex font-sans overflow-hidden h-screen">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Premium Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-80 border-r border-white/5 bg-[#0A141D] backdrop-blur-3xl z-[70] transition-transform duration-500 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xs font-black uppercase tracking-widest italic">ZamPortal</h1>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white/40"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 border-b border-white/5">
          <Button 
            onClick={() => {
              startNewChat();
              setIsSidebarOpen(false);
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20"
          >
            <MessageSquare className="mr-2 h-4 w-4" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">Recent Chats</h2>
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => {
                setActiveId(conv.id);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden border",
                activeId === conv.id 
                  ? "bg-white/10 border-white/10 text-emerald-400 shadow-xl" 
                  : "bg-transparent border-transparent text-white/40 hover:bg-white/5 hover:text-white/60"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <History className={cn("h-4 w-4", activeId === conv.id ? "text-emerald-500" : "text-white/20")} />
                <span className="text-xs font-bold truncate pr-4">{conv.title}</span>
              </div>
              {activeId === conv.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-600 p-[1px]">
              <div className="h-full w-full rounded-xl bg-[#050A0F] flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/80 truncate">Guest Citizen</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-500/50">Free Tier</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 z-50">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden rounded-xl bg-white/5"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden sm:flex items-center gap-4">
               <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/10">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black uppercase tracking-widest italic">ZamPortal <span className="text-emerald-500">Assistant</span></h1>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden lg:flex bg-emerald-600 border-none hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest italic shadow-lg shadow-emerald-600/20">
              <Shield className="mr-2 h-4 w-4" /> Official Help
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col w-full relative">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 scroll-smooth pb-48"
          >
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl",
                  msg.role === "user" ? "bg-white/10" : "bg-emerald-600"
                )}>
                  {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
                </div>
                
                <div className={cn(
                  "max-w-[80%] space-y-4",
                  msg.role === "user" ? "text-right" : "text-left"
                )}>
                <div className={cn(
                  "p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-base sm:text-lg leading-relaxed font-medium shadow-2xl backdrop-blur-3xl border",
                  msg.role === "user" 
                    ? "bg-emerald-600/10 border-emerald-500/20 rounded-tr-none text-emerald-50" 
                    : "bg-white/5 border-white/10 rounded-tl-none text-white/90"
                )}>
                  {msg.content}
                </div>

                  {msg.services && msg.services.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      {msg.services.map((service, sidx) => (
                        <Link 
                          key={sidx}
                          to={service.portal_slug ? `/${service.portal_slug}/apply/${service.slug}` : "/services"}
                          className="group bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 p-6 rounded-2xl transition-all flex flex-col justify-between animate-in zoom-in-95 duration-500 delay-200"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge className="bg-emerald-600/20 text-emerald-400 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg">
                                {service.category_name}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">{service.title}</h4>
                            <p className="text-xs text-white/40 mt-2 leading-relaxed line-clamp-2">{service.reason}</p>
                          </div>
                          <div className="mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-500 group-hover:translate-x-2 transition-transform">
                            Open Service <ArrowRight className="ml-2 h-3 w-3" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-6 animate-pulse max-w-4xl mx-auto w-full">
                <div className="h-12 w-12 rounded-2xl bg-white/10" />
                <div className="space-y-3 pt-2 w-full max-w-lg">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-16 bg-white/5 rounded-3xl w-full" />
                </div>
              </div>
            )}

            {canSuggest && !isLoading && (
              <div className="max-w-4xl mx-auto w-full py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-[2.5rem] p-8 text-center backdrop-blur-3xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                   <Bot className="h-12 w-12 text-emerald-500 mx-auto mb-6" />
                   <h3 className="text-xl font-black uppercase tracking-widest italic mb-2">Couldn't find what you need?</h3>
                   <p className="text-white/60 text-base mb-8 max-w-lg mx-auto leading-relaxed">
                     I've searched all government records but couldn't find a direct match. 
                     Would you like me to help you **suggest this service** to the ZamPortal administrators?
                   </p>
                   <Button 
                    onClick={handleStartSuggestion}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-14 px-10 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-emerald-600/20"
                   >
                     Help me suggest this service
                   </Button>
                </div>
              </div>
            )}

            {(isCrafting || suggestion) && (
              <div className="max-w-4xl mx-auto w-full py-12 animate-in fade-in zoom-in-95 duration-700">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl relative">
                  {isCrafting ? (
                    <div className="text-center py-10 space-y-6">
                      <RefreshCw className="h-12 w-12 text-emerald-500 mx-auto animate-spin" />
                      <h3 className="text-lg font-black uppercase tracking-widest animate-pulse">Crafting a professional message...</h3>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center">
                          <FileSearch className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Service Proposal</h4>
                          <h3 className="text-xl font-bold">{suggestion.suggested_service}</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/20">AI-Crafted Message for Admin</label>
                        <div className="bg-black/40 border border-white/5 p-8 rounded-3xl italic text-white/70 leading-relaxed font-medium">
                          "{suggestion.crafted_message}"
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4">
                        <p className="text-[10px] text-white/30 font-bold max-w-[200px]">This message will be sent to the Digital Transformation Department.</p>
                        <Button 
                          disabled={isSubmitting || hasSubmitted}
                          onClick={handleFinalSubmit}
                          className={cn(
                            "rounded-2xl h-14 px-10 font-black uppercase tracking-[0.2em] text-[10px] transition-all",
                            hasSubmitted ? "bg-green-600 hover:bg-green-600" : "bg-emerald-600 hover:bg-emerald-500"
                          )}
                        >
                          {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                          {hasSubmitted ? "Thank You! Sent" : "Submit Suggestion"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Bar Overlay */}
          <div className="p-4 sm:p-8 bg-gradient-to-t from-[#050A0F] via-[#050A0F] to-transparent absolute bottom-0 left-0 right-0 z-10">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
              className="max-w-4xl mx-auto relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-3xl sm:rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-[#0A141D] border border-white/10 rounded-2xl sm:rounded-[2.5rem] p-1 sm:p-2 flex items-center shadow-2xl">
                <Input 
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="bg-transparent border-none focus-visible:ring-0 text-base sm:text-lg px-4 sm:px-8 h-12 sm:h-16 placeholder:text-white/20 font-medium"
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 flex-shrink-0 transition-all hover:scale-110 active:scale-95"
                >
                  <Send className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-0 w-1/2 h-1/2 bg-emerald-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-1/2 h-1/2 bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}
