import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WebhooksService } from "./webhooks.service";
import { requireAuth } from "../auth/auth.utils";

@Controller("webhooks")
@UseGuards(AuthGuard("jwt"))
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async findAll(@Req() req) {
    const user = requireAuth(req);
    return this.webhooksService.findAll(user.id);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req) {
    const user = requireAuth(req);
    return this.webhooksService.findOne(id, user.id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>, @Req() req) {
    const user = requireAuth(req);
    return this.webhooksService.create({ ...dto, userId: user.id });
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>, @Req() req) {
    const user = requireAuth(req);
    return this.webhooksService.update(id, user.id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req) {
    const user = requireAuth(req);
    return this.webhooksService.remove(id, user.id);
  }
}
