import { WorkerJobData, BaseWorker } from "../base-worker";
import { prisma } from "@ultimate-leads/database";
import { Job, Worker } from "bullmq";
import { SearxngProvider } from "../discovery/searxng.provider";
import { DiscoveryResult } from "../discovery/types";
import crypto from "crypto";

export class DiscoveryWorker extends BaseWorker {
  constructor() {
    super("discovery", "discovery");
  }

  async start(): Promise<Worker> {
    const worker = this.getWorker(async (job: Job<WorkerJobData>) => {
      await this.markStarted(job.id!);
      await this.markProgress(job.id!, 10);

      const result = await this.processDiscovery(job.data, job.id!);

      await this.markCompleted(job.id!, result);
      return result;
    });

    this.registerEvents(worker);
    console.log(`[${this.workerName}] Autonomous discovery worker pool started`);
    return worker;
  }

  private async processDiscovery(data: WorkerJobData, jobId: string): Promise<Record<string, unknown>> {
    const { query, location, limit = 50, cellId, profileId } = data as any;

    // Execute discovery provider
    let results: DiscoveryResult[] = [];
    try {
      const provider = new SearxngProvider();
      results = await provider.discover({
        query: String(query || "Dentist"),
        location: location ? String(location) : undefined,
        limit: Number(limit) || 50,
      });
    } catch (error: any) {
      console.warn(`[DiscoveryWorker] Provider query failed for "${query}":`, error.message);
      results = [];
    }

    let discovered = 0;
    let duplicates = 0;

    for (const result of results) {
      const rawName = result.name?.trim();
      if (!rawName) continue;

      const canonicalName = rawName.replace(/\s+/g, " ");
      const normalizedName = canonicalName.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
      const city = result.city || (location ? location.split(",")[0]?.trim() : null);
      const state = result.state || (location ? location.split(",")[1]?.trim() : null);
      const country = result.country || (location ? location.split(",")[2]?.trim() : null);

      const digits = (result.phone || "").replace(/\D/g, "");
      const phoneHash = digits.length >= 6 ? crypto.createHash("md5").update(digits).digest("hex") : null;

      let websiteDomain: string | null = null;
      let domainHash: string | null = null;
      if (result.website && result.website.length > 3) {
        try {
          const u = new URL(result.website.startsWith("http") ? result.website : `https://${result.website}`);
          websiteDomain = u.hostname.toLowerCase().replace(/^www\./, "");
          domainHash = crypto.createHash("md5").update(websiteDomain).digest("hex");
        } catch {
          websiteDomain = result.website;
        }
      }

      const geoNameKey = `${normalizedName}|${(city || "").toLowerCase()}|${(country || "").toLowerCase()}`;
      const geoNameHash = crypto.createHash("md5").update(geoNameKey).digest("hex");

      // Multi-signal deduplication check
      let existing: any = null;

      if (phoneHash) {
        existing = await prisma.business.findFirst({ where: { phoneHash } });
      }
      if (!existing && domainHash) {
        existing = await prisma.business.findFirst({ where: { domainHash } });
      }
      if (!existing && city) {
        existing = await prisma.business.findFirst({ where: { geoNameHash } });
      }

      if (existing) {
        duplicates++;
        await prisma.business.update({
          where: { id: existing.id },
          data: {
            lastSeen: new Date(),
            address: existing.address || result.address,
            phone: existing.phone || result.phone,
            website: existing.website || result.website,
          },
        });
        continue;
      }

      const hasWebsite = Boolean(websiteDomain);
      const hasPhone = Boolean(digits.length >= 6);
      const leadScore = (!hasWebsite ? 35 : 10) + (hasPhone ? 25 : 0) + 20 + (city ? 10 : 0);

      const created = await prisma.business.create({
        data: {
          name: canonicalName,
          canonicalName,
          normalizedName,
          normalizedPhone: result.phone || null,
          phoneHash,
          websiteDomain,
          domainHash,
          geoNameHash,
          category: result.category,
          address: result.address,
          city,
          state,
          country,
          phone: result.phone || null,
          website: result.website || null,
          source: "SEARCH",
          sourceProvider: "SEARXNG",
          sourceUrl: result.sourceUrl,
          status: "NEW",
          lifecycleStage: leadScore >= 70 ? "SCORED" : "STORED",
          leadScore,
          opportunityScore: !hasWebsite ? 85 : 50,
          hasWebsite,
          hasPhone,
          firstSeen: new Date(),
          lastSeen: new Date(),
          ...(hasWebsite && result.website
            ? {
                websites: {
                  create: {
                    url: result.website,
                    status: "WEBSITE_FOUND",
                  },
                },
              }
            : {}),
        },
      });

      discovered++;

      if (profileId) {
        await prisma.leadEvent.create({
          data: {
            businessId: created.id,
            profileId,
            type: "DISCOVERED",
            title: `Harvested "${created.name}" in ${created.city || "Territory"}`,
            description: `Source: SearXNG · Missing Website: ${!hasWebsite ? "Yes" : "No"} · Lead Score: ${leadScore}`,
          },
        });
      }
    }

    // Checkpoint cell if specified
    if (cellId) {
      await prisma.discoveryCell.updateMany({
        where: { geoCellId: cellId },
        data: {
          status: "COMPLETED",
          leadYield: discovered,
          lastScannedAt: new Date(),
        },
      });
    }

    return {
      query,
      location,
      cellId,
      discovered,
      duplicates,
      message: `Discovery complete: ${discovered} unique leads, ${duplicates} duplicates prevented`,
    };
  }
}
