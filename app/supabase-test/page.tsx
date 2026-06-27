import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SupabaseTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-emerald-700">HireVify Supabase Test</p>
        <h1 className="mt-2 text-2xl font-bold">Diagnostics disabled for launch builds</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use the protected admin system health dashboard for production diagnostics.
        </p>
      </div>
    </main>
  );
}
