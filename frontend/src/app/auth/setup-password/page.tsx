"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function SetupPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  useEffect(() => {
    const token = sessionStorage.getItem("setup_token");
    if (!token) {
      toast.error("Invalid session. Please login again.");
      router.push("/auth/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const token = sessionStorage.getItem("setup_token");
      const res = await api.post(
        "/auth/setup-password", 
        { new_password: password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      sessionStorage.removeItem("setup_token");
      setAuth(res.data.user, res.data.access_token);
      toast.success("Password updated successfully!");
      
      if (res.data.user.role === 'super_admin') {
        router.push("/superadmin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Set New Password</h1>
        <p className="text-slate-500">For security reasons, you must change your default password before accessing the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
          <input 
            type="password" 
            required 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="Repeat password"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
        >
          {loading ? "Updating..." : "Update Password & Login"}
        </button>
      </form>
    </div>
  );
}
