import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class SocialsService {
  async create(dto: Prisma.SocialProfileCreateInput) {
    try {
      return await prisma.socialProfile.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.SocialProfileWhereInput = {};
    if (query.businessId) where.businessId = query.businessId as string;
    if (query.platform) where.platform = query.platform as string;

    const [items, total] = await Promise.all([
      prisma.socialProfile.findMany({
        where,
        skip,
        take,
        orderBy: { platform: "asc" },
        include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
      }),
      prisma.socialProfile.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const social = await prisma.socialProfile.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
    });
    if (!social) throw new NotFoundException("Social profile not found");
    return social;
  }

  async update(id: string, dto: Prisma.SocialProfileUpdateInput) {
    try {
      return await prisma.socialProfile.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.socialProfile.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findByBusiness(businessId: string) {
    return prisma.socialProfile.findMany({ where: { businessId }, orderBy: { platform: "asc" } });
  }
}
