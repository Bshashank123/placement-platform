"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Trophy, Filter, Search, Loader2 } from "lucide-react";

interface StudentRank {
  id: number;
  name: string;
  roll_number: string | null;
  department: string | null;
  branch: string | null;
  year: number | null;
  ats_score: number | null;
  resume_count: number;
  skills: string[];
}

export default function FacultyRankingPage() {
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [search, setSearch] = useState("");

  const { data: students, isLoading } = useQuery({
    queryKey: ["faculty-students-ranking", department, branch, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (department) params.append("department", department);
      if (branch) params.append("branch", branch);
      if (search) params.append("search", search);
      
      const res = await api.get<StudentRank[]>(`/faculty/students?${params.toString()}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-brand-600" />
          College Ranking
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          View the complete student ranking across the college based on their best ATS scores.
        </p>
      </div>

      {/* Filters */}
      <div className="card bg-white p-4 flex flex-col md:flex-row items-center gap-4 border border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 font-medium whitespace-nowrap">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        
        <div className="flex-1 w-full flex flex-col sm:flex-row gap-3">
          <select 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)}
            className="input py-2 text-sm"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="IT">IT</option>
          </select>

          <select 
            value={branch} 
            onChange={(e) => setBranch(e.target.value)}
            className="input py-2 text-sm"
          >
            <option value="">All Branches</option>
            <option value="B.Tech">B.Tech</option>
            <option value="M.Tech">M.Tech</option>
            <option value="BCA">BCA</option>
            <option value="MCA">MCA</option>
          </select>
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input py-2 pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !students || students.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Trophy className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No students found.</p>
            <p className="text-sm mt-1">Adjust your filters or ensure students have registered.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-center w-20">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Department & Branch</th>
                  <th className="px-6 py-4">Top Skills</th>
                  <th className="px-6 py-4 text-center">ATS Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center w-8 h-8 mx-auto rounded-full font-bold text-sm ${
                          rank === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                          rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                          rank === 3 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'text-gray-400'
                        }`}>
                          {rank}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          {student.roll_number || "No Roll #"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-700">{student.department || "No Dept"}</span>
                          <span className="text-xs text-gray-500">{student.branch || "No Branch"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded">
                              {skill}
                            </span>
                          ))}
                          {student.skills.length > 3 && (
                            <span className="px-2 py-0.5 text-gray-400 text-[10px] font-medium">
                              +{student.skills.length - 3}
                            </span>
                          )}
                          {student.skills.length === 0 && (
                            <span className="text-gray-400 text-xs italic">No skills</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.ats_score ? (
                          <span className={`inline-flex items-center justify-center font-bold text-sm ${
                            student.ats_score >= 75 ? 'text-green-600' :
                            student.ats_score >= 50 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {student.ats_score.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
