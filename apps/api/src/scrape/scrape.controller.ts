import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ScrapeService } from "./scrape.service";
import { ScraperAccessGuard } from "../auth/scraper-access.guard";

@Controller("scrape")
@UseGuards(ScraperAccessGuard)
export class ScrapeController {
  constructor(private readonly scrapeService: ScrapeService) {}

  @Post()
  async scrape(@Body() dto: Record<string, unknown>) {
    return this.scrapeService.scrape(dto as any);
  }
}