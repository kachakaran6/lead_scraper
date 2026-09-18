import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";
import { parsePhoneNumberFromString } from "libphonenumber-js";

@Injectable()
export class PhonesService {
  async create(dto: any) {
    try {
      const parsed = parsePhoneNumberFromString(dto.value);
      let phoneType: "MOBILE" | "LANDLINE" | "UNKNOWN" = "UNKNOWN";
      if (parsed?.getType() === "MOBILE") phoneType = "MOBILE";
      else if (parsed?.getType() === "FIXED_LINE") phoneType = "LANDLINE";

      return await prisma.phone.create({
        data: {
          ...dto,
          value: parsed?.number ?? dto.value,
          formatted: parsed?.formatInternational() ?? dto.formatted,
          countryCode: parsed?.countryCallingCode ? String(parsed.countryCallingCode) : dto.countryCode,
          nationalNumber: parsed?.nationalNumber ? String(parsed.nationalNumber) : dto.nationalNumber,
          type: phoneType,
        },
      });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.PhoneWhereInput = {};
    if (query.businessId) where.businessId = query.businessId as string;
    if (query.countryCode) where.countryCode = query.countryCode as string;
    if (query.value) where.value = { contains: query.value as string };

    const [items, total] = await Promise.all([
      prisma.phone.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
      }),
      prisma.phone.count({ where }),
    ]);
    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const phone = await prisma.phone.findUnique({
      where: { id },
      include: { business: { select: { id: true, name: true, city: true, state: true, country: true } } },
    });
    if (!phone) throw new NotFoundException("Phone not found");
    return phone;
  }

  async update(id: string, dto: Prisma.PhoneUpdateInput) {
    try {
      return await prisma.phone.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.phone.delete({ where: { id } });
    return { deleted: true, id };
  }

  async findByBusiness(businessId: string) {
    return prisma.phone.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
  }
}
