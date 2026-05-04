import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, Edit2, Trash2, Loader2, MoreVertical, 
  ArrowRight, Download, Filter, FileText, Calendar, CheckSquare,
  Eye, Clock, History, User, CheckCircle2, XCircle, ArrowLeft
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Api } from "@/lib/api";

interface Field {
  id?: string;
  name?: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
  required?: boolean;
  options?: string[];
  validation_regex?: string;
  placeholder?: string;
  field_description?: string;
}

interface Module {
  id: string;
  name: string;
  slug: string;
  singular_entity?: string;
  description: string;
  icon: string;
  schema_definition: Field[];
}

export default function ResourceManager({ module, portalId }: { module: Module, portalId?: string }) {
  const singular = module.singular_entity || module.name.split(' ').pop() || "Record";
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUpdatingModule, setIsUpdatingModule] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const fieldsPerStep = 4;
  const totalSteps = Math.ceil(module.schema_definition.length / fieldsPerStep);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [viewingRecord, setViewingRecord] = useState<any>(null);
  const { isStaff, isAdmin, isSuperAdmin } = useAuth();

  const canManageAll = isAdmin || isSuperAdmin;
  const isSelfServiceOnly = isStaff && !canManageAll;

  useEffect(() => {
    fetchData();
  }, [module.slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let result;
      if (isSelfServiceOnly) {
        result = await Api.getMyModuleData(module.slug);
      } else {
        result = await Api.listModuleData(module.slug, portalId);
      }
      setData(result);
    } catch (e) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    for (const field of module.schema_definition) {
      const fieldKey = field.id || field.name || "";
      const val = formData[fieldKey];
      
      if (field.required && (val === undefined || val === "")) {
        // Skip validation for status if it's hidden for employees (handled automatically)
        if (isSelfServiceOnly && fieldKey.toLowerCase() === 'status') continue;
        
        toast.error(`${field.label} is required`);
        return;
      }
      
      if (val && field.validation_regex) {
        try {
          const regex = new RegExp(field.validation_regex);
          if (!regex.test(String(val))) {
            toast.error(`Invalid format for ${field.label}`);
            return;
          }
        } catch (e) {
          console.error("Invalid regex:", field.validation_regex);
        }
      }
    }

    try {
      if (editingId) {
        await Api.updateModuleData(editingId, formData, portalId);
        toast.success(`${singular} updated`);
      } else {
        // Default status to Pending for self-service creation if status field exists in schema
        const hasStatusField = module.schema_definition.some(f => (f.id || f.name || "").toLowerCase() === 'status');
        const finalData = (isSelfServiceOnly && hasStatusField) ? { ...formData, status: 'Pending' } : formData;
        
        await Api.createModuleData(module.slug, finalData, portalId);
        toast.success(`${singular} created`);
      }
      
      setIsDialogOpen(false);
      fetchData();
      setFormData({});
      setEditingId(null);
    } catch (e) {
      toast.error(`Failed to save ${singular.toLowerCase()}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${singular.toLowerCase()}?`)) return;
    try {
      await Api.deleteModuleData(id);
      toast.success(`${singular} deleted`);
      fetchData();
    } catch (e) {
      toast.error(`Failed to delete ${singular.toLowerCase()}`);
    }
  };

  const filteredData = data.filter(item => {
    const searchStr = JSON.stringify(item.data).toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{module.name}</h2>
          <p className="text-slate-500 font-medium">{module.description}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="rounded-xl border-slate-200 dark:border-slate-800">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) { setEditingId(null); setFormData({}); setCurrentStep(0); }
          }}>
            <DialogTrigger asChild>
              {(!isSelfServiceOnly || module.slug === 'leave-management') && (
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg font-bold">
                  <Plus className="h-4 w-4 mr-2" /> {isSelfServiceOnly ? 'Apply' : 'Add'} {singular}
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{editingId ? 'Edit' : 'New'} {singular}</DialogTitle>
                <DialogDescription>
                  {totalSteps > 1 ? `Step ${currentStep + 1} of ${totalSteps}: ` : ""}
                  Fill in the details below to manage this {singular.toLowerCase()}.
                </DialogDescription>
                {totalSteps > 1 && (
                  <div className="flex gap-1 mt-4">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-all duration-500",
                          i <= currentStep ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "bg-slate-100 dark:bg-slate-800"
                        )}
                      />
                    ))}
                  </div>
                )}
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 min-h-[300px]">
                {module.schema_definition
                  .slice(currentStep * fieldsPerStep, (currentStep + 1) * fieldsPerStep)
                  .map((field) => {
                  const fieldKey = field.id || field.name || "";
                  
                  // Hide status field for employees (only admins can change status)
                  if (isSelfServiceOnly && fieldKey.toLowerCase() === 'status') {
                    return null;
                  }

                  return (
                    <div key={fieldKey} className={cn("space-y-2", (field.type === 'textarea') && "md:col-span-2")}>
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <Textarea 
                          value={formData[fieldKey] || ""}
                          onChange={(e) => setFormData({...formData, [fieldKey]: e.target.value})}
                          className="rounded-2xl bg-slate-50 dark:bg-slate-900 border-none"
                          placeholder={field.placeholder || "Enter details..."}
                          rows={4}
                        />
                      ) : field.type === 'select' ? (
                        <select 
                          value={formData[fieldKey] || ""}
                          onChange={(e) => setFormData({...formData, [fieldKey]: e.target.value})}
                          className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                        >
                          <option value="">Select...</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <Input 
                          type={field.type}
                          value={formData[fieldKey] || ""}
                          onChange={(e) => {
                            let val = e.target.value;
                            
                            // Auto-format NRC (XXXXXX/XX/X)
                            if (fieldKey === 'nrc' || field.placeholder === 'XXXXXX/XX/X') {
                              const cleaned = val.replace(/\D/g, '').slice(0, 9);
                              if (cleaned.length > 6) {
                                val = cleaned.slice(0, 6) + '/' + cleaned.slice(6, 8);
                                if (cleaned.length > 8) {
                                  val += '/' + cleaned.slice(8, 9);
                                }
                              } else {
                                val = cleaned;
                              }
                            }
                            
                            setFormData({...formData, [fieldKey]: val});
                          }}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                          className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
                        />
                      )}
                      {field.field_description && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1">{field.field_description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <DialogFooter className="flex flex-row gap-3 sm:justify-between">
                {currentStep > 0 ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep(prev => prev - 1)} 
                    className="flex-1 h-12 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                  >
                    Previous Step
                  </Button>
                ) : <div className="flex-1" />}
                
                {currentStep < totalSteps - 1 ? (
                  <Button 
                    onClick={() => {
                      // Basic validation for current step
                      const stepFields = module.schema_definition.slice(currentStep * fieldsPerStep, (currentStep + 1) * fieldsPerStep);
                      for (const f of stepFields) {
                        const fieldKey = f.id || f.name || "";
                        const val = formData[fieldKey];
                        
                        if (f.required && (val === undefined || val === "")) {
                          // Skip validation for status if it's hidden for employees
                          if (isSelfServiceOnly && fieldKey.toLowerCase() === 'status') continue;
                          
                          toast.error(`${f.label} is required`);
                          return;
                        }
                      }
                      setCurrentStep(prev => prev + 1);
                    }} 
                    className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={handleSave} className="flex-1 h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                    {editingId ? 'Update Record' : isSelfServiceOnly ? 'Submit Request' : 'Create Record'}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!viewingRecord && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600"><FileText className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total {module.name}</p>
                <p className="text-2xl font-black">{data.length}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600"><Clock className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Review</p>
                <p className="text-2xl font-black">{data.filter(d => d.data.status?.toLowerCase() === 'pending').length}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[28px] p-6 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-600"><CheckCircle2 className="h-6 w-6" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approved/Active</p>
                <p className="text-2xl font-black">{data.filter(d => ['approved', 'active', 'completed'].includes(d.data.status?.toLowerCase())).length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder={`Search ${module.name.toLowerCase()}...`}
          className="h-14 pl-12 rounded-2xl border-none shadow-sm bg-white dark:bg-slate-900 font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Data Module...</p>
            </div>
          ) : viewingRecord ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setViewingRecord(null)} className="rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h3 className="text-xl font-black">{singular} Details</h3>
                    <p className="text-xs text-slate-500 font-medium">Record ID: {viewingRecord.id}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {canManageAll && (
                    <Button 
                      variant="outline" 
                      className="rounded-xl font-bold border-slate-200"
                      onClick={() => {
                        setEditingId(viewingRecord.id);
                        setFormData(viewingRecord.data);
                        setViewingRecord(null);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-2" /> Edit Record
                    </Button>
                  )}
                  <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700" onClick={() => setViewingRecord(null)}>
                    Done
                  </Button>
                </div>
              </div>
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {module.schema_definition.map(f => {
                      const fieldKey = f.id || f.name || "";
                      const value = viewingRecord.data[fieldKey];
                      if (fieldKey.toLowerCase() === 'status') return null;
                      
                      return (
                        <div key={fieldKey} className={cn("space-y-1.5", (f.type === 'textarea') && "md:col-span-2")}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{f.label}</label>
                          <div className={cn(
                            "p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-200",
                            f.type === 'textarea' && "min-h-[100px]"
                          )}>
                            {String(value || "Not provided")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-6">
                  <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-800/50 rounded-[32px] overflow-hidden">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        {['approved', 'completed'].includes(viewingRecord.data.status?.toLowerCase()) ? (
                          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="h-6 w-6" /></div>
                        ) : ['rejected', 'cancelled'].includes(viewingRecord.data.status?.toLowerCase()) ? (
                          <div className="p-3 rounded-xl bg-red-500/10 text-red-500"><XCircle className="h-6 w-6" /></div>
                        ) : (
                          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><Clock className="h-6 w-6" /></div>
                        )}
                        <div>
                          <p className="text-xl font-black text-slate-800 dark:text-white capitalize">{viewingRecord.data.status || 'Pending'}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Last updated: {new Date(viewingRecord.updated_at || viewingRecord.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {canManageAll && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Update Status</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              variant="outline" 
                              className="h-12 rounded-xl font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => {
                                const newStatus = 'Approved';
                                Api.updateModuleData(viewingRecord.id, { ...viewingRecord.data, status: newStatus }, portalId)
                                  .then(() => {
                                    toast.success("Status updated to Approved");
                                    fetchData();
                                    setViewingRecord(prev => ({ ...prev, data: { ...prev.data, status: newStatus } }));
                                  });
                              }}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              className="h-12 rounded-xl font-bold border-red-100 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                const newStatus = 'Rejected';
                                Api.updateModuleData(viewingRecord.id, { ...viewingRecord.data, status: newStatus }, portalId)
                                  .then(() => {
                                    toast.success("Status updated to Rejected");
                                    fetchData();
                                    setViewingRecord(prev => ({ ...prev, data: { ...prev.data, status: newStatus } }));
                                  });
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <History className="h-4 w-4" /> Activity Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-3 relative pb-4 after:absolute after:left-[7px] after:top-[24px] after:bottom-0 after:w-[2px] after:bg-slate-50 last:after:hidden">
                        <div className="w-4 h-4 rounded-full bg-blue-500 mt-1 z-10" />
                        <div>
                          <p className="text-xs font-bold">Record Created</p>
                          <p className="text-[10px] text-slate-400">{new Date(viewingRecord.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-4 h-4 rounded-full bg-slate-200 mt-1" />
                        <div>
                          <p className="text-xs font-bold text-slate-400">System Validated</p>
                          <p className="text-[10px] text-slate-300">Automated Check</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-medium">No records found in this module yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {module.schema_definition.slice(0, 3).map(f => (
                      <th key={f.name} className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{f.label}</th>
                    ))}
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Created</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      {module.schema_definition.slice(0, 3).map(f => {
                        const fieldKey = f.id || f.name || "";
                        return (
                          <td key={fieldKey} className="px-8 py-5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {String(item.data[fieldKey] || "-")}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-8 py-5">
                        <Badge variant="outline" className={cn(
                          "font-bold text-[10px] px-3 py-1 border-none",
                          ['approved', 'completed'].includes(item.data.status?.toLowerCase()) ? 'bg-emerald-500/10 text-emerald-600' :
                          ['rejected', 'cancelled'].includes(item.data.status?.toLowerCase()) ? 'bg-red-500/10 text-red-600' :
                          'bg-blue-500/10 text-blue-600'
                        )}>
                          {item.data.status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-4 rounded-xl font-bold text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setViewingRecord(item)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600"
                            onClick={() => {
                              setEditingId(item.id);
                              setFormData(item.data);
                              setIsDialogOpen(true);
                            }}
                            disabled={isSelfServiceOnly && item.data.status !== 'Pending' && module.slug === 'leave-management'}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {canManageAll && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
