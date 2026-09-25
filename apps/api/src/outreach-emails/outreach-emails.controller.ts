import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { OutreachEmailsService } from "./outreach-emails.service";
import { SendOutreachEmailDto, QueryOutreachEmailDto } from "./dto/send-outreach-email.dto";

@Controller()
export class OutreachEmailsController {
  constructor(private readonly outreachEmailsService: OutreachEmailsService) {}

  @UseGuards(AuthGuard("jwt"))
  @Post("outreach-emails")
  async sendEmail(@Req() req: any, @Body() dto: SendOutreachEmailDto) {
    const userId = req.user.id || req.user.sub;
    return this.outreachEmailsService.sendEmail(userId, dto);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("outreach-emails")
  async findAll(@Req() req: any, @Query() query: QueryOutreachEmailDto) {
    const userId = req.user.id || req.user.sub;
    return this.outreachEmailsService.findAll(userId, query);
  }

  @UseGuards(AuthGuard("jwt"))
  @Get("outreach-emails/analytics")
  async getAnalytics(@Req() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.outreachEmailsService.getAnalytics(userId);
  }

  // ─────────────────────────────────────────────────────────────
  // Public Tracking Endpoints (No JWT required)
  // ─────────────────────────────────────────────────────────────

  @Get("track/open/:trackingId")
  async trackOpen(@Param("trackingId") trackingId: string, @Res() res: Response) {
    const gifBuffer = await this.outreachEmailsService.trackOpen(trackingId);

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.end(gifBuffer);
  }

  @Get("track/click/:trackingId")
  async trackClick(
    @Param("trackingId") trackingId: string,
    @Query("url") targetUrl: string,
    @Res() res: Response
  ) {
    const redirectUrl = await this.outreachEmailsService.trackClick(
      trackingId,
      targetUrl
    );
    res.redirect(302, redirectUrl);
  }
}
