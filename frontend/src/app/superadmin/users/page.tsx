"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Users, Shield, Key, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Tenant {
  id: number;
  name: string;
}

interface UserOut {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [resetModalUser, setResetModalUser] = useState<UserOut | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: async () => {
      const res = await api.get<Tenant[]>("/platform/tenants");
      if (res.data.length > 0 && !selectedTenant) {
        setSelectedTenant(res.data[0].id.toString());
      }
      return res.data;
    },
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["superadmin-users", selectedTenant],
    queryFn: async () => {
      if (!selectedTenant) return [];
      const res = await api.get<UserOut[]>(`/platform/users/${selectedTenant}`);
      return res.data;
    },
    enabled: !!selectedTenant,
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role, isActive }: { userId: number; role: string; isActive: boolean }) => {
      await api.put("/platform/user-permission", {
        user_id: userId,
        role,
        is_active: isActive,
      });
    },
    onSuccess: () => {
      toast.success("User permissions updated.");
      queryClient.invalidateQueries({ queryKey: ["superadmin-users", selectedTenant] });
    },
  });

  const resetPwdMutation = useMutation({
    mutationFn: async () => {
      if (!resetModalUser) return;
      await api.post(`/superadmin/users/${resetModalUser.id}/reset_password`, {
        new_password: newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password reset successfully.");
      setResetModalUser(null);
      setNewPassword("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to reset password.");
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            User Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage user roles, statuses, and credentials across all colleges.
          </p>
        </div>
        
        {/* Tenant Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm font-medium text-gray-500">College:</span>
          {loadingTenants ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="text-sm border-none bg-transparent font-semibold text-gray-800 focus:ring-0 p-0 pr-6"
            >
              {tenants?.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loadingUsers ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : !users || users.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No users found for this college.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">User Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Verified</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value, isActive: u.is_active })}
                        className="text-xs font-medium border-gray-200 rounded text-gray-700 focus:ring-brand-500 focus:border-brand-500 py-1"
                        disabled={u.role === "super_admin"}
                      >
                        <option value="student">Student</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin" disabled>Super Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => roleMutation.mutate({ userId: u.id, role: u.role, isActive: !u.is_active })}
                        disabled={u.role === "super_admin"}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                          u.is_active 
                            ? "bg-green-50 text-green-700 hover:bg-green-100" 
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                        }`}
                      >
                        {u.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {u.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_verified ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setResetModalUser(u)}
                        className="btn-secondary px-2 py-1 text-xs flex items-center gap-1 ml-auto"
                      >
                        <Key className="w-3 h-3" /> Reset Pwd
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Force Password Reset</h3>
                <p className="text-xs text-gray-500">{resetModalUser.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  className="input font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">The user will be able to log in with this password.</p>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setResetModalUser(null)}
                  className="btn-secondary"
                  disabled={resetPwdMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={() => resetPwdMutation.mutate()}
                  disabled={!newPassword || resetPwdMutation.isPending}
                  className="btn-primary"
                >
                  {resetPwdMutation.isPending ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
