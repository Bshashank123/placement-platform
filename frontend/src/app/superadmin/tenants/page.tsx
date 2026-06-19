"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Building2, Plus, Globe, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
  is_active: boolean;
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: async () => {
      const res = await api.get<Tenant[]>("/platform/tenants");
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug,
        domain,
        admin_password: adminPassword,
      };
      await api.post("/platform/tenant", payload);
    },
    onSuccess: () => {
      toast.success("College tenant created successfully!");
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      setIsCreating(false);
      setName("");
      setSlug("");
      setDomain("");
      setAdminPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to create tenant.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      await api.patch(`/platform/tenant/${tenantId}/deactivate`);
    },
    onSuccess: () => {
      toast.success("Tenant deactivated.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !domain || !adminPassword) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-600" />
            Tenant Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Provision and manage college instances on the platform.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary flex items-center gap-2"
        >
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4" /> Provision New College</>}
        </button>
      </div>

      {isCreating && (
        <div className="card bg-white animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-3">
            Provision New College Tenant
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">College Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nexus Institute of Technology"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Tenant Slug (Unique ID) *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. nexus-tech"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email Domain *</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. nexustech.edu"
                  required
                  className="input"
                />
              </div>
              <div>
                <label className="label">Initial Admin Password *</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="e.g. Temp@123"
                  required
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !name || !slug || !domain || !adminPassword}
                className="btn-primary"
              >
                {createMutation.isPending ? "Provisioning..." : "Provision Tenant"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenants Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !tenants || tenants.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Building2 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No tenants provisioned yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">College Name</th>
                  <th className="px-6 py-3">Domain</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">#{tenant.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{tenant.name}</div>
                      <div className="text-xs text-gray-400">Slug: {tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-brand-600 bg-brand-50 w-max px-2.5 py-1 rounded-md text-xs font-medium border border-brand-100">
                        <Globe className="w-3 h-3" /> @{tenant.domain}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tenant.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tenant.is_active && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to deactivate ${tenant.name}?`)) {
                              deactivateMutation.mutate(tenant.id);
                            }
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
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
