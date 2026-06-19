"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MessageSquare, FileText, User, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";

interface Review {
  id: number;
  resume_id: number;
  resume_name: string;
  faculty_id: number;
  comments: string;
  created_at: string;
  faculty_name: string;
  faculty_designation: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Review[]>("/students/reviews")
      .then((r) => setReviews(r.data))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Faculty Reviews</h2>
        <p className="text-gray-500 text-sm mt-1">
          Feedback from your placement officers and faculty.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="card text-center py-16">
          <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No reviews yet</h3>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">
            Faculty will leave feedback here after reviewing your resume.
            Make sure you have uploaded a resume.
          </p>
          <Link href="/dashboard/resumes"
            className="mt-6 inline-flex btn-primary px-5 py-2.5 text-sm">
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {review.faculty_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {review.faculty_name}
                    </p>
                    {review.faculty_designation && (
                      <p className="text-xs text-gray-400">{review.faculty_designation}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(review.created_at)}
                </div>
              </div>

              {/* Resume tag */}
              <Link
                href={`/dashboard/resumes/${review.resume_id}`}
                className="inline-flex items-center gap-1.5 text-xs text-brand-600 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full hover:bg-brand-100 transition-colors"
              >
                <FileText className="w-3 h-3" />
                {review.resume_name}
              </Link>

              {/* Comments */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {review.comments}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}