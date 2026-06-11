import type { Metadata } from "next";
import "./globals.css";
import "../src/styles/index.css";

export const metadata: Metadata = {
  title: "HireVify",
  description: "Skills-first hiring platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
