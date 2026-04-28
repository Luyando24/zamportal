import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  ArrowLeft, FileText, Clock, CheckCircle, 
  History, Loader2, AlertCircle, ShieldCheck,
  MessageSquare, ExternalLink, Calendar, Info
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  tracking_number: string;
  service_title: string;
  status: string;
  form_data: Record<string, any>;
  created_at: string;
  notes?: string;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string;
  created_at: string;
  changed_by_name: string;
}

const ApplicationStatus = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<Application | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLabels, setFormLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [appId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const savedSession = localStorage.getItem('zamportal_session');
      let token = null;
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          token = parsed.tokens?.accessToken;
        } catch (e) {}
      }

      const headers = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      };

      // Fetch application details
      const appRes = await fetch(`/api/applications/${appId}`, { headers });
      if (!appRes.ok) throw new Error("Could not retrieve application data");
      const appData = await appRes.json();
      setApp(appData);

      // Fetch history
      const historyRes = await fetch(`/api/applications/${appId}/history`, { headers });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }

      // Fetch forms to get labels
      const formsRes = await fetch(`/api/forms/${appData.portal_id}/${appData.service_id}`, { headers });
      if (formsRes.ok) {
        const forms = await formsRes.json();
        const labels: Record<string, string> = {};
        forms.forEach((f: any) => {
          if (Array.isArray(f.form_definition)) {
            f.form_definition.forEach((field: any) => {
              labels[field.id] = field.label;
            });
          }
        });
        setFormLabels(labels);
      }
    } catch (error: any) {
      toast.error(error.message);
      navigate("/my-portal");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-full w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/my-portal")}
            className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 border-l pl-4">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">
                {app.service_title}
                {app.form_name && <span className="text-emerald-500 ml-2">— {app.form_name}</span>}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">TRACKING: {app.tracking_number}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-slate-100 dark:border-slate-800">
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
              <Badge className={cn("mt-0.5 font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full border-none shadow-sm", getStatusStyles(app.status))}>
                {app.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Progress & Details */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Status Summary Card */}
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <div className={cn("h-3 w-full", getStatusStyles(app.status).split(' ')[0])} />
              <CardContent className="p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <Calendar className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submitted on {new Date(app.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-tight">
                      Your application is <br />
                      <span className={cn("px-2", getStatusStyles(app.status).split(' ')[1].replace('text-', 'bg-opacity-10 text-'))}>
                        {app.status.replace(/-/g, ' ')}
                      </span>
                    </h2>
                  </div>
                  
                  <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-4 text-center min-w-[240px]">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner">
                       {app.status === 'approved' ? <CheckCircle className="h-8 w-8 text-emerald-500" /> : <Clock className="h-8 w-8 text-blue-500 animate-pulse" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estimated Completion</p>
                      <p className="font-bold text-slate-600 dark:text-slate-300">Subject to review</p>
                    </div>
                  </div>
                </div>

                {app.notes && (
                  <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex gap-4">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg h-fit">
                      <MessageSquare className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Message from Government Officer</p>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed italic">"{app.notes}"</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submission Content */}
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="p-10 border-b border-slate-50 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">Application Data</CardTitle>
                    <CardDescription>Verify the information you submitted for this service.</CardDescription>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <FileText className="h-5 w-5 text-slate-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {Object.entries(app.form_data || {}).map(([key, value]) => (
                    <div key={key} className="space-y-2 group">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-emerald-500 transition-colors">
                        {formLabels[key] || key.replace(/_/g, ' ')}
                      </p>
                      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-12 p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                    <Info className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">Need to make a change?</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">If you noticed an error in your submission, please contact the department directly using your tracking number.</p>
                  </div>
                  <Button variant="outline" className="rounded-xl border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-600 font-bold">
                    Contact Department
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Audit Trail */}
          <div className="space-y-10">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900 h-full min-h-[600px]">
              <CardHeader className="p-8 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <History className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase italic tracking-tight">Live Tracker</CardTitle>
                    <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Status Audit History</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative space-y-10">
                  {/* Vertical Progress Line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  
                  {history.map((item, idx) => (
                    <div key={item.id} className="relative pl-12 animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                      {/* Step Indicator */}
                      <div className={cn(
                        "absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center transition-all shadow-sm",
                        idx === 0 ? "bg-emerald-500 scale-110" : "bg-slate-200 dark:bg-slate-700"
                      )}>
                        {idx === 0 ? <CheckCircle className="h-3 w-3 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
                      </div>

                      {/* Content Card */}
                      <div className={cn(
                        "rounded-xl p-6 border transition-all",
                        idx === 0 
                          ? "bg-emerald-50/50 border-emerald-100 shadow-sm" 
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <Badge className={cn("font-black text-[9px] uppercase tracking-widest border-none px-3 py-1", getStatusStyles(item.status))}>
                            {item.status}
                          </Badge>
                          <span className="text-[10px] font-bold text-slate-500">{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        
                        {item.notes ? (
                          <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Message from Government Officer</p>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 italic leading-relaxed">"{item.notes}"</p>
                          </div>
                        ) : (
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status automated transition</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Initial Step */}
                  <div className="relative pl-12">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Initial Submission</p>
                      <p className="text-[10px] font-bold text-slate-300 mt-1">{new Date(app.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

const getStatusStyles = (status: string) => {
  const s = status.toLowerCase();
  if (['approved', 'completed', 'delivered'].includes(s)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400";
  if (['processing', 'shipped'].includes(s)) return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
  if (['under-review', 'submitted'].includes(s)) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400";
  if (['payment-pending', 'additional-info-required'].includes(s)) return "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400";
  if (['ready-for-collection'].includes(s)) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400";
  if (s === 'rejected') return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
};

export default ApplicationStatus;
