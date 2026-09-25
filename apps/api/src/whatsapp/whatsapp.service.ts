import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { prisma } from "@ultimate-leads/database";
import {
  CreateWhatsappAccountDto,
  SendWhatsappMessageDto,
} from "./dto/create-whatsapp-account.dto";

@Injectable()
export class WhatsappService {
  async getAccounts(userId: string) {
    return prisma.whatsappAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { messages: true } },
      },
    });
  }

  async createAccount(userId: string, dto: CreateWhatsappAccountDto) {
    const cleanedPhone = dto.phone ? dto.phone.replace(/[^0-9+]/g, "") : null;

    return prisma.whatsappAccount.create({
      data: {
        userId,
        name: dto.name,
        phone: cleanedPhone,
        status: cleanedPhone ? "CONNECTED" : "DISCONNECTED",
      },
    });
  }

  async deleteAccount(userId: string, id: string) {
    const account = await prisma.whatsappAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException(`WhatsApp account ${id} not found`);
    }
    if (account.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    await prisma.whatsappAccount.delete({ where: { id } });
    return { success: true };
  }

  async logMessage(userId: string, dto: SendWhatsappMessageDto) {
    const cleanedPhone = dto.toPhone.replace(/[^0-9]/g, "");

    const message = await prisma.whatsappMessage.create({
      data: {
        accountId: dto.accountId || null,
        businessId: dto.businessId || null,
        toPhone: cleanedPhone,
        message: dto.message,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    if (dto.businessId) {
      try {
        const business = await prisma.business.findUnique({
          where: { id: dto.businessId },
          select: { status: true },
        });

        if (business && (business.status === "NEW" || business.status === "QUALIFIED")) {
          await prisma.business.update({
            where: { id: dto.businessId },
            data: { status: "CONTACTED" },
          });
        }

        await prisma.activity.create({
          data: {
            businessId: dto.businessId,
            userId,
            type: "WHATSAPP_SENT",
            description: `Sent WhatsApp outreach message to ${cleanedPhone}`,
            metadata: {
              messageId: message.id,
              toPhone: cleanedPhone,
              preview: dto.message.slice(0, 100),
            },
          },
        });
      } catch (err) {
        console.warn("Notice: Failed to log business activity for WhatsApp outreach:", err);
      }
    }

    const clickToChatUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(dto.message)}`;

    return {
      message,
      clickToChatUrl,
    };
  }

  async getMessages(userId: string, businessId?: string) {
    const where: any = {};
    if (businessId) {
      where.businessId = businessId;
    } else {
      where.account = { userId };
    }

    return prisma.whatsappMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        account: { select: { id: true, name: true, phone: true } },
        business: { select: { id: true, name: true, category: true, city: true } },
      },
    });
  }
}
