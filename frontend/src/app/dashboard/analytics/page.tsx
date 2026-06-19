"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart3, Users, FileCheck, ShieldAlert, TrendingUp, Loader2 } from "lucide-react";
import clsx from "clsx";

interface DeptAnalytics {
  department: string;
  total_students: number;
  scored_students: number;
  avg_ats_score: number;
  strong_students: number;
  weak_students: number;
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics-full"],
    queryFn: async () => {
      const res = await api.get<DeptAnalytics[]>("/admin/analytics");
      return res.data;
    },
  });

  const totalStudents = analytics?.reduce((acc, curr) => acc + curr.total_students, 0) || 0;
  const totalScored = analytics?.reduce((acc, curr) => acc + curr.scored_students, 0) || 0;
  const overallAvg = analytics && analytics.length > 0 
    ? Math.round(analytics.reduce((acc, curr) => acc + curr.avg_ats_score, 0) / analytics.length) 
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-600" />
          Platform Analytics
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Detailed breakdown of student performance across all departments.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : !analytics || analytics.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="font-medium text-gray-700">No analytics data available.</p>
          <p className="text-sm mt-1">Ensure students have uploaded resumes.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Resumes Scored</p>
                <p className="text-2xl font-bold text-gray-900">{totalScored}</p>
              </div>
            </div>
            <div className="card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Overall Avg ATS</p>
                <p className={clsx("text-2xl font-bold", overallAvg >= 70 ? "text-green-600" : "text-amber-600")}>
                  {overallAvg}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="card overflow-hidden p-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-semibold text-gray-800">Department Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3 text-center">Students</th>
                    <th className="px-6 py-3 text-center">Scored</th>
                    <th className="px-6 py-3">Avg ATS Score</th>
                    <th className="px-6 py-3 text-center">Strong (&ge; 75)</th>
                    <th className="px-6 py-3 text-center">Weak (&lt; 50)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {analytics.map((dept) => (
                    <tr key={dept.department} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{dept.department}</td>
                      <td className="px-6 py-4 text-center">{dept.total_students}</td>
                      <td className="px-6 py-4 text-center">{dept.scored_students}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                "h-full rounded-full transition-all duration-700",
                                dept.avg_ats_score >= 75 ? "bg-green-500" : 
                                dept.avg_ats_score >= 50 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${dept.avg_ats_score}%` }}
                            />
                          </div>
                          <span className="font-semibold text-gray-700">{dept.avg_ats_score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-green-600">
                        {dept.strong_students}
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-red-600">
                        {dept.weak_students > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> {dept.weak_students}
                          </div>
                        ) : (
                          dept.weak_students
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
