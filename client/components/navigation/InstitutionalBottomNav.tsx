import React from 'react';
import { Home, FileText, Briefcase, Users, Settings, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InstitutionalBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  primaryColor?: string;
}

export default function InstitutionalBottomNav({ activeTab, onTabChange, primaryColor = "#10b981" }: InstitutionalBottomNavProps) {
  const navItems = [
    { id: 'overview', label: 'Home', icon: Home },
    { id: 'applications', label: 'Requests', icon: FileText },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'staff', label: 'People', icon: Users },
    { id: 'settings', label: 'Config', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Button 
              key={item.id}
              variant="ghost" 
              size="icon" 
              onClick={() => onTabChange(item.id)}
              className="flex flex-col gap-1 h-auto py-2 px-1 transition-all duration-300"
              style={isActive ? { color: primaryColor, transform: 'scale(1.1)' } : { color: '#94a3b8' }}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-current opacity-10")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-tighter", isActive ? "opacity-100" : "opacity-70")}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
