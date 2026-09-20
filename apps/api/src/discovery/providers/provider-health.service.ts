import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";

@Injectable()
export class ProviderHealthService {
  /**
   * Checks if provider is healthy and not in cooldown
   */
  async canQuery(provider: string): Promise<boolean> {
    try {
      const health = await prisma.providerHealth.findUnique({
        where: { provider },
      });

      if (!health) return true; // Default healthy if no record yet

      if (health.status === "COOLDOWN" && health.cooldownUntil) {
        if (new Date() < health.cooldownUntil) {
          return false;
        }
        // Cooldown expired, restore to ACTIVE
        await prisma.providerHealth.update({
          where: { provider },
          data: { status: "ACTIVE", consecutiveFailures: 0, cooldownUntil: null },
        });
        return true;
      }

      return health.status !== "ERROR";
    } catch {
      return true;
    }
  }

  /**
   * Records a successful query
   */
  async recordSuccess(provider: string, latencyMs: number) {
    try {
      const health = await prisma.providerHealth.findUnique({ where: { provider } });
      const currentRequests = (health?.requestsTotal || 0) + 1;
      const currentSuccess = (health?.successTotal || 0) + 1;
      const prevLatency = health?.avgLatencyMs || latencyMs;
      const newAvgLatency = Math.round((prevLatency * 0.8) + (latencyMs * 0.2));

      await prisma.providerHealth.upsert({
        where: { provider },
        create: {
          provider,
          status: "ACTIVE",
          requestsTotal: 1,
          successTotal: 1,
          failureTotal: 0,
          consecutiveFailures: 0,
          lastRequestAt: new Date(),
          avgLatencyMs: latencyMs,
        },
        update: {
          status: "ACTIVE",
          requestsTotal: currentRequests,
          successTotal: currentSuccess,
          consecutiveFailures: 0,
          lastRequestAt: new Date(),
          avgLatencyMs: newAvgLatency,
          cooldownUntil: null,
        },
      });
    } catch (err: any) {
      console.warn(`Failed to record provider success for ${provider}:`, err.message);
    }
  }

  /**
   * Records a failure and applies backoff cooldown if needed
   */
  async recordFailure(provider: string, errorMessage: string) {
    try {
      const health = await prisma.providerHealth.findUnique({ where: { provider } });
      const currentFailures = (health?.failureTotal || 0) + 1;
      const consecutive = (health?.consecutiveFailures || 0) + 1;
      const currentRequests = (health?.requestsTotal || 0) + 1;

      // If 3 consecutive failures, put provider in a 5-minute cooldown
      let status = health?.status || "ACTIVE";
      let cooldownUntil: Date | null = null;

      if (consecutive >= 3) {
        status = "COOLDOWN";
        const cooldownMinutes = Math.min(consecutive * 2, 30);
        cooldownUntil = new Date(Date.now() + cooldownMinutes * 60 * 1000);
      } else if (consecutive > 1) {
        status = "DEGRADED";
      }

      await prisma.providerHealth.upsert({
        where: { provider },
        create: {
          provider,
          status: status as any,
          requestsTotal: 1,
          successTotal: 0,
          failureTotal: 1,
          consecutiveFailures: 1,
          lastRequestAt: new Date(),
          lastErrorMessage: errorMessage.slice(0, 255),
          cooldownUntil,
        },
        update: {
          status: status as any,
          requestsTotal: currentRequests,
          failureTotal: currentFailures,
          consecutiveFailures: consecutive,
          lastRequestAt: new Date(),
          lastErrorMessage: errorMessage.slice(0, 255),
          cooldownUntil,
        },
      });
    } catch (err: any) {
      console.warn(`Failed to record provider failure for ${provider}:`, err.message);
    }
  }

  /**
   * Returns health overview for all providers
   */
  async getAllHealth() {
    return prisma.providerHealth.findMany({
      orderBy: { provider: "asc" },
    });
  }
}
