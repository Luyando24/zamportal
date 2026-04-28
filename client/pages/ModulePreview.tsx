import React, { useState, useEffect } from "react";
import ResourceManager from "@/components/admin/ResourceManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ModulePreview() {
  const [module, setModule] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("temp_module_preview");
    if (data) {
      setModule(JSON.parse(data));
    }
  }, []);

  if (!module) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <Eye className="h-12 w-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 font-medium">No preview data found.</p>
          <Button onClick={() => window.close()}>Close Tab</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">Live System Preview</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unsaved Architecture</p>
            </div>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
            Preview Mode
          </Badge>
        </div>
        
        <ResourceManager module={{...module, slug: 'preview'}} />
        
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl px-6 py-3 flex items-center gap-4">
            <p className="text-sm font-medium text-slate-500">This is a live preview of your dynamic module.</p>
            <Button variant="outline" size="sm" onClick={() => window.close()}>Return to Factory</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Badge = ({ children, className }: any) => (
  <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", className)}>
    {children}
  </span>
);

const Card = ({ children, className }: any) => (
  <div className={cn("border bg-white dark:bg-slate-900 shadow-sm", className)}>
    {children}
  </div>
);

import { cn } from "@/lib/utils";
