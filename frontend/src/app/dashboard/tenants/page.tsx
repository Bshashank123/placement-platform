"use client";

import { useState, useEffect } from "react";
import { 
  Globe, Shield, Plus, CheckCircle, Send, Sparkles, 
  Database, ArrowRight, RefreshCw, Calendar, Info
} from "lucide-react";
import toast from "react-hot-toast";

interface MockTenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
  students: number;
  faculty: number;
  status: "active" | "inactive";
}

export default function TenantsPortalPreview() {
  const [emailInput, setEmailInput] = useState("");
  const [routedTenant, setRoutedTenant] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("waitlist_tenants")) setIsWaitlisted(true);
    if (localStorage.getItem("feedback_tenants")) setIsSubmitted(true);
  }, []);

  const tenants: MockTenant[] = [
    { id: 1, name: "Vellore Institute of Technology", slug: "vit", domain: "vit.edu", students: 1482, faculty: 42, status: "active" },
    { id: 2, name: "SRM Institute of Science", slug: "srm", domain: "srm.edu", students: 954, faculty: 28, status: "active" },
    { id: 3, name: "Indian Institute of Technology", slug: "iitm", domain: "iitm.ac.in", students: 612, faculty: 18, status: "active" }
  ];

  const handleDomainRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    const domain = emailInput.split("@")[1].toLowerCase();
    const matched = tenants.find((t) => t.domain === domain);
    if (matched) {
      setRoutedTenant(matched.name);
      toast.success(`Domain resolved! Routed to tenant: ${matched.slug.toUpperCase()}`);
    } else {
      setRoutedTenant("Default Platform / Unassigned");
      toast.error("No registered college tenant matches this domain.");
    }
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    localStorage.setItem("waitlist_tenants", email);
    setIsWaitlisted(true);
    toast.success("Joined the multi-tenant SaaS waitlist!");
  };

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Feedback cannot be empty.");
      return;
    }
    localStorage.setItem("feedback_tenants", feedback);
    setIsSubmitted(true);
    toast.success("Feedback submitted successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white p-8 md:p-12 shadow-xl border border-emerald-950">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-teal-500 rounded-full opacity-10 blur-3xl" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" /> Platform Admin Preview — Coming Soon
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Multi-Campus <span className="text-emerald-400">Tenant Management Portal</span>
          </h1>
          <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
            Enterprise command console for platform administrators to configure independent college subdomains, map automated domain-routing rules, and ensure strict query-level PostgreSQL data isolation across the entire SaaS environment.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-indigo-300 font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-emerald-400" /> Planned Release: Q4 2026</span>
            <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Info className="w-4 h-4 text-emerald-400" /> Target Users: Platform Super Admins</span>
          </div>
        </div>
      </div>

      {/* Tenant Management UI Mockup */}
      <div className="card border border-emerald-100 shadow-md">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 flex-wrap gap-4">
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" /> University Nodes Registry
            </h2>
            <p className="text-xs text-gray-400">SaaS Sandbox Preview — Monitor registered tenants and simulate signup routing</p>
          </div>
          <button 
            onClick={() => toast.error("Adding new colleges is disabled in the prototype sandbox.")}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add College Tenant
          </button>
        </div>

        {/* Tenant Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {tenants.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3 shadow-sm hover:border-emerald-200 hover:bg-white transition-all">
              <div className="flex justify-between items-start">
                <span className="font-black text-gray-900 text-sm">{t.slug.toUpperCase()} Node</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 capitalize">
                  {t.status}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-800">{t.name}</h4>
                <p className="text-[10px] text-gray-400">Domain: @{t.domain}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 font-medium">
                <div>Students: <strong className="text-gray-800">{t.students}</strong></div>
                <div>Faculty: <strong className="text-gray-800">{t.faculty}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Domain Routing Simulator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Interactive Domain Simulator */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" /> Domain Routing Simulator
            </h3>
            <p className="text-xs text-gray-400">Test how incoming student signups map automatically to college tenants by domain name.</p>
          </div>

          <form onSubmit={handleDomainRoute} className="space-y-3">
            <div>
              <label className="label">Enter Email Address</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@vit.edu or name@srm.edu"
                  className="input flex-1"
                />
                <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                  Run Resolver
                </button>
              </div>
            </div>
          </form>

          {routedTenant !== null && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl space-y-1 text-xs">
              <p className="font-bold">Resolver Output Summary:</p>
              <p>Routed Tenant Node: <strong>{routedTenant}</strong></p>
              <p className="text-[10px] text-emerald-600">Database Context: `tenant_id` variable loaded successfully.</p>
            </div>
          )}
        </div>

        {/* Database Schema Isolation Panel */}
        <div className="card space-y-4 bg-slate-900 text-slate-100 border border-slate-950">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> PostgreSQL Tenant Isolation
            </h3>
            <p className="text-[11px] text-slate-400">Strict structural context boundaries prevent data leakage between university schemas.</p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[10px] leading-relaxed text-emerald-400 overflow-x-auto">
            <span className="text-slate-500">-- Automated multi-tenant schema filter</span><br />
            <span className="text-pink-400">SELECT</span> * <span className="text-pink-400">FROM</span> resumes<br />
            <span className="text-pink-400">WHERE</span> tenant_id = <span className="text-amber-400">current_user.tenant_id</span><br />
            <span className="text-pink-400">AND</span> student_id = <span className="text-amber-400">1001</span>;<br />
            <span className="text-slate-500">-- [SUCCESS] Isolated scope. 0 leaks.</span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted tenant identifiers enforced across all database connections.</span>
          </div>
        </div>
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waitlist */}
        <div className="card h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Enterprise SaaS Waitlist
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Interested in setting up placement platform tenants for your multi-campus university network? Join the waitlist for pilot onboarding.
            </p>
          </div>

          <div className="mt-6">
            {isWaitlisted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <h4 className="font-bold text-sm">Waitlist Confirmed</h4>
                <p className="text-xs text-green-600">
                  We'll contact you at <strong>{localStorage.getItem("waitlist_tenants") || email}</strong> when pilot onboarding begins.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="space-y-3">
                <div>
                  <label className="label">Institutional Contact Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="chancellor@university-system.org"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                  Request SaaS Onboarding Schedule <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Request */}
        <div className="card h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" /> Admin Feature Wishlist
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Want custom subdomains, SAML Single Sign-On, or independent Stripe billing modules per tenant? Tell us your system requirements.
            </p>
          </div>

          <div className="mt-6">
            {isSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm">Feedback Captured</h4>
                <p className="text-xs text-emerald-600">
                  Our system architecture team has logged your wishlist features.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedback} className="space-y-3">
                <div>
                  <label className="label">Your Request</label>
                  <textarea 
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. We require Single Sign-On (SSO) using Microsoft Azure AD and custom theme colors for our campus nodes..."
                    className="input resize-none py-2"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-950">
                  Submit Admin Wishlist <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

