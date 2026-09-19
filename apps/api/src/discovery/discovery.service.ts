import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";
import { JobsService } from "../jobs/jobs.service";
import {
  GooglePlacesProvider,
  OverpassOsmProvider,
  SearxngProvider,
  DiscoveredLeadData,
  DiscoverySearchParams,
} from "./providers";

export interface LeadScoreFactor {
  name: string;
  points: number;
  met: boolean;
  explanation: string;
}

export interface LeadScoringBreakdown {
  score: number;
  grade: "A" | "B" | "C";
  factors: LeadScoreFactor[];
}

@Injectable()
export class DiscoveryService {
  private readonly googlePlaces: GooglePlacesProvider;
  private readonly overpassOsm: OverpassOsmProvider;
  private readonly searxng: SearxngProvider;

  constructor(private readonly jobsService?: JobsService) {
    this.googlePlaces = new GooglePlacesProvider();
    this.overpassOsm = new OverpassOsmProvider();
    this.searxng = new SearxngProvider();
  }

  async discover(params: DiscoverySearchParams & { campaignId?: string; source?: string; userId?: string }) {
    if (this.jobsService) {
      const job = await this.jobsService.create({
        type: "DISCOVER_BUSINESSES",
        status: "PENDING",
        campaignId: params.campaignId,
        progress: 0,
        result: params as any,
      });

      return {
        jobId: job.id,
        status: "queued",
        message: "Discovery job queued. Poll /jobs/:id for status.",
      };
    }

    return this.search(params);
  }

  async search(params: DiscoverySearchParams & { userId?: string }) {
    const query = (params.query || "").trim();
    const locationParts = params.location ? params.location.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const searchCity = (params.cityName && params.cityName !== "All Cities" ? params.cityName : "") || locationParts[0] || "";
    const searchState = params.stateCode || locationParts[1] || "";
    const searchCountry = params.countryCode || locationParts[2] || "";
    const effectiveLocation = [searchCity, searchState, searchCountry].filter(Boolean).join(", ") || params.location || "";
    const limit = Math.min(params.limit || 20, 50);

    // 1. Search existing verified DB records first
    const where: any = {};
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
      ];
    }
    if (searchCity) {
      where.AND = [
        {
          OR: [
            { city: { contains: searchCity, mode: "insensitive" } },
            { address: { contains: searchCity, mode: "insensitive" } },
          ],
        },
      ];
    }

    let existing = await prisma.business.findMany({
      where,
      take: limit,
      orderBy: { leadScore: "desc" },
      include: {
        websites: { take: 1 },
        websiteAudits: { take: 1 },
        phones: { take: 2 },
        emails: { take: 2 },
        opportunities: { take: 4 },
      },
    });

    // 2. If fewer records exist than requested limit, query live keyless data providers
    if (existing.length < limit) {
      const liveResults: DiscoveredLeadData[] = [];

      // A. Try Google Places if configured (Optional official API)
      if (this.googlePlaces.isConfigured()) {
        try {
          const googleResults = await this.googlePlaces.search({
            ...params,
            cityName: searchCity,
            stateCode: searchState,
            countryCode: searchCountry,
            limit,
          });
          liveResults.push(...googleResults);
        } catch (err: any) {
          console.warn("Google Places query error:", err.message);
        }
      }

      // B. Query OpenStreetMap Overpass live verified POIs (Keyless)
      try {
        const osmResults = await this.overpassOsm.search({
          ...params,
          cityName: searchCity,
          stateCode: searchState,
          countryCode: searchCountry,
          limit,
        });
        liveResults.push(...osmResults);
      } catch (err: any) {
        console.warn("Overpass OSM query error:", err.message);
      }

      // C. Query SearXNG Metasearch (Keyless - aggregates Google, Bing, DuckDuckGo)
      if (this.searxng.isConfigured()) {
        try {
          const searxngResults = await this.searxng.search({
            ...params,
            cityName: searchCity,
            stateCode: searchState,
            countryCode: searchCountry,
            limit,
          });
          liveResults.push(...searxngResults);
        } catch (err: any) {
          console.warn("SearXNG query error:", err.message);
        }
      }

      // 3. Persist and deduplicate real data into database
      if (liveResults.length > 0) {
        const persistedIds: string[] = [];
        for (const item of liveResults) {
          const saved = await this.persistAndDeduplicate(item, params.userId);
          if (saved && (saved as any).id) {
            persistedIds.push((saved as any).id);
          }
        }

        // Re-query database to fetch verified records with all relational data
        existing = await prisma.business.findMany({
          where: {
            OR: [
              where,
              ...(persistedIds.length > 0 ? [{ id: { in: persistedIds } }] : []),
            ],
          },
          take: limit,
          orderBy: { leadScore: "desc" },
          include: {
            websites: { take: 1 },
            websiteAudits: { take: 1 },
            phones: { take: 2 },
            emails: { take: 2 },
            opportunities: { take: 4 },
          },
        });
      }
    }

    // Attach transparent explainability factors to each result
    const itemsWithFactors = existing.map((b) => {
      const scoring = this.calculateLeadScore({
        hasWebsite: b.hasWebsite ?? Boolean(b.website),
        hasPhone: b.hasPhone ?? Boolean(b.phone),
        hasEmail: b.hasEmail ?? (b.emails && b.emails.length > 0),
        category: b.category,
        city: b.city,
        rating: b.rating,
        reviewCount: b.reviewCount,
      });

      return {
        ...b,
        leadScore: scoring.score,
        leadGrade: scoring.grade,
        scoringFactors: scoring.factors,
      };
    });

    return {
      items: itemsWithFactors,
      meta: {
        total: itemsWithFactors.length,
        query,
        location: effectiveLocation,
        countryCode: searchCountry,
        stateCode: searchState,
        cityName: searchCity,
        page: 1,
        limit,
      },
    };
  }

  calculateLeadScore(business: {
    hasWebsite: boolean;
    hasPhone: boolean;
    hasEmail: boolean;
    category?: string | null;
    city?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
  }): LeadScoringBreakdown {
    const factors: LeadScoreFactor[] = [];
    let score = 0;

    // Factor 1: Missing website (Primary Outreach Target)
    const isMissingWebsite = !business.hasWebsite;
    const pts1 = isMissingWebsite ? 35 : 10;
    score += pts1;
    factors.push({
      name: "Website Opportunity",
      points: pts1,
      met: isMissingWebsite,
      explanation: isMissingWebsite
        ? "No website found (prime web design/booking system prospect)"
        : "Website verified (redesign / performance audit target)",
    });

    // Factor 2: Direct Phone Available
    const hasPhone = Boolean(business.hasPhone);
    const pts2 = hasPhone ? 25 : 0;
    score += pts2;
    factors.push({
      name: "Direct Contact Phone",
      points: pts2,
      met: hasPhone,
      explanation: hasPhone
        ? "Direct phone number verified for outreach"
        : "No public phone number verified in source",
    });

    // Factor 3: Business Category & Match
    const hasCategory = Boolean(business.category);
    const pts3 = hasCategory ? 20 : 5;
    score += pts3;
    factors.push({
      name: "Industry & Category",
      points: pts3,
      met: hasCategory,
      explanation: hasCategory
        ? `Categorized as '${business.category}'`
        : "General unclassified commercial entity",
    });

    // Factor 4: Location Verification
    const hasLocation = Boolean(business.city);
    const pts4 = hasLocation ? 10 : 0;
    score += pts4;
    factors.push({
      name: "Location Verified",
      points: pts4,
      met: hasLocation,
      explanation: hasLocation
        ? `Physical presence verified in ${business.city}`
        : "Location partially unverified",
    });

    // Factor 5: Customer Reviews / Reputation
    const hasReviews = (business.reviewCount || 0) > 0 || (business.rating || 0) > 0;
    const pts5 = hasReviews ? 10 : 0;
    score += pts5;
    factors.push({
      name: "Reputation & Reviews",
      points: pts5,
      met: hasReviews,
      explanation: hasReviews
        ? `Reputation data present (${business.rating || 0}★, ${business.reviewCount || 0} reviews)`
        : "No public reviews recorded at source",
    });

    const grade: "A" | "B" | "C" = score >= 80 ? "A" : score >= 60 ? "B" : "C";

    return {
      score: Math.min(score, 100),
      grade,
      factors,
    };
  }

  private async persistAndDeduplicate(data: DiscoveredLeadData, userId?: string) {
    try {
      // Deduplication check: placeId, phone, or name + city
      let existing: any = null;

      if (data.googlePlaceId) {
        existing = await prisma.business.findFirst({
          where: { googlePlaceId: data.googlePlaceId },
        });
      }

      if (!existing && data.sourceId) {
        existing = await prisma.business.findFirst({
          where: { sourceId: data.sourceId },
        });
      }

      if (!existing && data.phone) {
        existing = await prisma.business.findFirst({
          where: { phone: data.phone },
        });
      }

      if (!existing && data.name && data.city) {
        existing = await prisma.business.findFirst({
          where: {
            name: { equals: data.name, mode: "insensitive" },
            city: { equals: data.city, mode: "insensitive" },
          },
        });
      }

      const hasWebsite = Boolean(data.website && data.website.trim().length > 3);
      const hasPhone = Boolean(data.phone && data.phone.trim().length > 4);
      const scoring = this.calculateLeadScore({
        hasWebsite,
        hasPhone,
        hasEmail: false,
        category: data.category,
        city: data.city,
        rating: data.rating,
        reviewCount: data.reviewCount,
      });

      if (existing) {
        // Merge verified fields without overwriting with nulls
        return await prisma.business.update({
          where: { id: existing.id },
          data: {
            address: existing.address || data.address,
            phone: existing.phone || data.phone,
            website: existing.website || data.website,
            rating: existing.rating || data.rating,
            reviewCount: existing.reviewCount || data.reviewCount,
            lastVerifiedAt: new Date(),
            verificationStatus: data.verificationStatus,
            hasWebsite: existing.hasWebsite ?? hasWebsite,
            hasPhone: existing.hasPhone ?? hasPhone,
          },
        });
      }

      return await prisma.business.create({
        data: {
          userId: userId || null,
          name: data.name,
          category: data.category || null,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          country: data.country || null,
          postalCode: data.postalCode || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          rating: data.rating || null,
          reviewCount: data.reviewCount || null,
          phone: data.phone || null,
          website: data.website || null,
          googlePlaceId: data.googlePlaceId || null,
          googleMapsUrl: data.googleMapsUrl || null,
          source: data.sourceProvider === "GOOGLE_PLACES" ? "MAPS" : "SEARCH",
          sourceProvider: data.sourceProvider,
          sourceId: data.sourceId || null,
          sourceUrl: data.sourceUrl || null,
          status: "NEW",
          hasWebsite,
          hasPhone,
          hasEmail: false,
          leadScore: scoring.score,
          leadGrade: scoring.grade,
          opportunityScore: isNaN(scoring.score) ? 50 : scoring.score,
          verificationStatus: data.verificationStatus,
          retrievedAt: new Date(),
          lastVerifiedAt: new Date(),
          ...(hasWebsite && data.website
            ? {
                websites: {
                  create: {
                    url: data.website,
                    status: "WEBSITE_FOUND",
                  },
                },
              }
            : {}),
        },
      });
    } catch (err: any) {
      console.warn("Failed to persist discovered lead:", err.message);
      return null;
    }
  }
}