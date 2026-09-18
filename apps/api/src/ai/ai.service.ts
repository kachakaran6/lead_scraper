import { Injectable, BadRequestException } from "@nestjs/common";
import axios from "axios";
import { getEnv } from "@ultimate-leads/config";

@Injectable()
export class AIService {
  private readonly defaultModel = "meta-llama/llama-3.3-70b-instruct";
  private readonly fallbackModel = "google/gemini-2.0-flash-001";

  isConfigured(): boolean {
    const key = getEnv().OPENROUTER_API_KEY;
    return Boolean(key && key.trim().length > 5);
  }

  getStatus() {
    const env = getEnv();
    const key = env.OPENROUTER_API_KEY;
    const isConfigured = Boolean(key && key.trim().length > 5);

    return {
      configured: isConfigured,
      provider: "OpenRouter",
      model: env.OPENROUTER_MODEL || this.defaultModel,
      maskedKey: isConfigured
        ? `${key!.slice(0, 7)}••••••••${key!.slice(-4)}`
        : null,
    };
  }

  async analyzeLead(lead: Record<string, unknown>): Promise<any> {
    const systemPrompt = `You are a professional B2B lead intelligence consultant.
Analyze the provided business details and extract legitimate business opportunities.

CRITICAL INTEGRITY RULES:
1. NEVER invent, fabricate, or hallucinate missing information.
2. If phone, email, or website is null/missing, explicitly note it as "Not available from verified sources".
3. Provide actionable outreach angles based ONLY on verified fields.

Format response as JSON:
{
  "summary": "2-sentence executive summary based solely on verified facts",
  "digitalReadiness": "High" | "Medium" | "Low",
  "missingAssets": ["list of genuinely missing assets like website, online booking, etc."],
  "outreachHook": "1-sentence high-converting pitch hook",
  "recommendedOffer": "specific service package (e.g. Website Creation, SEO, Booking System)"
}`;

    const userPrompt = `Verified Business Profile:
Name: ${lead.name || "Unknown"}
Category: ${lead.category || "Not available"}
Address: ${lead.address || "Not available"}, ${lead.city || ""} ${lead.state || ""} ${lead.country || ""}
Phone: ${lead.phone || "Not available"}
Website: ${lead.website || "No website found"}
Rating: ${lead.rating ? `${lead.rating}★ (${lead.reviewCount || 0} reviews)` : "Not available"}
Source: ${lead.sourceProvider || lead.source || "Database"}
Verification Status: ${lead.verificationStatus || "UNVERIFIED"}`;

    const raw = await this.callOpenRouter(systemPrompt, userPrompt);
    try {
      // Clean possible markdown code fences
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        summary: raw,
        digitalReadiness: lead.website ? "Medium" : "Low",
        missingAssets: !lead.website ? ["Official Website"] : [],
        outreachHook: `Modern digital engagement solutions for ${lead.name}`,
        recommendedOffer: !lead.website ? "New Business Website" : "Website Optimization",
      };
    }
  }

  async summarizeLead(lead: Record<string, unknown>): Promise<{ summary: string }> {
    const systemPrompt = `You are a factual business research assistant.
Summarize the following business based STRICTLY on the facts provided.
If any field is missing, state that it is not available. Never invent facts. Keep to 2-3 sentences.`;

    const userPrompt = `Business Data:
Name: ${lead.name}
Category: ${lead.category || "Unknown"}
Location: ${lead.city || "Unknown"}, ${lead.country || ""}
Phone: ${lead.phone || "Not available"}
Website: ${lead.website || "No website found"}
Rating: ${lead.rating || "Not available"}`;

    const summary = await this.callOpenRouter(systemPrompt, userPrompt);
    return { summary: summary.trim() };
  }

  async enhanceSearchQuery(query: string): Promise<{
    category?: string;
    city?: string;
    state?: string;
    country?: string;
    keywords?: string[];
    onlyWithoutWebsite?: boolean;
  }> {
    const systemPrompt = `You are a search query parser for a B2B business discovery platform.
Parse natural language queries into structured search parameters.
Output strictly JSON:
{
  "category": "Standard business category (e.g. Dentist, Restaurant, Lawyer)",
  "city": "City name or null",
  "state": "State name or null",
  "country": "Country name or null",
  "keywords": ["specific search terms"],
  "onlyWithoutWebsite": boolean (true if user asked for no website, missing website, etc.)
}`;

    const raw = await this.callOpenRouter(systemPrompt, `Parse this search request: "${query}"`);
    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        category: query,
        keywords: [query],
      };
    }
  }

  async researchAssistant(
    lead: Record<string, unknown>,
    question: string
  ): Promise<{ answer: string; groundedInSource: boolean }> {
    const systemPrompt = `You are an AI Lead Research Assistant for Lead Scrapper.
You answer questions about the specific business profile provided.

MANDATORY RULES:
1. Ground your answers ONLY on the provided verified profile.
2. If the user asks something that is NOT in the data (e.g. owner's private email, revenue, personal mobile), respond:
   "Information not available from the collected sources."
3. NEVER guess or invent data.`;

    const userPrompt = `Verified Profile:
${JSON.stringify(lead, null, 2)}

User Question: ${question}`;

    const answer = await this.callOpenRouter(systemPrompt, userPrompt);
    const isUnverified =
      answer.toLowerCase().includes("not available from the collected sources") ||
      answer.toLowerCase().includes("information not available");

    return {
      answer: answer.trim(),
      groundedInSource: !isUnverified,
    };
  }

  private async callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
    const env = getEnv();
    const apiKey = env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Deterministic safe fallback if key is not yet configured by user
      return "OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your backend environment settings.";
    }

    const model = env.OPENROUTER_MODEL || this.defaultModel;
    const baseURL = env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

    try {
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2, // Low temperature for factual accuracy and zero hallucination
          max_tokens: 800,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": env.FRONTEND_URL || "http://localhost:5173",
            "X-Title": "Lead Scrapper",
          },
          timeout: 15000,
        }
      );

      return (
        response.data?.choices?.[0]?.message?.content ||
        "No response generated by model."
      );
    } catch (err: any) {
      console.warn("OpenRouter request failed:", err?.response?.data || err.message);
      throw new BadRequestException(
        err?.response?.data?.error?.message ||
          "Unable to complete AI analysis at this time. Check your OpenRouter configuration."
      );
    }
  }
}
