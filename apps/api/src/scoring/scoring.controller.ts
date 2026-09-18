import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ScoringService } from "./scoring.service";
import { RolesGuard, RequireAction } from "../auth/roles.guard";

@Controller("scoring")
@UseGuards(RolesGuard)
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
  @RequireAction("SCORING_RULES_EDIT")
  async createRule(@Body() dto: any) {
    return this.scoringService.createRule(dto);
  }

  @Patch("rules/:id")
  @RequireAction("SCORING_RULES_EDIT")
  async updateRule(@Param("id") id: string, @Body() dto: any) {
    return this.scoringService.updateRule(id, dto);
  }

  @Delete("rules/:id")
  @RequireAction("SCORING_RULES_EDIT")
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
