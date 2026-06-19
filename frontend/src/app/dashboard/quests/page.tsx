"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Target, Loader2, CheckCircle2, Award, Zap } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Quest {
  id: number;
  title: string;
  description: string;
  target_departments: string;
  points: number;
  is_active: boolean;
  created_at: string;
  is_completed: boolean;
}

export default function StudentQuestsPage() {
  const queryClient = useQueryClient();

  const { data: quests, isLoading } = useQuery({
    queryKey: ["student-quests"],
    queryFn: async () => {
      const res = await api.get<Quest[]>("/quests/student");
      return res.data;
    },
  });

  const completeQuest = useMutation({
    mutationFn: async (questId: number) => {
      const res = await api.post(`/quests/student/${questId}/complete`, {});
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Quest completed!");
      queryClient.invalidateQueries({ queryKey: ["student-quests"] });
      queryClient.invalidateQueries({ queryKey: ["ranking"] }); // Invalidate ranking so the score updates everywhere
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to complete quest.");
    }
  });

  const handleComplete = (questId: number) => {
    if (confirm("Are you sure you want to mark this quest as completed? This will update your ranking score.")) {
      completeQuest.mutate(questId);
    }
  };

  const totalPoints = quests?.filter(q => q.is_completed).reduce((sum, q) => sum + q.points, 0) || 0;
  const pendingQuests = quests?.filter(q => !q.is_completed) || [];
  const completedQuests = quests?.filter(q => q.is_completed) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg shadow-blue-600/20">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="text-blue-200" size={32} />
            Skill Quests
          </h1>
          <p className="text-blue-100 mt-2 max-w-lg">
            Complete actionable tasks assigned by your faculty to earn bonus points. These points are directly added to your ATS score, instantly boosting your College Ranking!
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 text-center min-w-[200px]">
          <p className="text-blue-100 font-medium mb-1">Bonus Points Earned</p>
          <h2 className="text-5xl font-black text-white drop-shadow-md flex items-center justify-center gap-2">
            <Zap size={32} className="text-amber-400" />
            {totalPoints}
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="space-y-12">
          
          {/* Pending Quests */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
              Available Quests
            </h2>
            {pendingQuests.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                <Target size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="font-medium text-slate-900">You're all caught up!</p>
                <p className="text-slate-500 text-sm mt-1">No pending quests available for your department right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingQuests.map(quest => (
                  <div key={quest.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col transition-all hover:shadow-md hover:border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-slate-900">{quest.title}</h3>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-sm rounded-full flex items-center gap-1 shrink-0">
                        <Award size={14} /> +{quest.points} pts
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-6 flex-1 whitespace-pre-wrap">{quest.description}</p>
                    
                    <button 
                      onClick={() => handleComplete(quest.id)}
                      disabled={completeQuest.isPending}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {completeQuest.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Mark as Completed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Quests */}
          {completedQuests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" size={24} />
                Completed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {completedQuests.map(quest => (
                  <div key={quest.id} className="bg-slate-50 rounded-2xl border border-emerald-100 p-5 flex flex-col opacity-80">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-slate-800">{quest.title}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full shrink-0">
                        +{quest.points} pts
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs line-clamp-2">{quest.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
}
