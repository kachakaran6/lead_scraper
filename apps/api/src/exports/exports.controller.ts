import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ExportsService } from "./exports.service";
import { requireAuth } from "../auth/auth.utils";

@Controller("exports")
@UseGuards(AuthGuard("jwt"))
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  async findAll(@Req() req) {
    const user = requireAuth(req);
    return this.exportsService.findAll(user.id);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req) {
    const user = requireAuth(req);
    return this.exportsService.findOne(id, user.id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>, @Req() req) {
    const user = requireAuth(req);
    return this.exportsService.create({ ...dto, userId: user.id });
  }
}
