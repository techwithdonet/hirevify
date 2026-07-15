import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HireVifyClient from "../HireVifyClient";

const pages = {
  pricing: {
    screen: "pricing",
    title: "Pricing and Pro access",
    description: "Compare HireVify Free and Pro access. Online payments are currently pending.",
  },
  features: {
    screen: "product-features",
    title: "Features",
    description: "Explore HireVify skills-first hiring, candidate proof, assessments, and recruiter workflows.",
  },
  api: {
    screen: "product-api",
    title: "API",
    description: "Learn about the planned HireVify API and integration surface.",
  },
  integrations: {
    screen: "product-integrations",
    title: "Integrations",
    description: "Review HireVify integration availability and planned connections.",
  },
  about: {
    screen: "company-about",
    title: "About",
    description: "Learn why HireVify is building a skills-first, evidence-led hiring platform.",
  },
  blog: {
    screen: "company-blog",
    title: "Blog",
    description: "Product notes and practical ideas for skills-first hiring.",
  },
  careers: {
    screen: "company-careers",
    title: "Careers",
    description: "Explore opportunities to help build HireVify.",
  },
  contact: {
    screen: "company-contact",
    title: "Contact",
    description: "Contact the HireVify team.",
  },
  help: {
    screen: "support-help-center",
    title: "Help Center",
    description: "Get help using HireVify recruiter and candidate workflows.",
  },
  privacy: {
    screen: "support-privacy-policy",
    title: "Privacy Policy",
    description: "Read the HireVify privacy policy.",
  },
  terms: {
    screen: "support-terms-of-service",
    title: "Terms of Service",
    description: "Read the HireVify terms of service.",
  },
  status: {
    screen: "support-status",
    title: "System Status",
    description: "Review HireVify service availability information.",
  },
} as const;

type MarketingSlug = keyof typeof pages;

export function generateStaticParams() {
  return Object.keys(pages).map((marketing) => ({ marketing }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ marketing: string }>;
}): Promise<Metadata> {
  const { marketing } = await params;
  const page = pages[marketing as MarketingSlug];
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${marketing}` },
    openGraph: {
      title: `${page.title} | HireVify`,
      description: page.description,
      url: `/${marketing}`,
    },
  };
}

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ marketing: string }>;
}) {
  const { marketing } = await params;
  const page = pages[marketing as MarketingSlug];
  if (!page) notFound();
  return (
    <Suspense fallback={null}>
      <HireVifyClient initialScreen={page.screen} />
    </Suspense>
  );
}
