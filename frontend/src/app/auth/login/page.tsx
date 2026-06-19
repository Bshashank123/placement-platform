"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/hooks/useAuthStore";
import { TokenResponse } from "@/types";
import { Eye, EyeOff, GraduationCap } from "lucide-react";

const schema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<TokenResponse>("/auth/login", data);
      setAuth(res.data.user, res.data.access_token);
      toast.success(`Welcome back, ${res.data.user.email.split("@")[0]}!`);
      if (res.data.user.role === 'super_admin') {
        router.push("/superadmin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.detail?.code === "password_change_required") {
        const setupToken = err.response.data.detail.setup_token;
        // Save the setup token temporarily to be used by the setup page
        sessionStorage.setItem("setup_token", setupToken);
        toast.error("Please set a new password to continue.");
        router.push("/auth/setup-password");
        return;
      }
      
      const msg = err.response?.data?.detail || "Login failed. Check your credentials.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Resume Intelligence for Colleges</p>
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Email */}
            <div>
              <label className="label">College email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="yourname@college.edu"
                className="input"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-brand-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 card bg-brand-50 border-brand-100 text-xs text-brand-700">
          <p className="font-semibold mb-1">Demo credentials</p>
          <p>student@vit.edu  /  Student@1234</p>
          <p>faculty@vit.edu  /  Faculty@1234</p>
          <p>admin@vit.edu    /  Admin@1234</p>
        </div>

      </div>
    </div>
  );
}
