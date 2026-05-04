import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, Sparkles, User, Bot, Loader2, Paperclip, 
  Trash2, Copy, Check, MessageSquare, History, 
  FileText, Zap, ShieldCheck, Download, Search, Settings, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Api } from "@/lib/api";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function InstitutionalAI({ portalName, portalDescription }: { portalName: string, portalDescription?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("openai");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load AI config
    Api.getAiConfig().then(config => {
      setAvailableModels(config.availableModels);
      if (config.availableModels.includes("openai")) setSelectedModel("openai");
      else if (config.availableModels.length > 0) setSelectedModel(config.availableModels[0]);
    });

    // Add initial greeting
    setMessages([{
      role: 'assistant',
      content: `Hello! I am the **${portalName} Institutional AI Advisor**. I am here to assist you with institutional workflows, document analysis, and administrative drafting. \n\nHow can I help you today?`,
      timestamp: new Date()
    }]);
  }, [portalName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await Api.institutionalChat({
        portalName,
        portalDescription,
        message: input,
        history: messages.slice(-10), // Send last 10 messages for context
        model: selectedModel
      });

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: response.response, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      toast.error("Failed to get response from AI advisor");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex h-[calc(100vh-220px)] bg-slate-50 dark:bg-slate-900/50 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-500">
      {/* Sidebar - Chat History / Topics */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">Assistant Hub</h3>
          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-slate-400">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center gap-3 cursor-pointer ring-1 ring-blue-100 dark:ring-blue-900/50">
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-bold truncate">Current Advisory Session</span>
          </div>
          <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors group">
            <FileText className="h-4 w-4 group-hover:text-blue-500" />
            <span className="text-xs font-medium truncate">Document Analysis: Budget 2024</span>
          </div>
          <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-500 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors group">
            <ShieldCheck className="h-4 w-4 group-hover:text-blue-500" />
            <span className="text-xs font-medium truncate">Legal Review: Contract #882</span>
          </div>
        </div>
        <div className="p-6 border-t border-slate-50 dark:border-slate-800">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-3">
             <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span>Knowledge Scope</span>
               <Badge className="bg-blue-100 text-blue-600 text-[9px] px-1.5 h-4 border-none">Verified</Badge>
             </div>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
               Expert in {portalName} regulations, historical records, and administrative drafting.
             </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{portalName} AI</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Expert Advisor</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              {availableModels.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-slate-400">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scroll-smooth"
        >
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'assistant' 
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600"
              )}>
                {msg.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className={cn(
                "flex flex-col gap-2 group",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "p-5 rounded-3xl text-sm leading-relaxed shadow-sm",
                  msg.role === 'assistant' 
                    ? "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200" 
                    : "bg-blue-600 text-white font-medium"
                )}>
                  <div className="prose prose-slate dark:prose-invert max-w-none text-inherit prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-blue-400">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-medium text-slate-400">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button onClick={() => handleCopy(msg.content)} className="text-slate-400 hover:text-blue-500"><Copy className="h-3 w-3" /></button>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-6 max-w-4xl mx-auto animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-24 h-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-2" />
                <div className="h-20 w-[400px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-8 py-8 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-blue-500/5 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex flex-col bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[28px] p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40 transition-all">
              <Textarea
                placeholder={`Ask the ${portalName} Advisor... (e.g. "Draft a memo for budget review" or "Analyze this legal clause")`}
                className="bg-transparent border-none focus-visible:ring-0 resize-none py-4 px-6 text-sm font-medium min-h-[60px]"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
              />
              <div className="flex items-center justify-between px-4 pb-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-400">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-400">
                    <History className="h-5 w-5" />
                  </Button>
                  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Expert Mode</span>
                  </div>
                </div>
                <Button 
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center p-0"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            <p className="text-center mt-4 text-[10px] font-medium text-slate-400">
              Institutional AI can occasionally make mistakes. Verify important legal or financial documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
