import { WorkerJobData, BaseWorker } from "../base-worker";
import { Job, Worker } from "bullmq";

export class EnrichmentWorker extends BaseWorker {
  constructor() {
    super("enrichment", "enrichment");
  }

  async start(): Promise<Worker> {
    const worker = this.getWorker(async (job: Job<WorkerJobData>) => {
      await this.markStarted(job.id!);
      await this.markProgress(job.id!, 10);

      // Placeholder: enrichment pipeline
      // 1. Find website for business
      // 2. Queue crawl job
      // 3. Queue audit job
      // 4. Queue scoring job

      await this.markProgress(job.id!, 80);
      const result = { enriched: true, businessId: job.data.businessId };
      await this.markCompleted(job.id!, result);
      return result;
    });

    this.registerEvents(worker);
    console.log(`[${this.workerName}] Enrichment worker started`);
    return worker;
  }
}
