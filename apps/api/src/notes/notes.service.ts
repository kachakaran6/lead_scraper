import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError } from "../auth/auth.utils";

@Injectable()
export class NotesService {
  async create(dto: Prisma.NoteCreateInput) {
    try {
      return await prisma.note.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(businessId: string) {
    return prisma.note.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async remove(id: string) {
    await prisma.note.delete({ where: { id } });
    return { deleted: true, id };
  }
}