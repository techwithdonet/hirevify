"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("admin1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(result.error || "Admin login failed.");
        return;
      }

      setPassword("");
      router.refresh();
    } catch {
      setError("Unable to reach the admin login service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#064e3b_0%,#020617_48%,#020617_100%)] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl" aria-hidden="true">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-slate-950">HireVify Admin Login</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage platform data and temporary Pro access.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="admin-username" className="mb-2 block text-sm font-semibold text-slate-700">
              Username
            </label>
            <input
              id="admin-username"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking…" : "Open Admin Panel"}
          </button>
        </div>
      </form>
    </div>
  );
}
