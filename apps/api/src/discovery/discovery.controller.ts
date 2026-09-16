import { Body, Controller, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DiscoveryService } from "./discovery.service";

@Controller("discover")
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
}