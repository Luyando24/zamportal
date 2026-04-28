import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, Edit2, Trash2, Loader2, MoreVertical, 
  ArrowRight, Download, Filter, FileText, Calendar, CheckSquare
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Field {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'boolean';
  required?: boolean;
  options?: string[];
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

export default function ResourceManager({ module }: { module: Module }) {
  const singular = module.singular_entity || module.name.split(' ').pop() || "Record";
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [module.slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/modules/${module.slug}/data`);
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (e) {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    for (const field of module.schema_definition) {
      const val = formData[field.name];
      if (field.required && !val) {
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
      const method = editingId ? "PATCH" : "POST";
      const url = editingId 
        ? `/api/modules/data/${editingId}` 
        : `/api/modules/${module.slug}/data`;
        
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: formData })
      });
      
      if (res.ok) {
        toast.success(editingId ? `${singular} updated` : `${singular} created`);
        setIsDialogOpen(false);
        fetchData();
        setFormData({});
        setEditingId(null);
      }
    } catch (e) {
      toast.error(`Failed to save ${singular.toLowerCase()}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${singular.toLowerCase()}?`)) return;
    try {
      const res = await fetch(`/api/modules/data/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${singular} deleted`);
        fetchData();
      }
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
            if (!open) { setEditingId(null); setFormData({}); }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg font-bold">
                <Plus className="h-4 w-4 mr-2" /> Add {singular}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{editingId ? 'Edit' : 'New'} {singular}</DialogTitle>
                <DialogDescription>Fill in the details below to manage this {singular.toLowerCase()}.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                {module.schema_definition.map((field) => (
                  <div key={field.name} className={cn("space-y-2", (field.type === 'textarea') && "md:col-span-2")}>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <Textarea 
                        value={formData[field.name] || ""}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        className="rounded-2xl bg-slate-50 dark:bg-slate-900 border-none"
                        placeholder={field.placeholder || "Enter details..."}
                        rows={4}
                      />
                    ) : field.type === 'select' ? (
                      <select 
                        value={formData[field.name] || ""}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none px-4"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <Input 
                        type={field.type}
                        value={formData[field.name] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({...formData, [field.name]: val});
                        }}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-none"
                      />
                    )}
                    {field.field_description && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic px-1">{field.field_description}</p>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={handleSave} className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                  {editingId ? 'Update Record' : 'Create Record'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                    {module.schema_definition.slice(0, 4).map(f => (
                      <th key={f.name} className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">{f.label}</th>
                    ))}
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Created</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      {module.schema_definition.slice(0, 4).map(f => (
                        <td key={f.name} className="px-8 py-5">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {String(item.data[f.name] || "-")}
                          </span>
                        </td>
                      ))}
                      <td className="px-8 py-5">
                        <span className="text-xs font-medium text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600"
                            onClick={() => {
                              setEditingId(item.id);
                              setFormData(item.data);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
