import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@ultimate-leads/database";
import { SmtpAccountsService } from "../smtp-accounts/smtp-accounts.service";
import { SendOutreachEmailDto, QueryOutreachEmailDto } from "./dto/send-outreach-email.dto";

const TRANSPARENT_1PX_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

@Injectable()
export class OutreachEmailsService {
  constructor(private readonly smtpAccountsService: SmtpAccountsService) {}

  private getPublicApiUrl(): string {
    const raw =
      process.env.PUBLIC_API_URL ||
      process.env.API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://leads-api.kachakaran.me"
        : "http://localhost:4000");
    return raw.replace(/\/$/, "");
  }

  async sendEmail(userId: string, dto: SendOutreachEmailDto) {
    // 1. Resolve SMTP account to send with
    let accountId = dto.smtpAccountId;

    if (!accountId) {
      const defaultAccount = await prisma.smtpAccount.findFirst({
        where: { userId, isDefault: true },
      });
      if (defaultAccount) {
        accountId = defaultAccount.id;
      } else {
        const anyAccount = await prisma.smtpAccount.findFirst({
          where: { userId },
          orderBy: { createdAt: "asc" },
        });
        if (!anyAccount) {
          throw new BadRequestException(
            "No active SMTP email account configured. Please connect an SMTP account in Settings first."
          );
        }
        accountId = anyAccount.id;
      }
    }

    const { transporter, account, fromAddress, fromEmail } =
      await this.smtpAccountsService.getTransporterForAccount(accountId);

    if (account.userId !== userId) {
      throw new BadRequestException("Unauthorized access to specified SMTP account");
    }

    const trackingId = uuidv4();
    const publicUrl = this.getPublicApiUrl();

    // 2. Prepare HTML body with open tracking pixel & click tracking wrappers
    const openTrackingPixel = `<img src="${publicUrl}/track/open/${trackingId}" width="1" height="1" style="display:none !important; border:none; outline:none;" alt="" />`;

    let htmlBody = dto.body;

    // Wrap external hrefs with click tracking
    htmlBody = htmlBody.replace(/href="(https?:\/\/[^"]+)"/gi, (match, targetUrl) => {
      // Don't wrap already wrapped track URLs
      if (targetUrl.includes("/track/click/")) return match;
      const redirectUrl = `${publicUrl}/track/click/${trackingId}?url=${encodeURIComponent(targetUrl)}`;
      return `href="${redirectUrl}"`;
    });

    if (htmlBody.includes("</body>")) {
      htmlBody = htmlBody.replace("</body>", `${openTrackingPixel}</body>`);
    } else {
      htmlBody += openTrackingPixel;
    }

    // 3. Dispatch via Nodemailer
    let messageId: string | null = null;
    let status = "SENT";
    let failReason: string | null = null;

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: dto.toEmail,
        subject: dto.subject,
        html: htmlBody,
      });
      messageId = info.messageId;
    } catch (err: any) {
      status = "FAILED";
      failReason = err.message || "Failed to send email via SMTP";
    }

    // 4. Save record
    const emailRecord = await prisma.outreachEmail.create({
      data: {
        smtpAccountId: account.id,
        businessId: dto.businessId || null,
        toEmail: dto.toEmail,
        fromEmail,
        subject: dto.subject,
        body: dto.body,
        templateId: dto.templateId || null,
        status,
        messageId,
        failReason,
        trackingId,
        sentAt: status === "SENT" ? new Date() : null,
      },
      include: {
        smtpAccount: {
          select: { id: true, name: true, host: true, fromName: true, fromEmail: true },
        },
      },
    });

    // 5. Update SMTP account usage
    if (status === "SENT") {
      await prisma.smtpAccount.update({
        where: { id: account.id },
        data: { lastUsedAt: new Date() },
      });
    }

    // 6. Update business disposition if businessId provided
    if (dto.businessId && status === "SENT") {
      try {
        const business = await prisma.business.findUnique({
          where: { id: dto.businessId },
          select: { status: true, name: true },
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
            type: "EMAIL_SENT",
            description: `Sent outreach email "${dto.subject}" to ${dto.toEmail}`,
            metadata: {
              emailId: emailRecord.id,
              subject: dto.subject,
              to: dto.toEmail,
              from: fromEmail,
            },
          },
        });
      } catch (actErr) {
        console.warn("Notice: Failed to log activity for business outreach:", actErr);
      }
    }

    if (status === "FAILED") {
      throw new BadRequestException(`Delivery failed: ${failReason}`);
    }

    return emailRecord;
  }

  async findAll(userId: string, query: QueryOutreachEmailDto) {
    const where: any = {};

    if (query.businessId) {
      where.businessId = query.businessId;
    }
    if (query.status) {
      where.status = query.status;
    }

    // Filter by user's SMTP accounts
    const userSmtpAccounts = await prisma.smtpAccount.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = userSmtpAccounts.map((a) => a.id);

    where.OR = [
      { smtpAccountId: { in: accountIds } },
      { business: { userId } },
    ];

    const [items, total] = await Promise.all([
      prisma.outreachEmail.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: query.limit ? Number(query.limit) : 50,
        skip: query.offset ? Number(query.offset) : 0,
        include: {
          smtpAccount: {
            select: { id: true, name: true, fromName: true, fromEmail: true },
          },
          business: {
            select: { id: true, name: true, category: true, city: true },
          },
        },
      }),
      prisma.outreachEmail.count({ where }),
    ]);

    return { items, total };
  }

  async getAnalytics(userId: string) {
    const userSmtpAccounts = await prisma.smtpAccount.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = userSmtpAccounts.map((a) => a.id);

    const where: any = {
      OR: [
        { smtpAccountId: { in: accountIds } },
        { business: { userId } },
      ],
    };

    const [total, sent, opened, clicked, failed] = await Promise.all([
      prisma.outreachEmail.count({ where }),
      prisma.outreachEmail.count({ where: { ...where, status: { in: ["SENT", "OPENED", "CLICKED"] } } }),
      prisma.outreachEmail.count({ where: { ...where, status: { in: ["OPENED", "CLICKED"] } } }),
      prisma.outreachEmail.count({ where: { ...where, status: "CLICKED" } }),
      prisma.outreachEmail.count({ where: { ...where, status: "FAILED" } }),
    ]);

    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

    return {
      total,
      sent,
      opened,
      clicked,
      failed,
      openRate,
      clickRate,
    };
  }

  async trackOpen(trackingId: string): Promise<Buffer> {
    try {
      const email = await prisma.outreachEmail.findUnique({
        where: { trackingId },
      });

      if (email && !email.openedAt) {
        await prisma.outreachEmail.update({
          where: { trackingId },
          data: {
            openedAt: new Date(),
            status: email.status === "CLICKED" ? "CLICKED" : "OPENED",
          },
        });

        // Record activity if tied to business
        if (email.businessId) {
          await prisma.activity.create({
            data: {
              businessId: email.businessId,
              type: "EMAIL_OPENED",
              description: `Lead opened email: "${email.subject}"`,
              metadata: { emailId: email.id, openedAt: new Date() },
            },
          });
        }
      }
    } catch (err) {
      console.warn("Track open error notice:", err);
    }

    return TRANSPARENT_1PX_GIF;
  }

  async trackClick(trackingId: string, targetUrl: string): Promise<string> {
    try {
      const email = await prisma.outreachEmail.findUnique({
        where: { trackingId },
      });

      if (email) {
        await prisma.outreachEmail.update({
          where: { trackingId },
          data: {
            openedAt: email.openedAt || new Date(),
            clickedAt: new Date(),
            status: "CLICKED",
          },
        });

        if (email.businessId) {
          await prisma.activity.create({
            data: {
              businessId: email.businessId,
              type: "EMAIL_CLICKED",
              description: `Lead clicked link in email "${email.subject}": ${targetUrl}`,
              metadata: { emailId: email.id, targetUrl, clickedAt: new Date() },
            },
          });
        }
      }
    } catch (err) {
      console.warn("Track click error notice:", err);
    }

    // Default safe fallback if targetUrl is invalid
    if (!targetUrl || !targetUrl.startsWith("http")) {
      return "https://leads.kachakaran.me";
    }

    return targetUrl;
  }
}
