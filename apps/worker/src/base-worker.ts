import { Worker, Queue, Job } from "bullmq";
import { prisma } from "@ultimate-leads/database";
import { getEnv } from "@ultimate-leads/config";
import { JobType, JobStatus } from "@ultimate-leads/shared";

export interface WorkerJobData {
  businessId?: string;
  campaignId?: string;
  url?: string;
  query?: string;
  location?: string;
  [key: string]: unknown;
}

export abstract class BaseWorker {
  protected readonly queueName: string;
  protected readonly workerName: string;

  constructor(queueName: string, workerName: string) {
    this.queueName = queueName;
    this.workerName = workerName;
  }

  protected get redisConnection() {
    return {
      host: "127.0.0.1",
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }

  protected getQueue(): Queue {
    return new Queue(this.queueName, {
      connection: this.redisConnection,
    });
  }

  protected getWorker(processor: (job: Job<WorkerJobData>) => Promise<unknown>): Worker {
    return new Worker(
      this.queueName,
      processor,
      {
        connection: this.redisConnection,
        concurrency: 2,
      },
    );
  }

  protected async markStarted(jobId: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "ACTIVE", startedAt: new Date(), attempts: { increment: 1 } },
    });
  }

  protected async markProgress(jobId: string, progress: number) {
    await prisma.job.update({ where: { id: jobId }, data: { progress } });
  }

  protected async markCompleted(jobId: string, result: unknown) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: new Date(), progress: 100, result: result as any },
    });
  }

  protected async markFailed(jobId: string, error: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "FAILED", completedAt: new Date(), error },
    });
  }

  protected registerEvents(worker: Worker) {
    worker.on("completed", (job, result) => {
      console.log(`[${this.workerName}] Job ${job.id} completed:`, result);
    });
    worker.on("failed", (job, error) => {
      console.error(`[${this.workerName}] Job ${job?.id} failed:`, error);
    });
    worker.on("error", (error) => {
      console.error(`[${this.workerName}] Worker error:`, error);
    });
  }
}

export async function runWorkers(): Promise<Worker[]> {
  const workers: Worker[] = [];
  return workers;
}
