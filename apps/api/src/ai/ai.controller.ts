import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AIService } from "./ai.service";

@Controller("ai")
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get("status")
  async getStatus() {
    return this.aiService.getStatus();
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("analyze-lead")
  async analyzeLead(@Body() body: { lead: Record<string, unknown> }) {
    return this.aiService.analyzeLead(body.lead);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("summarize-lead")
  async summarizeLead(@Body() body: { lead: Record<string, unknown> }) {
    return this.aiService.summarizeLead(body.lead);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("enhance-query")
  async enhanceQuery(@Body() body: { query: string }) {
    return this.aiService.enhanceSearchQuery(body.query);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("research-assistant")
  async researchAssistant(
    @Body() body: { lead: Record<string, unknown>; question: string }
  ) {
    return this.aiService.researchAssistant(body.lead, body.question);
  }

  @UseGuards(AuthGuard("jwt"))
  @Post("generate-website-prompt")
  async generateWebsitePrompt(@Body() body: { businessId: string }) {
    return this.aiService.generateWebsitePrompt(body.businessId);
  }
}
