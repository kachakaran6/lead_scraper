import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError } from "../auth/auth.utils";

@Injectable()
export class DealsService {
  async create(dto: Prisma.DealCreateInput) {
    try {
      return await prisma.deal.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll() {
    return prisma.deal.findMany({
      include: {
        business: { select: { id: true, name: true, city: true, state: true, country: true } },
        stage: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        business: { select: { id: true, name: true, city: true, state: true, country: true } },
        stage: true,
      },
    });
    if (!deal) throw new NotFoundException("Deal not found");
    return deal;
  }

  async update(id: string, dto: Prisma.DealUpdateInput) {
    try {
      return await prisma.deal.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.deal.delete({ where: { id } });
    return { deleted: true, id };
  }

  async moveStage(id: string, stageId: string) {
    return prisma.deal.update({ where: { id }, data: { stageId } });
  }
}