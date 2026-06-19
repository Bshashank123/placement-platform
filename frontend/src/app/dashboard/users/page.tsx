"use client";

import { useState, useEffect } from "react";
import { 
  Shield, Users, CheckCircle, Send, Sparkles, Key, Lock, 
  Activity, ArrowRight, Save, Calendar, Info, Clock
} from "lucide-react";
import toast from "react-hot-toast";

interface MockUser {
  id: number;
  email: string;
  role: string;
  status: "active" | "suspended";
  lastLogin: string;
}

interface AuditLog {
  id: number;
  time: string;
  event: string;
  user: string;
  severity: "info" | "warning" | "critical";
}

export default function UsersPortalPreview() {
  const [users, setUsers] = useState<MockUser[]>([
    { id: 1, email: "admin@vit.edu", role: "Admin", status: "active", lastLogin: "5 mins ago" },
    { id: 2, email: "faculty@vit.edu", role: "Faculty", status: "active", lastLogin: "2 hours ago" },
    { id: 3, email: "student@vit.edu", role: "Student", status: "active", lastLogin: "1 day ago" },
    { id: 4, email: "intern_reviewer@vit.edu", role: "Faculty", status: "suspended", lastLogin: "3 weeks ago" }
  ]);
  const [selectedUser, setSelectedUser] = useState<string>("faculty@vit.edu");
  const [newRole, setNewRole] = useState<string>("Admin");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("waitlist_users")) setIsWaitlisted(true);
    if (localStorage.getItem("feedback_users")) setIsSubmitted(true);
  }, []);

  const auditLogs: AuditLog[] = [
    { id: 1, time: "18:02:11", event: "User login validated from IP 192.84.12.3", user: "admin@vit.edu", severity: "info" },
    { id: 2, time: "17:45:02", event: "Resume scored: Arjun Sharma (Score: 78)", user: "System Engine", severity: "info" },
    { id: 3, time: "16:21:44", event: "New Company Requirement created: Amazon (SDE)", user: "admin@vit.edu", severity: "info" },
    { id: 4, time: "15:02:19", event: "Faculty review comments published on Resume #23", user: "faculty@vit.edu", severity: "info" },
    { id: 5, time: "12:14:02", event: "Password reset token requested", user: "student@vit.edu", severity: "warning" }
  ];

  const handleRoleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(users.map(u => u.email === selectedUser ? { ...u, role: newRole } : u));
    toast.success(`Role updated: ${selectedUser} promoted to ${newRole}`);
  };

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    localStorage.setItem("waitlist_users", email);
    setIsWaitlisted(true);
    toast.success("Joined the security audit beta waitlist!");
  };

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      toast.error("Feedback cannot be empty.");
      return;
    }
    localStorage.setItem("feedback_users", feedback);
    setIsSubmitted(true);
    toast.success("Wishlist request logged!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 md:p-12 shadow-xl border border-slate-950">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-72 h-72 bg-slate-500 rounded-full opacity-10 blur-3xl" />
        
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30 text-xs font-semibold text-slate-300">
            <Sparkles className="w-3.5 h-3.5" /> Security Preview — Coming Soon
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            User Access Governance & <span className="text-brand-400">Security Audit Logs</span>
          </h1>
          <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
            Audit user roles, configure custom permission tags, review real-time security events, monitor suspicious login behaviors, and manage active college sessions inside your tenant context.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-indigo-300 font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-brand-400" /> Planned Release: Q1 2027</span>
            <span className="w-1.5 h-1.5 bg-indigo-700 rounded-full" />
            <span className="flex items-center gap-1.5"><Info className="w-4 h-4 text-brand-400" /> Target Users: College Admins</span>
          </div>
        </div>
      </div>

      {/* Directory Interface Mockup */}
      <div className="card border border-slate-100 shadow-md">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Tenant User Registry
          </h2>
          <p className="text-xs text-gray-400">Security Access Panel Sandbox — Promote mock users and verify active lists</p>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto pt-4">
          <table className="w-full text-left text-sm text-gray-700">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] text-gray-400 uppercase font-black tracking-wider">
                <th className="py-2.5">User Email</th>
                <th className="py-2.5">Assigned Role</th>
                <th className="py-2.5">Account Status</th>
                <th className="py-2.5">Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50/50 hover:bg-gray-50/50">
                  <td className="py-3 font-semibold text-gray-800">{u.email}</td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === "Admin" ? "bg-amber-100 text-amber-700" :
                      u.role === "Faculty" ? "bg-purple-100 text-purple-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-[10px] font-bold ${u.status === "active" ? "text-green-600" : "text-rose-500"}`}>
                      ● {u.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-gray-400">{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Manager & Audit Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Role Assignment Console */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" /> Permission Promotion Console
            </h3>
            <p className="text-xs text-gray-400">Elevate mock user roles dynamically to verify administrative layout changes.</p>
          </div>

          <form onSubmit={handleRoleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Select Target User</label>
                <select 
                  value={selectedUser} 
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.email}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Assign New Role</label>
                <select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4" /> Save User Permissions
            </button>
          </form>
        </div>

        {/* Security Audit Trail */}
        <div className="card space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" /> Live Security Audit Logs
            </h3>
            <p className="text-xs text-gray-400">Scrollable feed of critical system hooks and role modifications.</p>
          </div>

          <div className="border border-gray-100 rounded-2xl bg-gray-50/50 p-3 h-48 overflow-y-auto space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="text-[10px] bg-white border border-gray-100 rounded-lg p-2 flex items-start gap-2 leading-relaxed">
                <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-800">
                    <span className="text-gray-400 mr-1">[{log.time}]</span> 
                    <strong>{log.user}</strong>: {log.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waitlist */}
        <div className="card h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-500" /> Security Audit Waitlist
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Interested in custom security rules, compliance logging, and active IP monitoring alerts? Join the beta waitlist.
            </p>
          </div>

          <div className="mt-6">
            {isWaitlisted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <h4 className="font-bold text-sm">Waitlist Confirmed</h4>
                <p className="text-xs text-green-600">
                  We'll email you at <strong>{localStorage.getItem("waitlist_users") || email}</strong> when security logs launch.
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
                    placeholder="it_security@university.edu"
                    className="input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  Request Security Beta Token <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Feature Request */}
        <div className="card h-full flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" /> Governance Request
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Need custom SAML integrations, password complexity limits, or multi-turn audit export structures? Let us know.
            </p>
          </div>

          <div className="mt-6">
            {isSubmitted ? (
              <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl p-4 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-500 mx-auto" />
                <h4 className="font-bold text-sm">Feedback Captured</h4>
                <p className="text-xs text-indigo-600">
                  Your security wishlist request has been logged.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedback} className="space-y-3">
                <div>
                  <label className="label">Security Feature Wishes</label>
                  <textarea 
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. We require Single Sign-On (SSO) with Shibboleth or Google Workspace and auto-expiration of inactive faculty accounts..."
                    className="input resize-none py-2"
                  />
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 bg-indigo-900 hover:bg-indigo-950">
                  Submit Security Request <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

