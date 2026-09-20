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

export const REQUIRE_ADMIN_KEY = "require_admin";
export const RequireAdmin = () => SetMetadata(REQUIRE_ADMIN_KEY, true);

@Injectable()
export class AdminGuard implements CanActivate {
  private jwtService: JwtService;

  constructor(private reflector: Reflector) {
    this.jwtService = new JwtService({ secret: getEnv().JWT_SECRET });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let user = request.user;

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
          // Invalid token
        }
      }
    }

    if (!user || !user.id) {
      throw new UnauthorizedException({
        error: "UNAUTHORIZED",
        message: "Administrator authentication required.",
      });
    }

    // Check database state directly for strict security (no stale token bypass)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });

    if (!dbUser) {
      throw new UnauthorizedException({
        error: "USER_NOT_FOUND",
        message: "Admin account not found.",
      });
    }

    if (dbUser.accountStatus !== "ACTIVE") {
      throw new ForbiddenException({
        error: "ADMIN_ACCOUNT_INACTIVE",
        message: `Admin account is currently ${dbUser.accountStatus.toLowerCase()}.`,
      });
    }

    if (dbUser.role !== "ADMIN" && dbUser.role !== "OWNER") {
      throw new ForbiddenException({
        error: "FORBIDDEN",
        message: "Administrative privileges required to access this resource.",
      });
    }

    request.user = {
      ...user,
      role: dbUser.role,
      accountStatus: dbUser.accountStatus,
    };

    return true;
  }
}
