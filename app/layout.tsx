import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../src/styles/index.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://hirevify.com",
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "HireVify",
  title: {
    default: "HireVify | Skills-first hiring",
    template: "%s | HireVify",
  },
  description:
    "HireVify helps recruiters evaluate practical evidence and helps candidates present skills through projects, assessments, and structured hiring workflows.",
  keywords: [
    "HireVify",
    "skills-first hiring",
    "candidate assessment",
    "project-based hiring",
    "talent matching",
    "recruiting software",
  ],
  authors: [{ name: "HireVify" }],
  creator: "HireVify",
  publisher: "HireVify",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "HireVify",
    title: "HireVify | Skills-first hiring",
    description:
      "Evaluate candidates using skills, role context, project evidence, and structured workflows.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "HireVify skills-first hiring platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireVify | Skills-first hiring",
    description:
      "Skills-first candidate matching, project evidence, and structured recruiter workflows.",
    images: ["/twitter-image"],
  },
  robots: { index: true, follow: true },
  category: "technology",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[10000] -translate-y-24 rounded-lg bg-white px-4 py-2 font-semibold text-slate-950 shadow-lg transition focus:translate-y-0"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
