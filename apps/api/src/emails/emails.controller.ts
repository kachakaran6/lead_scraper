import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { EmailsService } from "./emails.service";

@Controller("emails")
export class EmailsController {
  private readonly emailsService: EmailsService;
  constructor(emailsService?: EmailsService) {
    this.emailsService = emailsService || new EmailsService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.emailsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.emailsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    return this.emailsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.emailsService.update(id, dto);
  }

  @Post(":id/verify")
  async markVerified(@Param("id") id: string) {
    return this.emailsService.markVerified(id);
  }

  @Post(":id/invalid")
  async markInvalid(@Param("id") id: string) {
    return this.emailsService.markInvalid(id);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.emailsService.remove(id);
  }

  @Get("business/:businessId")
  async findByBusiness(@Param("businessId") businessId: string) {
    return this.emailsService.findByBusiness(businessId);
  }
}
