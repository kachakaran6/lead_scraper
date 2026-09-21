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
  userId?: string;
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
          userId: dto.userId,
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
    const andConditions: Prisma.BusinessWhereInput[] = [];

    // Search filter across name, category, address, city, state, country, phone, websiteDomain, website
    if (query.search && typeof query.search === "string" && query.search.trim().length > 0) {
      const s = query.search.trim();
      andConditions.push({
        OR: [
          { name: { contains: s, mode: "insensitive" } },
          { category: { contains: s, mode: "insensitive" } },
          { city: { contains: s, mode: "insensitive" } },
          { state: { contains: s, mode: "insensitive" } },
          { country: { contains: s, mode: "insensitive" } },
          { address: { contains: s, mode: "insensitive" } },
          { phone: { contains: s, mode: "insensitive" } },
          { websiteDomain: { contains: s, mode: "insensitive" } },
          { website: { contains: s, mode: "insensitive" } },
        ],
      });
    }

    // City Filter
    if (query.city && typeof query.city === "string" && query.city.trim().length > 0) {
      const city = query.city.trim();
      andConditions.push({
        city: { equals: city, mode: "insensitive" },
      });
    }

    // State / Country / Category / Tag filters
    if (query.state && typeof query.state === "string" && query.state.trim().length > 0) {
      andConditions.push({ state: { contains: query.state.trim(), mode: "insensitive" } });
    }
    if (query.country && typeof query.country === "string" && query.country.trim().length > 0) {
      andConditions.push({ country: { contains: query.country.trim(), mode: "insensitive" } });
    }
    if (query.category && typeof query.category === "string" && query.category.trim().length > 0) {
      andConditions.push({ category: { contains: query.category.trim(), mode: "insensitive" } });
    }
    if (query.tag && typeof query.tag === "string" && query.tag.trim().length > 0) {
      andConditions.push({
        tags: { some: { name: { equals: query.tag.trim(), mode: "insensitive" } } },
      });
    }

    // Website Filter: ALL | MISSING_WEBSITE | HAS_ACTIVE_WEBSITE
    const websiteFilter = (query.website as string || query.websiteStatus as string || "").toLowerCase();
    if (websiteFilter === "missing" || websiteFilter === "missing_website" || query.hasWebsite === "false") {
      andConditions.push({
        OR: [
          { website: null },
          { website: "" },
          { hasWebsite: false },
          { websites: { none: {} } },
        ],
      });
    } else if (websiteFilter === "active" || websiteFilter === "has_active_website" || query.hasWebsite === "true") {
      andConditions.push({
        AND: [
          { website: { not: null } },
          { website: { not: "" } },
          {
            OR: [
              { hasWebsite: true },
              { websites: { some: {} } },
              { websiteDomain: { not: null } },
            ],
          },
        ],
      });
    }

    // Stage / Status Filter
    const stage = (query.stage as string || query.status as string || "").toUpperCase();
    if (stage && stage !== "ALL") {
      if (stage === "ACTIVE") {
        andConditions.push({
          status: {
            notIn: [LeadStatus.NOT_INTERESTED, LeadStatus.LOST],
          },
        });
      } else if (Object.values(LeadStatus).includes(stage as LeadStatus)) {
        andConditions.push({
          status: stage as LeadStatus,
        });
      }
    }

    // Min Lead Score
    if (query.minLeadScore) {
      const minScore = parseInt(query.minLeadScore as string, 10);
      if (!isNaN(minScore)) {
        andConditions.push({ leadScore: { gte: minScore } });
      }
    }

    // Contact availability filters
    if (query.hasEmail === "true") andConditions.push({ emails: { some: {} } });
    if (query.hasEmail === "false") andConditions.push({ emails: { none: {} } });
    if (query.hasPhone === "true") andConditions.push({ phones: { some: {} } });
    if (query.hasPhone === "false") andConditions.push({ phones: { none: {} } });
    if (query.hasSocial === "true") andConditions.push({ socialProfiles: { some: {} } });

    const where: Prisma.BusinessWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

    // Sort order
    let orderBy: Prisma.BusinessOrderByWithRelationInput[] = [];
    const sort = (query.sort as string || "").toLowerCase();

    if (sort === "score_desc" || sort === "score_high") {
      orderBy = [{ leadScore: "desc" }, { createdAt: "desc" }];
    } else if (sort === "score_asc" || sort === "score_low") {
      orderBy = [{ leadScore: "asc" }, { createdAt: "desc" }];
    } else if (sort === "date_asc" || sort === "oldest") {
      orderBy = [{ createdAt: "asc" }];
    } else if (sort === "date_desc" || sort === "newest") {
      orderBy = [{ createdAt: "desc" }];
    } else if (sort === "name_asc") {
      orderBy = [{ name: "asc" }];
    } else {
      // Default: prioritize actionable leads over NOT_INTERESTED, sorted by score & date
      orderBy = [{ status: "asc" }, { leadScore: "desc" }, { createdAt: "desc" }];
    }

    const [items, total] = await Promise.all([
      prisma.business.findMany({
        where,
        skip,
        take,
        orderBy,
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

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  async getDistinctCities(): Promise<string[]> {
    const records = await prisma.business.findMany({
      where: {
        city: { not: null },
      },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });

    const cityMap = new Map<string, string>();
    for (const r of records) {
      if (r.city) {
        const trimmed = r.city.trim();
        if (trimmed.length > 0) {
          const key = trimmed.toLowerCase();
          if (!cityMap.has(key)) {
            // Capitalize appropriately
            const formatted = trimmed
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ");
            cityMap.set(key, formatted);
          }
        }
      }
    }

    return Array.from(cityMap.values()).sort((a, b) => a.localeCompare(b));
  }

  async markNotInterested(id: string, reason?: string, notes?: string) {
    const previous = await prisma.business.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });
    if (!previous) throw new NotFoundException("Business not found");

    const updated = await prisma.business.update({
      where: { id },
      data: {
        status: LeadStatus.NOT_INTERESTED,
        dispositionReason: reason || "Not interested",
        dispositionNotes: notes || null,
        dispositionedAt: new Date(),
      },
    });

    try {
      await prisma.leadEvent.create({
        data: {
          businessId: id,
          type: "STATUS_CHANGED",
          title: "Marked as Not Interested",
          description: reason ? `Reason: ${reason}` : "Marked as Not Interested",
          metadata: {
            previousStatus: previous.status,
            reason: reason || "Not interested",
            notes: notes || null,
          },
        },
      });
    } catch {
      // Non-blocking event log
    }

    return {
      success: true,
      lead: updated,
      previousStatus: previous.status,
    };
  }

  async restoreStatus(id: string, targetStatus?: LeadStatus) {
    const previous = await prisma.business.findUnique({
      where: { id },
      select: { id: true, name: true, status: true },
    });
    if (!previous) throw new NotFoundException("Business not found");

    const statusToSet = targetStatus && Object.values(LeadStatus).includes(targetStatus)
      ? targetStatus
      : LeadStatus.NEW;

    const updated = await prisma.business.update({
      where: { id },
      data: {
        status: statusToSet,
        dispositionReason: null,
        dispositionNotes: null,
        dispositionedAt: null,
      },
    });

    try {
      await prisma.leadEvent.create({
        data: {
          businessId: id,
          type: "STATUS_CHANGED",
          title: "Lead Status Restored",
          description: `Status restored to ${statusToSet}`,
          metadata: {
            previousStatus: previous.status,
            newStatus: statusToSet,
          },
        },
      });
    } catch {
      // Non-blocking event log
    }

    return {
      success: true,
      lead: updated,
    };
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
