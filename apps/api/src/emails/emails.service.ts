import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, EmailStatus } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";
import { isGenericEmail } from "@ultimate-leads/shared";

@Injectable()
export class EmailsService {
  async create(dto: Prisma.EmailCreateInput) {
    try {
      return await prisma.email.create({
        data: {
          ...dto,
          value: dto.value.toLowerCase(),
          isGeneric: dto.isGeneric ?? isGenericEmail(dto.value.toLowerCase()),
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.EmailWhereInput = {};
    if (query.businessId) where.businessId = query.businessId as string;
    if (query.status) where.status = query.status as EmailStatus;
    if (query.value) where.value = { contains: query.value as string, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.email.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
      }),
      prisma.email.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const email = await prisma.email.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
    });
    if (!email) throw new NotFoundException("Email not found");
    return email;
  }

  async update(id: string, dto: Prisma.EmailUpdateInput) {
    try {
      return await prisma.email.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async markVerified(id: string) {
    return prisma.email.update({
      where: { id },
      data: { status: "VERIFIED", verifiedAt: new Date() },
    });
  }

  async markInvalid(id: string) {
    return prisma.email.update({ where: { id }, data: { status: "INVALID" } });
  }

  async remove(id: string) {
    await prisma.email.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findByBusiness(businessId: string) {
    return prisma.email.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
  }
}
