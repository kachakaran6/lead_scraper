import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { getEnv } from "@ultimate-leads/config";
import { prisma } from "@ultimate-leads/database";

export const REQUIRE_SCRAPER_ACCESS_KEY = "require_scraper_access";
export const RequireScraperAccess = () => SetMetadata(REQUIRE_SCRAPER_ACCESS_KEY, true);

export const IS_PUBLIC_KEY = "is_public";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class ScraperAccessGuard implements CanActivate {
  private jwtService: JwtService;

  constructor(private reflector: Reflector) {
    this.jwtService = new JwtService({ secret: getEnv().JWT_SECRET });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    let user = request.user;

    // Extract user from JWT if not already populated by Passport
    if (!user) {
      const authHeader = request.headers?.authorization || request.headers?.Authorization;
      if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        try {
          const payload = this.jwtService.verify(token);
          if (payload && payload.sub) {
            user = {
              id: payload.sub,
              sub: payload.sub,
              email: payload.email,
              role: payload.role || "MEMBER",
            };
            request.user = user;
          }
        } catch {
          // Token invalid or expired
        }
      }
    }

    if (!user || !user.id) {
      throw new UnauthorizedException({
        error: "UNAUTHORIZED",
        message: "Authentication required to access Lead Scrapper operations.",
      });
    }

    // Query current user authorization state from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
        scraperAccess: true,
      },
    });

    if (!dbUser) {
      throw new UnauthorizedException({
        error: "USER_NOT_FOUND",
        message: "User account does not exist.",
      });
    }

    // Attach latest dbUser state to request
    request.user = {
      ...user,
      accountStatus: dbUser.accountStatus,
      scraperAccess: dbUser.scraperAccess,
      role: dbUser.role,
    };

    // 1. Account must be active
    if (dbUser.accountStatus === "PENDING") {
      throw new ForbiddenException({
        error: "ACCOUNT_PENDING_APPROVAL",
        code: "ACCOUNT_PENDING_APPROVAL",
        message:
          "Your account is currently pending administrator approval. Please contact your administrator.",
      });
    }

    if (dbUser.accountStatus === "SUSPENDED") {
      throw new ForbiddenException({
        error: "ACCOUNT_SUSPENDED",
        code: "ACCOUNT_SUSPENDED",
        message:
          "Your account has been suspended by an administrator. Please contact support.",
      });
    }

    if (dbUser.accountStatus === "DISABLED") {
      throw new ForbiddenException({
        error: "ACCOUNT_DISABLED",
        code: "ACCOUNT_DISABLED",
        message:
          "Your account has been disabled. Access to Lead Scrapper is restricted.",
      });
    }

    if (dbUser.accountStatus !== "ACTIVE") {
      throw new ForbiddenException({
        error: "ACCOUNT_INACTIVE",
        code: "ACCOUNT_INACTIVE",
        message: "Your account is not active.",
      });
    }

    // 2. Scraper access must be explicitly granted (or user is OWNER/ADMIN)
    const isOwnerOrAdmin = dbUser.role === "OWNER" || dbUser.role === "ADMIN";
    if (!dbUser.scraperAccess && !isOwnerOrAdmin) {
      throw new ForbiddenException({
        error: "SCRAPER_ACCESS_REVOKED",
        code: "SCRAPER_ACCESS_REVOKED",
        message:
          "Your Lead Scrapper access has not been authorized or has been revoked by an administrator.",
      });
    }

    return true;
  }
}
