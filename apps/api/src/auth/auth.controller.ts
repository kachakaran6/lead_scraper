import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Ip,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from "./dto/auth.dto";
import { getRoleCapabilities } from "./roles";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string
  ) {
    return this.authService.login(dto, ip, userAgent);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    return this.authService.forgotPassword(dto, ip);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    return this.authService.resetPassword(dto, ip);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto,
    @Ip() ip: string
  ) {
    return this.authService.changePassword(req.user.id || req.user.sub, dto, ip);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Ip() ip: string) {
    return this.authService.logout(req.user.id || req.user.sub, ip);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("me")
  async me(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    const user = await this.authService.me(userId);
    const role = (user.role || "MEMBER").toLowerCase();
    return {
      user,
      capabilities: getRoleCapabilities(role),
    };
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("permissions")
  async permissions(@Req() req: any) {
    const role = (req.user?.role || "MEMBER").toLowerCase();
    return getRoleCapabilities(role);
  }
}
