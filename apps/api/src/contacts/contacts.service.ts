import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class ContactsService {
  async create(dto: Prisma.ContactCreateInput) {
    try {
      return await prisma.contact.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.ContactWhereInput = {};
    if (query.businessId) where.businessId = query.businessId as string;
    if (query.email) where.email = { contains: query.email as string, mode: "insensitive" };
    if (query.name) {
      where.OR = [
        { firstName: { contains: query.name as string, mode: "insensitive" } },
        { lastName: { contains: query.name as string, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
      }),
      prisma.contact.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
    });
    if (!contact) throw new NotFoundException("Contact not found");
    return contact;
  }

  async update(id: string, dto: Prisma.ContactUpdateInput) {
    try {
      return await prisma.contact.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.contact.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findByBusiness(businessId: string) {
    return prisma.contact.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
  }
}
