import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, WebsiteStatus } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class WebsitesService {
  async create(dto: Prisma.WebsiteCreateInput) {
    try {
      return await prisma.website.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.WebsiteWhereInput = {};
    if (query.businessId) where.businessId = query.businessId as string;
    if (query.status) where.status = query.status as WebsiteStatus;
    if (query.url || query.domain) {
      where.url = { contains: (query.url || query.domain) as string, mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      prisma.website.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          business: { select: { id: true, name: true, city: true, state: true, country: true } },
        },
      }),
      prisma.website.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            country: true,
            websiteAudits: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
    if (!website) throw new NotFoundException("Website not found");
    return website;
  }

  async update(id: string, dto: Prisma.WebsiteUpdateInput) {
    try {
      return await prisma.website.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.website.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findByBusiness(businessId: string) {
    return prisma.website.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
  }

  async addAudit(websiteId: string, dto: any) {
    try {
      const website = await prisma.website.findUnique({ where: { id: websiteId } });
      if (!website) throw new NotFoundException("Website not found");

      const audit = await prisma.websiteAudit.create({
        data: {
          ...dto,
          business: { connect: { id: website.businessId } },
        },
      });

      if (dto.httpStatus) {
        const status =
          dto.httpStatus >= 500
            ? "WEBSITE_DOWN"
            : dto.httpStatus >= 400
              ? "WEBSITE_BROKEN"
              : "WEBSITE_FOUND";
        await prisma.website.update({ where: { id: websiteId }, data: { status } });
      }
      return audit;
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
