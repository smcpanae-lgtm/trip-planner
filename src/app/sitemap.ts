import type { MetadataRoute } from "next";
import { ROUTES } from "@/data/routes";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.ai-drive-planner.com/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.ai-drive-planner.com/heritage",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.ai-drive-planner.com/shiori",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://www.ai-drive-planner.com/life-map/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://www.ai-drive-planner.com/routes",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...ROUTES.map((route) => ({
      url: `https://www.ai-drive-planner.com/routes/${route.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

