import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { Shield, ArrowLeft, Loader2, User, Lock, Mail, CreditCard } from "lucide-react";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { supabase } from "@/lib/supabase";

export default function AuthLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, session } = useAuth();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  // Redirect if already logged in
  React.useEffect(() => {
    if (session) {
      if (session.role === 'admin') navigate("/dashboard/admin");
      else navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please enter both identifier and password");
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

      if (!res.ok) throw new Error(data.error || "Login failed");
      
      // Sync with Supabase client
      if (data.tokens?.accessToken) {
        await supabase.auth.setSession({
          access_token: data.tokens.accessToken,
          refresh_token: data.tokens.refreshToken || "",
        });
      }

      signIn(data);
      toast.success("Welcome back to ZamPortal");
      
      if (data.role === 'admin') {
        signOut(); // Don't let them stay logged in on the citizen portal
        throw new Error("Administrative accounts must use the Institutional Gateway. Please use the 'Admin Login' link below.");
      } else {
        navigate(from, { replace: true });
      }
    } catch (e: any) {
      toast.error(e.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
        <Link to="/">
          <Button variant="ghost" className="rounded-xl font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-[40px] overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-2 w-full bg-emerald-600" />
        <CardHeader className="text-center pt-16 pb-8">
          <div className="mb-8 mx-auto w-28 h-28 bg-emerald-50 dark:bg-emerald-950/20 rounded-[40px] flex items-center justify-center shadow-inner group overflow-hidden border-4 border-white dark:border-slate-800">
            <img 
              src="/images/logo.png" 
              alt="Zambian Coat of Arms" 
              className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
          <CardTitle className="text-4xl font-black tracking-tight">Citizen Access</CardTitle>
          <CardDescription className="text-lg font-medium mt-2">
            Securely access Zambian Government services
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-12">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Mail className="h-3 w-3" /> Email or NRC Number
              </label>
              <div className="relative group">
                <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="identifier"
                  type="text"
                  placeholder="e.g. 123456/78/1 or mumba.c@domain.zm"
                  className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-lg font-bold"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1" htmlFor="password">
                <Lock className="h-3 w-3" /> Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-lg font-bold"
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
              {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Authorize & Sign In"}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
            <p className="text-slate-400 font-bold mb-4">Don't have a secure account yet?</p>
            <div className="space-y-3">
              <Link to="/register">
                <Button variant="outline" className="w-full h-14 rounded-2xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black">
                  Create Citizen Account
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button variant="ghost" className="w-full h-10 rounded-xl text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest">
                  Departmental/Institutional Login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center gap-2 text-slate-400">
        <Shield className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted Authentication</span>
      </div>
    </div>
  );
}
