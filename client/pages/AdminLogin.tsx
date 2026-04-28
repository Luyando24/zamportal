import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { Shield, ArrowLeft, Loader2, Lock, Mail, Building2, Key } from "lucide-react";
import ThemeToggle from "@/components/navigation/ThemeToggle";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session } = useAuth();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/admin";

  // Redirect if already logged in as admin
  React.useEffect(() => {
    if (session && (session.role === 'admin' || session.role === 'super_admin' || session.role === 'institutional_admin')) {
      if (session.role === 'institutional_admin' && session.portalSlug) {
        navigate(`/dashboard/${session.portalSlug}`, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [session, navigate, from]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter both credentials");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      console.log("Login Response Data:", data);

      if (!res.ok) throw new Error(data.error || "Login failed");

      if (data.role !== 'admin' && data.role !== 'super_admin' && data.role !== 'institutional_admin') {
        throw new Error("This portal is reserved for authorized administrators only.");
      }

      signIn(data);
      toast.success("Identity authenticated");
      
      if (data.role === 'institutional_admin' && data.portalSlug) {
        navigate(`/dashboard/${data.portalSlug}`, { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid administrative credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 font-sans">
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
        <Link to="/">
          <Button variant="ghost" className="rounded-xl font-bold text-slate-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> System Core
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <div className="mb-12 text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20">
          <Building2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">ZamPortal Institutional</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Government Management Gateway</p>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] overflow-hidden bg-slate-900 border-t-4 border-emerald-500">
        <CardHeader className="text-center pt-12 pb-8">
          <CardTitle className="text-3xl font-black tracking-tight text-white">Admin Authorization</CardTitle>
          <CardDescription className="text-slate-400 font-medium mt-2">
            Enter your departmental credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                <Mail className="h-3 w-3" /> Admin Identifier
              </label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="identifier"
                  type="text"
                  placeholder="Official Email or Staff ID"
                  className="pl-12 h-14 rounded-2xl border-slate-800 bg-slate-800/50 focus:bg-slate-800 transition-all text-lg font-bold text-white placeholder:text-slate-600"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1" htmlFor="password">
                <Lock className="h-3 w-3" /> Secure Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-14 rounded-2xl border-slate-800 bg-slate-800/50 focus:bg-slate-800 transition-all text-lg font-bold text-white placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 rounded-[20px] text-lg font-black transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Authenticate Identity"}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Shield className="h-3 w-3" /> Secure Institutional Node
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-slate-500 hover:text-emerald-500 font-bold text-sm transition-colors">
          Switch to Citizen Login
        </Link>
      </div>
    </div>
  );
}
