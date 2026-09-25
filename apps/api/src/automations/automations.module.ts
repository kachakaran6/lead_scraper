import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AutomationsService } from "./automations.service";
import { AutomationsController } from "./automations.controller";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "automation",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
  ],
  controllers: [AutomationsController],
  providers: [AutomationsService],
  exports: [AutomationsService],
})
export class AutomationsModule {}
