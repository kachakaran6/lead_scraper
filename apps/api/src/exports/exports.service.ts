import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";

export interface ExportFilterParams {
  format: "csv" | "json";
  query?: string;
  city?: string;
  category?: string;
  hasWebsite?: boolean;
  minScore?: number;
}

@Injectable()
export class ExportsService {
  async create(dto: { format: string; userId: string; filters?: any }) {
    return prisma.export.create({
      data: {
        userId: dto.userId,
        format: dto.format.toUpperCase(),
        status: "PENDING",
        filters: dto.filters || null,
      },
    });
  }

  async findAll(userId: string) {
    return prisma.export.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const item = await prisma.export.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Export not found");
    return item;
  }

  async generateDownload(userId: string, params: ExportFilterParams, ipAddress?: string) {
    const where: any = {};
    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: "insensitive" } },
        { category: { contains: params.query, mode: "insensitive" } },
      ];
    }
    if (params.city && params.city !== "ALL") {
      where.city = { contains: params.city, mode: "insensitive" };
    }
    if (params.category && params.category !== "ALL") {
      where.category = { contains: params.category, mode: "insensitive" };
    }
    if (params.hasWebsite !== undefined) {
      where.hasWebsite = params.hasWebsite;
    }
    if (params.minScore) {
      where.leadScore = { gte: params.minScore };
    }

    const leads = await prisma.business.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        phone: true,
        website: true,
        rating: true,
        reviewCount: true,
        leadScore: true,
        leadGrade: true,
        status: true,
        sourceProvider: true,
        verificationStatus: true,
        retrievedAt: true,
        lastVerifiedAt: true,
      },
      orderBy: { leadScore: "desc" },
      take: 1000,
    });

    // Record audit trail
    await prisma.auditLog.create({
      data: {
        userId,
        action: "EXPORT",
        ipAddress: ipAddress || null,
        details: {
          format: params.format,
          recordCount: leads.length,
          filters: params,
        },
      },
    });

    if (params.format === "json") {
      return {
        format: "json",
        filename: `leads-export-${Date.now()}.json`,
        contentType: "application/json",
        data: leads,
        count: leads.length,
      };
    }

    // CSV generation with sanitization against CSV formula injection
    const header = [
      "Business Name",
      "Category",
      "Address",
      "City",
      "State",
      "Country",
      "Phone",
      "Website",
      "Rating",
      "Reviews",
      "Lead Score",
      "Grade",
      "Status",
      "Source Provider",
      "Verification Status",
      "Retrieved At",
    ];

    const rows = leads.map((l) => [
      this.sanitizeCsvCell(l.name),
      this.sanitizeCsvCell(l.category || ""),
      this.sanitizeCsvCell(l.address || ""),
      this.sanitizeCsvCell(l.city || ""),
      this.sanitizeCsvCell(l.state || ""),
      this.sanitizeCsvCell(l.country || ""),
      this.sanitizeCsvCell(l.phone || ""),
      this.sanitizeCsvCell(l.website || "No website found"),
      l.rating ?? "",
      l.reviewCount ?? "",
      l.leadScore,
      l.leadGrade,
      l.status,
      this.sanitizeCsvCell(l.sourceProvider || "Database"),
      l.verificationStatus,
      l.retrievedAt ? l.retrievedAt.toISOString() : "",
    ]);

    const csvContent = [
      header.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(",")),
    ].join("\r\n");

    return {
      format: "csv",
      filename: `leads-export-${Date.now()}.csv`,
      contentType: "text/csv; charset=utf-8",
      data: csvContent,
      count: leads.length,
    };
  }

  private sanitizeCsvCell(value: string): string {
    if (!value) return "";
    let sanitized = String(value).replace(/"/g, '""');
    // Prevent CSV formula injection if starts with =, +, -, @
    if (/^[=+\-@]/.test(sanitized)) {
      sanitized = `'${sanitized}`;
    }
    return sanitized;
  }
}
