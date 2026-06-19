"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageSquare, Send, BellRing, Users } from "lucide-react";
import toast from "react-hot-toast";

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const payload = { subject, body };
      const res = await api.post("/admin-orch/broadcast", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Broadcast message sent!");
      setRecentBroadcasts([data, ...recentBroadcasts]);
      setSubject("");
      setBody("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to send broadcast.");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) return;
    broadcastMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BellRing className="w-6 h-6 text-brand-600" />
          Broadcast Messages
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Send important announcements to all students in your college.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-500" />
              Compose Message
            </h3>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="label">Subject Line *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important: Upcoming Drive Registration"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Message Body *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  required
                  className="input min-h-[200px]"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={broadcastMutation.isPending || !subject || !body}
                  className="btn-primary flex items-center gap-2"
                >
                  {broadcastMutation.isPending ? "Sending..." : "Send to All Students"}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-brand-50 border border-brand-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h4 className="font-semibold text-brand-900">Audience</h4>
                <p className="text-sm text-brand-700 mt-1">
                  This message will be visible on the dashboards of all students registered under your institution.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Recently Sent (Session)</h3>
            {recentBroadcasts.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No broadcasts sent in this session.</p>
            ) : (
              <div className="space-y-4">
                {recentBroadcasts.map((b) => (
                  <div key={b.id} className="border-l-2 border-brand-500 pl-3 py-1">
                    <p className="font-medium text-sm text-gray-800 line-clamp-1">{b.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(b.sent_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
