"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  BarChart2, Zap, AlertCircle, CheckCircle2,
  ChevronRight, Loader2, FileText, Trophy,
  TrendingUp, TrendingDown, Info,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Resume {
  id: number;
  file_name: string;
  is_primary: boolean;
  resume_type: string;
}

interface Score {
  resume_id: number;
  ats_score: number;
  impact_score: number;
  brevity_score: number;
  style_score: number;
  sections_score: number;
  calculated_at: string;
}

interface Suggestion {
  id: number;
  category: string;
  suggestion_text: string;
  priority: number;
}

interface ATSResult {
  score: Score;
  suggestions: Suggestion[];
  impact_pct: number;
  brevity_pct: number;
  style_pct: number;
  sections_pct: number;
  grade: string;
  summary: string;
}

const CATEGORY_META: Record<string, { label: string; max: number; color: string; bar: string }> = {
  impact:   { label: "Impact & Achievements", max: 40, color: "text-purple-600", bar: "bg-purple-500" },
  brevity:  { label: "Brevity & Word Choice", max: 25, color: "text-red-600",    bar: "bg-red-500"    },
  style:    { label: "Style & Formatting",    max: 20, color: "text-blue-600",   bar: "bg-blue-500"   },
  sections: { label: "Resume Sections",       max: 15, color: "text-green-600",  bar: "bg-green-500"  },
};

const PRIORITY_META: Record<number, { label: string; color: string; dot: string }> = {
  1: { label: "High",   color: "text-red-700   bg-red-50   border-red-200",   dot: "bg-red-500"    },
  2: { label: "Medium", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-400"  },
  3: { label: "Low",    color: "text-blue-700  bg-blue-50  border-blue-200",  dot: "bg-blue-400"   },
};

const GRADE_META: Record<string, { color: string; bg: string }> = {
  "A": { color: "text-green-700",  bg: "bg-green-100"  },
  "B": { color: "text-blue-700",   bg: "bg-blue-100"   },
  "C": { color: "text-amber-700",  bg: "bg-amber-100"  },
  "D": { color: "text-orange-700", bg: "bg-orange-100" },
  "F": { color: "text-red-700",    bg: "bg-red-100"    },
};

export default function ATSPage() {
  const [resumes, setResumes]       = useState<Resume[]>([]);
  const [selected, setSelected]     = useState<number | null>(null);
  const [result, setResult]         = useState<ATSResult | null>(null);
  const [scoring, setScoring]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<"breakdown" | "suggestions">("breakdown");

  useEffect(() => {
    api.get<Resume[]>("/resumes/")
      .then((r) => {
        setResumes(r.data);
        const primary = r.data.find((r) => r.is_primary) ?? r.data[0];
        if (primary) {
          setSelected(primary.id);
          // Try loading existing score
          api.get<ATSResult>(`/ats/${primary.id}/score`)
            .then((res) => setResult(res.data))
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelectResume = (id: number) => {
    setSelected(id);
    setResult(null);
    setLoading(true);
    api.get<ATSResult>(`/ats/${id}/score`)
      .then((r) => setResult(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const pollScoreStatus = async (taskId: string) => {
    try {
      const res = await api.get(`/ats/score-status/${taskId}`);
      if (res.data.status === "SUCCESS") {
        const finalResult = await api.get<ATSResult>(`/ats/${selected}/score`);
        setResult(finalResult.data);
        setActiveTab("breakdown");
        toast.success(`ATS Score: ${finalResult.data.score.ats_score}/100`);
        setScoring(false);
      } else if (res.data.status === "FAILURE") {
        toast.error("Scoring failed in background.");
        setScoring(false);
      } else {
        setTimeout(() => pollScoreStatus(taskId), 2000);
      }
    } catch (err) {
      toast.error("Error checking scoring status.");
      setScoring(false);
    }
  };

  const handleScore = async () => {
    if (!selected) return;
    setScoring(true);
    try {
      const res = await api.post<any>(`/ats/${selected}/score`);
      
      if (res.data.status === "processing") {
        toast.success("ATS Engine processing in background...");
        pollScoreStatus(res.data.task_id);
      } else if (res.data.status === "completed") {
        const finalResult = await api.get<ATSResult>(`/ats/${selected}/score`);
        setResult(finalResult.data);
        setActiveTab("breakdown");
        toast.success(`ATS Score: ${finalResult.data.score.ats_score}/100`);
        setScoring(false);
      } else {
        // Fallback if backend returned ATSResultOut directly
        setResult(res.data);
        setActiveTab("breakdown");
        toast.success(`ATS Score: ${res.data.score?.ats_score}/100`);
        setScoring(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Scoring failed.");
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="max-w-2xl">
        <div className="card text-center py-16">
          <FileText className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No resumes yet</h2>
          <p className="text-gray-400 text-sm mt-2">Upload a resume first to get your ATS score.</p>
          <Link href="/dashboard/resumes"
            className="mt-6 inline-flex items-center gap-2 btn-primary px-6 py-2.5">
            Upload Resume <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const score = result?.score;
  const gradeMeta = score ? GRADE_META[result.grade] ?? GRADE_META["F"] : null;

  return (
    <div className="max-w-4xl space-y-6">

      <div>
        <h2 className="text-2xl font-bold text-gray-900">ATS Score Analysis</h2>
        <p className="text-gray-500 text-sm mt-1">
          ResumeWorded-level scoring across 5 categories.
        </p>
      </div>

      {/* Resume selector + score button */}
      <div className="card flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-52">
          <label className="label">Select resume to analyse</label>
          <select
            value={selected ?? ""}
            onChange={(e) => handleSelectResume(Number(e.target.value))}
            className="input"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.file_name} {r.is_primary ? "(Primary)" : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleScore}
          disabled={!selected || scoring}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 shrink-0"
        >
          {scoring
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</>
            : <><Zap className="w-4 h-4" /> {result ? "Re-score" : "Get ATS Score"}</>
          }
        </button>
      </div>

      {/* Score result */}
      {result && score && (
        <>
          {/* Score hero */}
          <div className="card bg-gradient-to-br from-brand-600 to-indigo-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-200 text-sm font-medium">Overall ATS Score</p>
                <div className="flex items-end gap-3 mt-1">
                  <span className="text-6xl font-black">{score.ats_score}</span>
                  <span className="text-2xl text-brand-300 mb-1">/100</span>
                  <span className={clsx(
                    "mb-2 text-lg font-bold px-3 py-0.5 rounded-full",
                    gradeMeta?.bg, gradeMeta?.color
                  )}>
                    {result.grade}
                  </span>
                </div>
                <p className="text-brand-200 text-sm mt-2 max-w-md">{result.summary}</p>
              </div>
              <div className="hidden md:block">
                <ScoreCircle value={score.ats_score} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="card p-0 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {(["breakdown", "suggestions"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "px-6 py-3.5 text-sm font-medium capitalize transition-colors",
                    activeTab === tab
                      ? "border-b-2 border-brand-500 text-brand-600 bg-brand-50"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tab === "breakdown" ? "Score Breakdown" : `Suggestions (${result.suggestions.length})`}
                </button>
              ))}
            </div>

            <div className="p-6">

              {activeTab === "breakdown" && (
                <div className="space-y-5">
                  {[
                    { key: "impact",   score: score.impact_score,   pct: result.impact_pct   },
                    { key: "brevity",  score: score.brevity_score,  pct: result.brevity_pct  },
                    { key: "style",    score: score.style_score,    pct: result.style_pct    },
                    { key: "sections", score: score.sections_score, pct: result.sections_pct },
                  ].map(({ key, score: catScore, pct }) => {
                    const meta = CATEGORY_META[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={clsx("text-sm font-bold", meta.color)}>
                              {catScore}/{meta.max}
                            </span>
                            <span className="text-xs text-gray-400">({pct}%)</span>
                            {pct >= 75
                              ? <TrendingUp className="w-4 h-4 text-green-500" />
                              : pct >= 50
                              ? <div className="w-4 h-4" />
                              : <TrendingDown className="w-4 h-4 text-red-400" />
                            }
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={clsx("h-full rounded-full transition-all duration-700", meta.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Weight info */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Weights: Impact 40% · Brevity 25% · Style 20% · Sections 15%
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "suggestions" && (
                <div className="space-y-3">
                  {result.suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">Excellent work!</p>
                      <p className="text-gray-400 text-sm mt-1">No major issues found.</p>
                    </div>
                  ) : (
                    result.suggestions.map((s) => {
                      const pm = PRIORITY_META[s.priority] ?? PRIORITY_META[3];
                      return (
                        <div key={s.id}
                          className={clsx(
                            "flex gap-3 p-4 rounded-xl border text-sm",
                            pm.color
                          )}>
                          <div className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", pm.dot)} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide capitalize">
                                {s.category}
                              </span>
                              <span className="text-xs font-medium opacity-70">
                                {pm.label} priority
                              </span>
                            </div>
                            <p className="leading-relaxed">{s.suggestion_text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ranking update notice */}
          <div className="card bg-green-50 border-green-100 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Department ranking updated</p>
              <p className="text-xs text-green-600 mt-0.5">
                Your rank has been recalculated based on this score.
                <Link href="/dashboard/ranking" className="ml-1 underline font-medium">View ranking →</Link>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Empty state — resume selected but not yet scored */}
      {!result && !scoring && selected && (
        <div className="card text-center py-14">
          <BarChart2 className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Ready to analyse</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-sm mx-auto">
            Click <strong>Get ATS Score</strong> above to run the scoring engine on your resume.
          </p>
        </div>
      )}

    </div>
  );
}


// ── Circular score indicator ──────────────────────────────────────────────────

function ScoreCircle({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none"
        stroke="rgba(255,255,255,0.15)" strokeWidth="12" />
      <circle cx="70" cy="70" r={radius} fill="none"
        stroke="white" strokeWidth="12"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="70" y="65" textAnchor="middle" fill="white"
        fontSize="28" fontWeight="800">{value}</text>
      <text x="70" y="85" textAnchor="middle" fill="rgba(255,255,255,0.7)"
        fontSize="12">/100</text>
    </svg>
  );
}