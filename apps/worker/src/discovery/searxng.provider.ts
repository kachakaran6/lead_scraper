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

    const leads: DiscoveryResult[] = [];
    for (const r of results) {
      if (!r.url || !r.title) continue;
      if (this.isIrrelevantUrl(r.url)) continue;

      const name = this.cleanTitle(r.title);
      if (!name || name.length < 2) continue;

      leads.push({
        name,
        website: r.url,
        sourceUrl: r.url,
        category: this.inferCategory(r.title, r.content) || params.query,
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
      });

      if (leads.length >= (params.limit || 100)) break;
    }

    return leads;
  }

  private cleanTitle(title: string): string {
    const raw = title.replace(/<[^>]*>/g, "").trim();

    if (
      /^(the\s+)?(\d+\s+)?(best|top|find|hire)\s+/i.test(raw) ||
      /\b(top\s+\d+|\d+\s+best|\d+\s+top|directory|yellow pages|near me|search results|jobs|careers|salaries)\b/i.test(raw)
    ) {
      const parts = raw.split(/\s*[-|–—:]\s*/);
      if (parts.length > 1 && !/^(the\s+)?(\d+\s+)?(best|top|find)/i.test(parts[0])) {
        return parts[0].trim().slice(0, 150);
      }
      return "";
    }

    return raw
      .replace(/\s*[-|–—:]\s*(Home|Official Site|Welcome|About Us|Contact|Reviews|Overview|Photos).*$/i, "")
      .replace(/\s*[-|–—]\s*.*$/, "")
      .trim()
      .slice(0, 150);
  }

  private isIrrelevantUrl(url: string): boolean {
    const blockedDomains = [
      "google.com",
      "google.co.in",
      "bing.com",
      "duckduckgo.com",
      "wikipedia.org",
      "wikidata.org",
      "youtube.com",
      "facebook.com",
      "twitter.com",
      "x.com",
      "instagram.com",
      "linkedin.com",
      "reddit.com",
      "quora.com",
      "pinterest.com",
      "tiktok.com",
      "yelp.com",
      "tripadvisor.com",
      "healthgrades.com",
      "zocdoc.com",
      "yellowpages.com",
      "superpages.com",
      "whitepages.com",
      "mapquest.com",
      "usnews.com",
      "expertise.com",
      "threebestrated.com",
      "top10.com",
      "bbb.org",
      "angi.com",
      "angieslist.com",
      "homeadvisor.com",
      "thumbtack.com",
      "houzz.com",
      "nextdoor.com",
      "indeed.com",
      "glassdoor.com",
      "ziprecruiter.com",
      "webmd.com",
      "vitals.com",
      "doximity.com",
      "caredash.com",
      "findatopdoc.com",
      "citysearch.com",
      "manta.com",
      "merchantcircle.com",
      "trustpilot.com",
      "patch.com",
      "chamberofcommerce.com",
      "opencorporates.com",
    ];

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (blockedDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
        return true;
      }

      const path = parsed.pathname.toLowerCase();
      if (
        path.includes("/search") ||
        path.includes("/find/") ||
        path.includes("/directory") ||
        path.includes("/category/") ||
        path.includes("/tag/") ||
        path.includes("/browse/") ||
        path.includes("/best-") ||
        path.includes("/top-") ||
        path.includes("/jobs/")
      ) {
        return true;
      }

      return false;
    } catch {
      return true;
    }
  }

  private inferCategory(title: string, content?: string): string | undefined {
    const text = `${title} ${content || ""}`.toLowerCase();
    const categories: Array<{ match: string; label: string }> = [
      { match: "hvac", label: "Commercial HVAC" },
      { match: "air conditioning", label: "Commercial HVAC" },
      { match: "roofing", label: "Roofing Contractor" },
      { match: "solar", label: "Solar Energy" },
      { match: "plumber", label: "Plumbing Services" },
      { match: "plumbing", label: "Plumbing Services" },
      { match: "electrician", label: "Electrical Contractor" },
      { match: "contractor", label: "General Contractor" },
      { match: "construction", label: "Construction & Remodeling" },
      { match: "landscap", label: "Commercial Landscaping" },
      { match: "painting", label: "Painting Contractor" },
      { match: "pest control", label: "Pest Control Services" },
      { match: "lawyer", label: "Law Firm" },
      { match: "attorney", label: "Law Firm" },
      { match: "legal", label: "Legal Services" },
      { match: "cpa", label: "CPA & Accounting" },
      { match: "accountant", label: "CPA & Accounting" },
      { match: "real estate", label: "Real Estate Agency" },
      { match: "realtor", label: "Real Estate Agency" },
      { match: "architect", label: "Architecture Firm" },
      { match: "marketing", label: "Digital Marketing Agency" },
      { match: "auto repair", label: "Auto Repair Shop" },
      { match: "dentist", label: "Dental Practice" },
      { match: "dermatolog", label: "Dermatology Clinic" },
      { match: "chiropractic", label: "Chiropractic Clinic" },
      { match: "veterinar", label: "Veterinary Clinic" },
      { match: "restaurant", label: "Restaurant" },
    ];

    for (const item of categories) {
      if (text.includes(item.match)) return item.label;
    }
    return undefined;
  }
}
