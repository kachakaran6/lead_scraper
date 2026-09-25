import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { WhatsappService } from "./whatsapp.service";
import {
  CreateWhatsappAccountDto,
  SendWhatsappMessageDto,
} from "./dto/create-whatsapp-account.dto";

@Controller("whatsapp")
@UseGuards(AuthGuard("jwt"))
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get("accounts")
  async getAccounts(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.whatsappService.getAccounts(userId);
  }

  @Post("accounts")
  async createAccount(@Req() req: any, @Body() dto: CreateWhatsappAccountDto) {
    const userId = req.user.id || req.user.sub;
    return this.whatsappService.createAccount(userId, dto);
  }

  @Delete("accounts/:id")
  async deleteAccount(@Req() req: any, @Param("id") id: string) {
    const userId = req.user.id || req.user.sub;
    return this.whatsappService.deleteAccount(userId, id);
  }

  @Post("messages")
  async logMessage(@Req() req: any, @Body() dto: SendWhatsappMessageDto) {
    const userId = req.user.id || req.user.sub;
    return this.whatsappService.logMessage(userId, dto);
  }

  @Get("messages")
  async getMessages(@Req() req: any, @Query("businessId") businessId?: string) {
    const userId = req.user.id || req.user.sub;
    return this.whatsappService.getMessages(userId, businessId);
  }
}
