'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Users, BarChart, TrendingUp, AlertCircle } from 'lucide-react';

export default function FacultyCohortDashboard() {
  const [cohort, setCohort] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cohortRes, heatmapRes] = await Promise.all([
          api.get('/faculty-dash/cohort'),
          api.get('/faculty-dash/skills-heatmap')
        ]);
        setCohort(cohortRes.data);
        setHeatmap(heatmapRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse flex space-x-4 p-8"><div className="rounded-full bg-slate-200 h-10 w-10"></div><div className="flex-1 space-y-6 py-1"><div className="h-2 bg-slate-200 rounded"></div><div className="space-y-3"><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div><div className="h-2 bg-slate-200 rounded"></div></div></div></div>;
  }

  const placedCount = cohort.filter(c => c.has_offer).length;
  const placementRate = cohort.length > 0 ? (placedCount / cohort.length) * 100 : 0;
  const avgAts = cohort.reduce((acc, curr) => acc + curr.ats_score, 0) / (cohort.length || 1);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Department Cohort Progress</h1>
        <p className="text-slate-500 mt-2">Track placement readiness and skill gaps for your assigned batch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-blue-100 text-blue-600"><Users size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Total Students</p><h3 className="text-2xl font-bold">{cohort.length}</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-100 text-emerald-600"><TrendingUp size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Placement Rate</p><h3 className="text-2xl font-bold">{placementRate.toFixed(1)}%</h3></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 rounded-xl bg-indigo-100 text-indigo-600"><BarChart size={24} /></div>
          <div><p className="text-sm font-medium text-slate-500">Avg ATS Score</p><h3 className="text-2xl font-bold">{avgAts.toFixed(1)} / 100</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Student Roster</h3>
          <div className="overflow-auto max-h-[400px]">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-slate-100">
                  <th className="py-3 text-sm font-semibold text-slate-600">Student Name</th>
                  <th className="py-3 text-sm font-semibold text-slate-600">ATS Score</th>
                  <th className="py-3 text-sm font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {cohort.map(student => (
                  <tr key={student.id} className="border-b border-slate-50">
                    <td className="py-3"><p className="font-medium">{student.name}</p><p className="text-xs text-slate-500">{student.roll_number}</p></td>
                    <td className="py-3"><span className={`font-semibold ${student.ats_score > 70 ? 'text-emerald-600' : student.ats_score > 50 ? 'text-amber-600' : 'text-rose-600'}`}>{student.ats_score.toFixed(1)}</span></td>
                    <td className="py-3">
                      {student.has_offer ? (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Placed</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">Looking</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Skill Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Top skills among your students</p>
          <div className="space-y-4">
            {heatmap?.heatmap?.slice(0, 8).map((skill: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{skill.skill}</span>
                  <span className="text-slate-500">{skill.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${skill.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {heatmap?.heatmap?.length === 0 && (
              <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No skills data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}