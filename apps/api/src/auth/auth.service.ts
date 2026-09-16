import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import { prisma } from "@ultimate-leads/database";
import { hashPassword, verifyPassword } from "./auth.utils";

interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException("Email already registered");

    const isFirstUser = (await prisma.user.count()) === 0;
    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash: hashPassword(dto.password),
        role: isFirstUser ? "OWNER" : "MEMBER",
        emailVerified: isFirstUser,
      },
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: this.jwtService.sign({ sub: user.id, email: user.email, role: user.role }),
    };
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.passwordHash) throw new UnauthorizedException("Invalid credentials");
    if (!verifyPassword(dto.password, user.passwordHash)) throw new UnauthorizedException("Invalid credentials");

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token: this.jwtService.sign({ sub: user.id, email: user.email, role: user.role }),
    };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("User not found");
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }
}
