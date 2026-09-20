import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { prisma } from "@ultimate-leads/database";
import { hashPassword, verifyPassword } from "./auth.utils";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const isFirstUser = (await prisma.user.count()) === 0;
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name?.trim() || null,
        passwordHash: hashPassword(dto.password),
        role: isFirstUser ? "OWNER" : "MEMBER",
        accountStatus: isFirstUser ? "ACTIVE" : "PENDING",
        scraperAccess: isFirstUser,
        emailVerified: isFirstUser, // First owner automatically verified
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        ipAddress: ipAddress || null,
        details: {
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          scraperAccess: user.scraperAccess,
        },
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountStatus: user.accountStatus,
        scraperAccess: user.scraperAccess,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      throw new ForbiddenException(
        `Account is temporarily locked due to consecutive failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      );
    }

    const isValid = verifyPassword(dto.password, user.passwordHash);

    if (!isValid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const willLock = attempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = willLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "LOGIN_FAILED",
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
          details: { attempt: attempts, locked: willLock },
        },
      });

      if (willLock) {
        throw new ForbiddenException(
          "Account is temporarily locked due to consecutive failed login attempts. Please try again in 15 minutes."
        );
      }

      throw new UnauthorizedException("Invalid email or password");
    }

    // If user is OWNER or ADMIN and not suspended/disabled, ensure ACTIVE with scraperAccess
    let accountStatus = user.accountStatus;
    let scraperAccess = user.scraperAccess;
    if (
      (user.role === "OWNER" || user.role === "ADMIN") &&
      user.accountStatus !== "SUSPENDED" &&
      user.accountStatus !== "DISABLED" &&
      (user.accountStatus !== "ACTIVE" || !user.scraperAccess)
    ) {
      accountStatus = "ACTIVE";
      scraperAccess = true;
    }

    // Successful login: reset failed attempts & update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        accountStatus,
        scraperAccess,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: { email: user.email },
      },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountStatus,
        scraperAccess,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Avoid email enumeration: return standard success message regardless of existence
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          ipAddress: ipAddress || null,
          details: { email: user.email },
        },
      });

      // In production, an email is dispatched with the token link.
      // For local verification and audit logging, return the dev token if not in production.
      const isDev = process.env.NODE_ENV !== "production";
      return {
        success: true,
        message:
          "If your email is registered, you will receive a secure password reset link shortly.",
        ...(isDev && { resetToken }),
      };
    }

    return {
      success: true,
      message:
        "If your email is registered, you will receive a secure password reset link shortly.",
    };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(dto.token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        "Invalid or expired password reset token. Please request a new one."
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(dto.newPassword),
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_RESET_COMPLETED",
        ipAddress: ipAddress || null,
        details: { email: user.email },
      },
    });

    return {
      success: true,
      message: "Password reset successfully. You may now log in with your new password.",
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ipAddress?: string
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new NotFoundException("User not found");
    }

    const isValid = verifyPassword(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException("Current password is incorrect");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(dto.newPassword) },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGED",
        ipAddress: ipAddress || null,
      },
    });

    return {
      success: true,
      message: "Password updated successfully.",
    };
  }

  async logout(userId: string, ipAddress?: string) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "LOGOUT",
        ipAddress: ipAddress || null,
      },
    });
    return { success: true, message: "Logged out successfully" };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountStatus: true,
        scraperAccess: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return user;
  }
}
