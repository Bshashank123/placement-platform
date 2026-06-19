"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageSquare, Quote, UserCircle, Calendar, Loader2 } from "lucide-react";

interface PlatformFeedback {
  id: number;
  user_id: number;
  tenant_id: number;
  role: string;
  message: string;
  submitted_at: string;
}

export default function FeedbackPage() {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["superadmin-feedback"],
    queryFn: async () => {
      const res = await api.get<PlatformFeedback[]>("/platform/feedback");
      return res.data;
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-600" />
          Platform Feedback
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Review feedback and feature requests submitted by users across all colleges.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : !feedback || feedback.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-700">No feedback submitted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedback.map((fb) => (
            <div key={fb.id} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                      {fb.role.replace("_", " ")}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      User #{fb.user_id} · Tenant #{fb.tenant_id}
                    </p>
                  </div>
                </div>
                <Quote className="w-5 h-5 text-gray-200" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  &quot;{fb.message}&quot;
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(fb.submitted_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
