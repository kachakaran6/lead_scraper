import { Body, Controller, Post, Get, Query, Req } from "@nestjs/common";
import { DiscoveryService } from "./discovery.service";

@Controller(["discovery", "discover"])
export class DiscoveryController {
  private readonly discoveryService: DiscoveryService;
  constructor(discoveryService?: DiscoveryService) {
    this.discoveryService = discoveryService || new DiscoveryService();
  }

  @Post()
  async discover(@Body() dto: Record<string, unknown>, @Req() req: any) {
    return this.discoveryService.discover({ ...dto, userId: req.user?.id } as any);
  }

  @Post("search")
  async search(@Body() dto: Record<string, unknown>, @Req() req: any) {
    return this.discoveryService.search({ ...dto, userId: req.user?.id } as any);
  }

  @Get("status")
  async getStatus() {
    return {
      googlePlaces: {
        configured: Boolean(process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY),
        provider: "Google Places API (Official Text Search)",
        status: (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY) ? "CONFIGURED" : "NOT_CONFIGURED",
        maskedKey: (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY) ? "AIza••••••••••••" : null,
      },
      openStreetMap: {
        configured: true,
        provider: "OpenStreetMap Overpass API",
        status: "ACTIVE",
        maskedKey: "N/A (Open Public Data)",
      },
      searxng: {
        configured: true,
        provider: "SearXNG Metasearch (Google/Bing/DuckDuckGo Keyless)",
        status: "ACTIVE",
        maskedKey: "N/A (Self-Hosted Internal Engine)",
      },
    };
  }

  @Get("search")
  async searchGet(@Query() query: Record<string, unknown>, @Req() req: any) {
    return this.discoveryService.search({ ...query, userId: req.user?.id } as any);
  }
}