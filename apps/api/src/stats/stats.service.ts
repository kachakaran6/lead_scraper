import { Injectable } from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";

@Injectable()
export class StatsService {
  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      total,
      newToday,
      newWeek,
      newMonth,
      withoutWebsite,
      withWebsite,
      highOpportunity,
      contacted,
      replied,
      meetings,
      proposals,
      wonDeals,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { createdAt: { gte: today } } }),
      prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.business.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.business.count({ where: { websites: { none: {} } } }),
      prisma.business.count({ where: { websites: { some: {} } } }),
      prisma.business.count({ where: { leadScore: { gte: 60 } } }),
      prisma.business.count({ where: { status: "CONTACTED" } }),
      prisma.business.count({ where: { status: "REPLIED" } }),
      prisma.business.count({ where: { status: "MEETING" } }),
      prisma.business.count({ where: { status: "PROPOSAL" } }),
      prisma.business.count({ where: { status: "WON" } }),
    ]);

    const byCity = await prisma.business.groupBy({
      by: ["city"],
      _count: { id: true },
      where: { city: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const byCategory = await prisma.business.groupBy({
      by: ["category"],
      _count: { id: true },
      where: { category: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const byCountry = await prisma.business.groupBy({
      by: ["country"],
      _count: { id: true },
      where: { country: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const byState = await prisma.business.groupBy({
      by: ["state"],
      _count: { id: true },
      where: { state: { not: null } },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const opportunities = await prisma.opportunity.groupBy({
      by: ["type"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    const pipeline = await prisma.pipelineStage.findMany({
      include: { _count: { select: { deals: true } } },
      orderBy: { position: "asc" },
    });

    return {
      kpis: {
        total,
        newToday,
        newWeek,
        newMonth,
        withoutWebsite,
        withWebsite,
        highOpportunity,
        contacted,
        replied,
        meetings,
        proposals,
        wonDeals,
      },
      charts: {
        byCity: byCity.map((c) => ({ city: c.city, count: c._count.id })),
        byCategory: byCategory.map((c) => ({ category: c.category, count: c._count.id })),
        byCountry: byCountry.map((c) => ({ country: c.country, count: c._count.id })),
        byState: byState.map((s) => ({ state: s.state, count: s._count.id })),
        opportunities: opportunities.map((o) => ({ type: o.type, count: o._count.id })),
        pipeline,
      },
    };
  }

  async getSalesAnalytics() {
    const [deals, revenue] = await Promise.all([
      prisma.deal.findMany({
        include: { business: { select: { id: true, name: true, category: true, city: true, state: true, country: true } } },
      }),
      prisma.deal.aggregate({
        _sum: { value: true },
        _avg: { value: true },
        _count: { id: true },
      }),
    ]);

    const byStage = await prisma.deal.groupBy({
      by: ["stageId"],
      _sum: { value: true },
      _count: { id: true },
    });

    const stages = await prisma.pipelineStage.findMany();
    const byStageWithNames = byStage.map((s) => ({
      ...s,
      stageName: stages.find((st) => st.id === s.stageId)?.name,
      count: s._count.id,
    }));

    return {
      totalDeals: revenue._count?.id || 0,
      totalRevenue: revenue._sum?.value || 0,
      averageDealSize: revenue._avg?.value || 0,
      byStage: byStageWithNames,
      deals,
    };
  }
}