import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AutopilotService } from "./autopilot.service";
import { expandNicheQuery } from "@ultimate-leads/shared";
import { prisma } from "@ultimate-leads/database";

@Controller("autopilot")
export class AutopilotController {
  constructor(private readonly autopilotService: AutopilotService) {}

  @Post("profiles")
  async createProfile(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || (await this.getDefaultUserId());
    return this.autopilotService.createProfile(userId, body);
  }

  @Get("profiles")
  async listProfiles(@Req() req: any) {
    const userId = req.user?.id || (await this.getDefaultUserId());
    return prisma.discoveryProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { regions: true, queryLogs: true },
        },
      },
    });
  }

  @Get("profiles/:id")
  async getProfile(@Param("id") id: string) {
    return prisma.discoveryProfile.findUnique({
      where: { id },
      include: {
        regions: { take: 10, include: { cells: { take: 5 } } },
        queryLogs: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });
  }

  @Patch("profiles/:id")
  async updateProfile(@Param("id") id: string, @Body() body: any) {
    return prisma.discoveryProfile.update({
      where: { id },
      data: body,
    });
  }

  @Post("profiles/:id/toggle")
  async toggleProfile(@Param("id") id: string) {
    const profile = await prisma.discoveryProfile.findUnique({ where: { id } });
    if (!profile) return { error: "Profile not found" };

    const nextStatus = profile.status === "RUNNING" ? "PAUSED" : "RUNNING";
    return prisma.discoveryProfile.update({
      where: { id },
      data: { status: nextStatus },
    });
  }

  @Post("trigger")
  async triggerCycle(@Body() body: { profileId?: string }) {
    return this.autopilotService.runAutopilotCycle(body.profileId);
  }

  @Get("status")
  async getStatus(@Req() req: any) {
    const userId = req.user?.id || (await this.getDefaultUserId());
    return this.autopilotService.getAutopilotStatus(userId);
  }

  @Get("activity")
  async getActivity(@Req() req: any, @Query("limit") limit?: string) {
    const userId = req.user?.id || (await this.getDefaultUserId());
    return this.autopilotService.getLiveActivity(userId, Number(limit) || 15);
  }

  @Get("digest/today")
  async getTodayDigest(@Req() req: any, @Query("date") date?: string) {
    const userId = req.user?.id || (await this.getDefaultUserId());
    return this.autopilotService.getDailyDigest(userId, date);
  }

  @Get("niches/expand")
  async expandNiche(
    @Query("niche") niche?: string,
    @Query("country") country?: string
  ) {
    return expandNicheQuery(niche || "Dentist", country || "India");
  }

  private async getDefaultUserId(): Promise<string> {
    const user = await prisma.user.findFirst();
    if (user) return user.id;

    const created = await prisma.user.create({
      data: {
        email: "demo@leadengine.io",
        passwordHash: "$2b$10$demoHashForDevelopmentOnlyPlaceholder",
        name: "LeadEngine Admin",
        role: "OWNER",
      },
    });
    return created.id;
  }
}
