import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">404</p>
        <h1 className="mt-4 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 leading-7 text-slate-300">The requested HireVify page does not exist or has moved.</p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950">
          Return to HireVify
        </Link>
      </div>
    </main>
  );
}
