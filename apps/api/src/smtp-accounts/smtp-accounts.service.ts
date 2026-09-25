import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { prisma } from "@ultimate-leads/database";
import { encryptText, decryptText } from "../common/crypto.util";
import { CreateSmtpAccountDto, TestSmtpAccountDto } from "./dto/create-smtp-account.dto";
import { UpdateSmtpAccountDto } from "./dto/update-smtp-account.dto";

@Injectable()
export class SmtpAccountsService {
  /**
   * Builds an active nodemailer transporter from account details
   */
  createTransporter(params: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    passwordPlain: string;
  }) {
    return nodemailer.createTransport({
      host: params.host,
      port: params.port,
      secure: params.secure,
      auth: {
        user: params.username,
        pass: params.passwordPlain,
      },
      tls: {
        rejectUnauthorized: false, // Prevents self-signed cert blocks on custom corporate SMTPs
      },
      connectionTimeout: 10000,
    });
  }

  async create(userId: string, dto: CreateSmtpAccountDto) {
    const port = dto.port || (dto.secure ? 465 : 587);
    const secure = dto.secure ?? port === 465;

    // Verify credentials first with SMTP host
    const transporter = this.createTransporter({
      host: dto.host,
      port,
      secure,
      username: dto.username,
      passwordPlain: dto.password,
    });

    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      throw new BadRequestException(
        `SMTP Connection Verification Failed: ${verifyErr.message || "Invalid host, port, or authentication credentials"}`
      );
    }

    const count = await prisma.smtpAccount.count({ where: { userId } });
    const isDefault = dto.isDefault ?? count === 0;

    if (isDefault) {
      await prisma.smtpAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const passEncrypted = encryptText(dto.password);

    const account = await prisma.smtpAccount.create({
      data: {
        userId,
        name: dto.name,
        host: dto.host,
        port,
        secure,
        username: dto.username,
        passEncrypted,
        fromName: dto.fromName || dto.name,
        fromEmail: dto.fromEmail || dto.username,
        isDefault,
        isVerified: true,
      },
    });

    const { passEncrypted: _, ...safeAccount } = account;
    return { ...safeAccount, hasPassword: true };
  }

  async findAll(userId: string) {
    const accounts = await prisma.smtpAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return accounts.map(({ passEncrypted, ...acc }) => ({
      ...acc,
      hasPassword: Boolean(passEncrypted && passEncrypted.length > 0),
    }));
  }

  async findOne(userId: string, id: string) {
    const account = await prisma.smtpAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`SMTP Account ${id} not found`);
    }

    if (account.userId !== userId) {
      throw new ForbiddenException("Access denied to this SMTP account");
    }

    const { passEncrypted, ...safe } = account;
    return { ...safe, hasPassword: Boolean(passEncrypted) };
  }

  async update(userId: string, id: string, dto: UpdateSmtpAccountDto) {
    const existing = await prisma.smtpAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`SMTP Account ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this SMTP account");
    }

    let passEncrypted = existing.passEncrypted;
    let isVerified = existing.isVerified;

    if (dto.password && dto.password.trim().length > 0) {
      const port = dto.port || existing.port;
      const secure = dto.secure ?? existing.secure;
      const host = dto.host || existing.host;
      const username = dto.username || existing.username;

      const transporter = this.createTransporter({
        host,
        port,
        secure,
        username,
        passwordPlain: dto.password,
      });

      try {
        await transporter.verify();
        isVerified = true;
      } catch (err: any) {
        throw new BadRequestException(`SMTP verification failed: ${err.message}`);
      }

      passEncrypted = encryptText(dto.password);
    }

    if (dto.isDefault) {
      await prisma.smtpAccount.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.smtpAccount.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        host: dto.host ?? existing.host,
        port: dto.port ?? existing.port,
        secure: dto.secure ?? existing.secure,
        username: dto.username ?? existing.username,
        fromName: dto.fromName !== undefined ? dto.fromName : existing.fromName,
        fromEmail: dto.fromEmail !== undefined ? dto.fromEmail : existing.fromEmail,
        isDefault: dto.isDefault !== undefined ? dto.isDefault : existing.isDefault,
        passEncrypted,
        isVerified,
      },
    });

    const { passEncrypted: _, ...safe } = updated;
    return { ...safe, hasPassword: true };
  }

  async delete(userId: string, id: string) {
    const existing = await prisma.smtpAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`SMTP Account ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException("Access denied to this SMTP account");
    }

    await prisma.smtpAccount.delete({ where: { id } });

    // If deleted account was default, promote next available account
    if (existing.isDefault) {
      const nextAccount = await prisma.smtpAccount.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (nextAccount) {
        await prisma.smtpAccount.update({
          where: { id: nextAccount.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true, message: "SMTP account removed successfully" };
  }

  async testConnection(userId: string, id: string, dto?: TestSmtpAccountDto) {
    const account = await prisma.smtpAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException(`SMTP Account ${id} not found`);
    }
    if (account.userId !== userId) {
      throw new ForbiddenException("Access denied to this SMTP account");
    }

    const passwordPlain = decryptText(account.passEncrypted);
    const transporter = this.createTransporter({
      host: account.host,
      port: account.port,
      secure: account.secure,
      username: account.username,
      passwordPlain,
    });

    try {
      await transporter.verify();
    } catch (err: any) {
      await prisma.smtpAccount.update({
        where: { id },
        data: { isVerified: false },
      });
      throw new BadRequestException(`Verification failed: ${err.message}`);
    }

    let sentMessageId: string | null = null;
    if (dto?.recipientEmail) {
      try {
        const fromHeader = account.fromName
          ? `"${account.fromName}" <${account.fromEmail || account.username}>`
          : account.fromEmail || account.username;

        const info = await transporter.sendMail({
          from: fromHeader,
          to: dto.recipientEmail,
          subject: "✓ LeadEngine Pro — SMTP Test Connection Successful",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
              <h2 style="color: #38bdf8; margin-top: 0;">✓ SMTP Account Connected!</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                This test email confirms that your outgoing SMTP account <strong>${account.name}</strong> (${account.username} via ${account.host}:${account.port}) is verified and ready for high-conversion automated outreach.
              </p>
              <div style="margin: 20px 0; padding: 16px; background: #1e293b; border-radius: 8px; font-size: 13px; color: #cbd5e1;">
                <div><strong>Host:</strong> ${account.host}</div>
                <div><strong>Port:</strong> ${account.port} (${account.secure ? "SSL/TLS" : "STARTTLS"})</div>
                <div><strong>Sender:</strong> ${fromHeader}</div>
                <div><strong>Verified Timestamp:</strong> ${new Date().toISOString()}</div>
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                Sent via LeadEngine Pro Outreach Platform.
              </p>
            </div>
          `,
        });
        sentMessageId = info.messageId;
      } catch (sendErr: any) {
        throw new BadRequestException(`SMTP verified, but failed to deliver test email: ${sendErr.message}`);
      }
    }

    await prisma.smtpAccount.update({
      where: { id },
      data: {
        isVerified: true,
        lastUsedAt: new Date(),
      },
    });

    return {
      success: true,
      verified: true,
      message: dto?.recipientEmail
        ? `SMTP connection verified and test email delivered to ${dto.recipientEmail}`
        : "SMTP connection verified successfully",
      messageId: sentMessageId,
    };
  }

  async setDefault(userId: string, id: string) {
    const account = await prisma.smtpAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException(`SMTP Account ${id} not found`);
    }
    if (account.userId !== userId) {
      throw new ForbiddenException("Access denied to this SMTP account");
    }

    await prisma.smtpAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    await prisma.smtpAccount.update({
      where: { id },
      data: { isDefault: true },
    });

    return { success: true, message: `Account "${account.name}" set as default` };
  }

  /**
   * Internal helper for outreach email service
   */
  async getTransporterForAccount(accountId: string) {
    const account = await prisma.smtpAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`SMTP Account ${accountId} not found`);
    }

    const passwordPlain = decryptText(account.passEncrypted);
    const transporter = this.createTransporter({
      host: account.host,
      port: account.port,
      secure: account.secure,
      username: account.username,
      passwordPlain,
    });

    const fromAddress = account.fromName
      ? `"${account.fromName}" <${account.fromEmail || account.username}>`
      : account.fromEmail || account.username;

    return {
      transporter,
      account,
      fromAddress,
      fromEmail: account.fromEmail || account.username,
    };
  }
}
