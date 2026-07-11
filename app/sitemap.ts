import type { MetadataRoute } from "next";
import { BODEGAS } from "@/data/bodegas";

const BASE = "https://embodegate.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    ...BODEGAS.map((b) => ({
      url: `${BASE}/bodega/${b.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
