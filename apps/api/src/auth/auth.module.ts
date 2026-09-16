import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { getEnv } from "@ultimate-leads/config";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersModule } from "../users/users.module";

import { JwtAuthGuard } from "./jwt.strategy";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: getEnv().JWT_SECRET,
      signOptions: { expiresIn: getEnv().JWT_EXPIRY },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
