import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma, UserRole, AccountStatus, Prisma } from "@ultimate-leads/database";

@Injectable()
export class AdminService {
  /**
   * KPI metrics for the Admin Dashboard
   */
  async getStats() {
    const [
      totalUsers,
      pendingApprovals,
      activeScraperUsers,
      suspendedUsers,
      disabledUsers,
      totalAdmins,
      recentAuditLogsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accountStatus: "PENDING" } }),
      prisma.user.count({ where: { scraperAccess: true, accountStatus: "ACTIVE" } }),
      prisma.user.count({ where: { accountStatus: "SUSPENDED" } }),
      prisma.user.count({ where: { accountStatus: "DISABLED" } }),
      prisma.user.count({ where: { role: { in: ["ADMIN", "OWNER"] } } }),
      prisma.auditLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalUsers,
      pendingApprovals,
      activeScraperUsers,
      suspendedUsers,
      disabledUsers,
      totalAdmins,
      recentAuditLogsCount,
    };
  }

  /**
   * Paginated list of users with search and filter capabilities
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    accountStatus?: string;
    scraperAccess?: string;
    role?: string;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    // Search by name, email, or user ID
    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { id: { equals: q } },
      ];
    }

    // Filter by AccountStatus
    if (params.accountStatus && params.accountStatus !== "ALL") {
      where.accountStatus = params.accountStatus as AccountStatus;
    }

    // Filter by ScraperAccess
    if (params.scraperAccess && params.scraperAccess !== "ALL") {
      where.scraperAccess = params.scraperAccess === "true" || params.scraperAccess === "ENABLED";
    }

    // Filter by Role
    if (params.role && params.role !== "ALL") {
      where.role = params.role as UserRole;
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          accountStatus: true,
          scraperAccess: true,
          approvedBy: true,
          approvedAt: true,
          suspendedAt: true,
          disabledAt: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              businesses: true,
              discoveryProfiles: true,
              exports: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Detailed user profile with authorization history and audit records
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            businesses: true,
            discoveryProfiles: true,
            exports: true,
            apiKeys: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Fetch related audit logs for this user (both user actions and actions on user)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId: id },
          { details: { path: ["targetUserId"], equals: id } },
        ],
      },
      take: 25,
      orderBy: { createdAt: "desc" },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountStatus: user.accountStatus,
        scraperAccess: user.scraperAccess,
        approvedBy: user.approvedBy,
        approvedAt: user.approvedAt,
        suspendedAt: user.suspendedAt,
        disabledAt: user.disabledAt,
        emailVerified: user.emailVerified,
        failedLoginAttempts: user.failedLoginAttempts,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        counts: user._count,
      },
      auditLogs,
    };
  }

  /**
   * Approves a user, setting accountStatus to ACTIVE and granting scraperAccess
   */
  async approveUser(
    targetUserId: string,
    adminUser: { id: string; email: string; name?: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    const now = new Date();
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: "ACTIVE",
        scraperAccess: true,
        approvedBy: adminUser.email || adminUser.id,
        approvedAt: now,
        suspendedAt: null,
        disabledAt: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "USER_APPROVED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousStatus: target.accountStatus,
          newStatus: "ACTIVE",
          scraperAccessGranted: true,
          approvedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Enables a disabled or suspended account
   */
  async enableUser(
    targetUserId: string,
    adminUser: { id: string; email: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: "ACTIVE",
        suspendedAt: null,
        disabledAt: null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "USER_ENABLED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousStatus: target.accountStatus,
          newStatus: "ACTIVE",
          performedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Disables an account and revokes scraper access immediately
   */
  async disableUser(
    targetUserId: string,
    adminUser: { id: string; email: string },
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    if (target.id === adminUser.id) {
      throw new BadRequestException("Administrators cannot disable their own account.");
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: "DISABLED",
        scraperAccess: false,
        disabledAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "USER_DISABLED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousStatus: target.accountStatus,
          newStatus: "DISABLED",
          scraperAccessRevoked: true,
          reason: reason || "Disabled by administrator",
          performedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Suspends an account and revokes scraper access
   */
  async suspendUser(
    targetUserId: string,
    adminUser: { id: string; email: string },
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    if (target.id === adminUser.id) {
      throw new BadRequestException("Administrators cannot suspend their own account.");
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        accountStatus: "SUSPENDED",
        scraperAccess: false,
        suspendedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "USER_SUSPENDED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousStatus: target.accountStatus,
          newStatus: "SUSPENDED",
          scraperAccessRevoked: true,
          reason: reason || "Suspended by administrator",
          performedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Explicitly grants Lead Scrapper access
   */
  async grantScraperAccess(
    targetUserId: string,
    adminUser: { id: string; email: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        scraperAccess: true,
        accountStatus: target.accountStatus === "PENDING" ? "ACTIVE" : target.accountStatus,
        approvedBy: target.approvedBy || adminUser.email,
        approvedAt: target.approvedAt || new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "SCRAPER_ACCESS_GRANTED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousAccess: target.scraperAccess,
          newAccess: true,
          performedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Explicitly revokes Lead Scrapper access
   */
  async revokeScraperAccess(
    targetUserId: string,
    adminUser: { id: string; email: string },
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        scraperAccess: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "SCRAPER_ACCESS_REVOKED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousAccess: target.scraperAccess,
          newAccess: false,
          reason: reason || "Revoked by administrator",
          performedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Changes user role (OWNER, ADMIN, MEMBER, VIEWER)
   */
  async changeRole(
    targetUserId: string,
    newRole: UserRole,
    adminUser: { id: string; email: string },
    ipAddress?: string,
    userAgent?: string
  ) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Target user not found.");

    if (target.id === adminUser.id && newRole !== "OWNER" && newRole !== "ADMIN") {
      throw new BadRequestException("Administrators cannot demote themselves.");
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "ROLE_CHANGED",
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        details: {
          targetUserId,
          targetUserEmail: target.email,
          previousRole: target.role,
          newRole,
          performedBy: adminUser.email,
        },
      },
    });

    return updated;
  }

  /**
   * Paginated audit logs stream
   */
  async getAuditLogs(params: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
  }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Math.max(Number(params.limit) || 30, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (params.action && params.action !== "ALL") {
      where.action = { contains: params.action, mode: "insensitive" };
    }

    if (params.userId) {
      where.OR = [
        { userId: params.userId },
        { details: { path: ["targetUserId"], equals: params.userId } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Idempotent bootstrap helper for initial admin promotion
   */
  async bootstrapAdmin(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${normalizedEmail} does not exist.`);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "OWNER",
        accountStatus: "ACTIVE",
        scraperAccess: true,
        emailVerified: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "ADMIN_BOOTSTRAP",
        details: { email: user.email, promotedTo: "OWNER" },
      },
    });

    return {
      message: `User ${normalizedEmail} successfully promoted to OWNER with ACTIVE status and full scraper access.`,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        accountStatus: updated.accountStatus,
        scraperAccess: updated.scraperAccess,
      },
    };
  }
}
