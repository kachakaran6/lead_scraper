import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppAction, can } from "./roles";

export const PERMISSION_ACTION_KEY = "rbac_action";
export const RequireAction = (action: AppAction) => SetMetadata(PERMISSION_ACTION_KEY, action);

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private reflector: Reflector;

  constructor(reflector?: Reflector) {
    this.reflector = reflector || new Reflector();
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

    if (!requiredAction && (!requiredRoles || requiredRoles.length === 0)) {
      return true; // No RBAC restrictions on this endpoint
    }

    const request = context.switchToHttp().getRequest();
    // Resolve user role: from JWT user, query, or x-user-role header (for dev/qa simulation)
    const user = request.user;
    const headerRole = request.headers["x-user-role"] as string;
    const role = (user?.role || headerRole || "member").toLowerCase();

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
