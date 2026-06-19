"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Building2, Calendar, Plus, Briefcase, ChevronRight, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";

interface PlacementDrive {
  id: number;
  company_id: number;
  title: string;
  description: string | null;
  drive_date: string;
  location: string | null;
  eligibility_cgpa: number | null;
  eligibility_ats_score: number | null;
  created_at: string;
}

interface Company {
  id: number;
  name: string;
}

export default function PlacementDrivesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [driveDate, setDriveDate] = useState("");
  const [location, setLocation] = useState("");

  const { data: drives, isLoading: loadingDrives } = useQuery({
    queryKey: ["admin-drives"],
    queryFn: async () => {
      const res = await api.get<PlacementDrive[]>("/admin-orch/drives");
      return res.data;
    },
  });

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const res = await api.get<Company[]>("/admin/companies");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_id: parseInt(companyId),
        title,
        description: description || null,
        drive_date: driveDate ? new Date(driveDate).toISOString() : new Date().toISOString(),
        location: location || null,
      };
      await api.post("/admin-orch/drives", payload);
    },
    onSuccess: () => {
      toast.success("Placement drive created!");
      queryClient.invalidateQueries({ queryKey: ["admin-drives"] });
      setIsCreating(false);
      setCompanyId("");
      setTitle("");
      setDescription("");
      setDriveDate("");
      setLocation("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to create drive.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !title || !driveDate) return;
    createMutation.mutate();
  };

  const getCompanyName = (cId: number) => {
    return companies?.find(c => c.id === cId)?.name || `Company #${cId}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            Placement Drives
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage upcoming campus recruitment drives and track associated companies.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4" /> New Drive</>}
        </button>
      </div>

      {isCreating && (
        <div className="card bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3">
            Create New Placement Drive
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Company *</label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                  className="input"
                  disabled={loadingCompanies}
                >
                  <option value="" disabled>Select Company</option>
                  {companies?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Drive Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SDE 1 Campus Hiring"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Drive Date & Time *</label>
                <input
                  type="datetime-local"
                  value={driveDate}
                  onChange={(e) => setDriveDate(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Location / Venue</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium"
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="label">Description / Eligibility Criteria</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the drive..."
                className="input min-h-[80px]"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !companyId || !title || !driveDate}
                className="btn-primary"
              >
                {createMutation.isPending ? "Creating..." : "Save Drive"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Drives List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingDrives ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !drives || drives.length === 0 ? (
          <div className="col-span-full card text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="font-medium text-gray-700">No active placement drives.</p>
            <p className="text-sm mt-1">Click &quot;New Drive&quot; to organize one.</p>
          </div>
        ) : (
          drives.map((drive) => {
            const cName = getCompanyName(drive.company_id);
            return (
              <div key={drive.id} className="card hover:shadow-md transition-shadow flex flex-col group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg">
                    {cName[0].toUpperCase()}
                  </div>
                  {drive.drive_date && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                      <Calendar className="w-3 h-3" />
                      {new Date(drive.drive_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{cName}</h3>
                <p className="flex items-center gap-1.5 text-sm font-medium text-gray-600 mt-1 mb-1">
                  <Briefcase className="w-4 h-4 text-gray-400" /> {drive.title}
                </p>
                {drive.location && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-3">
                    <MapPin className="w-3 h-3 text-gray-400" /> {drive.location}
                  </p>
                )}
                
                <div className="flex-1">
                  {drive.description && (
                    <p className="text-xs text-gray-500 line-clamp-3">
                      {drive.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>Created {new Date(drive.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 cursor-pointer">
                    Manage <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
