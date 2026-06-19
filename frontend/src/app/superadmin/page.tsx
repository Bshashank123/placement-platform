'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Building2, Users, FileText, Activity } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/superadmin/analytics');
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch super admin analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Colleges', value: stats?.total_tenants || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Resumes Analyzed', value: stats?.total_resumes || 0, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Active Tenants', value: stats?.active_tenants || 0, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-2">Monitor global platform usage and tenant statistics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
