import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class OpportunitiesService {
  async create(dto: Prisma.OpportunityCreateInput) {
    try {
      return await prisma.opportunity.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.OpportunityWhereInput = {};
    if (query.businessId) where.businessId = query.businessId as string;
    if (query.type) where.type = query.type as any;
    if (query.status) where.status = query.status as string;

    const [items, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
      }),
      prisma.opportunity.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
    });
    if (!opportunity) throw new NotFoundException("Opportunity not found");
    return opportunity;
  }

  async update(id: string, dto: Prisma.OpportunityUpdateInput) {
    try {
      return await prisma.opportunity.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.opportunity.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findByBusiness(businessId: string) {
    return prisma.opportunity.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
  }
}
