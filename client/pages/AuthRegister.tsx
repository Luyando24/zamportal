import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import { 
  Shield, ArrowLeft, Loader2, User, Lock, Mail, 
  CreditCard, CheckCircle2, ChevronRight,
  ArrowRight, Landmark, BadgeCheck
} from "lucide-react";
import ThemeToggle from "@/components/navigation/ThemeToggle";
import { Progress } from "@/components/ui/progress";

export default function AuthRegister() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    nrc: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const id = e.target.id;

    if (id === "nrc") {
      // Remove all non-numeric characters to get raw digits
      const digits = value.replace(/\D/g, "");
      
      // Apply mask: 123456 / 78 / 1
      let maskedValue = "";
      if (digits.length > 0) {
        maskedValue = digits.substring(0, 6);
        if (digits.length > 6) {
          maskedValue += "/" + digits.substring(6, 8);
        }
        if (digits.length > 8) {
          maskedValue += "/" + digits.substring(8, 9);
        }
      }
      value = maskedValue;
    }

    setFormData({ ...formData, [id]: value });
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.nrc) {
        toast.error("Please provide your identity details first");
        return;
      }
      
      const nrcPattern = /^\d{6}\/\d{2}\/\d{1}$/;
      if (!nrcPattern.test(formData.nrc)) {
        toast.error("Invalid NRC format. Use: 123456/78/1");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please complete your security credentials");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Identity verified and account created!");
      
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.email, password: formData.password }),
      });
      
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        signIn(loginData);
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const progressValue = (step / 2) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans py-20">
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
        <Link to="/login">
          <Button variant="ghost" className="rounded-xl font-bold">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-xl border-none shadow-2xl rounded-[48px] overflow-hidden bg-white dark:bg-slate-900">
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-emerald-600 transition-all duration-500 ease-out" 
            style={{ width: `${progressValue}%` }}
          />
        </div>
        
        <CardHeader className="text-center pt-16 pb-8 px-10">
          <div className="mb-8 mx-auto w-28 h-28 bg-emerald-50 dark:bg-emerald-950/20 rounded-[40px] flex items-center justify-center shadow-inner group overflow-hidden border-4 border-white dark:border-slate-800">
            <img 
              src="/images/logo.png" 
              alt="Zambian Coat of Arms" 
              className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-500" 
            />
          </div>
          <CardTitle className="text-4xl font-black tracking-tight leading-tight">National Citizen ID</CardTitle>
          <CardDescription className="text-lg font-medium mt-3">
            {step === 1 ? "Step 1: Identity Verification" : "Step 2: Secure Access Credentials"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-12 pb-16">
          <form className="space-y-8" onSubmit={onSubmit}>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <BadgeCheck className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Personal Identity</h3>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">First Name</label>
                  <Input 
                    id="firstName" 
                    placeholder="e.g. Chanda" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:bg-white transition-all" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Last Name</label>
                  <Input 
                    id="lastName" 
                    placeholder="e.g. Mwila" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:bg-white transition-all" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">NRC Number</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <Input 
                      id="nrc" 
                      placeholder="123456/78/1" 
                      className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:bg-white transition-all" 
                      value={formData.nrc} 
                      onChange={handleChange} 
                      maxLength={11}
                    />
                  </div>
                </div>

                <Button 
                  type="button" 
                  onClick={nextStep}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 rounded-2xl text-lg font-black transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  Continue to Credentials <ArrowRight className="h-6 w-6" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Security Details</h3>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="e.g. mumba.c@domain.zm" 
                      className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:bg-white transition-all" 
                      value={formData.email} 
                      onChange={handleChange} 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Create Password</label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:bg-white transition-all" 
                    value={formData.password} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Confirm Password</label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 font-bold text-lg focus:bg-white transition-all" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={prevStep}
                    className="h-16 flex-1 rounded-2xl font-black text-lg border-2 border-slate-100"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="h-16 flex-[2] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 rounded-2xl text-lg font-black transition-all active:scale-95" 
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "Verify & Create Account"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-400 font-bold">
              Already verified? <Link to="/login" className="text-emerald-600 hover:underline">Sign In here</Link>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-10 flex items-center gap-4 text-slate-400 opacity-60">
        <Landmark className="h-5 w-5" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official National Identity Framework</span>
      </div>
    </div>
  );
}
