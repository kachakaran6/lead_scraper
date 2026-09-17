import { Body, Controller, Get, Post, Req, Headers, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { publicUser } from "./auth.utils";
import { getRoleCapabilities } from "./roles";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: { email: string; password: string; name?: string }) {
    return this.authService.register(dto);
  }

  @Post("login")
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }

  @Get("me")
  async me(@Req() req: any, @Headers("x-user-role") headerRole?: string) {
    const user = req.user || {
      id: "usr-demo-leadengine",
      email: "engineer@leadengine.internal",
      name: "Engineering Lead",
      role: headerRole || "admin",
    };
    const role = (user.role || headerRole || "admin").toLowerCase();
    return {
      user: {
        ...publicUser(user),
        role,
      },
      capabilities: getRoleCapabilities(role),
    };
  }

  @Get("permissions")
  async permissions(@Headers("x-user-role") headerRole?: string) {
    const role = headerRole || "admin";
    return getRoleCapabilities(role);
  }
}

