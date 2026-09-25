import { getEnv } from "@ultimate-leads/config";
import { DiscoveryWorker } from "./workers/discovery.worker";
import { CrawlWorker } from "./workers/crawl.worker";
import { EnrichmentWorker } from "./workers/enrichment.worker";
import { AnalysisWorker } from "./workers/analysis.worker";
import { AutomationWorker } from "./workers/automation.worker";
import { Worker } from "bullmq";

async function main() {
  console.log("Starting Ultimate Lead Engine workers...");
  console.log(`Redis: ${getEnv().REDIS_URL}`);

  const workers: Worker[] = [];

  workers.push(await new DiscoveryWorker().start());
  workers.push(await new CrawlWorker().start());
  workers.push(await new EnrichmentWorker().start());
  workers.push(await new AnalysisWorker().start());
  workers.push(await new AutomationWorker().start());

  console.log(`All ${workers.length} workers started`);

  const shutdown = async () => {
    console.log("Shutting down workers...");
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Worker startup failed:", error);
  process.exit(1);
});
