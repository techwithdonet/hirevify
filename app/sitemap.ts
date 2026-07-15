import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hirevify.com";
  const routes = [
    "",
    "/pricing",
    "/features",
    "/api",
    "/integrations",
    "/about",
    "/blog",
    "/careers",
    "/contact",
    "/help",
    "/privacy",
    "/terms",
    "/status",
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
