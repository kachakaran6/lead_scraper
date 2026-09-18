import { WorkerJobData, BaseWorker } from "../base-worker";
import { prisma } from "@ultimate-leads/database";
import { Job, Worker } from "bullmq";
import { isGenericEmail, SOCIAL_PLATFORMS } from "@ultimate-leads/shared";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import * as cheerio from "cheerio";
import axios from "axios";
import pLimit from "p-limit";

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[\w.]+/gi;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}/g;

const SOCIAL_DOMAINS: Record<string, RegExp> = {
  FACEBOOK: /facebook\.com/i,
  INSTAGRAM: /instagram\.com/i,
  TWITTER: /(?:twitter\.com|x\.com)/i,
  LINKEDIN: /linkedin\.com/i,
  YOUTUBE: /(?:youtube\.com|youtu\.be)/i,
  TIKTOK: /tiktok\.com/i,
  THREADS: /threads\.net/i,
  PINTEREST: /pinterest\.com/i,
};

export class CrawlWorker extends BaseWorker {
  constructor() {
    super("crawler", "crawler");
  }

  async start(): Promise<Worker> {
    const worker = this.getWorker(async (job: Job<WorkerJobData>) => {
      await this.markStarted(job.id!);
      await this.markProgress(job.id!, 5);

      const result = await this.processCrawl(job.data, job.id!);

      await this.markCompleted(job.id!, result);
      return result;
    });

    this.registerEvents(worker);
    console.log(`[${this.workerName}] Crawl worker started`);
    return worker;
  }

  private async processCrawl(data: WorkerJobData, jobId: string): Promise<Record<string, unknown>> {
    const { url, businessId } = data;
    if (!url) throw new Error("URL is required for crawl job");

    await this.markProgress(jobId, 15);

    try {
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);

      // Extract emails
      const emails = this.extractEmails($, url);
      // Extract phones
      const phones = this.extractPhones($, url);
      // Extract social links
      const socials = this.extractSocials($, url);
      // Extract title/meta
      const title = $("title").text().trim();
      const metaDesc = $('meta[name="description"]').attr("content")?.trim();
      const h1Count = $("h1").length;
      const h2Count = $("h2").length;
      const hasContactForm = $("form").length > 0;
      const hasWhatsApp = html.toLowerCase().includes("wa.me") || html.toLowerCase().includes("whatsapp.com");

      if (businessId) {
        await this.persistCrawlResults(businessId, { emails, phones, socials, title, metaDesc, h1Count, h2Count, hasContactForm, hasWhatsApp });
      }

      await this.markProgress(jobId, 90);

      return {
        url,
        businessId,
        emails: emails.length,
        phones: phones.length,
        socials: socials.length,
        title,
        metaDesc,
        h1Count,
        h2Count,
        hasContactForm,
        hasWhatsApp,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markFailed(jobId, message);
      throw error;
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await axios.get(url, {
      timeout: 30000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "UltimateLeadEngine/1.0 (+https://self-hosted.local)",
      },
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.data;
  }

  private extractEmails($: any, baseUrl: string): string[] {
    const emails = new Set<string>();
    $("a[href], body").each((_i: any, el: any) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text() || "";
      const candidates = [href, text];
      for (const candidate of candidates) {
        const matches = candidate.match(EMAIL_REGEX);
        if (matches) {
          for (const email of matches) {
            emails.add(email.toLowerCase().replace(/^mailto:/, ""));
          }
        }
      }
    });
    return Array.from(emails).slice(0, 50);
  }

  private extractPhones($: any, baseUrl: string): string[] {
    const phones = new Set<string>();
    $("a[href], body").each((_i: any, el: any) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text() || "";
      const candidates = [href, text];
      for (const candidate of candidates) {
        const matches = candidate.match(PHONE_REGEX);
        if (matches) {
          for (const phone of matches) {
            phones.add(phone.trim());
          }
        }
      }
    });
    return Array.from(phones).slice(0, 20);
  }

  private extractSocials(
    $: any,
    baseUrl: string,
  ): Array<{ platform: string; url: string }> {
    const socials: Array<{ platform: string; url: string }> = [];
    $("a[href]").each((_i: any, el: any) => {
      const href = $(el).attr("href");
      if (!href) return;
      for (const [platform, pattern] of Object.entries(SOCIAL_DOMAINS)) {
        if (pattern.test(href)) {
          socials.push({ platform, url: href });
          break;
        }
      }
    });
    return socials;
  }

  private async persistCrawlResults(
    businessId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const emails = (data.emails as string[]) || [];
    const phones = (data.phones as string[]) || [];
    const socials = (data.socials as Array<{ platform: string; url: string }>) || [];

    for (const email of emails) {
      await prisma.email.upsert({
        where: { businessId_value: { businessId, value: email } },
        update: {},
        create: {
          value: email,
          businessId,
          status: "UNVERIFIED",
          isGeneric: isGenericEmail(email),
        },
      });
    }

    for (const phone of phones) {
      const parsed = parsePhoneNumberFromString(phone);
      let pType: "MOBILE" | "LANDLINE" | "UNKNOWN" = "UNKNOWN";
      if (parsed?.getType() === "MOBILE") pType = "MOBILE";
      else if (parsed?.getType() === "FIXED_LINE") pType = "LANDLINE";

      await prisma.phone.upsert({
        where: { businessId_value: { businessId, value: phone } },
        update: {},
        create: {
          value: phone,
          businessId,
          countryCode: parsed?.countryCallingCode ? String(parsed.countryCallingCode) : undefined,
          formatted: parsed?.formatInternational() ?? phone,
          type: pType,
        },
      });
    }

    for (const social of socials) {
      await prisma.socialProfile.upsert({
        where: { businessId_platform: { businessId, platform: social.platform as any } },
        update: {},
        create: {
          platform: social.platform as any,
          url: social.url,
          businessId,
        },
      });
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { lastCrawled: new Date() },
    });
  }
}

