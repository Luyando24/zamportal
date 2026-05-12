import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, ArrowRight, RotateCcw, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  services?: any[];
}

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hello! I am your **ZamPortal Assistant**. \n\nI can help you find government services, explain application procedures, and guide you through institutional requirements. How can I assist you today?"
        }
      ]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (text?: string) => {
    const content = text || inputValue;
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/recommend-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: content,
          history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
        })
      });
      
      const data = await res.json();
      const fullResponse = data.response || "I've found some services that might help you.";
      const services = data.services || [];
      
      let typedResponse = "";
      const placeholderMessage: Message = {
        role: "assistant",
        content: "",
        services: []
      };
      
      setMessages(prev => [...prev, placeholderMessage]);
      setIsLoading(false);

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
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Assistant encountered an error.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out",
        isOpen ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0"
      )}>
        <Button 
          onClick={toggleChat} 
          className="rounded-full w-16 h-16 bg-emerald-600 hover:bg-emerald-700 shadow-2xl hover:shadow-emerald-600/40 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="w-8 h-8 text-white relative z-10 group-hover:scale-110 transition-transform" />
        </Button>
        <div className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-20 -z-10"></div>
      </div>

      {/* AI Assistant Window */}
      <div className={cn(
        "fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border border-slate-200 dark:border-slate-800 overflow-hidden",
        isOpen ? "opacity-100 transform scale-100 translate-y-0" : "opacity-0 transform scale-95 translate-y-10 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-emerald-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-emerald-50" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest italic">ZamPortal <span className="text-emerald-100">AI</span></h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-emerald-50 uppercase tracking-widest opacity-80">Online Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 relative z-10">
            <Button 
              onClick={() => navigate('/assistant')} 
              variant="ghost" size="icon" 
              className="text-white hover:bg-white/20 rounded-xl h-9 w-9"
              title="Open full page assistant"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button onClick={toggleChat} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl h-9 w-9">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto space-y-6 scroll-smooth bg-slate-50/50 dark:bg-slate-900/50"
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={cn(
              "flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "px-4 py-3 rounded-2xl max-w-[85%] text-sm font-medium shadow-sm",
                msg.role === 'user' 
                  ? "bg-emerald-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
              )}>
                <div className={cn(
                  "prose prose-sm max-w-none",
                  msg.role === 'user' ? "prose-invert" : "dark:prose-invert"
                )}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>

              {/* Service Cards inside chat */}
              {msg.services && msg.services.length > 0 && (
                <div className="flex flex-col gap-2 w-full mt-2">
                  {msg.services.map((service, sidx) => (
                    <Link 
                      key={sidx}
                      to={service.portal_slug ? `/${service.portal_slug}/apply/${service.slug}` : "/services"}
                      className="group bg-white dark:bg-slate-800 border border-emerald-500/10 hover:border-emerald-500/30 p-3 rounded-xl transition-all flex items-center justify-between"
                    >
                      <div className="flex-1 pr-4">
                        <p className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter mb-1">{service.category_name}</p>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">{service.title}</h4>
                      </div>
                      <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-slate-400" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded-full" />
                <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 transition-all">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="How can I help you?"
              className="flex-1 px-3 bg-transparent border-none focus:outline-none text-sm font-medium py-2"
            />
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={!inputValue.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl w-10 h-10 p-0 shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Official AI Engine</span>
            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;