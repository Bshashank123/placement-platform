"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  GraduationCap, LayoutDashboard, FileText, BarChart2,
  Users, Building2, LogOut, ChevronRight, Bell,
  User, MessageSquare, Settings, Globe, Shield, Trophy
} from "lucide-react";
import clsx from "clsx";

const NAV_STUDENT = [
  { href: "/dashboard",               icon: LayoutDashboard, label: "Overview"        },
  { href: "/dashboard/profile",       icon: User,            label: "My Profile"      },
  { href: "/dashboard/resumes",       icon: FileText,        label: "My Resumes"      },
  { href: "/dashboard/ats",           icon: BarChart2,       label: "ATS Analysis"    },
  { href: "/dashboard/ranking",       icon: Users,           label: "Ranking"         },
  { href: "/dashboard/companies",     icon: Building2,       label: "Company Matches" },
  { href: "/dashboard/reviews",       icon: MessageSquare,   label: "My Reviews"      },
];

const NAV_FACULTY = [
  { href: "/dashboard",                 icon: LayoutDashboard, label: "Overview"  },
  { href: "/dashboard/faculty",         icon: Users,           label: "Students"  },
  { href: "/dashboard/faculty/ranking", icon: Trophy,          label: "College Ranking" },
  { href: "/dashboard/faculty/reviews", icon: MessageSquare,   label: "Reviews"   },
];

const NAV_ADMIN = [
  { href: "/dashboard",                    icon: LayoutDashboard, label: "Overview"   },
  { href: "/dashboard/admin/shortlist",    icon: Users,           label: "Shortlist"  },
  { href: "/dashboard/admin/drives",       icon: Building2,       label: "Drives"     },
  { href: "/dashboard/admin/offers",       icon: FileText,        label: "Offers"     },
  { href: "/dashboard/admin/broadcast",    icon: MessageSquare,   label: "Broadcast"  },
  { href: "/dashboard/analytics",          icon: BarChart2,       label: "Analytics"  },
];

const NAV_SUPER = [
  { href: "/superadmin",           icon: Globe,           label: "Enterprise Platform"},
];

function navFor(role: string) {
  if (role === "faculty")     return NAV_FACULTY;
  if (role === "admin")       return NAV_ADMIN;
  if (role === "super_admin") return NAV_SUPER;
  return NAV_STUDENT;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrate, logout } = useAuthStore();

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    // Wait for hydration to finish. If we have no user in localStorage, it will set user to null.
    // So if !user AND we are done hydrating (we can assume if user is null, we redirect).
    // Wait, hydrate happens synchronously on mount if not already done.
    if (!isAuthenticated) {
      // Small timeout to let hydration complete if it's running
      const timer = setTimeout(() => {
        if (!useAuthStore.getState().isAuthenticated) {
          router.replace("/auth/login");
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nav = navFor(user.role);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const roleBadge: Record<string, string> = {
    student:     "bg-blue-100 text-blue-700",
    faculty:     "bg-purple-100 text-purple-700",
    admin:       "bg-amber-100 text-amber-700",
    super_admin: "bg-red-100 text-red-700",
  };

  const pageTitle = nav.find(n =>
    n.href === pathname || (n.href !== "/dashboard" && pathname.startsWith(n.href))
  )?.label ?? "Dashboard";

  
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    setSubmittingFeedback(true);
    try {
      // Import api and toast manually at top if missing, or use existing api wrapper
      const { api } = await import('@/lib/api');
      const { default: toast } = await import('react-hot-toast');
      await api.post('/platform/feedback', { message: feedbackMsg });
      toast.success("Feedback submitted. Thank you!");
      setFeedbackMsg("");
      setIsFeedbackOpen(false);
    } catch (err) {
      console.error(err);
      const { default: toast } = await import('react-hot-toast');
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">

        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm leading-tight">
              Placement<br />
              <span className="text-brand-600">Platform</span>
            </span>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {user.email[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email.split("@")[0]}
              </p>
              <span className={clsx(
                "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                roleBadge[user.role]
              )}>
                {user.role.replace("_", " ")}
              </span>
            </div>
          </div>
          {user.tenant && (
            <p className="text-xs text-gray-400 mt-2 truncate pl-1">
              {user.tenant.name}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={clsx(
                  "w-5 h-5 shrink-0",
                  active ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"
                )} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-4 h-4 text-brand-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
            {user.tenant && (
              <p className="text-xs text-gray-400">{user.tenant.name}</p>
            )}
          </div>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>

      {/* Floating Feedback Button for Students/Faculty */}
      {(user.role === 'student' || user.role === 'faculty') && (
        <>
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="absolute bottom-6 right-6 bg-slate-900 hover:bg-slate-800 text-white rounded-full p-4 shadow-xl transition-transform hover:scale-105 z-40 flex items-center gap-2"
          >
            <MessageSquare size={20} />
            <span className="font-medium text-sm pr-1">Platform Feedback</span>
          </button>
          
          {isFeedbackOpen && (
            <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Globe className="text-blue-600" size={20} />
                      Leave Platform Feedback
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Note: This is sent directly to Enterprise Superadmins, NOT your college administration.
                    </p>
                  </div>
                  <button onClick={() => setIsFeedbackOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white rounded-full p-1 border">
                    <LogOut size={16} />
                  </button>
                </div>
                <form onSubmit={handleFeedbackSubmit} className="p-6">
                  <textarea
                    value={feedbackMsg}
                    onChange={e => setFeedbackMsg(e.target.value)}
                    required
                    placeholder="Tell us what you love or what could be improved about the Placement Platform..."
                    className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  />
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsFeedbackOpen(false)}
                      className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="px-4 py-2 font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submittingFeedback ? "Sending..." : "Send Feedback"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}