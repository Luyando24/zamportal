import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { FileText, Settings, ArrowLeft } from "lucide-react";

export default function PortalNav() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  
  const navItems = [
    { to: `/profile`, label: "My Profile", icon: <FileText className="h-4 w-4 mr-2" /> },
    { to: `/settings`, label: "Settings", icon: <Settings className="h-4 w-4 mr-2" /> },
  ];

  return (
    <div className="sticky top-0 z-40 bg-background/70 backdrop-blur border-b mb-6">
      <div className="container mx-auto">
        <div className="flex items-center py-2">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          
          <nav className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Button 
                key={item.to} 
                variant="ghost" 
                size="sm" 
                asChild
              >
                <Link to={item.to} className="flex items-center">
                  {item.icon}
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}