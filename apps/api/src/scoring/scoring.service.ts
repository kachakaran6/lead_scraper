import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError, parsePagination } from "../auth/auth.utils";

@Injectable()
export class ScoringService {
  async findRules() {
    return prisma.scoringRule.findMany({ orderBy: { name: "asc" } });
  }

  async createRule(dto: Prisma.ScoringRuleCreateInput) {
    try {
      return await prisma.scoringRule.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async updateRule(id: string, dto: Prisma.ScoringRuleUpdateInput) {
    try {
      return await prisma.scoringRule.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async removeRule(id: string) {
    await prisma.scoringRule.delete({ where: { id } });
    return { deleted: true, id };
  }

  async calculate(businessId: string): Promise<{ total: number; breakdown: Record<string, number> }> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        websites: true,
        socials: true,
        emails: true,
        phones: true,
        opportunities: true,
      },
    });
    if (!business) throw new NotFoundException("Business not found");

    const rules = await prisma.scoringRule.findMany({ where: { enabled: true } });
    const breakdown: Record<string, number> = {};
    let total = 0;

    const website = business.websites[0];
    const context = {
      "website.status": website?.status ?? "NO_WEBSITE",
      "website.quality": website ? "good" : "poor",
      "website.mobile": website ? "good" : "poor",
      "website.hasContactForm": String(website ? false : false),
      "website.hasWhatsApp": String(website ? false : false),
      "social.count": String(business.socials.length),
      "reviews.count": "0",
      "email.count": String(business.emails.length),
      "phone.count": String(business.phones.length),
    };

    for (const rule of rules) {
      const actual = context[rule.signal as keyof typeof context];
      if (actual === undefined) continue;

      let matches = false;
      switch (rule.operator) {
        case "equals":
          matches = String(actual) === String(rule.value);
          break;
        case "gte":
          matches = Number(actual) >= Number(rule.value);
          break;
        case "lte":
          matches = Number(actual) <= Number(rule.value);
          break;
        case "contains":
          matches = String(actual).includes(String(rule.value ?? ""));
          break;
      }

      if (matches) {
        breakdown[rule.name] = rule.weight;
        total += rule.weight;
      }
    }

    await prisma.leadScore.upsert({
      where: { businessId },
      update: { total, breakdown, calculatedAt: new Date() },
      create: { businessId, total, breakdown },
    });

    return { total, breakdown };
  }

  async calculateAll(): Promise<number> {
    const businesses = await prisma.business.findMany({ select: { id: true } });
    let count = 0;
    for (const business of businesses) {
      try {
        await this.calculate(business.id);
        count++;
      } catch (error) {
        console.error(`Failed to score business ${business.id}:`, error);
      }
    }
    return count;
  }
}
