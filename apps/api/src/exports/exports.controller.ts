import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Ip,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ExportsService, ExportFilterParams } from "./exports.service";

@Controller("exports")
@UseGuards(AuthGuard("jwt"))
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.exportsService.findAll(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.exportsService.findOne(id, userId);
  }

  @Post()
  async create(@Body() dto: Record<string, unknown>, @Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.exportsService.create({ ...dto, userId } as any);
  }

  @Post("download")
  async download(
    @Body() filters: ExportFilterParams,
    @Req() req: any,
    @Ip() ip: string
  ) {
    const userId = req.user.id || req.user.sub;
    return this.exportsService.generateDownload(userId, filters, ip);
  }
}
