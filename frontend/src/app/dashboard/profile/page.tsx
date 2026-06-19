"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  User, Github, Linkedin, Award,
  Plus, X, Save, Loader2,
} from "lucide-react";

const schema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters"),
  roll_number:  z.string().optional(),
  department:   z.string().optional(),
  branch:       z.string().optional(),
  year:         z.coerce.number().min(1).max(4).optional().or(z.literal("")),
  cgpa:         z.coerce.number().min(0).max(10).optional().or(z.literal("")),
  github_url:   z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

interface Profile {
  id: number;
  name: string;
  roll_number?: string;
  department?: string;
  branch?: string;
  year?: number;
  cgpa?: number;
  github_url?: string;
  linkedin_url?: string;
  skills: { id: number; skill_name: string }[];
}

const SUGGESTED_SKILLS = [
  "Python","Java","JavaScript","TypeScript","React","Node.js",
  "FastAPI","Django","SQL","PostgreSQL","MongoDB","Docker",
  "AWS","Git","Machine Learning","Data Structures","C++","REST APIs",
];

export default function ProfilePage() {
  const { hydrate } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [skills, setSkills]   = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    api.get<Profile>("/students/profile")
      .then((res) => {
        setProfile(res.data);
        setSkills(res.data.skills.map((s) => s.skill_name));
        reset({
          name:         res.data.name         || "",
          roll_number:  res.data.roll_number  || "",
          department:   res.data.department   || "",
          branch:       res.data.branch       || "",
          year:         res.data.year         || "",
          cgpa:         res.data.cgpa         || "",
          github_url:   res.data.github_url   || "",
          linkedin_url: res.data.linkedin_url || "",
        });
      })
      .catch(() => toast.error("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        year:        data.year  === "" ? null : Number(data.year),
        cgpa:        data.cgpa  === "" ? null : Number(data.cgpa),
        github_url:  data.github_url   || null,
        linkedin_url:data.linkedin_url || null,
        skills,
      };
      const res = await api.put<Profile>("/students/profile", payload);
      setProfile(res.data);
      toast.success("Profile saved!");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !skills.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
  };

  const removeSkill = (name: string) => setSkills(skills.filter((s) => s !== name));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 text-2xl font-bold">
          {profile?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
          <p className="text-sm text-gray-500">
            {profile?.department && `${profile.department} · `}
            {profile?.branch && `${profile.branch} · `}
            {profile?.year && `Year ${profile.year}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Basic Info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-500" /> Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name *</label>
              <input {...register("name")} className="input" placeholder="Arjun Sharma" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Roll number</label>
              <input {...register("roll_number")} className="input" placeholder="21BCE1001" />
            </div>
            <div>
              <label className="label">Department</label>
              <input {...register("department")} className="input" placeholder="CSE" />
            </div>
            <div>
              <label className="label">Branch</label>
              <input {...register("branch")} className="input" placeholder="B.Tech" />
            </div>
            <div>
              <label className="label">Year</label>
              <select {...register("year")} className="input">
                <option value="">Select year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
            </div>
            <div>
              <label className="label">CGPA</label>
              <input {...register("cgpa")} type="number" step="0.01" min="0" max="10"
                className="input" placeholder="8.5" />
              {errors.cgpa && <p className="text-red-500 text-xs mt-1">{errors.cgpa.message}</p>}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-brand-500" /> Online Profiles
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub URL
              </label>
              <input {...register("github_url")} className="input"
                placeholder="https://github.com/yourusername" />
              {errors.github_url && <p className="text-red-500 text-xs mt-1">{errors.github_url.message}</p>}
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn URL
              </label>
              <input {...register("linkedin_url")} className="input"
                placeholder="https://linkedin.com/in/yourprofile" />
              {errors.linkedin_url && <p className="text-red-500 text-xs mt-1">{errors.linkedin_url.message}</p>}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-500" /> Skills ({skills.length})
          </h3>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="flex items-center gap-1 bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-100">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)}
                    className="hover:text-red-500 transition-colors ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }
              }}
              className="input flex-1"
              placeholder="Type a skill and press Enter (e.g. React)"
            />
            <button type="button" onClick={() => addSkill(skillInput)}
              className="btn-primary px-3 py-2">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_SKILLS
                .filter((s) => !skills.map(x => x.toLowerCase()).includes(s.toLowerCase()))
                .map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)}
                    className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 flex items-center gap-2">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4" /> Save Profile</>
            }
          </button>
        </div>

      </form>
    </div>
  );
}