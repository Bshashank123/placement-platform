"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  ArrowLeft, FileText, Tag, Calendar, Star,
  CheckCircle2, XCircle, BarChart2, Loader2,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Section {
  id: number;
  section_name: string;
  content: string;
}

interface Bullet {
  id: number;
  section_name: string;
  bullet_text: string;
  word_count: number;
  has_metric: boolean;
  weak_verb: boolean;
}

interface ResumeDetail {
  id: number;
  file_name: string;
  resume_type: string;
  is_primary: boolean;
  uploaded_at: string;
  sections: Section[];
  bullets: Bullet[];
  detected_skills: string[];
}

const SECTION_ORDER = [
  "summary", "education", "experience", "projects",
  "skills", "certifications", "achievements", "leadership",
];

export default function ResumeDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sections" | "bullets" | "skills">("sections");

  useEffect(() => {
    api.get<ResumeDetail>(`/resumes/${id}`)
      .then((r) => setResume(r.data))
      .catch(() => router.push("/dashboard/resumes"))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!resume) return null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  const sortedSections = [...resume.sections].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a.section_name);
    const bi = SECTION_ORDER.indexOf(b.section_name);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const metricBullets = resume.bullets.filter((b) => b.has_metric).length;
  const weakBullets   = resume.bullets.filter((b) => b.weak_verb).length;
  const goodBullets   = resume.bullets.filter((b) => b.word_count >= 12 && b.word_count <= 25).length;

  return (
    <div className="max-w-4xl space-y-6">

      {/* Back */}
      <Link href="/dashboard/resumes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to resumes
      </Link>

      {/* Header card */}
      <div className="card flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
            resume.is_primary ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-500"
          )}>
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{resume.file_name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Tag className="w-3 h-3" /> {resume.resume_type}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" /> {formatDate(resume.uploaded_at)}
              </span>
              {resume.is_primary && (
                <span className="flex items-center gap-1 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                  <Star className="w-3 h-3" /> Primary
                </span>
              )}
            </div>
          </div>
        </div>
        <Link href="/dashboard/ats"
          className="flex items-center gap-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors shrink-0">
          <BarChart2 className="w-4 h-4" /> Get ATS Score
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Sections",      value: resume.sections.length,  color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "Bullets",       value: resume.bullets.length,   color: "text-purple-600", bg: "bg-purple-50" },
          { label: "With metrics",  value: metricBullets,           color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Skills found",  value: resume.detected_skills.length, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className={clsx("rounded-xl p-4 text-center", s.bg)}>
            <p className={clsx("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(["sections", "bullets", "skills"] as const).map((tab) => (
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
              {tab} {tab === "sections" && `(${resume.sections.length})`}
              {tab === "bullets"  && `(${resume.bullets.length})`}
              {tab === "skills"   && `(${resume.detected_skills.length})`}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* Sections tab */}
          {activeTab === "sections" && (
            <div className="space-y-4">
              {sortedSections.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No sections detected.</p>
              ) : sortedSections.map((s) => (
                <div key={s.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700 capitalize">{s.section_name}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {s.content || "No content extracted."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bullets tab */}
          {activeTab === "bullets" && (
            <div className="space-y-3">
              {resume.bullets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No bullet points detected.</p>
                  <p className="text-gray-300 text-xs mt-1">
                    Make sure your resume uses bullet markers (•, -, *).
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {metricBullets} have metrics
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                      {goodBullets} ideal length (12–25 words)
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      {weakBullets} weak verbs
                    </span>
                  </div>
                  {resume.bullets.map((b) => (
                    <div key={b.id}
                      className={clsx(
                        "flex gap-3 p-3 rounded-xl border text-sm",
                        b.has_metric
                          ? "border-green-100 bg-green-50"
                          : b.weak_verb
                          ? "border-red-100 bg-red-50"
                          : "border-gray-100 bg-white"
                      )}>
                      <div className="shrink-0 mt-0.5">
                        {b.has_metric
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : b.weak_verb
                          ? <XCircle className="w-4 h-4 text-red-400" />
                          : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 leading-snug">{b.bullet_text}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-gray-400 capitalize">{b.section_name}</span>
                          <span className={clsx(
                            "text-xs px-1.5 py-0.5 rounded",
                            b.word_count >= 12 && b.word_count <= 25
                              ? "bg-blue-50 text-blue-600"
                              : b.word_count < 12
                              ? "bg-amber-50 text-amber-600"
                              : "bg-orange-50 text-orange-600"
                          )}>
                            {b.word_count} words
                          </span>
                          {b.weak_verb && (
                            <span className="text-xs text-red-500">weak verb</span>
                          )}
                          {b.has_metric && (
                            <span className="text-xs text-green-600">has metric ✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Skills tab */}
          {activeTab === "skills" && (
            <div>
              {resume.detected_skills.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  No known skills detected. Add more technical terms to your resume.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {resume.detected_skills.map((s) => (
                    <span key={s}
                      className="bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1.5 rounded-full border border-brand-100 capitalize">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}