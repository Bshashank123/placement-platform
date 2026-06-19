"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Building2, CheckCircle2, XCircle, ChevronRight,
  Loader2, Star, AlertCircle, RefreshCw, Search,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface CompanyMatch {
  company_id: number;
  company_name: string;
  role: string | null;
  match_score: number;
  skill_match_pct: number;
  cgpa_eligible: boolean;
  matched_skills: string[];
  missing_skills: string[];
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-red-100 text-red-600 border-red-200";
  return (
    <span className={clsx("text-sm font-bold px-3 py-1 rounded-full border", color)}>
      {score}%
    </span>
  );
}

export default function CompaniesPage() {
  const [matches, setMatches]   = useState<CompanyMatch[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all" | "eligible" | "partial">("all");

  const load = (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    api.get<CompanyMatch[]>("/admin/matches/me")
      .then((r) => setMatches(r.data))
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = matches.filter((m) => {
    const matchesSearch = m.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.role ?? "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "eligible") return m.match_score >= 75 && m.cgpa_eligible;
    if (filter === "partial")  return m.match_score >= 40 && m.match_score < 75;
    return true;
  });

  const eligible = matches.filter((m) => m.match_score >= 75 && m.cgpa_eligible).length;
  const partial  = matches.filter((m) => m.match_score >= 40 && m.match_score < 75).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-16">
          <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No companies added yet</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
            Your placement cell hasn&apos;t added any companies yet.
            Check back soon, or make sure you&apos;ve updated your profile skills.
          </p>
          <Link href="/dashboard/profile"
            className="mt-6 inline-flex items-center gap-2 btn-primary px-5 py-2.5 text-sm">
            Update Skills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Matches</h2>
          <p className="text-gray-500 text-sm mt-1">
            Based on your skills, CGPA, and profile.
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw className={clsx("w-4 h-4", refreshing && "animate-spin")} />
          Recalculate
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center bg-green-50 border-green-100">
          <p className="text-3xl font-bold text-green-700">{eligible}</p>
          <p className="text-xs text-green-600 mt-1">Fully Eligible</p>
        </div>
        <div className="card text-center bg-amber-50 border-amber-100">
          <p className="text-3xl font-bold text-amber-700">{partial}</p>
          <p className="text-xs text-amber-600 mt-1">Partial Match</p>
        </div>
        <div className="card text-center bg-gray-50">
          <p className="text-3xl font-bold text-gray-700">{matches.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Companies</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies or roles…"
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "eligible", "partial"] as const).map((f) => (
            <button key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize",
                filter === f
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Match scores update automatically when you update your skills profile or upload a new resume.
          Add missing skills at <Link href="/dashboard/profile" className="underline font-medium">My Profile</Link>.
        </span>
      </div>

      {/* Company cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400 text-sm">No companies match the current filter.</p>
          </div>
        ) : (
          filtered.map((match) => (
            <div key={match.company_id} className={clsx(
              "card border-l-4 space-y-4",
              match.match_score >= 75 && match.cgpa_eligible
                ? "border-l-green-400"
                : match.match_score >= 40
                ? "border-l-amber-400"
                : "border-l-red-300"
            )}>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0",
                    match.match_score >= 75 ? "bg-green-100 text-green-700" :
                    match.match_score >= 40 ? "bg-amber-100 text-amber-700" :
                    "bg-red-50 text-red-500"
                  )}>
                    {match.company_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{match.company_name}</h3>
                      {match.match_score >= 75 && match.cgpa_eligible && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Star className="w-3 h-3" /> Best Match
                        </span>
                      )}
                    </div>
                    {match.role && (
                      <p className="text-sm text-gray-500">{match.role}</p>
                    )}
                  </div>
                </div>
                <ScoreBadge score={match.match_score} />
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Skill Match</span>
                    <span className="text-xs font-bold text-gray-700">{match.skill_match_pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={clsx(
                      "h-full rounded-full transition-all duration-700",
                      match.skill_match_pct >= 75 ? "bg-green-500" :
                      match.skill_match_pct >= 40 ? "bg-amber-400" : "bg-red-400"
                    )} style={{ width: `${match.skill_match_pct}%` }} />
                  </div>
                </div>
                <div className={clsx(
                  "rounded-xl p-3 flex items-center gap-2",
                  match.cgpa_eligible ? "bg-green-50" : "bg-red-50"
                )}>
                  {match.cgpa_eligible
                    ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  }
                  <div>
                    <p className={clsx("text-xs font-medium",
                      match.cgpa_eligible ? "text-green-700" : "text-red-600")}>
                      CGPA {match.cgpa_eligible ? "Eligible" : "Below Min"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                {match.matched_skills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Matched skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matched_skills.map((s) => (
                        <span key={s} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {match.missing_skills.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">Missing skills:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.missing_skills.map((s) => (
                        <Link key={s} href="/dashboard/profile"
                          className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-200 hover:bg-red-100 transition-colors">
                          + {s}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}