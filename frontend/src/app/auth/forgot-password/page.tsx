"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { mobile_or_email: identifier });
      toast.success("If your account exists, an OTP has been sent.");
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { 
        mobile_or_email: identifier,
        otp,
        new_password: newPassword
      });
      
      setAuth(res.data.user, res.data.access_token);
      toast.success("Password reset successfully!");
      
      if (res.data.user.role === 'super_admin') {
        router.push("/superadmin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reset password. Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h1>
        <p className="text-slate-500">
          {step === 1 ? "Enter your email or mobile number to receive a secure OTP." : "Enter the OTP sent to you and your new password."}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email or Mobile Number</label>
            <input 
              type="text" 
              required 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="e.g. student@vit.edu or 9876543210"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">6-Digit OTP</label>
            <input 
              type="text" 
              required 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors tracking-widest text-center text-lg"
              placeholder="••••••"
              maxLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input 
              type="password" 
              required 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="At least 8 characters"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
          >
            {loading ? "Resetting..." : "Reset Password & Login"}
          </button>
          
          <button 
            type="button" 
            onClick={() => setStep(1)}
            className="w-full text-indigo-600 font-medium py-2 text-sm hover:underline"
          >
            Back to Request OTP
          </button>
        </form>
      )}
    </div>
  );
}
