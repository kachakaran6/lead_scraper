import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { getEnv } from "@ultimate-leads/config";
import { AppAction, can } from "./roles";

export const PERMISSION_ACTION_KEY = "rbac_action";
export const RequireAction = (action: AppAction) => SetMetadata(PERMISSION_ACTION_KEY, action);

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private reflector: Reflector;
  private jwtService: JwtService;

  constructor(reflector?: Reflector) {
    this.reflector = reflector || new Reflector();
    this.jwtService = new JwtService({ secret: getEnv().JWT_SECRET });
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredAction = this.reflector.getAllAndOverride<AppAction>(
      PERMISSION_ACTION_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    const request = context.switchToHttp().getRequest();
    let user = request.user;

    // Decode and verify JWT from Authorization header if request.user is not yet populated
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

    if (!requiredAction && (!requiredRoles || requiredRoles.length === 0)) {
      return true; // No RBAC restrictions on this endpoint
    }

    if (!user || !user.role) {
      // Allow public/guest access for general read actions and discovery
      if (requiredAction === "DISCOVERY_RUN" || requiredAction === "LEADS_VIEW") {
        return true;
      }
      throw new ForbiddenException({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required to access this resource",
        },
      });
    }

    const role = user.role.toLowerCase();

    // Check specific action requirement
    if (requiredAction) {
      const allowed = can(role, requiredAction);
      if (!allowed) {
        throw new ForbiddenException({
          error: {
            code: "FORBIDDEN",
            message: `Role '${role}' is not authorized to perform action '${requiredAction}'`,
            requiredAction,
            currentRole: role,
          },
        });
      }
    }

    // Check role whitelist requirement
    if (requiredRoles && requiredRoles.length > 0) {
      const allowed = requiredRoles.map((r) => r.toLowerCase()).includes(role);
      if (!allowed) {
        throw new ForbiddenException({
          error: {
            code: "FORBIDDEN",
            message: `Access denied. Role '${role}' lacks one of required roles: [${requiredRoles.join(", ")}]`,
            requiredRoles,
            currentRole: role,
          },
        });
      }
    }

    return true;
  }
}

