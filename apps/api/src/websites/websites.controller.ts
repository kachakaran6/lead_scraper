import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WebsitesService } from "./websites.service";

@Controller("websites")
export class WebsitesController {
  private readonly websitesService: WebsitesService;
  constructor(websitesService?: WebsitesService) {
    this.websitesService = websitesService || new WebsitesService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.websitesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.websitesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.websitesService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.websitesService.update(id, dto);
  }

  @Post(":id/audits")
  async addAudit(@Param("id") id: string, @Body() dto: any) {
    return this.websitesService.addAudit(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.websitesService.remove(id);
  }

  @Get("business/:businessId")
  async findByBusiness(@Param("businessId") businessId: string) {
    return this.websitesService.findByBusiness(businessId);
  }
}
