import { Module } from "@nestjs/common";
import { SmtpAccountsService } from "./smtp-accounts.service";
import { SmtpAccountsController } from "./smtp-accounts.controller";

@Module({
  controllers: [SmtpAccountsController],
  providers: [SmtpAccountsService],
  exports: [SmtpAccountsService],
})
export class SmtpAccountsModule {}
