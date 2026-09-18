import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, JobStatus } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class JobsService {
  async create(dto: Prisma.JobCreateInput | Prisma.JobUncheckedCreateInput | any) {
    try {
      return await prisma.job.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.JobWhereInput = {};
    if (query.status) where.status = query.status as JobStatus;
    if (query.type) where.type = query.type as any;
    if (query.campaignId) where.campaignId = query.campaignId as string;
    if (query.businessId) where.businessId = query.businessId as string;

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          business: { select: { id: true, name: true } },
          campaign: { select: { id: true, name: true } },
        },
      }),
      prisma.job.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true } },
        campaign: { select: { id: true, name: true } },
      },
    });
    if (!job) throw new NotFoundException("Job not found");
    return job;
  }

  async update(id: string, dto: Prisma.JobUpdateInput) {
    try {
      return await prisma.job.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.job.delete({ where: { id } });
    return { deleted: true, id };
  }

  async stats() {
    const total = await prisma.job.count();
    const byStatus = await prisma.job.groupBy({ by: ["status"], _count: { _all: true } });
    const byType = await prisma.job.groupBy({ by: ["type"], _count: { _all: true } });
    return { total, byStatus, byType };
  }
}
