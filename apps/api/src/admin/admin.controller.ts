import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminGuard } from "../auth/admin.guard";
import { UserRole } from "@ultimate-leads/database";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  async getStats() {
    return this.adminService.getStats();
  }

  @Get("users")
  async getUsers(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("status") accountStatus?: string,
    @Query("scraperAccess") scraperAccess?: string,
    @Query("role") role?: string
  ) {
    return this.adminService.getUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      accountStatus,
      scraperAccess,
      role,
    });
  }

  @Get("users/:id")
  async getUserById(@Param("id") id: string) {
    return this.adminService.getUserById(id);
  }

  @Post("users/:id/approve")
  async approveUser(@Param("id") id: string, @Req() req: any) {
    return this.adminService.approveUser(
      id,
      req.user,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Post("users/:id/enable")
  async enableUser(@Param("id") id: string, @Req() req: any) {
    return this.adminService.enableUser(
      id,
      req.user,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Post("users/:id/disable")
  async disableUser(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Req() req: any
  ) {
    return this.adminService.disableUser(
      id,
      req.user,
      reason,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Post("users/:id/suspend")
  async suspendUser(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Req() req: any
  ) {
    return this.adminService.suspendUser(
      id,
      req.user,
      reason,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Post("users/:id/grant-access")
  async grantScraperAccess(@Param("id") id: string, @Req() req: any) {
    return this.adminService.grantScraperAccess(
      id,
      req.user,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Post("users/:id/revoke-access")
  async revokeScraperAccess(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Req() req: any
  ) {
    return this.adminService.revokeScraperAccess(
      id,
      req.user,
      reason,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Patch("users/:id/role")
  async changeRole(
    @Param("id") id: string,
    @Body("role") role: UserRole,
    @Req() req: any
  ) {
    return this.adminService.changeRole(
      id,
      role,
      req.user,
      req.ip,
      req.headers?.["user-agent"]
    );
  }

  @Get("audit-logs")
  async getAuditLogs(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("action") action?: string,
    @Query("userId") userId?: string
  ) {
    return this.adminService.getAuditLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 30,
      action,
      userId,
    });
  }

  @Post("bootstrap")
  async bootstrapAdmin(@Body("email") email: string, @Req() req: any) {
    // Only owner can invoke bootstrap once an owner exists
    if (req.user?.role !== "OWNER") {
      throw new ForbiddenException("Only the system Owner can run bootstrap promotions.");
    }
    return this.adminService.bootstrapAdmin(email);
  }
}
