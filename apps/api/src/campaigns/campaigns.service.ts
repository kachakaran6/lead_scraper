import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, CampaignStatus } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class CampaignsService {
  async create(dto: Prisma.CampaignCreateInput) {
    try {
      return await prisma.campaign.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.CampaignWhereInput = {};
    if (query.status) where.status = query.status as CampaignStatus;

    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { jobs: true } } },
      }),
      prisma.campaign.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { jobs: { orderBy: { createdAt: "desc" }, take: 100 } },
    });
    if (!campaign) throw new NotFoundException("Campaign not found");
    return campaign;
  }

  async update(id: string, dto: Prisma.CampaignUpdateInput) {
    try {
      return await prisma.campaign.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.campaign.delete({ where: { id } });
    return { deleted: true, id };
  }

  async start(id: string) {
    return prisma.campaign.update({
      where: { id },
      data: { status: "ACTIVE", startedAt: new Date() },
    });
  }

  async pause(id: string) {
    return prisma.campaign.update({
      where: { id },
      data: { status: "PAUSED" },
    });
  }

  async complete(id: string, stats: { discovered?: number; unique?: number; noWebsite?: number; highOpportunity?: number }) {
    return prisma.campaign.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        discovered: stats.discovered ?? 0,
        unique: stats.unique ?? 0,
        noWebsite: stats.noWebsite ?? 0,
        highOpportunity: stats.highOpportunity ?? 0,
      },
    });
  }
}
