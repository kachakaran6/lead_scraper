import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiKeysService } from "./api-keys.service";
import { requireAuth } from "../auth/auth.utils";

@Controller("api-keys")
@UseGuards(AuthGuard("jwt"))
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async findAll(@Req() req) {
    const user = requireAuth(req);
    return this.apiKeysService.findAll(user.id);
  }

  @Post()
  async create(@Body() dto: { name: string; permissions?: string[] }, @Req() req) {
    const user = requireAuth(req);
    return this.apiKeysService.create(user.id, dto.name, dto.permissions ?? []);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Req() req) {
    const user = requireAuth(req);
    return this.apiKeysService.remove(id, user.id);
  }
}
