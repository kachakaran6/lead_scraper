import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ScoringService } from "./scoring.service";

@Controller("scoring")
export class ScoringController {
  private readonly scoringService: ScoringService;
  constructor(scoringService?: ScoringService) {
    this.scoringService = scoringService || new ScoringService();
  }

  @Get("rules")
  async findRules() {
    return this.scoringService.findRules();
  }

  @Post("rules")
  async createRule(@Body() dto: Record<string, unknown>) {
    return this.scoringService.createRule(dto);
  }

  @Patch("rules/:id")
  async updateRule(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.scoringService.updateRule(id, dto);
  }

  @Delete("rules/:id")
  async removeRule(@Param("id") id: string) {
    return this.scoringService.removeRule(id);
  }

  @Post("calculate/:businessId")
  async calculate(@Param("businessId") businessId: string) {
    return this.scoringService.calculate(businessId);
  }

  @Post("calculate-all")
  async calculateAll() {
    const count = await this.scoringService.calculateAll();
    return { calculated: count };
  }
}
