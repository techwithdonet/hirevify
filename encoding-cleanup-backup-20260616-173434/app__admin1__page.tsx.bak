"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/src/hirevify-app/components/AuthProvider";
import { Button } from "@/src/hirevify-app/components/ui/button";
import { toast, Toaster } from "sonner";

function AdminPanel() {
  const { signIn, setUser } = useAuth();

  const openDashboard = (type: "recruiter" | "candidate") => {
    localStorage.setItem("hirevify_admin_auto_open", type);
    window.location.href = "/";
  };

  const handleRecruiter = async () => {
    const result = await signIn("recruiter@hirevify.com", "TestPassword123!");

    if (result.success && result.user) {
      const recruiterUser = {
        ...result.user,
        email: "recruiter@hirevify.com",
        userType: "recruiter" as const,
        profileComplete: true,
      };

      setUser(recruiterUser);
      localStorage.setItem("hirevify_user", JSON.stringify(recruiterUser));
      localStorage.setItem("hirevify_access_token", recruiterUser.accessToken || "");
      toast.success("Opening recruiter dashboard...");
      openDashboard("recruiter");
    } else {
      toast.error(result.message || "Recruiter login failed");
    }
  };

  const handleCandidate = async () => {
    const result = await signIn("candidate@hirevify.com", "TestPassword123!");

    if (result.success && result.user) {
      const candidateUser = {
        ...result.user,
        email: "candidate@hirevify.com",
        userType: "candidate" as const,
        profileComplete: true,
      };

      setUser(candidateUser);
      localStorage.setItem("hirevify_user", JSON.stringify(candidateUser));
      localStorage.setItem("hirevify_access_token", candidateUser.accessToken || "");
      toast.success("Opening candidate dashboard...");
      openDashboard("candidate");
    } else {
      toast.error(result.message || "Candidate login failed");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-4">HireVify Admin Panel</h1>
        <h2 className="text-xl font-semibold mb-2">Authentication Testing</h2>
        <p className="text-gray-600 mb-6">
          Use these buttons for testing recruiter and candidate login.
        </p>

        <div className="flex gap-4">
          <Button onClick={handleRecruiter}>Test Recruiter Login</Button>
          <Button variant="outline" onClick={handleCandidate}>
            Test Candidate Login
          </Button>
        </div>
      </div>

      <Toaster />
    
      <a
        href="/admin1/assessments"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "12px 18px",
          borderRadius: "10px",
          background: "#059669",
          color: "white",
          fontWeight: 600,
          textDecoration: "none"
        }}
      >
        Manage Skills Assessments
      </a>
</main>
  );
}

export default function Admin1Page() {
  return (
    <AuthProvider>
      <AdminPanel />
    </AuthProvider>
  );
}