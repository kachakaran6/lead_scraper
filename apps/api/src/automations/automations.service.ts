import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Optional,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { prisma, AutomationStatus } from "@ultimate-leads/database";
import { CreateAutomationDto } from "./dto/create-automation.dto";
import { UpdateAutomationDto } from "./dto/update-automation.dto";

@Injectable()
export class AutomationsService {
  constructor(
    @Optional()
    @InjectQueue("automation")
    private readonly automationQueue?: Queue
  ) {}

  async create(userId: string, dto: CreateAutomationDto) {
    const sequencesData = dto.sequences && dto.sequences.length > 0
      ? dto.sequences.map((s, index) => ({
          stepIndex: s.stepIndex ?? index,
          channel: s.channel || "EMAIL",
          templateId: s.templateId || null,
          customSubject: s.customSubject || null,
          customBody: s.customBody || null,
          delayDays: s.delayDays || 0,
          delayHours: s.delayHours || 0,
          condition: s.condition || "ALWAYS",
        }))
      : [
          {
            stepIndex: 0,
            channel: "EMAIL",
            customSubject: "Quick introduction & digital inquiry for {{businessName}}",
            customBody:
              "<p>Hi {{businessName}} team,</p><p>I noticed your business in {{city}} and wanted to share a quick proposal for enhancing your digital booking presence.</p><p>Best regards,<br/>Lead Team</p>",
            delayDays: 0,
            delayHours: 0,
            condition: "ALWAYS",
          },
        ];

    return prisma.automationCampaign.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description || null,
        status: AutomationStatus.DRAFT,
        searchQuery: dto.searchQuery,
        location: dto.location || null,
        dailyLeadTarget: dto.dailyLeadTarget || 10,
        totalLeadTarget: dto.totalLeadTarget || null,
        sendWindowStart: dto.sendWindowStart || "09:00",
        sendWindowEnd: dto.sendWindowEnd || "18:00",
        daysOfWeek: dto.daysOfWeek || [1, 2, 3, 4, 5],
        leadFilters: dto.leadFilters || null,
        sequences: {
          create: sequencesData,
        },
      },
      include: {
        sequences: { orderBy: { stepIndex: "asc" } },
      },
    });
  }

  async findAll(userId: string) {
    return prisma.automationCampaign.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        sequences: { orderBy: { stepIndex: "asc" } },
        _count: { select: { runs: true } },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const campaign = await prisma.automationCampaign.findUnique({
      where: { id },
      include: {
        sequences: { orderBy: { stepIndex: "asc" } },
        runs: {
          take: 20,
          orderBy: { startedAt: "desc" },
          include: {
            business: {
              select: {
                id: true,
                name: true,
                category: true,
                city: true,
                phone: true,
                emails: { select: { value: true } },
              },
            },
          },
        },
        _count: { select: { runs: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (campaign.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return campaign;
  }

  async update(userId: string, id: string, dto: UpdateAutomationDto) {
    const existing = await prisma.automationCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Update sequences if provided
    if (dto.sequences && dto.sequences.length > 0) {
      await prisma.automationSequence.deleteMany({ where: { campaignId: id } });
      await prisma.automationSequence.createMany({
        data: dto.sequences.map((s, index) => ({
          campaignId: id,
          stepIndex: s.stepIndex ?? index,
          channel: s.channel || "EMAIL",
          templateId: s.templateId || null,
          customSubject: s.customSubject || null,
          customBody: s.customBody || null,
          delayDays: s.delayDays || 0,
          delayHours: s.delayHours || 0,
          condition: s.condition || "ALWAYS",
        })),
      });
    }

    return prisma.automationCampaign.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description !== undefined ? dto.description : existing.description,
        searchQuery: dto.searchQuery ?? existing.searchQuery,
        location: dto.location !== undefined ? dto.location : existing.location,
        dailyLeadTarget: dto.dailyLeadTarget ?? existing.dailyLeadTarget,
        totalLeadTarget: dto.totalLeadTarget !== undefined ? dto.totalLeadTarget : existing.totalLeadTarget,
        sendWindowStart: dto.sendWindowStart ?? existing.sendWindowStart,
        sendWindowEnd: dto.sendWindowEnd ?? existing.sendWindowEnd,
        daysOfWeek: dto.daysOfWeek ?? existing.daysOfWeek,
        leadFilters: dto.leadFilters !== undefined ? dto.leadFilters : existing.leadFilters,
      },
      include: {
        sequences: { orderBy: { stepIndex: "asc" } },
      },
    });
  }

  async delete(userId: string, id: string) {
    const existing = await prisma.automationCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    await prisma.automationCampaign.delete({ where: { id } });
    return { success: true };
  }

  async start(userId: string, id: string) {
    const campaign = await prisma.automationCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (campaign.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const updated = await prisma.automationCampaign.update({
      where: { id },
      data: {
        status: AutomationStatus.ACTIVE,
        startedAt: campaign.startedAt || new Date(),
      },
    });

    if (this.automationQueue) {
      try {
        await this.automationQueue.add(
          "RUN_AUTOMATION_TICK",
          { campaignId: id },
          { jobId: `tick-${id}-${Date.now()}` }
        );
      } catch (queueErr) {
        console.warn("Notice: Failed to enqueue immediate automation tick:", queueErr);
      }
    }

    return { success: true, status: updated.status };
  }

  async pause(userId: string, id: string) {
    const campaign = await prisma.automationCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (campaign.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const updated = await prisma.automationCampaign.update({
      where: { id },
      data: { status: AutomationStatus.PAUSED },
    });

    return { success: true, status: updated.status };
  }

  async resume(userId: string, id: string) {
    return this.start(userId, id);
  }

  async getAnalytics(userId: string, id: string) {
    const campaign = await prisma.automationCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (campaign.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    const totalSent = campaign.emailsSent;
    const totalOpened = campaign.emailsOpened;
    const totalClicked = campaign.emailsClicked;
    const totalFailed = campaign.emailsFailed;

    const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
    const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

    return {
      campaignId: id,
      name: campaign.name,
      status: campaign.status,
      leadsDiscovered: campaign.leadsDiscovered,
      emailsSent: totalSent,
      emailsOpened: totalOpened,
      emailsClicked: totalClicked,
      emailsFailed: totalFailed,
      replies: campaign.replies,
      openRate,
      clickRate,
      funnel: [
        { stage: "Discovered", count: campaign.leadsDiscovered },
        { stage: "Contacted", count: totalSent },
        { stage: "Opened", count: totalOpened },
        { stage: "Engaged / Clicked", count: totalClicked },
        { stage: "Replies", count: campaign.replies },
      ],
    };
  }

  async getRuns(userId: string, id: string) {
    const campaign = await prisma.automationCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException(`Automation campaign ${id} not found`);
    }
    if (campaign.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return prisma.automationRun.findMany({
      where: { campaignId: id },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            category: true,
            city: true,
            state: true,
            phone: true,
            website: true,
            emails: { select: { value: true, status: true } },
          },
        },
      },
    });
  }
}
