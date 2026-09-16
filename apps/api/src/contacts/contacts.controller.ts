import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ContactsService } from "./contacts.service";

@Controller("contacts")
export class ContactsController {
  private readonly contactsService: ContactsService;
  constructor(contactsService?: ContactsService) {
    this.contactsService = contactsService || new ContactsService();
  }

  @Get()
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.contactsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>) {
    return this.contactsService.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: Record<string, unknown>) {
    return this.contactsService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.contactsService.remove(id);
  }

  @Get("business/:businessId")
  async findByBusiness(@Param("businessId") businessId: string) {
    return this.contactsService.findByBusiness(businessId);
  }
}
