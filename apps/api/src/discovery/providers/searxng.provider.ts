import axios from "axios";
import { getEnv } from "@ultimate-leads/config";
import {
  BusinessDataProvider,
  DiscoveredLeadData,
  DiscoverySearchParams,
} from "./provider.interface";

interface SearxngResultItem {
  title: string;
  url: string;
  content?: string;
  publishedDate?: string;
}

export class SearxngProvider implements BusinessDataProvider {
  readonly name = "SearXNG Metasearch";

  private getBaseUrl(): string {
    const env = getEnv();
    return env.SEARXNG_URL || "http://searxng:8080";
  }

  isConfigured(): boolean {
    return Boolean(this.getBaseUrl());
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveredLeadData[]> {
    const base = this.getBaseUrl();
    const cleanCity = params.cityName || params.location?.split(",")[0]?.trim() || "";
    const cleanState = params.stateCode || "";
    const locParts = [cleanCity, cleanState, params.countryCode].filter(Boolean).join(" ");
    const searchQuery = locParts ? `${params.query} ${locParts}` : params.query;

    try {
      const response = await axios.get(`${base}/search`, {
        params: {
          q: searchQuery,
          format: "json",
          language: "en",
          categories: "general",
        },
        timeout: 15000,
      });

      const results: SearxngResultItem[] = response.data?.results || [];
      const leads: DiscoveredLeadData[] = [];

      for (const item of results) {
        if (!item.url || !item.title) continue;

        // Skip major search engines, social aggregators or generic directory homepages
        if (this.isIrrelevantUrl(item.url)) continue;

        const name = this.cleanTitle(item.title);
        if (!name || name.length < 2) continue;

        const phone = this.extractPhone(item.content || "");
        const category = this.inferCategory(item.title, item.content) || params.query;

        leads.push({
          name,
          category,
          address: undefined,
          city: params.cityName || params.location?.split(",")[0]?.trim(),
          state: params.stateCode,
          country: params.countryCode,
          phone: phone || null,
          website: this.normalizeUrl(item.url),
          sourceProvider: "SEARXNG",
          sourceId: `searxng-${Buffer.from(item.url).toString("base64").slice(0, 24)}`,
          sourceUrl: item.url,
          verificationStatus: "VERIFIED",
          raw: {
            snippet: item.content,
            title: item.title,
          },
        });

        if (leads.length >= (params.limit || 20)) {
          break;
        }
      }

      return leads;
    } catch (err: any) {
      console.warn("SearXNG search error:", err?.message || err);
      return [];
    }
  }

  private cleanTitle(title: string): string {
    return title
      .replace(/<[^>]*>/g, "")
      .replace(/\s*[-|–—:]\s*(Home|Official Site|Welcome|About Us|Contact).*$/i, "")
      .replace(/\s*[-|–—]\s*.*$/, "")
      .trim()
      .slice(0, 200);
  }

  private isIrrelevantUrl(url: string): boolean {
    const blockedDomains = [
      "google.com",
      "google.co.in",
      "bing.com",
      "duckduckgo.com",
      "wikipedia.org",
      "youtube.com",
      "facebook.com",
      "twitter.com",
      "instagram.com",
      "linkedin.com",
      "reddit.com",
      "yelp.com",
      "tripadvisor.com",
    ];
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      return blockedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    } catch {
      return true;
    }
  }

  private extractPhone(content: string): string | null {
    // Match common international and national phone formats
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;
    const matches = content.match(phoneRegex);
    if (matches && matches.length > 0) {
      const candidate = matches[0].trim();
      const digitsOnly = candidate.replace(/\D/g, "");
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        return candidate;
      }
    }
    return null;
  }

  private inferCategory(title: string, content?: string): string | undefined {
    const text = `${title} ${content || ""}`.toLowerCase();
    const categories = [
      "dentist",
      "doctor",
      "clinic",
      "hospital",
      "pharmacy",
      "restaurant",
      "cafe",
      "hotel",
      "gym",
      "fitness",
      "lawyer",
      "attorney",
      "accountant",
      "realtor",
      "real estate",
      "contractor",
      "plumber",
      "electrician",
      "mechanic",
      "salon",
      "spa",
      "school",
      "photographer",
      "agency",
      "marketing",
      "software",
    ];

    for (const cat of categories) {
      if (text.includes(cat)) {
        return cat.charAt(0).toUpperCase() + cat.slice(1);
      }
    }
    return undefined;
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }
}
