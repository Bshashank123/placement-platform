"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Search, SlidersHorizontal, UserCheck, ChevronRight, Loader2, Download } from "lucide-react";
import clsx from "clsx";

interface ShortlistStudent {
  id: number;
  name: string;
  roll_number: string | null;
  department: string | null;
  cgpa: number | null;
  ats_score: number;
  skills: string[];
}

export default function ShortlistPage() {
  const [minCgpa, setMinCgpa] = useState<number | "">("");
  const [minAts, setMinAts] = useState<number | "">("");
  const [skillsRaw, setSkillsRaw] = useState("");

  // Convert raw comma-separated skills to array of trimmed strings
  const skillsArray = skillsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: students, isLoading } = useQuery({
    queryKey: ["shortlist", minCgpa, minAts, skillsArray],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (minCgpa !== "") params.append("min_cgpa", minCgpa.toString());
      if (minAts !== "") params.append("min_ats", minAts.toString());
      skillsArray.forEach((sk) => params.append("skills", sk));

      const res = await api.get<ShortlistStudent[]>(`/admin-orch/shortlist?${params.toString()}`);
      return res.data;
    },
  });

  const exportCSV = () => {
    if (!students || students.length === 0) return;
    const headers = ["Name", "Roll Number", "Department", "CGPA", "ATS Score", "Skills"];
    const csvContent = [
      headers.join(","),
      ...students.map((s) =>
        [
          `"${s.name}"`,
          `"${s.roll_number || ""}"`,
          `"${s.department || ""}"`,
          s.cgpa || "",
          s.ats_score,
          `"${s.skills.join("; ")}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_shortlist.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            Student Shortlisting
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Filter and export eligible students based on academic and resume performance.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!students || students.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-white space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <SlidersHorizontal className="w-4 h-4" />
          Filter Criteria
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Minimum CGPA</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={minCgpa}
              onChange={(e) => setMinCgpa(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="e.g. 7.5"
              className="input"
            />
          </div>
          <div>
            <label className="label">Minimum ATS Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={minAts}
              onChange={(e) => setMinAts(e.target.value ? parseInt(e.target.value, 10) : "")}
              placeholder="e.g. 60"
              className="input"
            />
          </div>
          <div>
            <label className="label">Required Skills (comma separated)</label>
            <input
              type="text"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              placeholder="e.g. Python, React, SQL"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-semibold text-gray-800">
            Matching Students {students ? `(${students.length})` : ""}
          </h3>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-brand-500" />}
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !students || students.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No students found matching these criteria.</p>
            <p className="text-sm mt-1">Try adjusting or clearing the filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">CGPA</th>
                  <th className="px-6 py-3">ATS Score</th>
                  <th className="px-6 py-3">Matched Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-xs text-gray-400">{student.roll_number || "No roll number"}</div>
                    </td>
                    <td className="px-6 py-4">{student.department || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={clsx("font-medium", student.cgpa && student.cgpa >= 8.0 ? "text-green-600" : "")}>
                        {student.cgpa || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              "h-full rounded-full",
                              student.ats_score >= 70 ? "bg-green-500" : student.ats_score >= 50 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${student.ats_score}%` }}
                          />
                        </div>
                        <span className="font-medium text-gray-700">{student.ats_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {student.skills.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-medium border border-blue-100">
                            {s}
                          </span>
                        ))}
                        {student.skills.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px] font-medium border border-gray-200">
                            +{student.skills.length - 3}
                          </span>
                        )}
                        {student.skills.length === 0 && <span className="text-gray-400 italic">None listed</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
