import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { handlePrismaError } from "../auth/auth.utils";
import { createHash, randomBytes } from "crypto";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): string {
  return "ulk_" + randomBytes(32).toString("hex");
}

@Injectable()
export class ApiKeysService {
  async create(userId: string, name: string, permissions: string[] = []) {
    const key = generateApiKey();
    try {
      const item = await prisma.apiKey.create({
        data: { name, keyHash: hashApiKey(key), userId, permissions },
      });
      return { id: item.id, name: item.name, key, createdAt: item.createdAt };
    } catch (error) {
      handlePrismaError(error);
    }
  }

  async findAll(userId: string) {
    return prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        permissions: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async remove(id: string, userId: string) {
    await prisma.apiKey.delete({ where: { id } });
    return { deleted: true, id };
  }

  async touch(id: string) {
    return prisma.apiKey.update({ where: { id }, data: { lastUsedAt: new Date() } });
  }

  async validate(key: string): Promise<{ id: string; userId: string } | null> {
    const item = await prisma.apiKey.findFirst({
      where: { keyHash: hashApiKey(key) },
    });
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < new Date()) return null;
    await this.touch(item.id);
    return { id: item.id, userId: item.userId };
  }
}
