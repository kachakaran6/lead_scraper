import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { publicUser } from "./auth.utils";

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
  @UseGuards(AuthGuard("jwt"))
  async me(@Req() req) {
    return { user: publicUser(req.user) };
  }
}
