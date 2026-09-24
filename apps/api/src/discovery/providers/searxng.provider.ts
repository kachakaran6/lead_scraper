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
    const raw = title.replace(/<[^>]*>/g, "").trim();

    // Discard listicle titles and directory pages
    if (
      /^(the\s+)?(\d+\s+)?(best|top|find|hire)\s+/i.test(raw) ||
      /\b(top\s+\d+|\d+\s+best|\d+\s+top|directory|yellow pages|near me|search results|jobs|careers|salaries)\b/i.test(raw)
    ) {
      // If it looks like "Top 10 Dentists in Houston - Yelp", check if there's a specific brand before dash
      const parts = raw.split(/\s*[-|–—:]\s*/);
      if (parts.length > 1 && !/^(the\s+)?(\d+\s+)?(best|top|find)/i.test(parts[0])) {
        return parts[0].trim().slice(0, 150);
      }
      return ""; // Discard pure listicle titles
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

      // Check path patterns for directory searches
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
    const categories: Array<{ match: string; label: string }> = [
      { match: "hvac", label: "Commercial HVAC" },
      { match: "air conditioning", label: "Commercial HVAC" },
      { match: "roofing", label: "Roofing Contractor" },
      { match: "solar", label: "Solar Energy" },
      { match: "plumber", label: "Plumbing Services" },
      { match: "plumbing", label: "Plumbing Services" },
      { match: "electrician", label: "Electrical Contractor" },
      { match: "electrical", label: "Electrical Contractor" },
      { match: "contractor", label: "General Contractor" },
      { match: "construction", label: "Construction & Remodeling" },
      { match: "landscap", label: "Commercial Landscaping" },
      { match: "painting", label: "Painting Contractor" },
      { match: "pest control", label: "Pest Control Services" },
      { match: "lawyer", label: "Law Firm" },
      { match: "attorney", label: "Law Firm" },
      { match: "law firm", label: "Law Firm" },
      { match: "legal", label: "Legal Services" },
      { match: "cpa", label: "CPA & Accounting" },
      { match: "accountant", label: "CPA & Accounting" },
      { match: "accounting", label: "CPA & Accounting" },
      { match: "tax", label: "Tax Consultant" },
      { match: "wealth", label: "Wealth Management" },
      { match: "financial", label: "Financial Services" },
      { match: "real estate", label: "Real Estate Agency" },
      { match: "realtor", label: "Real Estate Agency" },
      { match: "property management", label: "Property Management" },
      { match: "architect", label: "Architecture Firm" },
      { match: "interior design", label: "Interior Design Studio" },
      { match: "marketing", label: "Digital Marketing Agency" },
      { match: "seo", label: "Digital Marketing Agency" },
      { match: "advertising", label: "Advertising Agency" },
      { match: "it services", label: "Managed IT Services" },
      { match: "cleaning", label: "Commercial Cleaning" },
      { match: "auto repair", label: "Auto Repair Shop" },
      { match: "mechanic", label: "Auto Repair Shop" },
      { match: "dentist", label: "Dental Practice" },
      { match: "dental", label: "Dental Practice" },
      { match: "orthodont", label: "Orthodontics" },
      { match: "dermatolog", label: "Dermatology Clinic" },
      { match: "skin", label: "Dermatology Clinic" },
      { match: "chiropractic", label: "Chiropractic Clinic" },
      { match: "physical therapy", label: "Physical Therapy" },
      { match: "veterinar", label: "Veterinary Clinic" },
      { match: "animal hospital", label: "Veterinary Clinic" },
      { match: "catering", label: "Catering & Events" },
      { match: "restaurant", label: "Restaurant" },
    ];

    for (const item of categories) {
      if (text.includes(item.match)) {
        return item.label;
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
