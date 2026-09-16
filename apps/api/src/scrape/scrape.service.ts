import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";
import { JobsService } from "../jobs/jobs.service";

interface ScrapeParams {
  url: string;
  extract?: {
    emails?: boolean;
    phones?: boolean;
    socials?: boolean;
    contactForm?: boolean;
    address?: boolean;
    name?: boolean;
  };
  businessId?: string;
}

@Injectable()
export class ScrapeService {
  constructor(private readonly jobsService: JobsService) {}

  async scrape(params: ScrapeParams) {
    const job = await this.jobsService.create({
      type: "CRAWL_WEBSITE",
      status: "PENDING",
      businessId: params.businessId,
      progress: 0,
      result: { url: params.url, extract: params.extract },
    });

    return {
      jobId: job.id,
      status: "queued",
      message: "Crawl job queued. Poll /jobs/:id for status.",
    };
  }
}