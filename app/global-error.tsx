"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <main className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-3xl font-semibold">HireVify hit an unexpected error</h1>
          <p className="mt-4 leading-7 text-slate-300">
            Your data has not been submitted again. Retry the current screen or return to the homepage.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
              Try again
            </button>
            <Link href="/" className="rounded-xl border border-white/20 px-5 py-3 font-semibold">
              Go home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
