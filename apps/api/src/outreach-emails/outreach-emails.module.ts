import { Module } from "@nestjs/common";
import { OutreachEmailsService } from "./outreach-emails.service";
import { OutreachEmailsController } from "./outreach-emails.controller";
import { SmtpAccountsModule } from "../smtp-accounts/smtp-accounts.module";

@Module({
  imports: [SmtpAccountsModule],
  controllers: [OutreachEmailsController],
  providers: [OutreachEmailsService],
  exports: [OutreachEmailsService],
})
export class OutreachEmailsModule {}
