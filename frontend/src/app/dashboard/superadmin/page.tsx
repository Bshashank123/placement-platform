"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Globe, Users, Plus, Shield, Check,
  Loader2, ChevronDown, ChevronUp, Save,
} from "lucide-react";
import clsx from "clsx";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string;
  is_active: boolean;
}

interface PlatformUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

const ALL_ROLES = ["student", "faculty", "admin", "super_admin"];

export default function SuperAdminPage() {
  const { user, hydrate } = useAuthStore();
  const [tenants, setTenants]         = useState<Tenant[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"colleges" | "permissions">("colleges");
  const [expandedTenant, setExpandedTenant] = useState<number | null>(null);
  const [tenantUsers, setTenantUsers] = useState<Record<number, PlatformUser[]>>({});
  const [saving, setSaving]           = useState<Record<number, boolean>>({});

  // New college form
  const [showForm, setShowForm]   = useState(false);
  const [newName, setNewName]     = useState("");
  const [newSlug, setNewSlug]     = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating]   = useState(false);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    api.get<Tenant[]>("/platform/tenants")
      .then((r) => setTenants(r.data))
      .finally(() => setLoading(false));
  }, []);

  const loadTenantUsers = (tenantId: number) => {
    if (tenantUsers[tenantId]) return;
    api.get<PlatformUser[]>(`/platform/users/${tenantId}`)
      .then((r) => setTenantUsers({ ...tenantUsers, [tenantId]: r.data }))
      .catch(() => {});
  };

  const handleToggleTenant = (tenantId: number) => {
    if (expandedTenant === tenantId) {
      setExpandedTenant(null);
    } else {
      setExpandedTenant(tenantId);
      loadTenantUsers(tenantId);
    }
  };

  const handlePermissionSave = async (
    tenantId: number,
    userId: number,
    role: string,
    isActive: boolean,
  ) => {
    setSaving({ ...saving, [userId]: true });
    try {
      await api.put("/platform/user-permission", {
        user_id: userId,
        role,
        is_active: isActive,
      });
      toast.success("Permissions updated.");
      // Refresh users
      const res = await api.get<PlatformUser[]>(`/platform/users/${tenantId}`);
      setTenantUsers({ ...tenantUsers, [tenantId]: res.data });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update permissions.");
    } finally {
      setSaving({ ...saving, [userId]: false });
    }
  };

  const handleCreateCollege = async () => {
    if (!newName.trim() || !newSlug.trim() || !newDomain.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post<Tenant>("/platform/tenant", {
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase(),
        domain: newDomain.trim().toLowerCase(),
      });
      setTenants([...tenants, res.data]);
      toast.success(`College "${res.data.name}" created!`);
      setShowForm(false);
      setNewName(""); setNewSlug(""); setNewDomain("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create college.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (tenantId: number) => {
    if (!confirm("Deactivate this college? Students won't be able to sign up with this domain.")) return;
    try {
      await api.patch(`/platform/tenant/${tenantId}/deactivate`);
      setTenants(tenants.map(t => t.id === tenantId ? { ...t, is_active: false } : t));
      toast.success("College deactivated.");
    } catch {
      toast.error("Failed.");
    }
  };

  if (!user || user.role !== "super_admin") {
    return (
      <div className="card text-center py-16">
        <p className="text-gray-400">Super admin access only.</p>
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
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Administration</h2>
        <p className="text-gray-500 text-sm mt-1">
          Manage colleges and user permissions across the entire platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["colleges", "permissions"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-brand-600 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}>
            {tab === "colleges"
              ? <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> Colleges ({tenants.length})</span>
              : <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Permissions</span>
            }
          </button>
        ))}
      </div>

      {/* Colleges tab */}
      {activeTab === "colleges" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2 px-4 py-2.5">
              <Plus className="w-4 h-4" /> Add College
            </button>
          </div>

          {showForm && (
            <div className="card border-brand-100 bg-brand-50 space-y-4">
              <h3 className="font-semibold text-gray-800">New College</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">College name *</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="input" placeholder="VIT Vellore" />
                </div>
                <div>
                  <label className="label">Slug * (URL identifier)</label>
                  <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)}
                    className="input" placeholder="vit" />
                </div>
                <div>
                  <label className="label">Email domain *</label>
                  <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)}
                    className="input" placeholder="vit.edu" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreateCollege} disabled={creating}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Create College
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {tenants.map((t) => (
              <div key={t.id} className={clsx(
                "card border transition-colors",
                !t.is_active && "opacity-60 bg-gray-50"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        {!t.is_active && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        @{t.domain} · /{t.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.is_active && (
                      <button
                        onClick={() => handleDeactivate(t.id)}
                        className="text-xs text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions tab */}
      {activeTab === "permissions" && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
            Click a college to expand its user list. Use checkboxes to toggle
            roles and active status, then click Save.
          </div>

          {tenants.map((tenant) => (
            <div key={tenant.id} className="card p-0 overflow-hidden">
              <button
                onClick={() => handleToggleTenant(tenant.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                    {tenant.name[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-xs text-gray-400">@{tenant.domain}</p>
                  </div>
                </div>
                {expandedTenant === tenant.id
                  ? <ChevronUp className="w-5 h-5 text-gray-400" />
                  : <ChevronDown className="w-5 h-5 text-gray-400" />
                }
              </button>

              {expandedTenant === tenant.id && (
                <div className="border-t border-gray-100">
                  {!tenantUsers[tenant.id] ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    </div>
                  ) : tenantUsers[tenant.id].length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">No users in this college.</p>
                  ) : (
                    <div>
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-2 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        <div className="col-span-4">Email</div>
                        <div className="col-span-5">Role</div>
                        <div className="col-span-2 text-center">Active</div>
                        <div className="col-span-1 text-center">Save</div>
                      </div>

                      {tenantUsers[tenant.id].map((u) => (
                        <PermissionRow
                          key={u.id}
                          user={u}
                          saving={saving[u.id] ?? false}
                          onSave={(role, isActive) =>
                            handlePermissionSave(tenant.id, u.id, role, isActive)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Permission row component ──────────────────────────────────────────────────

function PermissionRow({
  user,
  saving,
  onSave,
}: {
  user: PlatformUser;
  saving: boolean;
  onSave: (role: string, isActive: boolean) => void;
}) {
  const [role, setRole]         = useState(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const isDirty = role !== user.role || isActive !== user.is_active;

  return (
    <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-gray-50 hover:bg-gray-50 items-center text-sm">
      {/* Email */}
      <div className="col-span-4 truncate text-gray-700">{user.email}</div>

      {/* Role checkboxes */}
      <div className="col-span-5 flex flex-wrap gap-2">
        {ALL_ROLES.map((r) => (
          <label key={r} className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg cursor-pointer text-xs font-medium border transition-colors",
            role === r
              ? "bg-brand-100 text-brand-700 border-brand-300"
              : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
          )}>
            <input
              type="radio"
              name={`role-${user.id}`}
              value={r}
              checked={role === r}
              onChange={() => setRole(r)}
              className="sr-only"
            />
            {role === r && <Check className="w-3 h-3" />}
            <span className="capitalize">{r.replace("_", " ")}</span>
          </label>
        ))}
      </div>

      {/* Active toggle */}
      <div className="col-span-2 flex justify-center">
        <button
          onClick={() => setIsActive(!isActive)}
          className={clsx(
            "w-12 h-6 rounded-full transition-colors relative",
            isActive ? "bg-green-500" : "bg-gray-300"
          )}
        >
          <span className={clsx(
            "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all",
            isActive ? "left-6" : "left-0.5"
          )} />
        </button>
      </div>

      {/* Save button */}
      <div className="col-span-1 flex justify-center">
        <button
          onClick={() => onSave(role, isActive)}
          disabled={!isDirty || saving}
          className={clsx(
            "p-1.5 rounded-lg transition-colors",
            isDirty && !saving
              ? "bg-brand-100 text-brand-600 hover:bg-brand-200"
              : "bg-gray-100 text-gray-300 cursor-not-allowed"
          )}
          title="Save changes"
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}