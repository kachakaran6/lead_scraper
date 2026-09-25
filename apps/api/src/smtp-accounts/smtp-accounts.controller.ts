import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { SmtpAccountsService } from "./smtp-accounts.service";
import { CreateSmtpAccountDto, TestSmtpAccountDto } from "./dto/create-smtp-account.dto";
import { UpdateSmtpAccountDto } from "./dto/update-smtp-account.dto";

@Controller("smtp-accounts")
@UseGuards(AuthGuard("jwt"))
export class SmtpAccountsController {
  constructor(private readonly smtpAccountsService: SmtpAccountsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.findAll(userId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateSmtpAccountDto) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.create(userId, dto);
  }

  @Get(":id")
  async findOne(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.findOne(userId, id);
  }

  @Patch(":id")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateSmtpAccountDto
  ) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.update(userId, id, dto);
  }

  @Delete(":id")
  async delete(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.delete(userId, id);
  }

  @Post(":id/test")
  async testConnection(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: TestSmtpAccountDto
  ) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.testConnection(userId, id, dto);
  }

  @Post(":id/set-default")
  async setDefault(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.smtpAccountsService.setDefault(userId, id);
  }
}
