"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, Sparkles } from "lucide-react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "فشل تسجيل الدخول.");
      router.replace(from.startsWith("/admin") ? from : "/admin");
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-midnight-deep px-6">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-gold" />
            <span className="font-display text-2xl font-extrabold text-cream">سيرتي</span>
          </div>
          <p className="mt-2 text-sm text-slateblue">لوحة تحكم الأدمن</p>
        </div>

        <label className="block">
          <span className="field-label">كلمة السر</span>
          <div className="relative">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slateblue" />
            <input
              type="password"
              autoFocus
              className="field-input pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </label>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-gold mt-6 w-full">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
          دخول
        </button>
      </form>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
