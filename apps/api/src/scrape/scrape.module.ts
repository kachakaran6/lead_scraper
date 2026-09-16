import { Module } from "@nestjs/common";
import { ScrapeController } from "./scrape.controller";
import { ScrapeService } from "./scrape.service";
import { JobsService } from "../jobs/jobs.service";

@Module({
  controllers: [ScrapeController],
  providers: [ScrapeService, JobsService],
})
export class ScrapeModule {}