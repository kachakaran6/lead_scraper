import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma, BusinessSource, LeadStatus } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

interface CreateBusinessDto {
  name: string;
  category?: string;
  status?: LeadStatus;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  source?: BusinessSource;
  sourceId?: string;
  sourceUrl?: string;
  website?: string;
  phone?: string;
  email?: string;
}

interface UpdateBusinessDto {
  name?: string;
  category?: string;
  status?: LeadStatus;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  sourceId?: string;
  sourceUrl?: string;
  leadScore?: number;
  leadGrade?: string;
  opportunityScore?: number;
}

@Injectable()
export class BusinessesService {
  async create(dto: CreateBusinessDto) {
    try {
      const business = await prisma.business.create({
        data: {
          name: dto.name,
          category: dto.category,
          status: dto.status ?? "NEW",
          address: dto.address,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          postalCode: dto.postalCode,
          latitude: dto.latitude,
          longitude: dto.longitude,
          source: dto.source ?? "MANUAL",
          sourceId: dto.sourceId,
          sourceUrl: dto.sourceUrl,
          websites: dto.website
            ? { create: { url: this.normalizeUrl(dto.website) } }
            : undefined,
          phones: dto.phone
            ? { create: { value: dto.phone, formatted: dto.phone } }
            : undefined,
          emails: dto.email
            ? { create: { value: dto.email.toLowerCase(), status: "UNVERIFIED" } }
            : undefined,
        },
        include: {
          websites: true,
          phones: true,
          emails: true,
          socialProfiles: true,
          opportunities: true,
          tags: true,
          deals: { include: { stage: true } },
          _count: {
            select: {
              contacts: true,
              notes: true,
              activities: true,
            },
          },
        },
      });
      return business;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(query: Record<string, string | string[] | undefined>) {
    const { skip, take, page, limit } = parsePagination(query);
    const where: Prisma.BusinessWhereInput = {};

    if (query.search) where.name = { contains: query.search as string, mode: "insensitive" };
    if (query.city) where.city = { contains: query.city as string, mode: "insensitive" };
    if (query.state) where.state = { contains: query.state as string, mode: "insensitive" };
    if (query.country) where.country = { contains: query.country as string, mode: "insensitive" };
    if (query.category) where.category = { contains: query.category as string, mode: "insensitive" };
    if (query.tag) {
      where.tags = { some: { name: { equals: query.tag as string, mode: "insensitive" } } };
    }
    if (query.hasWebsite === "true") where.websites = { some: {} };
    if (query.hasWebsite === "false") where.websites = { none: {} };
    if (query.hasEmail === "true") where.emails = { some: {} };
    if (query.hasEmail === "false") where.emails = { none: {} };
    if (query.hasPhone === "true") where.phones = { some: {} };
    if (query.hasPhone === "false") where.phones = { none: {} };
    if (query.hasSocial === "true") where.socialProfiles = { some: {} };
    if (query.minLeadScore) {
      where.leadScore = { gte: parseInt(query.minLeadScore as string, 10) };
    }

    const [items, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          websites: { orderBy: { createdAt: "desc" }, take: 1 },
          websiteAudits: { orderBy: { createdAt: "desc" }, take: 1 },
          phones: { take: 2 },
          emails: { take: 2 },
          socialProfiles: { take: 5 },
          opportunities: { select: { id: true, type: true, title: true, status: true, value: true } },
          tags: { select: { id: true, name: true, color: true } },
          deals: { select: { id: true, title: true, value: true, stage: { select: { name: true } } } },
          _count: {
            select: {
              contacts: true,
              notes: true,
              activities: true,
              opportunities: true,
            },
          },
        },
      }),
      prisma.business.count({ where }),
    ]);

    return { items, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const business = await prisma.business.findUnique({
      where: { id },
      include: {
        websites: true,
        websiteAudits: { orderBy: { createdAt: "desc" }, take: 10 },
        contacts: { orderBy: { createdAt: "desc" } },
        phones: true,
        emails: true,
        socialProfiles: { orderBy: { platform: "asc" } },
        opportunities: { orderBy: { createdAt: "desc" } },
        tags: true,
        notes: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
        activities: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 50 },
        deals: { include: { stage: true } },
        proposals: { orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            contacts: true,
            notes: true,
            activities: true,
            opportunities: true,
            websites: true,
          },
        },
      },
    });
    if (!business) throw new NotFoundException("Business not found");
    return business;
  }

  async update(id: string, dto: UpdateBusinessDto) {
    try {
      const business = await prisma.business.update({
        where: { id },
        data: dto,
        include: {
          websites: true,
          phones: true,
          emails: true,
          socialProfiles: true,
          opportunities: true,
          tags: true,
        },
      });
      return business;
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.business.delete({ where: { id } });
    return { deleted: true, id };
  }

  async search(query: string, location?: string, limit = 50) {
    const where: Prisma.BusinessWhereInput = {
      name: { contains: query, mode: "insensitive" },
    };
    if (location) {
      where.OR = [
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } },
        { address: { contains: location, mode: "insensitive" } },
      ];
    }
    return prisma.business.findMany({
      where,
      take: Math.min(limit, 200),
      orderBy: { createdAt: "desc" },
      include: {
        websites: { take: 1 },
        phones: { take: 1 },
        emails: { take: 1 },
        opportunities: { take: 5 },
      },
    });
  }

  async addTag(businessId: string, tagName: string) {
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      create: { name: tagName },
      update: {},
    });
    return prisma.business.update({
      where: { id: businessId },
      data: { tags: { connect: { id: tag.id } } },
      include: { tags: true },
    });
  }

  async removeTag(businessId: string, tagName: string) {
    return prisma.business.update({
      where: { id: businessId },
      data: { tags: { disconnect: { name: tagName } } },
      include: { tags: true },
    });
  }

  async listTags() {
    return prisma.tag.findMany({
      include: { _count: { select: { businesses: true } } },
      orderBy: { name: "asc" },
    });
  }

  async stats() {
    const total = await prisma.business.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      newToday,
      withoutWebsite,
      withWebsite,
      withEmail,
      withPhone,
      withSocial,
      highOpportunity,
      contacted,
      replied,
      meetings,
      proposals,
      wonDeals,
      poorWebsite,
    ] = await Promise.all([
      prisma.business.count({ where: { createdAt: { gte: today } } }),
      prisma.business.count({ where: { websites: { none: {} } } }),
      prisma.business.count({ where: { websites: { some: {} } } }),
      prisma.business.count({ where: { emails: { some: {} } } }),
      prisma.business.count({ where: { phones: { some: {} } } }),
      prisma.business.count({ where: { socialProfiles: { some: {} } } }),
      prisma.business.count({ where: { leadScore: { gte: 60 } } }),
      prisma.business.count({ where: { status: "CONTACTED" } }),
      prisma.business.count({ where: { status: "REPLIED" } }),
      prisma.business.count({ where: { status: "MEETING" } }),
      prisma.business.count({ where: { status: "PROPOSAL" } }),
      prisma.business.count({ where: { status: "WON" } }),
      prisma.business.count({ where: { websiteQuality: "poor" } }),
    ]);

    return {
      total,
      newToday,
      withoutWebsite,
      withWebsite,
      withEmail,
      withPhone,
      withSocial,
      highOpportunity,
      contacted,
      replied,
      meetings,
      proposals,
      wonDeals,
      poorWebsite,
    };
  }

  private normalizeUrl(url: string): string {
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    return normalized;
  }
}
