"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Target, Plus, Loader2, Users, Calendar, Award } from "lucide-react";
import toast from "react-hot-toast";

interface Quest {
  id: number;
  title: string;
  description: string;
  target_departments: string;
  points: int;
  is_active: boolean;
  created_at: string;
  completion_count: number;
}

export default function FacultyQuestsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_departments: "ALL",
    points: 10,
  });

  const { data: quests, isLoading } = useQuery({
    queryKey: ["faculty-quests"],
    queryFn: async () => {
      const res = await api.get<Quest[]>("/quests/faculty");
      return res.data;
    },
  });

  const createQuest = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post("/quests/faculty", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Skill Quest created successfully!");
      setIsCreating(false);
      setFormData({ title: "", description: "", target_departments: "ALL", points: 10 });
      queryClient.invalidateQueries({ queryKey: ["faculty-quests"] });
    },
    onError: () => toast.error("Failed to create quest")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuest.mutate(formData);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="text-purple-600" size={32} />
            Skill Quests
          </h1>
          <p className="text-slate-500 mt-2">Create actionable tasks to improve your students' employability.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> New Quest
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Skill Quest</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Quest Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input" 
                  placeholder="e.g. Complete AWS Cloud Practitioner" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Target Departments</label>
                <select 
                  value={formData.target_departments}
                  onChange={(e) => setFormData({...formData, target_departments: e.target.value})}
                  className="input"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">CSE Only</option>
                  <option value="ECE">ECE Only</option>
                  <option value="MECH">MECH Only</option>
                  <option value="CIVIL">CIVIL Only</option>
                  <option value="CSE,ECE">CSE & ECE</option>
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Description / Instructions</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input h-24 py-2" 
                  placeholder="Provide links, resources, or specific instructions for completion." 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Bonus Ranking Points</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  max="50"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                  className="input" 
                />
                <p className="text-xs text-slate-500 mt-1">These points are added to their ATS score to boost their ranking.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createQuest.isPending}
                className="btn-primary"
              >
                {createQuest.isPending ? "Creating..." : "Publish Quest"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
      ) : quests?.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center flex flex-col items-center">
          <Target size={48} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No active quests</h3>
          <p className="text-slate-500 mb-6 max-w-md">Create quests to encourage students to learn specific skills or complete certifications.</p>
          <button onClick={() => setIsCreating(true)} className="btn-primary">Create Your First Quest</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quests?.map(quest => (
            <div key={quest.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-900">{quest.title}</h3>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-sm rounded-full flex items-center gap-1 shrink-0">
                  <Award size={14} /> +{quest.points} pts
                </span>
              </div>
              <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-3">{quest.description}</p>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Target size={16} className="text-slate-400" />
                  <span className="font-medium">{quest.target_departments}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={16} className="text-slate-400" />
                  <span className="font-medium text-purple-600">{quest.completion_count} Completed</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 col-span-2">
                  <Calendar size={16} className="text-slate-400" />
                  <span>Created {new Date(quest.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
