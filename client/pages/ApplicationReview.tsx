import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { 
  ArrowLeft, FileText, Clock, CheckCircle, 
  ChevronRight, Activity, Shield, User,
  History, Send, Loader2, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  tracking_number: string;
  service_title: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  form_data: Record<string, any>;
  created_at: string;
}

interface StatusHistory {
  id: string;
  status: string;
  notes: string;
  created_at: string;
  changed_by_name: string;
}

const ApplicationReview = () => {
  const { portalSlug, appId } = useParams();
  const navigate = useNavigate();
  const { session, isSuperAdmin } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState("");
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
      if (!appRes.ok) throw new Error("Application not found or access denied");
      const appData = await appRes.json();
      
      // Security check: Institutional admins can only review applications in their portal
      const userPortalId = session?.user?.app_metadata?.portal_id;
      if (!isSuperAdmin && userPortalId && userPortalId !== appData.portal_id) {
        toast.error("Unauthorized: You do not have access to this application");
        navigate("/my-portal");
        return;
      }
      
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
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (status: string) => {
    setPendingStatus(status);
    setStatusNote("");
    setNoteDialogOpen(true);
  };

  const updateStatus = async (status: string, notes: string = "") => {
    setUpdating(true);
    try {
      const savedSession = localStorage.getItem('zamportal_session');
      let token = null;
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          token = parsed.tokens?.accessToken;
        } catch (e) {}
      }

      const res = await fetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, notes })
      });

      if (res.ok) {
        toast.success(`Application updated to ${status}`);
        fetchData(); // Refresh data
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUpdating(false);
      setNoteDialogOpen(false);
      setPendingStatus(null);
      setStatusNote("");
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
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/dashboard/${portalSlug}`)}
            className="rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 border-l pl-4">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight leading-none">
                {app.service_title}
                {app.form_name && <span className="text-emerald-500 ml-2">— {app.form_name}</span>}
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1">Ref: {app.tracking_number}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
            <Badge className={cn("mt-1 font-black text-[10px] uppercase tracking-widest px-4 py-1 rounded-full border-none shadow-sm", getStatusStyles(app.status))}>
              {app.status}
            </Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Action Bar */}
            <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600">Decision Engine</CardTitle>
                <CardDescription className="text-lg font-medium">Update the operational status of this request.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Under Review', status: 'under-review', icon: Clock },
                    { label: 'Ask Info', status: 'additional-info-required', icon: AlertCircle },
                    { label: 'Await Payment', status: 'payment-pending', icon: Activity },
                    { label: 'Processing', status: 'processing', icon: Loader2 },
                    { label: 'Ready', status: 'ready-for-collection', icon: CheckCircle },
                    { label: 'Shipped', status: 'shipped', icon: Send },
                  ].map((btn) => (
                    <Button 
                      key={btn.status}
                      variant="outline" 
                      disabled={updating}
                      className={cn(
                        "h-20 flex-col gap-2 rounded-2xl border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group",
                        app.status === btn.status && "bg-emerald-50 border-emerald-200 text-emerald-600"
                      )}
                      onClick={() => handleStatusClick(btn.status)}
                    >
                      <btn.icon className={cn("h-5 w-5", app.status === btn.status ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500")} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{btn.label}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <Button 
                    variant="outline" 
                    disabled={updating}
                    className="flex-1 h-14 rounded-2xl border-red-100 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-xs"
                    onClick={() => handleStatusClick('rejected')}
                  >
                    Reject Application
                  </Button>
                  <Button 
                    disabled={updating}
                    className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20"
                    onClick={() => handleStatusClick('approved')}
                  >
                    Authorize Approval
                  </Button>
                </div>

                {/* Status Note Dialog */}
                <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                  <DialogContent className="rounded-2xl p-8 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                        {pendingStatus?.replace(/-/g, ' ')}
                      </DialogTitle>
                      <DialogDescription className="text-slate-500 font-medium">
                        {pendingStatus === 'additional-info-required' 
                          ? "Please specify exactly what information is missing from the applicant."
                          : "Add an optional note to this status update for the citizen to see."}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-6">
                      <Textarea 
                        placeholder={pendingStatus === 'additional-info-required' ? "Type the required information here..." : "Optional internal or external note..."}
                        className="rounded-2xl border-slate-100 min-h-[120px] focus-visible:ring-emerald-500"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                      />
                      {pendingStatus === 'additional-info-required' && !statusNote.trim() && (
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Note is mandatory for this status
                        </p>
                      )}
                    </div>

                    <DialogFooter className="gap-3">
                      <Button variant="ghost" className="font-bold rounded-xl" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-8"
                        disabled={updating || (pendingStatus === 'additional-info-required' && !statusNote.trim())}
                        onClick={() => pendingStatus && updateStatus(pendingStatus, statusNote)}
                      >
                        {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Update"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Application Content */}
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Applicant Identity</h3>
                    </div>
                    
                    <div className="grid gap-6">
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Legal Name</p>
                        <p className="text-xl font-bold">{app.first_name} {app.last_name}</p>
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Electronic Mail</p>
                        <p className="text-xl font-bold">{app.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Submission Data</h3>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(app.form_data || {}).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-1">
                            {formLabels[key] || key.replace(/_/g, ' ')}
                          </p>
                          <p className="font-bold text-right max-w-[200px]">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: History */}
          <div className="space-y-10">
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 h-full min-h-[600px]">
              <CardHeader className="p-8 bg-slate-900 text-white">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-400" />
                  Status Audit Trail
                </CardTitle>
                <CardDescription className="text-slate-400">Complete immutable record of changes.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="relative space-y-8">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  
                  {history.map((item, idx) => (
                    <div key={item.id} className="relative pl-10 animate-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                      <div className={cn(
                        "absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-sm",
                        idx === 0 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                      )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={cn("font-black text-[9px] uppercase tracking-widest border-none px-2", getStatusStyles(item.status))}>
                            {item.status}
                          </Badge>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {item.notes && <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 italic">"{item.notes}"</p>}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <User className="h-3 w-3 text-slate-500" />
                          </div>
                          <p className="text-[10px] font-bold text-slate-500">{item.changed_by_name || 'System'}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="relative pl-10">
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="p-5">
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
  if (['approved', 'completed', 'delivered'].includes(s)) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";
  if (['processing', 'shipped'].includes(s)) return "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
  if (['under-review', 'submitted'].includes(s)) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400";
  if (['payment-pending', 'additional-info-required'].includes(s)) return "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400";
  if (['ready-for-collection'].includes(s)) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400";
  if (s === 'rejected') return "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400";
  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
};

export default ApplicationReview;
