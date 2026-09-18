import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ActivitiesService } from "./activities.service";
import { requireAuth } from "../auth/auth.utils";

@Controller("activities")
@UseGuards(AuthGuard("jwt"))
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(@Body() dto: Record<string, unknown>, @Req() req) {
    const user = requireAuth(req);
    return this.activitiesService.create({ ...dto, userId: user.id } as any);
  }

  @Get("business/:businessId")
  async findAll(@Param("businessId") businessId: string) {
    return this.activitiesService.findAll(businessId);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.activitiesService.remove(id);
  }
}