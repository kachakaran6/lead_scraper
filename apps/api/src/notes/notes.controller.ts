import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { NotesService } from "./notes.service";
import { requireAuth } from "../auth/auth.utils";

@Controller("notes")
@UseGuards(AuthGuard("jwt"))
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  async create(@Body() dto: any, @Req() req) {
    const user = requireAuth(req);
    return this.notesService.create({
      content: dto.content,
      business: { connect: { id: dto.businessId } },
      user: { connect: { id: user.id } },
    });
  }

  @Get("business/:businessId")
  async findAll(@Param("businessId") businessId: string) {
    return this.notesService.findAll(businessId);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.notesService.remove(id);
  }
}