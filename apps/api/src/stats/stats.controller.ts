import { Controller, Get } from "@nestjs/common";
import { StatsService } from "./stats.service";

@Controller("stats")
export class StatsController {
  private readonly statsService: StatsService;
  constructor(statsService?: StatsService) {
    this.statsService = statsService || new StatsService();
  }

  @Get()
  async getStats() {
    return this.statsService.getDashboard();
  }

  @Get("dashboard")
  async dashboard() {
    return this.statsService.getDashboard();
  }

  @Get("sales")
  async sales() {
    return this.statsService.getSalesAnalytics();
  }
}