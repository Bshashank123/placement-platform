"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Building2, Plus, Trash2, BarChart2,
  Loader2, X, Save, AlertCircle,
} from "lucide-react";
import clsx from "clsx";

interface Company {
  id: number;
  name: string;
  role: string | null;
  min_cgpa: number | null;
  min_projects: number;
  required_skills: string[];
}

interface DeptAnalytics {
  department: string;
  total_students: number;
  scored_students: number;
  avg_ats_score: number;
  top_score: number;
  strong_students: number;
  weak_students: number;
}

export default function AdminPage() {
  const { user, hydrate } = useAuthStore();
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [analytics, setAnalytics]   = useState<DeptAnalytics[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [activeTab, setActiveTab]   = useState<"companies" | "analytics">("companies");

  // Form state
  const [name, setName]             = useState("");
  const [role, setRole]             = useState("");
  const [minCgpa, setMinCgpa]       = useState("");
  const [minProjects, setMinProjects] = useState("0");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills]         = useState<string[]>([]);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
   Promise.all([
  api.get<Company[]>("/admin/companies"),
  api.get<DeptAnalytics[]>("/admin/analytics"),
]).then(([c, a]) => {
  setCompanies(c.data);
  setAnalytics(a.data);
}).catch(() => {
  // silently fail — user may not have permission for all endpoints
}).finally(() => setLoading(false));
  }, []);

  const handleAddCompany = async () => {
    if (!name.trim()) { toast.error("Company name is required."); return; }
    setSaving(true);
    try {
      const res = await api.post("/admin/company", {
        name: name.trim(),
        role: role.trim() || null,
        min_cgpa: minCgpa ? Number(minCgpa) : null,
        min_projects: Number(minProjects),
        required_skills: skills,
      });
      setCompanies([...companies, res.data]);
      toast.success("Company added!");
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add company.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this company?")) return;
    try {
      await api.delete(`/admin/company/${id}`);
      setCompanies(companies.filter((c) => c.id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const addSkill = (s: string) => {
    const t = s.trim();
    if (t && !skills.map(x => x.toLowerCase()).includes(t.toLowerCase())) {
      setSkills([...skills, t]);
    }
    setSkillInput("");
  };

  const resetForm = () => {
    setName(""); setRole(""); setMinCgpa("");
    setMinProjects("0"); setSkillInput(""); setSkills([]);
  };

  if (!user || user.role === "student") {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">This page is for admins only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">College Admin</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage companies and view placement analytics.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["companies", "analytics"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}>
            {tab === "companies" ? `Companies (${companies.length})` : "Analytics"}
          </button>
        ))}
      </div>

      {/* Companies tab */}
      {activeTab === "companies" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 px-4 py-2.5">
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="card border-brand-100 bg-brand-50 space-y-4">
              <h3 className="font-semibold text-gray-800">New Company</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Company name *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="input" placeholder="Amazon" />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)}
                    className="input" placeholder="SDE, Data Analyst…" />
                </div>
                <div>
                  <label className="label">Minimum CGPA</label>
                  <input value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)}
                    type="number" step="0.1" min="0" max="10"
                    className="input" placeholder="7.0" />
                </div>
                <div>
                  <label className="label">Min. projects/resumes</label>
                  <input value={minProjects} onChange={(e) => setMinProjects(e.target.value)}
                    type="number" min="0" className="input" placeholder="2" />
                </div>
              </div>

              {/* Required skills */}
              <div>
                <label className="label">Required Skills</label>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {skills.map((s) => (
                      <span key={s} className="flex items-center gap-1 bg-white text-brand-700 text-sm px-3 py-1 rounded-full border border-brand-200">
                        {s}
                        <button onClick={() => setSkills(skills.filter(x => x !== s))}>
                          <X className="w-3 h-3 hover:text-red-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }}}
                    className="input flex-1" placeholder="Java, DSA, React… press Enter" />
                  <button onClick={() => addSkill(skillInput)}
                    className="btn-primary px-3"><Plus className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleAddCompany} disabled={saving}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Company
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Company list */}
          {companies.length === 0 ? (
            <div className="card text-center py-12">
              <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No companies added yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((c) => (
                <div key={c.id} className="card flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      {c.role && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {c.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {c.min_cgpa && <span>Min CGPA: {c.min_cgpa}</span>}
                      {c.min_projects > 0 && <span>Min projects: {c.min_projects}</span>}
                    </div>
                    {c.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.required_skills.map((s) => (
                          <span key={s} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          {analytics.length === 0 ? (
            <div className="card text-center py-12">
              <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No data yet. Students need to upload and score resumes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.map((d) => (
                <div key={d.department} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{d.department}</h3>
                      <p className="text-xs text-gray-400">
                        {d.total_students} students · {d.scored_students} scored
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={clsx(
                        "text-2xl font-bold",
                        d.avg_ats_score >= 65 ? "text-green-600" :
                        d.avg_ats_score >= 45 ? "text-amber-600" : "text-red-500"
                      )}>
                        {d.avg_ats_score}
                      </p>
                      <p className="text-xs text-gray-400">Avg ATS</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 mb-3">
                    <div className={clsx(
                      "h-full rounded-full transition-all duration-700",
                      d.avg_ats_score >= 65 ? "bg-green-500" :
                      d.avg_ats_score >= 45 ? "bg-amber-400" : "bg-red-400"
                    )} style={{ width: `${d.avg_ats_score}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-gray-800">{d.top_score}</p>
                      <p className="text-xs text-gray-400">Top Score</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-700">{d.strong_students}</p>
                      <p className="text-xs text-green-600">Strong (75+)</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-red-600">{d.weak_students}</p>
                      <p className="text-xs text-red-500">Weak (&lt;50)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}