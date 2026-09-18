import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { getEnv } from "@ultimate-leads/config";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly jwtService: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnv().JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException("Invalid token payload");
    }
    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

export function createJwtToken(user: { id: string; email: string; role: string }) {
  return new JwtService({ secret: getEnv().JWT_SECRET }).sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}
