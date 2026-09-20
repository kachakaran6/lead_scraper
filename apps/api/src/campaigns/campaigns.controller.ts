import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { CampaignsService } from "./campaigns.service";
import { ScraperAccessGuard } from "../auth/scraper-access.guard";

@Controller("campaigns")
@UseGuards(ScraperAccessGuard)
export class CampaignsController {
  private readonly campaignsService: CampaignsService;
  constructor(campaignsService?: CampaignsService) {
    this.campaignsService = campaignsService || new CampaignsService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.campaignsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    return this.campaignsService.create(dto as any);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.campaignsService.update(id, dto as any);
  }

  @Post(":id/start")
  async start(@Param("id") id: string) {
    return this.campaignsService.start(id);
  }

  @Post(":id/pause")
  async pause(@Param("id") id: string) {
    return this.campaignsService.pause(id);
  }

  @Post(":id/complete")
  async complete(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.campaignsService.complete(id, dto as any);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.campaignsService.remove(id);
  }
}
