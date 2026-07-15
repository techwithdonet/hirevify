import type { ReactNode } from "react";
import { hasAdminSession } from "@/src/lib/server/adminSession";
import { AdminLogin } from "./AdminLogin";
import { AdminShell } from "./AdminShell";

export default async function Admin1Layout({ children }: { children: ReactNode }) {
  if (!(await hasAdminSession())) {
    return <AdminLogin />;
  }

  return <AdminShell>{children}</AdminShell>;
}
