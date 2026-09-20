import { Module } from "@nestjs/common";
import { DiscoveryController } from "./discovery.controller";
import { DiscoveryService } from "./discovery.service";
import { AutopilotController } from "./autopilot.controller";
import { AutopilotService } from "./autopilot.service";
import { DeduplicationService } from "./deduplication.service";
import { ProviderHealthService } from "./providers/provider-health.service";
import { JobsService } from "../jobs/jobs.service";
import { AIService } from "../ai/ai.service";

@Module({
  controllers: [DiscoveryController, AutopilotController],
  providers: [
    DiscoveryService,
    AutopilotService,
    DeduplicationService,
    ProviderHealthService,
    JobsService,
    AIService,
  ],
  exports: [DiscoveryService, AutopilotService, DeduplicationService, ProviderHealthService],
})
export class DiscoveryModule {}