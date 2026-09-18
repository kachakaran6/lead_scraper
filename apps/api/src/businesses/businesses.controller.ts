import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { BusinessesService } from "./businesses.service";
import { RolesGuard, RequireAction } from "../auth/roles.guard";

@Controller("businesses")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class BusinessesController {
  private readonly businessesService: BusinessesService;
  constructor(businessesService?: BusinessesService) {
    this.businessesService = businessesService || new BusinessesService();
  }

  @Get()
  @RequireAction("LEADS_VIEW")
  async findAll(@Query() query: Record<string, string | string[] | undefined>) {
    return this.businessesService.findAll(query);
  }

  @Get("stats/dashboard")
  @RequireAction("LEADS_VIEW")
  async stats() {
    return this.businessesService.stats();
  }

  @Get("tags/list")
  @RequireAction("LEADS_VIEW")
  async listTags() {
    return this.businessesService.listTags();
  }

  @Get(":id")
  @RequireAction("LEADS_VIEW")
  async findOne(@Param("id") id: string) {
    return this.businessesService.findOne(id);
  }

  @Post()
  @RequireAction("LEADS_CREATE")
  async create(@Body() dto: Record<string, unknown>, @Req() req: any) {
    return this.businessesService.create({ ...dto, userId: req.user?.id } as any);
  }

  @Patch(":id")
  @RequireAction("LEADS_EDIT")
  async update(
    @Param("id") id: string,
    @Body() dto: Record<string, unknown>,
    @Req() req: any
  ) {
    return this.businessesService.update(id, dto as any);
  }

  @Delete(":id")
  @RequireAction("LEADS_DELETE")
  async remove(@Param("id") id: string, @Req() req: any) {
    return this.businessesService.remove(id);
  }

  @Post(":id/tags/:tag")
  @RequireAction("LEADS_EDIT")
  async addTag(@Param("id") id: string, @Param("tag") tag: string) {
    return this.businessesService.addTag(id, tag);
  }

  @Delete(":id/tags/:tag")
  @RequireAction("LEADS_EDIT")
  async removeTag(@Param("id") id: string, @Param("tag") tag: string) {
    return this.businessesService.removeTag(id, tag);
  }
}
