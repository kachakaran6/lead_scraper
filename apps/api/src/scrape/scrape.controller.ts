import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ScrapeService } from "./scrape.service";

@Controller("scrape")
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Post()
  async scrape(@Body() dto: Record<string, unknown>) {
    return this.scrapeService.scrape(dto as any);
  }
}