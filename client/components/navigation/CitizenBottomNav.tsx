import React from 'react';
import { Home, Briefcase, Clock, CreditCard, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CitizenBottomNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function CitizenBottomNav({ activeSection, onSectionChange }: CitizenBottomNavProps) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'applications', label: 'Requests', icon: Clock },
    { id: 'wallet', label: 'Wallet', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t lg:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <Button 
              key={item.id}
              variant="ghost" 
              size="icon" 
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "flex flex-col gap-1 h-auto py-2 px-1 transition-all duration-300",
                isActive ? "text-emerald-600 scale-110" : "text-slate-400"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-emerald-600/10")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-tighter", isActive ? "opacity-100" : "opacity-70")}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 w-1 h-1 bg-emerald-600 rounded-full" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
