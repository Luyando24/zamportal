import React from 'react';
import { Home, Grid, Search, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MobileBottomNavProps {
  onMenuClick: () => void;
  onLoginClick: () => void;
}

export default function MobileBottomNav({ onMenuClick, onLoginClick }: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around p-2">
        <Button variant="ghost" size="icon" asChild className="flex flex-col gap-1 h-auto py-2">
          <Link to="/">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
        </Button>
        
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto py-2" onClick={onMenuClick}>
          <Grid className="h-5 w-5" />
          <span className="text-[10px] font-medium">Services</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto py-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Search</span>
        </Button>
        
        <Button variant="ghost" size="icon" className="flex flex-col gap-1 h-auto py-2" onClick={onLoginClick}>
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Login</span>
        </Button>
      </div>
    </div>
  );
}
