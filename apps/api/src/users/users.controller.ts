import { Body, Controller, Delete, Get, Param, Patch, Put, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";
import { isOwnerOrAdmin, publicUser, requireAuth } from "../auth/auth.utils";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get("audit/logs")
  async getAuditLogs() {
    return this.usersService.getAuditLogs();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    const allowed: Record<string, unknown> = {};
    if (typeof dto.name === "string") allowed.name = dto.name;
    if (typeof dto.avatarUrl === "string") allowed.avatarUrl = dto.avatarUrl;
    if (typeof dto.emailVerified === "boolean") allowed.emailVerified = dto.emailVerified;
    return this.usersService.update(id, allowed);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }
}
