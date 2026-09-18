import { Module } from "@nestjs/common";
import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";
import { JobsService } from "../jobs/jobs.service";

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService, JobsService],
})
export class DiscoveryModule {}