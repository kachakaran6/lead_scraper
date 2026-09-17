import { Body, Controller, Post, Get, Query, UseGuards } from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";
import { RolesGuard, RequireAction } from "../auth/roles.guard";

@Controller(["discovery", "discover"])
@UseGuards(RolesGuard)
export class DiscoveryController {
  private readonly discoveryService: DiscoveryService;
  constructor(discoveryService?: DiscoveryService) {
    this.discoveryService = discoveryService || new DiscoveryService();
  }

  @Post()
  @RequireAction("DISCOVERY_RUN")
  async discover(@Body() dto: Record<string, unknown>) {
    return this.discoveryService.discover(dto as any);
  }

  @Post("search")
  @RequireAction("DISCOVERY_RUN")
  async search(@Body() dto: Record<string, unknown>) {
    return this.discoveryService.search(dto as any);
  }

  @Get("search")
  @RequireAction("DISCOVERY_RUN")
  async searchGet(@Query() query: Record<string, unknown>) {
    return this.discoveryService.search(query as any);
  }
}