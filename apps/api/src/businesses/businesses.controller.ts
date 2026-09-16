import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { BusinessesService } from "./businesses.service";

@Controller("businesses")
export class BusinessesController {
  private readonly businessesService: BusinessesService;
  constructor(businessesService?: BusinessesService) {
    this.businessesService = businessesService || new BusinessesService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.businessesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.businessesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    return this.businessesService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.businessesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.businessesService.remove(id);
  }

  @Post(":id/tags/:tag")
  async addTag(@Param("id") id: string, @Param("tag") tag: string) {
    return this.businessesService.addTag(id, tag);
  }

  @Delete(":id/tags/:tag")
  async removeTag(@Param("id") id: string, @Param("tag") tag: string) {
    return this.businessesService.removeTag(id, tag);
  }

  @Get("tags/list")
  async listTags() {
    return this.businessesService.listTags();
  }

  @Get("stats/dashboard")
  async stats() {
    return this.businessesService.stats();
  }
}
