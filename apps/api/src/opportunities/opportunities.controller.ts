import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { OpportunitiesService } from "./opportunities.service";

@Controller("opportunities")
export class OpportunitiesController {
  private readonly opportunitiesService: OpportunitiesService;
  constructor(opportunitiesService?: OpportunitiesService) {
    this.opportunitiesService = opportunitiesService || new OpportunitiesService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.opportunitiesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.opportunitiesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.opportunitiesService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.opportunitiesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.opportunitiesService.remove(id);
  }

  @Get("business/:businessId")
  async findByBusiness(@Param("businessId") businessId: string) {
    return this.opportunitiesService.findByBusiness(businessId);
  }
}
