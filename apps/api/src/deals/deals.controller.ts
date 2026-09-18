import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { DealsService } from "./deals.service";

@Controller("deals")
export class DealsController {
  private readonly dealsService: DealsService;
  constructor(dealsService?: DealsService) {
    this.dealsService = dealsService || new DealsService();
  }

  @Get()
  async findAll() {
    return this.dealsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    return this.dealsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.dealsService.update(id, dto);
  }

  @Post(":id/move/:stageId")
  async moveStage(@Param("id") id: string, @Param("stageId") stageId: string) {
    return this.dealsService.moveStage(id, stageId);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.dealsService.remove(id);
  }
}