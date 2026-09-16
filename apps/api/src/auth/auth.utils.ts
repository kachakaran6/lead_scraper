import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getEnv } from "@ultimate-leads/config";

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

export function requireAuth(req: AuthenticatedRequest): AuthenticatedUser {
  if (!req.user) throw new BadRequestException("Authentication required");
  return req.user;
}

export function publicUser(user: AuthenticatedUser) {
  return { id: user.id, email: user.email, role: user.role };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function isOwnerOrAdmin(user: AuthenticatedUser): boolean {
  return user.role === "OWNER" || user.role === "ADMIN";
}

export function isOwner(user: AuthenticatedUser): boolean {
  return user.role === "OWNER";
}

export function getBearerToken(req: AuthenticatedRequest): string | null {
  const auth = req.headers?.authorization;
  if (!auth) return null;
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export function parsePagination(query: Record<string, string | string[] | undefined>) {
  const page = query.page ? parseInt(query.page as string, 10) : 1;
  const limit = query.limit ? parseInt(query.limit as string, 10) : 20;
  return {
    skip: Math.max(0, (page - 1) * limit),
    take: Math.min(Math.max(1, limit), 200),
    page,
    limit: Math.min(Math.max(1, limit), 200),
  };
}

export function getOptionalId(id: string | undefined): string | undefined {
  return id;
}

export function handlePrismaError(error: unknown): never {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new BadRequestException("Duplicate value");
    if (error.code === "P2025") throw new BadRequestException("Record not found");
  }
  throw error;
}
