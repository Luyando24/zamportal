import React, { useState } from "react";
import type { User } from "@shared/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, EyeOff, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: User;
  className?: string;
}

function initials(u: User) {
  const a = (u.firstName || "").trim()[0] || "";
  const b = (u.lastName || "").trim()[0] || "";
  const f = `${a}${b}`.toUpperCase();
  return f || u.email.slice(0, 2).toUpperCase();
}

function maskNrc(nrc?: string) {
  if (!nrc) return "N/A";
  const clean = nrc.replace(/\s+/g, "");
  if (clean.length < 4) return clean;
  return `${clean.slice(0, 3)}•••${clean.slice(-2)}`;
}

export default function QRCodeCard({ user, className }: Props) {
  const [showQrCode, setShowQrCode] = useState(false);
  
  return (
    <Card
      className={cn(
        "digital-card w-full max-w-md overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative group hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]",
        className
      )}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-600/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)]" style={{ backgroundSize: '20px 20px' }} />
      
      <div className="relative">
        {/* Header section with modern gradient */}
        <div className="h-36 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-500 relative overflow-hidden">
          {/* Animated shimmer effect */}
          <div className="shimmer-effect absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12" />
          
          {/* Logo/chip */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <div className="h-8 w-12 rounded-md bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-slate-900" />
            </div>
          </div>
          
          {/* Digital ID Card text at top */}
          <div className="absolute top-4 left-6 text-white/90 z-10 max-w-[200px]">
            <div className="text-xs font-medium uppercase tracking-wider opacity-80">Digital NRC Card</div>
            <div className="text-sm font-semibold truncate">Republic of Zambia</div>
          </div>
          
          {/* Sparkles icon for decoration */}
          <div className="absolute top-4 left-[180px] z-20">
            <Sparkles className="sparkle-icon h-3 w-3 text-white/90" />
          </div>
        </div>

        <CardContent className="pt-4 pb-6 px-6 relative">
          {/* Avatar and name */}
          <div className="relative -mt-20 mb-6 flex items-center">
            {/* Avatar */}
            <div className="float-element h-24 w-24 rounded-2xl bg-gradient-to-br from-white to-slate-100 shadow-xl ring-4 ring-white/20 backdrop-blur-sm grid place-items-center text-slate-800 font-bold text-2xl">
              {initials(user)}
            </div>
            {/* Info */}
            <div className="ml-4">
              <div className="text-white drop-shadow-lg">
                <div className="text-2xl font-bold tracking-tight leading-tight truncate uppercase">
                  {[user.firstName, user.lastName]
                    .filter(Boolean)
                    .join(" ") || "User"}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6">
            {/* QR Code section */}
             <div className="relative">
               <div className="glow-effect rounded-2xl border border-white/10 p-4 bg-white/5 backdrop-blur-sm shadow-2xl">
                 <div className="h-36 w-36 bg-white/10 rounded-lg flex items-center justify-center">
                    <div className="text-white/50 text-xs text-center p-2">Digital Identity Verified</div>
                  </div>
                {!showQrCode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md rounded-2xl">
                    <div className="text-white/70 text-sm font-medium">QR Code Hidden</div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 blur-xl -z-10" />
            </div>
            
            {/* Details */}
            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2 p-3 rounded-xl glass-effect">
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Role</div>
                  <div className="font-mono text-base tracking-wider text-white font-semibold capitalize">
                    {user.role}
                  </div>
                </div>
                <div className="space-y-2 p-3 rounded-xl glass-effect">
                  <div className="text-white/60 text-xs font-medium uppercase tracking-wider">NRC</div>
                  <div className="font-mono text-white font-semibold">{maskNrc(user.nrc)}</div>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                   variant="outline"
                   className="modern-button flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm transition-all duration-300"
                   onClick={() => setShowQrCode(!showQrCode)}
                 >
                  {showQrCode ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" /> Hide QR
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" /> Show QR
                    </>
                  )}
                </Button>
                
                <Button 
                  className="modern-button flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 shadow-lg transition-all duration-300"
                  onClick={() => {
                    const cardElement = document.querySelector('.digital-card');
                    if (cardElement) {
                      import('html2canvas').then(html2canvas => {
                        html2canvas.default(cardElement as HTMLElement).then(canvas => {
                          const link = document.createElement('a');
                          link.download = `nrc-card-${user.id}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        });
                      }).catch(err => {
                        console.error('Failed to load html2canvas:', err);
                        alert('Could not download card. Please try again later.');
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
