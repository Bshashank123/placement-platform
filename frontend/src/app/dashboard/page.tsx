"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, BarChart2, Trophy, Building2,
  ArrowRight, Upload, MessageSquare, TrendingUp,
  AlertCircle, Loader2, User, Users, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface DashboardStats {
  ats_score: number | null;
  rank: number | null;
  total_in_dept: number | null;
  percentile: string | null;
  resume_count: number;
  company_match_count: number;
  faculty_review_count: number;
  top_ats_improvement: string | null;
  impact_score: number | null;
  skills_score: number | null;
  structure_score: number | null;
  format_score: number | null;
  brevity_score: number | null;
}

interface DeptAnalytics {
  department: string;
  total_students: number;
  scored_students: number;
  avg_ats_score: number;
  strong_students: number;
  weak_students: number;
}

function HeatmapBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const pct = value ?? 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">
        {value !== null ? `${pct}%` : "—"}
      </span>
    </div>
  );
}

function StatCard({ href, icon: Icon, color, value, label, sub }: {
  href: string; icon: React.ElementType; color: string;
  value: string; label: string; sub: string;
}) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow group">
      <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
      <p className="text-xs text-gray-400 mt-1 leading-snug">{sub}</p>
      <div className="flex items-center gap-1 mt-3 text-xs font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
        View <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Average";
  return "Needs work";
}

// ── Faculty/Admin overview ─────────────────────────────────────────────────

function FacultyOverview({ role, email, tenantName }: {
  role: string; email: string; tenantName: string;
}) {
  const [analytics, setAnalytics] = useState<DeptAnalytics[]>([]);
  const [loading, setLoading]     = useState(true);
  const firstName = email.split("@")[0];

  useEffect(() => {
  if (role === "faculty") {
    setLoading(false);
    return;
  }
  api.get<DeptAnalytics[]>("/admin/analytics")
    .then((r) => setAnalytics(r.data))
    .catch(() => {})
    .finally(() => setLoading(false));
}, [role]);

  const totalStudents = analytics.reduce((s, d) => s + d.total_students, 0);
  const scored = analytics.reduce((s, d) => s + d.scored_students, 0);
  const avgAts = analytics.length
    ? Math.round(analytics.reduce((s, d) => s + d.avg_ats_score, 0) / analytics.length)
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, <span className="text-brand-600 capitalize">{firstName}</span> 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            {role.replace("_", " ")} — {tenantName}
          </p>
        </div>
        <Link href="/dashboard/faculty"
          className="flex items-center gap-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">
          <Users className="w-4 h-4" /> View Students
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
          <p className="text-xs text-gray-500 mt-1">Total Students</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{scored}</p>
          <p className="text-xs text-gray-500 mt-1">Resumes Scored</p>
        </div>
        <div className="card text-center">
          <p className={clsx("text-3xl font-bold", avgAts && avgAts >= 65 ? "text-green-600" : "text-amber-600")}>
            {avgAts ?? "—"}
          </p>
          <p className="text-xs text-gray-500 mt-1">Avg. ATS Score</p>
        </div>
      </div>

      {/* Department breakdown */}
      {!loading && analytics.length > 0 && role !== "faculty" && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Department Breakdown</h3>
          <div className="space-y-3">
            {analytics.map((d) => (
              <div key={d.department} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-24 shrink-0">
                  {d.department}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-brand-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${d.avg_ats_score}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-12 text-right">
                  {d.avg_ats_score}
                </span>
                <span className="text-xs text-gray-400 w-24 text-right">
                  {d.total_students} students
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Super Admin overview ──────────────────────────────────────────────────

function SuperAdminOverview({ email }: { email: string }) {
  const [stats, setStats] = useState<any>(null);
  const firstName = email.split("@")[0];

  useEffect(() => {
    api.get("/platform/analytics")
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Platform Admin — <span className="text-brand-600 capitalize">{firstName}</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Super admin dashboard</p>
        </div>
        <Link href="/dashboard/superadmin"
          className="flex items-center gap-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">
          Manage Platform
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Colleges",      value: stats.total_colleges,  color: "text-brand-600" },
            { label: "Students",      value: stats.total_students,  color: "text-blue-600"  },
            { label: "Resumes",       value: stats.total_resumes,   color: "text-purple-600"},
            { label: "Avg ATS",       value: stats.platform_avg_ats,color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="card text-center">
              <p className={clsx("text-3xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<DashboardStats>("/students/dashboard");
      return res.data;
    },
    enabled: !!user && user.role === "student",
  });


  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (user.role === "faculty" || user.role === "admin") {
    return (
      <FacultyOverview
        role={user.role}
        email={user.email}
        tenantName={user.tenant?.name ?? ""}
      />
    );
  }

  if (user.role === "super_admin") {
    return <SuperAdminOverview email={user.email} />;
  }

  // ── Student dashboard ─────────────────────────────────────────────────────
  const firstName = user.email.split("@")[0];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-brand-600 capitalize">{firstName}</span> 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s your placement readiness overview.</p>
        </div>
        <Link href="/dashboard/profile"
          className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors">
          <User className="w-4 h-4" /> Edit Profile
        </Link>
      </div>

      {statsLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading your stats…
        </div>
      ) : statsError ? (
        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4" />
          Could not load stats. Make sure the backend is running.
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard href="/dashboard/ats" icon={BarChart2} color="bg-purple-50 text-purple-600"
            value={stats?.ats_score !== null ? `${stats?.ats_score}/100` : "—"}
            label="ATS Score"
            sub={stats?.ats_score !== null ? scoreLabel(stats!.ats_score) : "Upload a resume to score"} />
          <StatCard href="/dashboard/ranking" icon={Trophy} color="bg-amber-50 text-amber-600"
            value={stats?.rank ? `#${stats.rank}` : "—"}
            label="Department Rank"
            sub={stats?.rank ? `${stats.percentile} · ${stats.total_in_dept} students` : "No rank yet"} />
          <StatCard href="/dashboard/resumes" icon={FileText} color="bg-blue-50 text-blue-600"
            value={String(stats?.resume_count ?? 0)}
            label="Resumes"
            sub={stats?.resume_count === 0 ? "Upload your first resume" : `${stats?.resume_count} uploaded`} />
          <StatCard href="/dashboard/companies" icon={Building2} color="bg-green-50 text-green-600"
            value={String(stats?.company_match_count ?? 0)}
            label="Company Matches"
            sub={stats?.company_match_count === 0 ? "No matches yet" : "Eligible companies"} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" /> Resume Strength
            </h3>
          </div>
          {!statsLoading && stats?.ats_score === null ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Upload a resume to see your strength heatmap</p>
              <Link href="/dashboard/resumes"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                Upload now <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <HeatmapBar label="Impact"     value={stats?.impact_score    ?? null} color="bg-purple-400" />
              <HeatmapBar label="Skills"     value={stats?.skills_score    ?? null} color="bg-blue-400"   />
              <HeatmapBar label="Structure"  value={stats?.structure_score ?? null} color="bg-green-400"  />
              <HeatmapBar label="ATS Format" value={stats?.format_score    ?? null} color="bg-amber-400"  />
              <HeatmapBar label="Brevity"    value={stats?.brevity_score   ?? null} color="bg-red-400"    />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {stats?.top_ats_improvement && (
            <div className="card bg-amber-50 border-amber-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Top improvement</p>
                <p className="text-sm text-amber-700 mt-0.5">{stats.top_ats_improvement}</p>
              </div>
            </div>
          )}
          <Link href="/dashboard/reviews" className="card hover:shadow-md transition-shadow group flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Faculty Reviews</p>
              <p className="text-sm text-gray-400">
                {stats?.faculty_review_count
                  ? `${stats.faculty_review_count} review${stats.faculty_review_count > 1 ? "s" : ""} received`
                  : "No reviews yet"}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
          </Link>
          {stats?.resume_count === 0 && (
            <Link href="/dashboard/resumes"
              className="card bg-brand-600 text-white flex items-center justify-between hover:bg-brand-700 transition-colors">
              <div>
                <p className="font-semibold">Upload your resume</p>
                <p className="text-brand-200 text-sm mt-0.5">Get your ATS score instantly</p>
              </div>
              <Upload className="w-6 h-6 text-brand-200" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}