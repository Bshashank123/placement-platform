"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, FileText, BarChart2, MessageSquare,
  Send, Star, Loader2, CheckCircle2, Calendar,
  User, Award,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Student {
  id: number;
  name: string;
  roll_number: string | null;
  department: string | null;
  branch: string | null;
  year: number | null;
  cgpa: number | null;
  github_url: string | null;
  linkedin_url: string | null;
  skills: { id: number; skill_name: string }[];
}

interface Resume {
  id: number;
  file_name: string;
  resume_type: string;
  is_primary: boolean;
  uploaded_at: string;
}

interface Review {
  id: number;
  resume_id: number;
  comments: string;
  created_at: string;
  faculty_name: string;
  faculty_designation: string | null;
}

export default function StudentReviewPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [student, setStudent]   = useState<Student | null>(null);
  const [resumes, setResumes]   = useState<Resume[]>([]);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Student>(`/students/${id}/profile`),
      api.get<Resume[]>(`/faculty/students/${id}/resumes`),
    ])
      .then(([s, r]) => {
        setStudent(s.data);
        setResumes(r.data);
        const primary = r.data.find((x) => x.is_primary) ?? r.data[0];
        if (primary) {
          setSelected(primary.id);
          loadReviews(primary.id);
        }
      })
      .catch(() => router.push("/dashboard/faculty"))
      .finally(() => setLoading(false));
  }, [id]);

  const loadReviews = (resumeId: number) => {
    api.get<Review[]>(`/faculty/resume/${resumeId}/reviews`)
      .then((r) => setReviews(r.data))
      .catch(() => {});
  };

  const handleSelectResume = (resumeId: number) => {
    setSelected(resumeId);
    loadReviews(resumeId);
  };

  const handleSubmitReview = async () => {
    if (!selected || !comment.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/faculty/review/${selected}`, { comments: comment.trim() });
      toast.success("Review submitted!");
      setComment("");
      loadReviews(selected);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="max-w-4xl space-y-6">

      <Link href="/dashboard/faculty"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to students
      </Link>

      {/* Student header */}
      <div className="card flex items-start gap-5">
        <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold shrink-0">
          {student.name[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {student.roll_number && `${student.roll_number} · `}
            {student.department && `${student.department} · `}
            {student.branch && `${student.branch} · `}
            {student.year && `Year ${student.year}`}
            {student.cgpa && ` · CGPA ${student.cgpa}`}
          </p>
          {student.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {student.skills.map((s) => (
                <span key={s.id} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">
                  {s.skill_name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {student.github_url && (
            <a href={student.github_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              GitHub
            </a>
          )}
          {student.linkedin_url && (
            <a href={student.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left — Resume selector + actions */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-500" />
              Resumes ({resumes.length})
            </h3>

            {resumes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No resumes uploaded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectResume(r.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                      selected === r.id
                        ? "border-brand-300 bg-brand-50"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      r.is_primary ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-400"
                    )}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.file_name}</p>
                      <p className="text-xs text-gray-400">{r.resume_type} · {formatDate(r.uploaded_at)}</p>
                    </div>
                    {r.is_primary && (
                      <Star className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/dashboard/faculty/resume/${selected}`}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 py-2 rounded-xl transition-colors"
                >
                  <FileText className="w-4 h-4" /> View Parsed Resume
                </Link>
                <Link
                  href={`/dashboard/ats/${selected}`}
                  className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <BarChart2 className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Leave review */}
          {selected && resumes.length > 0 && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-500" /> Leave a Review
              </h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                className="input resize-none"
                placeholder={`Add feedback for ${student.name}…\n\nExamples:\n• Improve project impact with metrics\n• Add GitHub links to your projects\n• Use stronger action verbs`}
              />
              <button
                onClick={handleSubmitReview}
                disabled={!comment.trim() || submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><Send className="w-4 h-4" /> Submit Review</>
                }
              </button>
            </div>
          )}
        </div>

        {/* Right — Review history */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-500" />
            Review History ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No reviews yet for this resume.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {reviews.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.faculty_name}</p>
                      {r.faculty_designation && (
                        <p className="text-xs text-gray-400">{r.faculty_designation}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {r.comments}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}