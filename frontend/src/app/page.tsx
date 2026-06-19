"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function RootPage() {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
