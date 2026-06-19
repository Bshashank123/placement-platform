"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Eye, EyeOff, GraduationCap, Info } from "lucide-react";

const schema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Enter a valid college email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role:     z.enum(["student", "faculty", "admin"]),
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await api.post("/auth/signup", data);
      toast.success("Account created! Please sign in.");
      router.push("/auth/login");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Signup failed.";
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
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Create an account</h2>

          {/* Info banner */}
          <div className="flex gap-2 bg-brand-50 border border-brand-100 rounded-lg p-3 mb-5 text-xs text-brand-700">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Use your official college email (e.g. <strong>yourname@vit.edu</strong>).
              The system auto-detects your college from the email domain.
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Name */}
            <div>
              <label className="label">Full name</label>
              <input {...register("name")} type="text" placeholder="Arjun Sharma"
                className="input" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">College email</label>
              <input {...register("email")} type="email" placeholder="yourname@college.edu"
                className="input" autoComplete="email" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters" className="input pr-10"
                  autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="label">I am a…</label>
              <select {...register("role")} className="input">
                <option value="student">Student</option>
                <option value="faculty">Faculty / Placement Officer</option>
                <option value="admin">College Admin</option>
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
