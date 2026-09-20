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

@Injectable()
export class DeduplicationService {
  /**
   * Cleans and normalizes phone numbers into E.164 and digits-only format
   */
  normalizePhone(rawPhone?: string | null): { normalized: string; digits: string; hash?: string } {
    if (!rawPhone) return { normalized: "", digits: "" };
    const trimmed = rawPhone.trim();
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 6) return { normalized: "", digits: "" };

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
   * Normalizes business names by removing company types, doctors titles, and punctuation
   */
  normalizeBusinessName(rawName: string): { canonical: string; normalized: string; cleanTokens: string[] } {
    const canonical = rawName.trim().replace(/\s+/g, " ");
    
    // First strip punctuation and clean into whitespace-separated words
    let normalized = canonical.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");

    const legalSuffixes = [
      /\b(llc|inc|incorporated|corp|corporation|ltd|limited|pvt|private|co|company|gmbh|sa|srl)\b/gi,
      /\b(dr|doctor|prof|mr|mrs|ms)\b/gi,
      /\b(clinic|hospital|centre|center|care|services|studio|practice|dental)\b/gi,
    ];

    for (const rx of legalSuffixes) {
      normalized = normalized.replace(rx, " ");
    }
    normalized = normalized.replace(/\s+/g, " ").trim();
    const cleanTokens = normalized.split(" ").filter((t) => t.length > 1);

    return { canonical, normalized, cleanTokens };
  }

  /**
   * Extracts clean root domain from website URL
   */
  extractDomain(rawUrl?: string | null): { domain: string | null; hash?: string } {
    if (!rawUrl || rawUrl.trim().length < 4) return { domain: null };
    try {
      let urlStr = rawUrl.trim();
      if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
        urlStr = `https://${urlStr}`;
      }
      const parsed = new URL(urlStr);
      let hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (hostname.length < 3) return { domain: null };
      const hash = crypto.createHash("md5").update(hostname).digest("hex");
      return { domain: hostname, hash };
    } catch {
      const clean = rawUrl
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .split("?")[0]
        .trim();
      if (clean.length > 3) {
        return {
          domain: clean,
          hash: crypto.createHash("md5").update(clean).digest("hex"),
        };
      }
      return { domain: null };
    }
  }

  /**
   * Computes Token Overlap + Levenshtein similarity between two names
   */
  calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1.0;
    if (!a || !b) return 0.0;

    const tokensA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
    const tokensB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));

    let intersection = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) intersection++;
    }

    const minSize = Math.min(tokensA.size, tokensB.size);
    const overlapRatio = minSize > 0 ? intersection / minSize : 0;

    // Levenshtein ratio
    const lenA = a.length;
    const lenB = b.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= lenA; i++) matrix[i] = [i];
    for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

    for (let i = 1; i <= lenA; i++) {
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const levDist = matrix[lenA][lenB];
    const levSim = 1 - levDist / Math.max(lenA, lenB, 1);

    return Math.max(overlapRatio * 0.8 + levSim * 0.2, overlapRatio, levSim);
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
    const { normalized: normPhone, digits: phoneDigits, hash: phoneHash } = this.normalizePhone(data.phone);
    const { domain, hash: domainHash } = this.extractDomain(data.website);

    const cityNorm = (data.city || "").toLowerCase().trim();
    const countryNorm = (data.country || "").toLowerCase().trim();
    const geoNameKey = `${normalized}|${cityNorm}|${countryNorm}`;
    const geoNameHash = crypto.createHash("md5").update(geoNameKey).digest("hex");

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

    // 2. Check Signal 2: Exact Phone Hash Match
    if (!existingBusiness && phoneHash && phoneDigits.length >= 7) {
      const phoneMatch = await prisma.business.findFirst({
        where: { phoneHash },
      });
      if (phoneMatch) {
        const sim = this.calculateSimilarity(normalized, phoneMatch.normalizedName || phoneMatch.name);
        if (sim >= 0.45) {
          existingBusiness = phoneMatch;
          matchReason = `Verified direct phone match (${normPhone})`;
          confidence = 0.98;
        }
      }
    }

    // 3. Check Signal 3: Exact Domain Match
    if (!existingBusiness && domainHash && domain) {
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
    if (!existingBusiness && cityNorm.length > 2) {
      const geoMatch = await prisma.business.findFirst({
        where: { geoNameHash },
      });
      if (geoMatch) {
        existingBusiness = geoMatch;
        matchReason = `Name & Geographic presence match (${data.city})`;
        confidence = 0.92;
      }
    }

    // 5. Signal 5: Fuzzy Name Similarity inside same City
    if (!existingBusiness && cityNorm.length > 2 && cleanTokens.length >= 2) {
      const cityCandidates = await prisma.business.findMany({
        where: {
          city: { equals: data.city, mode: "insensitive" },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      });

      for (const candidate of cityCandidates) {
        const candNorm = candidate.normalizedName || this.normalizeBusinessName(candidate.name).normalized;
        const sim = this.calculateSimilarity(normalized, candNorm);
        if (sim >= 0.85) {
          existingBusiness = candidate;
          matchReason = `High-confidence fuzzy name match in ${data.city} (${Math.round(sim * 100)}% similarity)`;
          confidence = Number(sim.toFixed(2));
          break;
        }
      }
    }

    const hasWebsite = Boolean(domain || (data.website && data.website.trim().length > 3));
    const hasPhone = Boolean(phoneDigits.length >= 6);

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
          website: existingBusiness.website || data.website,
          websiteDomain: existingBusiness.websiteDomain || domain || null,
          domainHash: existingBusiness.domainHash || domainHash || null,
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

    // Brand New Lead: Insert Canonical Record & Provenance
    const created = await prisma.business.create({
      data: {
        userId: userId || null,
        name: canonical,
        canonicalName: canonical,
        normalizedName: normalized,
        normalizedPhone: normPhone || null,
        phoneHash: phoneHash || null,
        websiteDomain: domain || null,
        domainHash: domainHash || null,
        geoNameHash,
        identityHash,
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
        source: providerName === "GOOGLE_PLACES" ? "MAPS" : "SEARCH",
        sourceProvider: providerName,
        sourceId: data.sourceId || null,
        sourceUrl: data.sourceUrl || null,
        status: "NEW",
        lifecycleStage: "STORED",
        hasWebsite,
        hasPhone,
        hasEmail: false,
        verificationStatus: data.verificationStatus || "UNVERIFIED",
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
          description: `Provider: ${providerName} · Website: ${hasWebsite ? "Yes" : "None"} · Phone: ${hasPhone ? "Verified" : "None"}`,
          metadata: {
            provider: providerName,
            city: created.city,
            category: created.category,
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
