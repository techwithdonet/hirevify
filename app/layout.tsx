import type { Metadata } from "next";
import "./globals.css";
import "../src/styles/index.css";

const siteUrl = new URL("https://hirevify.vercel.app");
const refreshSnapshotScript = `
(function () {
  try {
    var raw =
      window.sessionStorage.getItem('hirevify_refresh_snapshot') ||
      window.localStorage.getItem('hirevify_refresh_snapshot');
    if (!raw) return;
    var snapshot = JSON.parse(raw);
    if (!snapshot || !snapshot.dataUrl || !snapshot.capturedAt) return;
    if (Date.now() - snapshot.capturedAt > 30 * 60 * 1000) return;

    var overlay = document.createElement('div');
    overlay.id = 'hirevify-refresh-paint';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2147483647';
    overlay.style.overflow = 'hidden';
    overlay.style.pointerEvents = 'none';
    overlay.style.background = snapshot.backgroundColor || '#ffffff';

    var image = document.createElement('img');
    image.alt = '';
    image.src = snapshot.dataUrl;
    image.style.display = 'block';
    image.style.width = '100vw';
    image.style.height = '100vh';
    image.style.objectFit = 'fill';

    overlay.appendChild(image);
    document.documentElement.appendChild(overlay);
  } catch (error) {}
})();
`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "HireVify",
  title: {
    default: "HireVify | AI-Powered Skills Hiring",
    template: "%s | HireVify",
  },
  description:
    "HireVify is an AI-powered skills hiring platform where recruiters evaluate real work, rank candidates by proof, and grow talent beyond keywords.",
  keywords: [
    "HireVify",
    "AI hiring platform",
    "skills-first hiring",
    "candidate proof board",
    "project-based hiring",
    "talent matching",
    "recruiting software",
  ],
  authors: [{ name: "HireVify" }],
  creator: "HireVify",
  publisher: "HireVify",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "HireVify",
    title: "HireVify | Hire Smarter. Grow Talent.",
    description:
      "A dark green and neon lime AI hiring platform for skills-first candidate matching, proof review, and recruiter workflows.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "HireVify dark green landing page with neon lime AI hiring dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HireVify | Hire Smarter. Grow Talent.",
    description:
      "AI-powered skills hiring with candidate proof boards, match scoring, and project-based evaluation.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "hirevify:theme": "dark green landing page with neon lime accents",
    "hirevify:hero": "Hire Smarter. Grow Talent.",
    "hirevify:preview":
      "Skill Match dashboard, candidate proof board, match scoring, project-based hiring",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Immediate scroll to top - executes before body renders */}
        <script
          dangerouslySetInnerHTML={{ __html: "window.scrollTo(0,0);" }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{min-height:100%;background:#f1f5f9;scroll-behavior:auto!important;}body:has([class*='bg-[#0b1a0f]']),body:has([class*='bg-[#112318]']){background:#0b1a0f;}",
          }}
        />
        <script
          id="hirevify-refresh-snapshot"
          dangerouslySetInnerHTML={{ __html: refreshSnapshotScript }}
        />
        {children}
      </body>
    </html>
  );
}
