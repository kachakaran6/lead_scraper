import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WebhooksService } from "./webhooks.service";
import { requireAuth } from "../auth/auth.utils";

@Controller("webhooks")
@UseGuards(AuthGuard("jwt"))
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async findAll() {
    return this.webhooksService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.webhooksService.findOne(id);
  }

  @Post()
  async create(@Body() dto: any) {
    return this.webhooksService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: any) {
    return this.webhooksService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.webhooksService.remove(id);
  }
}
