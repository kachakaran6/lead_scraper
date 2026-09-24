import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";
import crypto from "crypto";
import { DiscoveredLeadData } from "./providers";

export interface DeduplicationResult {
  businessId: string;
  isDuplicate: boolean;
  matchReason?: string;
  confidence: number;
  lead: any;
}

export const AGGREGATOR_DOMAINS = new Set([
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "pinterest.com",
  "reddit.com",
  "quora.com",
  "yelp.com",
  "yellowpages.com",
  "superpages.com",
  "whitepages.com",
  "healthgrades.com",
  "zocdoc.com",
  "webmd.com",
  "vitals.com",
  "doximity.com",
  "caredash.com",
  "findatopdoc.com",
  "ratemds.com",
  "doctor.com",
  "google.com",
  "maps.google.com",
  "goo.gl",
  "bing.com",
  "yahoo.com",
  "tripadvisor.com",
  "foursquare.com",
  "mapquest.com",
  "citysearch.com",
  "angi.com",
  "angieslist.com",
  "homeadvisor.com",
  "thumbtack.com",
  "houzz.com",
  "nextdoor.com",
  "bbb.org",
  "trustpilot.com",
  "sitejabber.com",
  "wikipedia.org",
  "wikidata.org",
  "openstreetmap.org",
  "patch.com",
  "manta.com",
  "merchantcircle.com",
  "chamberofcommerce.com",
  "opencorporates.com",
  "dnb.com",
  "zoominfo.com",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com",
  "usnews.com",
  "expertise.com",
  "threebestrated.com",
  "top10.com",
]);

@Injectable()
export class DeduplicationService {
  /**
   * Cleans and normalizes phone numbers into E.164 and digits-only format
   */
  normalizePhone(rawPhone?: string | null): { normalized: string; digits: string; hash?: string } {
    if (!rawPhone) return { normalized: "", digits: "" };
    const trimmed = rawPhone.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 7) return { normalized: "", digits: "" };

    let normalized = trimmed.replace(/[^\d+]/g, "");
    if (!normalized.startsWith("+") && digits.length >= 10) {
      if (digits.length === 10) {
        normalized = `+1${digits}`; // Default US or raw
      } else {
        normalized = `+${digits}`;
      }
    }

    const hash = crypto.createHash("md5").update(digits).digest("hex");
    return { normalized, digits, hash };
  }

  /**
   * Normalizes business names by removing legal entity suffixes and honorifics.
   * Preserves core name tokens to avoid generating empty or generic strings.
   */
  normalizeBusinessName(rawName: string): { canonical: string; normalized: string; cleanTokens: string[] } {
    const canonical = (rawName || "").trim().replace(/\s+/g, " ");
    if (!canonical) return { canonical: "", normalized: "", cleanTokens: [] };

    // Strip punctuation into whitespace-separated words
    let base = canonical.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

    // Only strip pure legal entity suffixes and titles
    const legalSuffixes = [
      /\b(llc|inc|incorporated|corp|corporation|ltd|limited|pvt|private|co|company|gmbh|sa|srl)\b/gi,
      /\b(dr|doctor|prof|mr|mrs|ms)\b/gi,
    ];

    let stripped = base;
    for (const rx of legalSuffixes) {
      stripped = stripped.replace(rx, " ");
    }
    stripped = stripped.replace(/\s+/g, " ").trim();

    // If stripping removed everything or made it too short, retain the original base
    const finalNormalized = stripped.length >= 3 ? stripped : base;
    const cleanTokens = finalNormalized.split(" ").filter((t) => t.length > 1);

    return { canonical, normalized: finalNormalized, cleanTokens };
  }

  /**
   * Extracts clean root domain from website URL and identifies aggregator/directory links
   */
  extractDomain(rawUrl?: string | null): { domain: string | null; hash?: string; isAggregator: boolean } {
    if (!rawUrl || rawUrl.trim().length < 4) {
      return { domain: null, isAggregator: false };
    }

    try {
      let urlStr = rawUrl.trim();
      if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
        urlStr = `https://${urlStr}`;
      }
      const parsed = new URL(urlStr);
      const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (hostname.length < 3) return { domain: null, isAggregator: false };

      const isAggregator =
        AGGREGATOR_DOMAINS.has(hostname) ||
        Array.from(AGGREGATOR_DOMAINS).some((ad) => hostname.endsWith(`.${ad}`));

      // If it's an aggregator / social / directory domain, do NOT generate a domainHash for deduplication!
      if (isAggregator) {
        return { domain: hostname, isAggregator: true };
      }

      const hash = crypto.createHash("md5").update(hostname).digest("hex");
      return { domain: hostname, hash, isAggregator: false };
    } catch {
      const clean = rawUrl
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .split("?")[0]
        .trim();

      if (clean.length > 3) {
        const isAggregator =
          AGGREGATOR_DOMAINS.has(clean) ||
          Array.from(AGGREGATOR_DOMAINS).some((ad) => clean.endsWith(`.${ad}`));

        if (isAggregator) {
          return { domain: clean, isAggregator: true };
        }

        return {
          domain: clean,
          hash: crypto.createHash("md5").update(clean).digest("hex"),
          isAggregator: false,
        };
      }
      return { domain: null, isAggregator: false };
    }
  }

  /**
   * Computes True Jaccard Token Similarity + Levenshtein distance between two names
   */
  calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (!a || !b) return 0.0;

    const cleanA = a.toLowerCase().trim();
    const cleanB = b.toLowerCase().trim();
    if (cleanA === cleanB) return 1.0;

    const tokensA = new Set(cleanA.split(/\s+/).filter((t) => t.length > 1));
    const tokensB = new Set(cleanB.split(/\s+/).filter((t) => t.length > 1));

    if (tokensA.size === 0 || tokensB.size === 0) return 0.0;

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    // Standard Jaccard index: intersection / union
    const unionSize = tokensA.size + tokensB.size - intersection;
    const jaccard = unionSize > 0 ? intersection / unionSize : 0;

    // Levenshtein ratio
    const lenA = cleanA.length;
    const lenB = cleanB.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= lenA; i++) matrix[i] = [i];
    for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = cleanA[i - 1] === cleanB[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const levDist = matrix[lenA][lenB];
    const levSim = 1 - levDist / Math.max(lenA, lenB, 1);

    return jaccard * 0.6 + levSim * 0.4;
  }

  /**
   * Deterministic & Multi-Signal Identity Resolution and Safe Upsert
   */
  async resolveAndPersistLead(
    data: DiscoveredLeadData,
    userId?: string,
    profileId?: string
  ): Promise<DeduplicationResult | null> {
    const rawName = data.name?.trim();
    if (!rawName) return null;

    const { canonical, normalized, cleanTokens } = this.normalizeBusinessName(rawName);
    if (!normalized || normalized.length < 2) return null;

    const { normalized: normPhone, digits: phoneDigits, hash: phoneHash } = this.normalizePhone(data.phone);
    const { domain, hash: domainHash, isAggregator } = this.extractDomain(data.website);

    const cityNorm = (data.city || "").toLowerCase().trim();
    const countryNorm = (data.country || "").toLowerCase().trim();

    // Only compute geoNameHash if we have a distinctive normalized name (>= 3 chars) and city (>= 2 chars)
    const canUseGeoHash = normalized.length >= 3 && cleanTokens.length >= 1 && cityNorm.length >= 2;
    const geoNameKey = canUseGeoHash ? `${normalized}|${cityNorm}|${countryNorm}` : null;
    const geoNameHash = geoNameKey ? crypto.createHash("md5").update(geoNameKey).digest("hex") : null;

    const identityComposite = `${normalized}|${phoneDigits || domain || ""}|${cityNorm}`;
    const identityHash = crypto.createHash("md5").update(identityComposite).digest("hex");

    const providerName = data.sourceProvider || "SEARCH";
    const providerPlaceId = data.googlePlaceId || data.sourceId || null;

    // 1. Check Signal 1: Provider Place ID via LeadSource
    let existingBusiness: any = null;
    let matchReason: string | undefined;
    let confidence = 0.0;

    if (providerPlaceId) {
      const sourceRecord = await prisma.leadSource.findFirst({
        where: {
          provider: providerName,
          providerPlaceId,
        },
        include: { business: true },
      });
      if (sourceRecord?.business) {
        existingBusiness = sourceRecord.business;
        matchReason = `Exact provider ID match (${providerName}: ${providerPlaceId})`;
        confidence = 1.0;
      }
    }

    // 2. Check Signal 2: Exact Phone Hash Match (excluding toll-free shared numbers)
    const isTollFree = /^(1?8(00|88|77|66|55|44|33)|1800)/.test(phoneDigits);
    if (!existingBusiness && phoneHash && phoneDigits.length >= 7 && !isTollFree) {
      const phoneMatch = await prisma.business.findFirst({
        where: { phoneHash },
      });
      if (phoneMatch) {
        const sim = this.calculateSimilarity(normalized, phoneMatch.normalizedName || phoneMatch.name);
        if (sim >= 0.70) {
          existingBusiness = phoneMatch;
          matchReason = `Verified direct phone match (${normPhone})`;
          confidence = 0.98;
        }
      }
    }

    // 3. Check Signal 3: Exact Domain Match (ONLY on verified private domains, never aggregators)
    if (!existingBusiness && domainHash && domain && !isAggregator) {
      const domainMatch = await prisma.business.findFirst({
        where: { domainHash },
      });
      if (domainMatch) {
        existingBusiness = domainMatch;
        matchReason = `Canonical website domain match (${domain})`;
        confidence = 0.95;
      }
    }

    // 4. Check Signal 4: Exact Geo-Name Hash (Normalized Name + City + Country)
    if (!existingBusiness && geoNameHash && canUseGeoHash) {
      const geoMatch = await prisma.business.findFirst({
        where: { geoNameHash },
      });
      if (geoMatch) {
        existingBusiness = geoMatch;
        matchReason = `Exact name & territory match in ${data.city}`;
        confidence = 0.93;
      }
    }

    // 5. Signal 5: High-Confidence Fuzzy Name Similarity inside same City
    if (
      !existingBusiness &&
      cityNorm.length >= 3 &&
      cleanTokens.length >= 2 &&
      normalized.length >= 6
    ) {
      const cityCandidates = await prisma.business.findMany({
        where: {
          city: { equals: data.city, mode: "insensitive" },
        },
        take: 15,
        orderBy: { updatedAt: "desc" },
      });

      for (const candidate of cityCandidates) {
        const candNorm =
          candidate.normalizedName || this.normalizeBusinessName(candidate.name).normalized;
        if (candNorm.length < 5) continue;
        const sim = this.calculateSimilarity(normalized, candNorm);
        if (sim >= 0.88) {
          existingBusiness = candidate;
          matchReason = `High-confidence fuzzy name match in ${data.city} (${Math.round(sim * 100)}% similarity)`;
          confidence = Number(sim.toFixed(2));
          break;
        }
      }
    }

    // True business website: must exist, not be an aggregator directory, and have sufficient length
    const hasWebsite = Boolean(domain && !isAggregator);
    const hasPhone = Boolean(phoneDigits.length >= 7);

    // If Duplicate Found: Update provenance & refresh non-null fields
    if (existingBusiness) {
      const updated = await prisma.business.update({
        where: { id: existingBusiness.id },
        data: {
          lastSeen: new Date(),
          duplicateConfidence: confidence,
          matchReason,
          address: existingBusiness.address || data.address,
          phone: existingBusiness.phone || data.phone,
          normalizedPhone: existingBusiness.normalizedPhone || normPhone || null,
          phoneHash: existingBusiness.phoneHash || phoneHash || null,
          website: existingBusiness.website || (!isAggregator ? data.website : null),
          websiteDomain: existingBusiness.websiteDomain || (hasWebsite ? domain : null),
          domainHash: existingBusiness.domainHash || (!isAggregator ? domainHash : null),
          rating: data.rating || existingBusiness.rating,
          reviewCount: data.reviewCount || existingBusiness.reviewCount,
          verificationStatus:
            data.verificationStatus === "VERIFIED"
              ? "VERIFIED"
              : existingBusiness.verificationStatus,
        },
      });

      // Upsert LeadSource provenance
      if (providerPlaceId) {
        await prisma.leadSource.upsert({
          where: {
            provider_providerPlaceId: {
              provider: providerName,
              providerPlaceId,
            },
          },
          update: {
            lastSeenAt: new Date(),
            rawName: data.name,
            rawAddress: data.address,
            rawPhone: data.phone,
            rawWebsite: data.website,
            rawData: data as any,
          },
          create: {
            businessId: existingBusiness.id,
            provider: providerName,
            providerPlaceId,
            rawName: data.name,
            rawAddress: data.address,
            rawPhone: data.phone,
            rawWebsite: data.website,
            rawCategory: data.category,
            rawData: data as any,
          },
        });
      }

      return {
        businessId: existingBusiness.id,
        isDuplicate: true,
        matchReason,
        confidence,
        lead: updated,
      };
    }

    // Calculate lead opportunity score
    const leadScore =
      (!hasWebsite ? 35 : 15) +
      (hasPhone ? 25 : 0) +
      (data.category ? 20 : 10) +
      (data.city ? 10 : 0) +
      ((data.rating || 0) > 0 ? 10 : 0);

    const opportunityScore = !hasWebsite ? 90 : 55;

    // Brand New Lead: Insert Canonical Record & Provenance
    const created = await prisma.business.create({
      data: {
        userId: userId || null,
        name: canonical,
        canonicalName: canonical,
        normalizedName: normalized,
        normalizedPhone: normPhone || null,
        phoneHash: phoneHash || null,
        websiteDomain: hasWebsite ? domain : null,
        domainHash: hasWebsite && domainHash ? domainHash : null,
        geoNameHash,
        identityHash,
        category: data.category || "Commercial Entity",
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
        website: hasWebsite ? data.website : null,
        googlePlaceId: data.googlePlaceId || null,
        googleMapsUrl: data.googleMapsUrl || null,
        source: providerName === "GOOGLE_PLACES" ? "MAPS" : "SEARCH",
        sourceProvider: providerName,
        sourceId: data.sourceId || null,
        sourceUrl: data.sourceUrl || null,
        status: "NEW",
        lifecycleStage: leadScore >= 70 ? "SCORED" : "STORED",
        leadScore: Math.min(leadScore, 100),
        opportunityScore,
        hasWebsite,
        hasPhone,
        hasEmail: false,
        verificationStatus: data.verificationStatus || "VERIFIED",
        retrievedAt: new Date(),
        firstSeen: new Date(),
        lastSeen: new Date(),
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
        sources: providerPlaceId
          ? {
              create: {
                provider: providerName,
                providerPlaceId,
                rawName: data.name,
                rawAddress: data.address,
                rawPhone: data.phone,
                rawWebsite: data.website,
                rawCategory: data.category,
                rawData: data as any,
              },
            }
          : undefined,
      },
    });

    // Record LeadEvent
    if (profileId) {
      await prisma.leadEvent.create({
        data: {
          businessId: created.id,
          profileId,
          type: "DISCOVERED",
          title: `Discovered "${created.name}" in ${created.city || "Target Territory"}`,
          description: `Industry: ${created.category} · Website: ${hasWebsite ? "Yes" : "Missing (Opportunity)"} · Phone: ${hasPhone ? "Verified" : "None"}`,
          metadata: {
            provider: providerName,
            city: created.city,
            category: created.category,
            hasWebsite,
          },
        },
      });
    }

    return {
      businessId: created.id,
      isDuplicate: false,
      confidence: 1.0,
      lead: created,
    };
  }
}
