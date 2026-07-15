"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider } from "@/src/hirevify-app/components/AuthProvider";

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleAdminLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/admin1");
    router.refresh();
  };

  return (
    <AuthProvider>
      <div className="premium-page">
        <div className="premium-header">
          <div className="premium-header-inner">
            <div>
              <p className="premium-eyebrow text-emerald-700">HireVify Admin</p>
              <p className="text-sm text-slate-500">Secure admin session active</p>
            </div>
            <button type="button" onClick={handleAdminLogout} className="premium-btn-danger">
              Logout
            </button>
          </div>
        </div>
        <main className="premium-content">{children}</main>
      </div>
    </AuthProvider>
  );
}
