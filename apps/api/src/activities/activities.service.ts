import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError } from "../auth/auth.utils";

@Injectable()
export class ActivitiesService {
  async create(dto: Prisma.ActivityUncheckedCreateInput) {
    try {
      return await prisma.activity.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(businessId: string, limit = 50) {
    return prisma.activity.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async remove(id: string) {
    await prisma.activity.delete({ where: { id } });
    return { deleted: true, id };
  }
}