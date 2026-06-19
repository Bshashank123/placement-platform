"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { FileText, Plus, CheckCircle2, IndianRupee, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface PlacementOffer {
  id: number;
  student_id: number;
  company_id: number;
  role: string;
  ctc_lpa: number;
  accepted: boolean;
  offered_at: string;
}

interface Company {
  id: number;
  name: string;
}

interface Student {
  id: number;
  name: string;
  roll_number: string | null;
  department: string | null;
}

export default function OffersPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [studentId, setStudentId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [role, setRole] = useState("");
  const [ctc, setCtc] = useState("");
  const [accepted, setAccepted] = useState(true);

  const { data: offers, isLoading: loadingOffers } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const res = await api.get<PlacementOffer[]>("/admin-orch/offers");
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

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["admin-students-shortlist"],
    queryFn: async () => {
      // Using shortlist endpoint without filters to get all students
      const res = await api.get<Student[]>("/admin-orch/shortlist");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        student_id: parseInt(studentId),
        company_id: parseInt(companyId),
        role,
        ctc_lpa: parseFloat(ctc),
        accepted,
      };
      await api.post("/admin-orch/offers", payload);
    },
    onSuccess: () => {
      toast.success("Job offer recorded!");
      queryClient.invalidateQueries({ queryKey: ["admin-offers"] });
      setIsCreating(false);
      setStudentId("");
      setCompanyId("");
      setRole("");
      setCtc("");
      setAccepted(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to record offer.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !companyId || !role || !ctc) return;
    createMutation.mutate();
  };

  const getCompanyName = (cId: number) => {
    return companies?.find(c => c.id === cId)?.name || `Company #${cId}`;
  };

  const getStudentInfo = (sId: number) => {
    const s = students?.find(s => s.id === sId);
    if (!s) return { name: `Student #${sId}`, info: "" };
    return { name: s.name, info: `${s.roll_number || "No roll"} · ${s.department || "No dept"}` };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            Placement Offers
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage job offers extended to your students.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4" /> Record Offer</>}
        </button>
      </div>

      {isCreating && (
        <div className="card bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3">
            Record New Offer
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Student *</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="input"
                  disabled={loadingStudents}
                >
                  <option value="" disabled>Select Student</option>
                  {students?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                  ))}
                </select>
              </div>
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
                <label className="label">Role Offered *</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Package (CTC in LPA) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ctc}
                  onChange={(e) => setCtc(e.target.value)}
                  placeholder="e.g. 12.5"
                  required
                  className="input"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="accepted"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="accepted" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Student has accepted this offer
                </label>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !studentId || !companyId || !role || !ctc}
                className="btn-primary"
              >
                {createMutation.isPending ? "Saving..." : "Save Offer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Offers Table */}
      <div className="card overflow-hidden p-0">
        {loadingOffers || loadingCompanies || loadingStudents ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !offers || offers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No offers recorded yet.</p>
            <p className="text-sm mt-1">Record your first placement offer to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">CTC (LPA)</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {offers.map((offer) => {
                  const student = getStudentInfo(offer.student_id);
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-400">{student.info}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {getCompanyName(offer.company_id)}
                      </td>
                      <td className="px-6 py-4">{offer.role}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
                          <IndianRupee className="w-3 h-3" />
                          {offer.ctc_lpa}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {offer.accepted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Accepted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(offer.offered_at).toLocaleDateString()}
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
