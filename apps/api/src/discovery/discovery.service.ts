import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";
import { JobsService } from "../jobs/jobs.service";

interface DiscoveryParams {
  query: string;
  location?: string;
  radiusKm?: number;
  limit?: number;
  source?: "MAPS" | "SEARCH" | "DIRECTORY";
  campaignId?: string;
}

@Injectable()
export class DiscoveryService {
  constructor(private readonly jobsService: JobsService) {}

  async discover(params: DiscoveryParams) {
    const { query, location, radiusKm, limit = 1000, source = "SEARCH", campaignId } = params;

    const job = await this.jobsService.create({
      type: "DISCOVER_BUSINESSES",
      status: "PENDING",
      campaignId,
      progress: 0,
      result: { query, location, radiusKm, limit, source },
    });

    return {
      jobId: job.id,
      status: "queued",
      message: "Discovery job queued. Poll /jobs/:id for status.",
    };
  }

  async search(params: DiscoveryParams) {
    const { query, location, limit = 50 } = params;

    // Search existing businesses first
    const existing = await prisma.business.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        ...(location && {
          OR: [
            { city: { contains: location, mode: "insensitive" } },
            { state: { contains: location, mode: "insensitive" } },
            { country: { contains: location, mode: "insensitive" } },
          ],
        }),
      },
      take: Math.min(limit, 200),
      include: {
        websites: { take: 1 },
        phones: { take: 1 },
        emails: { take: 1 },
        opportunities: { take: 5 },
        leadScore: { select: { total: true } },
      },
    });

    return { items: existing, meta: { total: existing.length, page: 1, limit } };
  }
}