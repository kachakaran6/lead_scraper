import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CampaignsService } from "./campaigns.service";

@Controller("campaigns")
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
    return this.campaignsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.campaignsService.update(id, dto);
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
    return this.campaignsService.complete(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.campaignsService.remove(id);
  }
}
