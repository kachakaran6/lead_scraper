import axios from "axios";
import { getEnv } from "@ultimate-leads/config";
import { DiscoveryParams, DiscoveryProvider, DiscoveryResult } from "./types";

interface SearxngResult {
  title: string;
  url: string;
  content?: string;
  publishedDate?: string;
}

export class SearxngProvider implements DiscoveryProvider {
  readonly name = "searxng";

  async discover(params: DiscoveryParams): Promise<DiscoveryResult[]> {
    const base = getEnv().SEARXNG_URL;
    if (!base) throw new Error("SEARXNG_URL is not configured");

    const query = params.location
      ? `"${params.query}" "${params.location}"`
      : params.query;

    const response = await axios.get(`${base}/search`, {
      params: {
        q: query,
        format: "json",
        language: "en",
        categories: "general",
      },
      timeout: 30000,
    });

    const results: SearxngResult[] = response.data?.results || [];

    return results.slice(0, params.limit || 100).map((r) => ({
      name: this.cleanTitle(r.title),
      website: r.url,
      sourceUrl: r.url,
      category: this.inferCategory(r.title, r.content),
      address: undefined,
      city: params.location?.split(",")[0]?.trim(),
      state: params.location?.split(",").map((s) => s.trim())[1],
      country: undefined,
      phone: undefined,
      latitude: undefined,
      longitude: undefined,
      rating: undefined,
      reviewCount: undefined,
      sourceId: undefined,
    }));
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/\s*[-|]\s*.*$/, "")
      .replace(/\s*-\s*.*$/, "")
      .trim()
      .slice(0, 255);
  }

  private inferCategory(title: string, content?: string): string | undefined {
    const text = `${title} ${content || ""}`.toLowerCase();
    const categories = [
      "restaurant",
      "dental",
      "clinic",
      "lawyer",
      "realtor",
      "hotel",
      "salon",
      "gym",
      "school",
      "contractor",
      "plumber",
      "electrician",
      "mechanic",
      "photographer",
      "accountant",
    ];
    for (const category of categories) {
      if (text.includes(category)) return category;
    }
    return undefined;
  }
}
