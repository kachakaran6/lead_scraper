import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";

@Injectable()
export class HealthService {
  async check() {
    let database = "ok";
    let redis = "ok";
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
    } catch {
      database = "down";
    }
    return {
      status: database === "ok" ? "ok" : "degraded",
      database,
      redis,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}