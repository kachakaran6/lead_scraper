import { Body, Controller, Post, Get, Query } from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";

@Controller(["discovery", "discover"])
export class DiscoveryController {
  private readonly discoveryService: DiscoveryService;
  constructor(discoveryService?: DiscoveryService) {
    this.discoveryService = discoveryService || new DiscoveryService();
  }

  @Post()
  async discover(@Body() dto: Record<string, unknown>) {
    return this.discoveryService.discover(dto as any);
  }

  @Post("search")
  async search(@Body() dto: Record<string, unknown>) {
    return this.discoveryService.search(dto as any);
  }

  @Get("search")
  async searchGet(@Query() query: Record<string, unknown>) {
    return this.discoveryService.search(query as any);
  }
}