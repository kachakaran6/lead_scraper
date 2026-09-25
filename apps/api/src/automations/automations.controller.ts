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
import { AutomationsService } from "./automations.service";
import { CreateAutomationDto } from "./dto/create-automation.dto";
import { UpdateAutomationDto } from "./dto/update-automation.dto";

@Controller("automations")
@UseGuards(AuthGuard("jwt"))
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.findAll(userId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateAutomationDto) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.create(userId, dto);
  }

  @Get(":id")
  async findOne(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.findOne(userId, id);
  }

  @Patch(":id")
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateAutomationDto
  ) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.update(userId, id, dto);
  }

  @Delete(":id")
  async delete(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.delete(userId, id);
  }

  @Post(":id/start")
  async start(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.start(userId, id);
  }

  @Post(":id/pause")
  async pause(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.pause(userId, id);
  }

  @Post(":id/resume")
  async resume(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.resume(userId, id);
  }

  @Get(":id/analytics")
  async getAnalytics(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.getAnalytics(userId, id);
  }

  @Get(":id/runs")
  async getRuns(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.automationsService.getRuns(userId, id);
  }
}
