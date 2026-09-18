import { WorkerJobData, BaseWorker } from "../base-worker";
import { prisma } from "@ultimate-leads/database";
import { Job, Worker } from "bullmq";
import { SearxngProvider } from "../discovery/searxng.provider";
import { DiscoveryResult } from "../discovery/types";

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
    console.log(`[${this.workerName}] Discovery worker started`);
    return worker;
  }

  private async processDiscovery(data: WorkerJobData, jobId: string): Promise<Record<string, unknown>> {
    const { query, location, limit = 1000 } = data;

    // Execute discovery providers
    let results: DiscoveryResult[] = [];
    try {
      const provider = new SearxngProvider();
      results = await provider.discover({
        query: String(query || ""),
        location: location ? String(location) : undefined,
        limit: Number(limit) || 1000,
      });
    } catch (error) {
      console.warn(`Discovery provider failed for "${query}":`, error);
      results = [];
    }

    // Normalize and persist results
    let discovered = 0;
    let duplicates = 0;
    for (const result of results) {
      const name = result.name?.trim();
      if (!name) continue;

      const existing = await prisma.business.findFirst({
        where: {
          name: { equals: name, mode: "insensitive" },
          ...(location && {
            OR: [
              { city: { contains: location.split(",")[0], mode: "insensitive" } },
              { state: { contains: location.split(",")[1], mode: "insensitive" } },
            ],
          }),
        },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      await prisma.business.create({
        data: {
          name,
          category: result.category,
          address: result.address,
          city: result.city,
          state: result.state,
          country: result.country,
          source: "SEARCH",
          sourceUrl: result.sourceUrl,
          websites: result.website
            ? { create: { url: result.website } }
            : undefined,
        },
      });
      discovered++;
    }

    return {
      query,
      location,
      discovered,
      duplicates,
      message: `Discovery complete: ${discovered} new, ${duplicates} duplicates`,
    };
  }
}
