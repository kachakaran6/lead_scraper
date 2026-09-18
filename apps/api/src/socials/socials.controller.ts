import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SocialsService } from "./socials.service";

@Controller("socials")
export class SocialsController {
  private readonly socialsService: SocialsService;
  constructor(socialsService?: SocialsService) {
    this.socialsService = socialsService || new SocialsService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.socialsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.socialsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.socialsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.socialsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.socialsService.remove(id);
  }

  @Get("business/:businessId")
  async findByBusiness(@Param("businessId") businessId: string) {
    return this.socialsService.findByBusiness(businessId);
  }
}
