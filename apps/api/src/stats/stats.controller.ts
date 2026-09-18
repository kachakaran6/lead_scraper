import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { StatsService } from "./stats.service";

@Controller("stats")
@UseGuards(AuthGuard("jwt"))
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