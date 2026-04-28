import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, FileText, CheckCircle, Upload, 
  Calendar, AlertCircle, Info, Send, Loader2,
  ChevronRight, Layers, Shield, HelpCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

const STEP_SIZE = 3; // Number of fields per step

interface FormDefinition {
  id: string;
  form_name: string;
  form_slug: string;
  form_definition: any[];
  service_id?: string;
  service_title?: string;
  service_description?: string;
}

const ServiceApplication = () => {
  const { portalSlug, serviceSlug } = useParams();
  const navigate = useNavigate();
  const { session, userId } = useAuth();
  
  const [service, setService] = useState<any>(null);
  const [portal, setPortal] = useState<any>(null);
  const [availableForms, setAvailableForms] = useState<FormDefinition[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormDefinition | null>(null);
  
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(0); 
  const [totalSteps, setTotalSteps] = useState(0);
  const [fieldGroups, setFieldGroups] = useState<any[][]>([]);

  useEffect(() => {
    fetchInitialData();
    
    // Check if we have saved form data after returning from login
    const savedData = sessionStorage.getItem("pending_application");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.portalSlug === portalSlug && parsed.serviceSlug === serviceSlug) {
          setFormData(parsed.formData);
          // We can't easily restore the exact step/form state without more logic, 
          // but we restore the data fields.
          toast.info("Welcome back! Your form progress has been restored.");
        }
        sessionStorage.removeItem("pending_application");
      } catch (e) {
        console.error("Failed to restore form data", e);
      }
    }
  }, [portalSlug, serviceSlug, userId]);

  const fetchInitialData = async () => {
    try {
      // 1. Get portal config
      const portalRes = await fetch(`/api/portals/${portalSlug}`);
      if (!portalRes.ok) throw new Error("Portal not found");
      const portalData = await portalRes.json();
      console.log(`ServiceApplication: Loaded Portal Data for ${portalSlug}:`, portalData);
      setPortal(portalData);

      // 2. Try to find if this is a DIRECT sub-service application (using form slug)
      const directFormRes = await fetch(`/api/forms/slug/${portalData.id}/${serviceSlug}`);
      if (directFormRes.ok) {
        const directForm = await directFormRes.json();
        setService({
          id: directForm.service_id,
          title: directForm.service_title,
          description: directForm.service_description,
          slug: directForm.service_slug
        });
        selectForm(directForm);
        setLoading(false);
        return;
      }

      // 3. Otherwise, treat as a MAIN service application
      const serviceData = portalData.services?.find((s: any) => s.slug?.toLowerCase() === serviceSlug?.toLowerCase());
      if (!serviceData) throw new Error("Service not found in this portal");
      setService(serviceData);

      const formsRes = await fetch(`/api/forms/${portalData.id}/${serviceData.id}`);
      const forms = await formsRes.json();
      setAvailableForms(forms || []);

      // Always show the form selection screen first
      // Previously we auto-selected if only one form existed

    } catch (error: any) {
      console.error("Critical Fetch Error:", error);
      if (error.message === "Portal not found") {
        toast.error("Institutional Portal is currently offline or invalid.");
      } else if (error.message === "Service not found in this portal") {
        toast.error("This service is not currently active in this department's catalog.");
      } else {
        toast.error("Unable to load service details. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectForm = (form: FormDefinition) => {
    setSelectedForm(form);
    const initialData: any = {};
    const fields = form.form_definition || [];
    
    fields.forEach((f: any) => {
      initialData[f.id] = "";
    });
    setFormData(initialData);

    // Group fields into steps
    const groups = [];
    for (let i = 0; i < fields.length; i += STEP_SIZE) {
      groups.push(fields.slice(i, i + STEP_SIZE));
    }
    setFieldGroups(groups);
    setTotalSteps(groups.length + 1); // +1 for the review step
    setCurrentStep(1); 
  };

  const getStepTitle = (fields: any[]) => {
    if (!fields || fields.length === 0) return "General Information";
    
    const labels = fields.map(f => (f.label || "").toLowerCase());
    const ids = fields.map(f => (f.id || "").toLowerCase());
    const combined = [...labels, ...ids].join(" ");

    if (combined.includes("upload") || combined.includes("file") || combined.includes("document") || combined.includes("attach")) {
      return "Required Documentation";
    }
    if (combined.includes("name") || combined.includes("nrc") || combined.includes("dob") || combined.includes("birth") || combined.includes("gender")) {
      return "Personal Information";
    }
    if (combined.includes("email") || combined.includes("phone") || combined.includes("mobile") || combined.includes("address") || combined.includes("contact")) {
      return "Contact Information";
    }
    if (combined.includes("license") || combined.includes("permit") || combined.includes("card") || combined.includes("reference")) {
      return "Credential Details";
    }
    
    return "Application Details";
  };

  const nextStep = () => {
    // Validate current step fields if necessary
    const currentFields = fieldGroups[currentStep - 1];
    if (currentFields) {
      const missingRequired = currentFields.find(f => f.required && !formData[f.id]);
      if (missingRequired) {
        toast.error(`Please fill out: ${missingRequired.label}`);
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    if (currentStep === 1) {
      setSelectedForm(null);
      setCurrentStep(0);
    } else {
      setCurrentStep(prev => prev - 1);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedForm) return;

    if (!userId) {
      // Save state to sessionStorage to restore after login
      sessionStorage.setItem("pending_application", JSON.stringify({
        portalSlug,
        serviceSlug,
        formData,
        formId: selectedForm.id
      }));
      
      toast.info("Identification required. Please sign in to submit your application.");
      navigate("/login", { state: { from: location } });
      return;
    }

    // Prevent submitting empty forms
    if (!selectedForm.form_definition || selectedForm.form_definition.length === 0) {
      toast.error("This form has no fields to submit. Please contact the administrator.");
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          service_id: service.id,
          portal_id: portal.id,
          form_id: selectedForm.id,
          form_data: formData,
          attachments: [] 
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      setTrackingNumber(result.tracking_number);
      setSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black mb-2 uppercase">Service Not Found</h2>
        <p className="text-slate-500 font-medium mb-8 max-w-sm mx-auto">The requested service is not registered in this portal catalog.</p>
        <Button onClick={() => navigate(-1)} className="rounded-xl font-black bg-emerald-600 px-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-3xl overflow-hidden text-center p-12 bg-white dark:bg-slate-900">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce text-emerald-600">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-4 uppercase">Submission Confirmed</h2>
          <p className="text-slate-500 font-medium mb-8">Your request for {selectedForm?.form_name} has been securely transmitted.</p>
          
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-8 mb-8 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tracking Reference</p>
            <p className="text-3xl font-black text-emerald-600 tracking-wider font-mono">{trackingNumber}</p>
          </div>

          <Button 
            className="w-full h-16 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg shadow-xl shadow-emerald-600/20"
            onClick={() => navigate("/dashboard")}
          >
            Go to My Applications
          </Button>
        </Card>
      </div>
    );
  }

  if (!selectedForm) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-12">
        <div className="max-w-[95%] mx-auto px-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-10 font-black rounded-xl">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Services
          </Button>

          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                Service Portal: {portal?.name}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6 italic uppercase text-slate-900 dark:text-white">
              {service.title}
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-3xl leading-relaxed">
              {service.description}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {availableForms.map((form) => (
              <motion.div
                key={form.id}
                whileHover={{ y: -10, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className="group border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden cursor-pointer bg-white dark:bg-slate-900 h-full flex flex-col"
                  onClick={() => selectForm(form)}
                >
                  <div className="p-10 flex flex-col h-full">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-8 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                      <Layers className="h-10 w-10" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 group-hover:text-emerald-600 transition-colors tracking-tight leading-tight">
                      {form.form_name}
                    </h3>
                    <p className="text-slate-400 font-bold mb-8 flex-grow leading-relaxed uppercase text-[10px] tracking-widest">
                      Proceed to initiate the {form.form_name.toLowerCase()} workflow for this department.
                    </p>
                    <Button className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black h-14 rounded-2xl transition-all group-hover:shadow-xl group-hover:shadow-emerald-600/20">
                      Begin Process <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}

            {availableForms.length === 0 && (
              <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-3xl shadow-sm border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                  <HelpCircle className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tighter italic uppercase">Zero Workflows Available</h3>
                <p className="text-slate-400 max-w-sm mx-auto font-medium leading-relaxed">This service entry currently has no published service paths. Please contact the digital support desk.</p>
                <Button variant="outline" className="mt-12 font-black h-12 px-10 rounded-xl border-slate-200 hover:bg-slate-50" onClick={() => navigate(-1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Exit to Catalog
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const progress = (currentStep / totalSteps) * 100;
  const isReviewStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-10">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={prevStep}
          className="mb-8 rounded-xl font-bold h-10 px-4 hover:bg-white dark:hover:bg-slate-900 text-slate-500 transition-all"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {currentStep === 1 ? "Back to Services" : "Previous Step"}
        </Button>

        {/* Header & Progress */}
        <header className="mb-12 bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
                Step {currentStep} of {totalSteps}
              </span>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Progress</span>
                <span className="text-slate-900 dark:text-white">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic whitespace-nowrap">
              {isReviewStep ? "Final Review" : selectedForm.form_name}
            </h1>
            
            <p className="text-slate-500 font-medium text-lg">
              {isReviewStep 
                ? "Final validation of your provided information." 
                : `${currentStep}. ${getStepTitle(fieldGroups[currentStep - 1])}`
              }
            </p>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
            <motion.div 
              className="h-full bg-emerald-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "circOut" }}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {!isReviewStep ? (
              <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-slate-900">
                <CardContent className="p-10 md:p-16">
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                      {fieldGroups[currentStep - 1]?.map((field) => (
                        <div key={field.id} className={cn(
                          "space-y-3",
                          (field.type === 'textarea' || field.type === 'file') && "lg:col-span-3"
                        )}>
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        
                        {field.type === 'text' && (
                          <Input 
                            required={field.required}
                            value={formData[field.id]}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="h-16 rounded-2xl border-2 border-slate-200 bg-white dark:bg-slate-800 font-bold text-lg focus:border-emerald-500 focus:ring-0 transition-all px-6 shadow-sm"
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                          />
                        )}

                        {field.type === 'textarea' && (
                          <Textarea 
                            required={field.required}
                            value={formData[field.id]}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="min-h-[160px] rounded-3xl border-2 border-slate-200 bg-white dark:bg-slate-800 font-bold text-lg focus:border-emerald-500 focus:ring-0 transition-all p-8 shadow-sm"
                            placeholder={`Provide details for ${field.label.toLowerCase()}...`}
                          />
                        )}

                        {field.type === 'date' && (
                          <Input 
                            type="date"
                            required={field.required}
                            value={formData[field.id]}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="h-16 rounded-2xl border-2 border-slate-200 bg-white dark:bg-slate-800 font-bold text-lg focus:border-emerald-500 transition-all px-6 shadow-sm"
                          />
                        )}

                        {field.type === 'number' && (
                          <Input 
                            type="number"
                            required={field.required}
                            value={formData[field.id]}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="h-16 rounded-2xl border-2 border-slate-200 bg-white dark:bg-slate-800 font-bold text-lg focus:border-emerald-500 transition-all px-6 shadow-sm"
                            placeholder="0"
                          />
                        )}

                        {field.type === 'select' && (
                          <Select 
                            required={field.required}
                            value={formData[field.id]}
                            onValueChange={(value) => handleInputChange(field.id, value)}
                          >
                            <SelectTrigger className="h-16 rounded-2xl border-2 border-slate-200 bg-white dark:bg-slate-800 font-bold text-lg focus:border-emerald-500 transition-all px-6 shadow-sm">
                              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {field.options?.map((option: any) => (
                                <SelectItem key={option} value={option} className="font-bold">{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {field.type === 'file' && (
                          <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group">
                            <Upload className="h-10 w-10 mx-auto text-slate-300 group-hover:text-emerald-500 transition-colors mb-4" />
                            <p className="font-black text-slate-900 dark:text-white text-lg">Supporting Documents</p>
                            <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">PDF, JPG, PNG (Max 10MB)</p>
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                        Fields with <span className="text-red-500">*</span> are mandatory
                      </p>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        {currentStep > 1 && (
                          <Button 
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="h-16 px-10 rounded-xl font-black border-2 border-slate-200 text-lg hover:bg-slate-50 transition-all active:scale-95"
                          >
                            Previous Step
                          </Button>
                        )}
                        <Button 
                          onClick={nextStep}
                          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black h-16 px-12 rounded-xl shadow-xl shadow-emerald-600/20 text-lg group transition-all active:scale-95"
                        >
                          Continue to Next Step <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-slate-900 text-white">
                  <CardContent className="p-12 md:p-16">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tight">Review Details</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      {selectedForm.form_definition?.map((field) => (
                        <div key={field.id} className="border-b border-white/10 pb-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">{field.label}</p>
                          <p className="text-xl font-bold">{formData[field.id] || <span className="text-white/20 italic">Not provided</span>}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setCurrentStep(totalSteps - 1)}
                    className="rounded-2xl font-black h-16 px-10 hover:bg-white text-slate-500"
                  >
                    Edit Information
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black h-20 px-16 rounded-3xl shadow-2xl shadow-emerald-600/40 text-xl group transition-all scale-105 active:scale-100"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" /> Transmitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3">
                        Submit Application <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="h-40" />

        {/* Security Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex items-center gap-5 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl flex items-center justify-center shrink-0">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Secure</p>
              <p className="text-base font-black text-slate-900 dark:text-white">256-bit Encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-5 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Verified</p>
              <p className="text-base font-black text-slate-900 dark:text-white">DPA-2024 Compliant</p>
            </div>
          </div>
          <div className="flex items-center gap-5 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center shrink-0">
              <HelpCircle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Support</p>
              <p className="text-base font-black text-slate-900 dark:text-white">24/7 Digital Desk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceApplication;
