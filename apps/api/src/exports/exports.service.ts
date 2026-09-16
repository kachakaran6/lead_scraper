import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError } from "../auth/auth.utils";

@Injectable()
export class ExportsService {
  async create(dto: Prisma.ExportCreateInput) {
    try {
      return await prisma.export.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(userId: string) {
    return prisma.export.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string, userId: string) {
    const item = await prisma.export.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Export not found");
    return item;
  }

  async markCompleted(id: string, fileUrl: string) {
    return prisma.export.update({
      where: { id },
      data: { status: "COMPLETED", fileUrl, completedAt: new Date() },
    });
  }

  async markFailed(id: string, error: string) {
    return prisma.export.update({
      where: { id },
      data: { status: "FAILED", error },
    });
  }
}
