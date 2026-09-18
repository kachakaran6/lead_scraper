import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError } from "../auth/auth.utils";

@Injectable()
export class WebhooksService {
  async create(dto: Prisma.WebhookCreateInput) {
    try {
      return await prisma.webhook.create({ data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll() {
    return prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const webhook = await prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException("Webhook not found");
    return webhook;
  }

  async update(id: string, dto: Prisma.WebhookUpdateInput) {
    try {
      return await prisma.webhook.update({ where: { id }, data: dto });
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await prisma.webhook.delete({ where: { id } });
    return { deleted: true, id };
  }
}
