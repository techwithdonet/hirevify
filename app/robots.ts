import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hirevify.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin1", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
