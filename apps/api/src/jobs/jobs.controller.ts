import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { ScraperAccessGuard } from "../auth/scraper-access.guard";

@Controller("jobs")
@UseGuards(ScraperAccessGuard)
export class JobsController {
  private readonly jobsService: JobsService;
  constructor(jobsService?: JobsService) {
    this.jobsService = jobsService || new JobsService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.jobsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.jobsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.jobsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.jobsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.jobsService.remove(id);
  }

  @Get("stats/summary")
  async stats() {
    return this.jobsService.stats();
  }
}
