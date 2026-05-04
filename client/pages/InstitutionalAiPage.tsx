import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Bot, Send, User, Sparkles, ArrowLeft, RefreshCw, 
  MessageSquare, History, Shield, Info, ArrowRight, 
  X, Menu, FileText, Zap, ShieldCheck, Download, 
  Search, Settings, Plus, Copy, Check, Paperclip, Loader2,
  ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal,
  Square, Brain, Cpu, ChevronDown, Trash2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Api } from "@/lib/api";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { marked } from "marked";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

export default function InstitutionalAiPage() {
  const { portalSlug } = useParams();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("openai");
  const [isAiEnabled, setIsAiEnabled] = useState<boolean | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [thinkingStage, setThinkingStage] = useState(0);
  const thinkingStages = [
    "Analyzing institutional context...",
    "Reviewing relevant Zambian regulations...",
    "Scanning document repository...",
    "Structuring advisory response...",
    "Finalizing drafting..."
  ];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch portal details and modules
  useEffect(() => {
    const initPage = async () => {
      if (!portalSlug) return;
      
      try {
        const portalData = await Api.getPortalConfig(portalSlug);
        setPortal(portalData);
        
        // Fetch modules for this portal
        const modules = await Api.listModules(portalData.id);
        const aiModule = modules.find((m: any) => m.slug === 'institutional-ai');
        setIsAiEnabled(aiModule?.is_enabled ?? false);
        
      } catch (err: any) {
        console.error("Failed to initialize AI Advisor:", err);
        toast.error("Failed to load institutional context");
      } finally {
        setIsInitialLoading(false);
      }
    };

    initPage();
  }, [portalSlug]);

  // Load AI config
  useEffect(() => {
    Api.getAiConfig().then(config => {
      setAvailableModels(config.availableModels);
      if (config.defaultModel && config.availableModels.includes(config.defaultModel)) {
        setSelectedModel(config.defaultModel);
      } else if (config.availableModels.includes("groq")) {
        setSelectedModel("groq");
      } else if (config.availableModels.length > 0) {
        setSelectedModel(config.availableModels[0]);
      }
    });
  }, []);

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

  // Load conversations from localStorage (portal specific)
  useEffect(() => {
    if (portalSlug) {
      const saved = localStorage.getItem(`zamportal_ai_${portalSlug}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConversations(parsed);
          if (parsed.length > 0) {
            setActiveId(parsed[0].id);
            setMessages(parsed[0].messages);
          }
        } catch (e) {
          console.error("Failed to load chats:", e);
        }
      } else {
        startNewChat();
      }
    }
  }, [portalSlug]);

  // Save conversations to localStorage
  useEffect(() => {
    if (portalSlug && conversations.length > 0) {
      localStorage.setItem(`zamportal_ai_${portalSlug}`, JSON.stringify(conversations));
    }
  }, [conversations, portalSlug]);

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
      title: "New Advisory Session",
      messages: [
        {
          role: "assistant",
          content: portal 
            ? `Hello! I am the **${portal.name} Assistant**. 

I am here to assist you with:
- **Institutional Workflows**: Guidance on internal processes, policies, and regulations.
- **Document Analysis**: Summarizing reports, identifying risks in contracts, and analyzing data.
- **Administrative Drafting**: Professional memos, budget justifications, and official correspondence.

How can I help you today?`
            : "Hello! I am your Institutional Assistant. How can I help you today?",
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

  const handleSendMessage = async (retryInput?: string) => {
    const messageContent = retryInput || input;
    if (!messageContent.trim() || !activeId || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString()
    };

    let newMessages = [...messages];
    if (!retryInput) {
      newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
    }
    
    setIsLoading(true);

    try {
      const res = await Api.institutionalChat({
        portalName: portal?.name || portalSlug || "Institution",
        portalDescription: portal?.description || "",
        message: messageContent,
        history: messages.slice(-10),
        model: selectedModel
      });
      
      const fullResponse = res.response;
      let typedResponse = "";
      
      const placeholderMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, placeholderMessage]);
      setIsLoading(false); // Stop "thinking" stage once response starts typing

      const words = fullResponse.split(" ");
      for (let i = 0; i < words.length; i++) {
        typedResponse += words[i] + (i === words.length - 1 ? "" : " ");
        setMessages(prev => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: typedResponse
            };
          }
          return next;
        });
        // Variable typing speed for more natural feel
        const delay = words[i].length > 8 ? 40 : 25;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Final update to conversations list with full content
      setConversations(prev => prev.map(c => {
        if (c.id === activeId) {
          const updatedMessages = [...newMessages, { 
            role: "assistant" as const, 
            content: fullResponse, 
            timestamp: new Date().toISOString() 
          }];
          return {
            ...c,
            title: c.title === "New Advisory Session" ? messageContent.substring(0, 30) + (messageContent.length > 30 ? "..." : "") : c.title,
            messages: updatedMessages,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Failed to get response from AI assistant");
      setIsLoading(false);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      // Convert markdown to HTML for rich text clipboard support
      const htmlContent = await marked.parse(content);
      
      // Wrap in a div with standard document styling for better pasting into Word/Docs
      const richHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; color: #000000; line-height: 1.6;">
          ${htmlContent}
        </div>
      `;

      const blobHtml = new Blob([richHtml], { type: 'text/html' });
      const blobText = new Blob([content], { type: 'text/plain' });
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        })
      ]);

      toast.success("Copied with formatting", {
        duration: 1500,
        style: { background: '#333', color: '#fff', border: 'none' }
      });
    } catch (err) {
      console.error("Failed to copy rich text:", err);
      // Fallback to plain text if ClipboardItem API or marked fails
      navigator.clipboard.writeText(content);
      toast.success("Copied as plain text");
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

  const handleRetry = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      // Remove last assistant message if it was the last one
      if (messages[messages.length - 1].role === 'assistant') {
        setMessages(prev => prev.slice(0, -1));
      }
      handleSendMessage(lastUserMessage.content);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (isAiEnabled === false) {
    return (
      <div className="min-h-screen bg-[#171717] text-white flex flex-col items-center justify-center p-6 text-center">
         <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-8 border border-white/10">
           <Sparkles className="h-10 w-10 text-white/40" />
         </div>
         <h2 className="text-2xl font-bold mb-2">Assistant Offline</h2>
         <p className="text-white/40 max-w-sm text-sm leading-relaxed mb-8">
           The Institutional Assistant module is currently disabled for {portal?.name}. 
         </p>
         <Button 
          onClick={() => navigate(`/dashboard/${portalSlug}`)}
          className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 px-6 font-medium text-xs transition-all"
         >
           <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
         </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec] flex font-sans overflow-hidden h-[100dvh] text-sm">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Minimal Sidebar - Dark Mode Aesthetic */}
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
          
          <div className="relative group/search">
            <Search className="h-4 w-4 absolute left-3 top-3 text-white/20 group-focus-within/search:text-white/60 transition-colors" />
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border-none rounded-lg h-10 pl-10 pr-4 text-xs font-medium placeholder:text-white/20 focus:ring-1 focus:ring-white/10 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-hide">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Recent</span>
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
            <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold">
              {portal?.name?.substring(0, 2).toUpperCase() || "ZP"}
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold truncate">{portal?.name}</p>
              <p className="text-[10px] text-white/40 font-medium">Institutional Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Minimal Header */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 z-50">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/5 mr-1"
              onClick={() => navigate(`/dashboard/${portalSlug}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-8 w-8 text-white/60"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer">
              <span className="text-sm font-medium text-white/60">{portal?.name} Assistant</span>
              <Badge variant="outline" className="text-[9px] border-white/10 text-white/40 h-4 px-1.5 uppercase font-bold tracking-tighter">Pro</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-white/60 hover:text-white">
              Share
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
                      {/* Avatar for assistant - small and minimal */}
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
                          prose-ul:my-4 prose-li:my-1
                        ">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                        
                        {/* Action Buttons below response */}
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
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white/5 text-white/40">
                            <ThumbsDown className="h-3.5 w-3.5" />
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
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-500/60 ml-2 animate-pulse">
                      Assistant is thinking
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white/30 italic">
                    {thinkingStages[thinkingStage]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Minimal Floating Input Bar */}
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
                  placeholder={`Reply to ${portal?.name} Assistant...`}
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
                {portal?.name} Assistant can make mistakes. Please check important info.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
