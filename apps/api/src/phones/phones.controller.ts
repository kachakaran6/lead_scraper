import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { PhonesService } from "./phones.service";

@Controller("phones")
export class PhonesController {
  private readonly phonesService: PhonesService;
  constructor(phonesService?: PhonesService) {
    this.phonesService = phonesService || new PhonesService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.phonesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.phonesService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    return this.phonesService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.phonesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.phonesService.remove(id);
  }

  @Get("business/:businessId")
  async findByBusiness(@Param("businessId") businessId: string) {
    return this.phonesService.findByBusiness(businessId);
  }
}
