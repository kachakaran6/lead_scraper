import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { getEnv } from "@ultimate-leads/config";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { BusinessesModule } from "./businesses/businesses.module";
import { ContactsModule } from "./contacts/contacts.module";
import { EmailsModule } from "./emails/emails.module";
import { PhonesModule } from "./phones/phones.module";
import { SocialsModule } from "./socials/socials.module";
import { WebsitesModule } from "./websites/websites.module";
import { OpportunitiesModule } from "./opportunities/opportunities.module";
import { ScoringModule } from "./scoring/scoring.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { JobsModule } from "./jobs/jobs.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { ExportsModule } from "./exports/exports.module";
import { ApiKeysModule } from "./api-keys/api-keys.module";
import { HealthModule } from "./health/health.module";
import { StatsModule } from "./stats/stats.module";
import { DiscoveryModule } from "./discovery/discovery.module";
import { ScrapeModule } from "./scrape/scrape.module";
import { DealsModule } from "./deals/deals.module";
import { NotesModule } from "./notes/notes.module";
import { ActivitiesModule } from "./activities/activities.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: () => {
        try {
          const parsed = new URL(getEnv().REDIS_URL || "redis://localhost:6379");
          return {
            connection: {
              host: parsed.hostname || "127.0.0.1",
              port: parseInt(parsed.port || "6379", 10),
              maxRetriesPerRequest: null,
            },
          };
        } catch {
          return {
            connection: {
              host: "127.0.0.1",
              port: 6379,
              maxRetriesPerRequest: null,
            },
          };
        }
      },
    }),
    BullModule.registerQueue({
      name: "discovery",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
    BullModule.registerQueue({
      name: "crawler",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
    BullModule.registerQueue({
      name: "enrichment",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
    BullModule.registerQueue({
      name: "analysis",
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      },
    }),
    AuthModule,
    UsersModule,
    BusinessesModule,
    ContactsModule,
    EmailsModule,
    PhonesModule,
    SocialsModule,
    WebsitesModule,
    OpportunitiesModule,
    ScoringModule,
    CampaignsModule,
    JobsModule,
    WebhooksModule,
    ExportsModule,
    ApiKeysModule,
    HealthModule,
    StatsModule,
    DiscoveryModule,
    ScrapeModule,
    DealsModule,
    NotesModule,
    ActivitiesModule,
  ],
})
export class AppModule {}
