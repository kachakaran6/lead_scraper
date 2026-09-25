import { Worker, Job, Queue } from "bullmq";
import { BaseWorker, WorkerJobData } from "../base-worker";
import { prisma, AutomationStatus } from "@ultimate-leads/database";

export class AutomationWorker extends BaseWorker {
  private queue: Queue;

  constructor() {
    super("automation", "AutomationWorker");
    this.queue = this.getQueue();
  }

  async start(): Promise<Worker> {
    const worker = this.getWorker(async (job: Job<WorkerJobData>) => {
      console.log(`[AutomationWorker] Processing job ${job.name} (#${job.id})`);
      return this.processTick(job.data?.campaignId as string | undefined);
    });

    this.registerEvents(worker);

    // Schedule periodic ticks every 15 minutes
    try {
      await this.queue.upsertJobScheduler(
        "automation-tick-scheduler",
        { pattern: "*/15 * * * *" },
        {
          name: "RUN_AUTOMATION_TICK",
          data: {},
        }
      );
      console.log("[AutomationWorker] Periodic cron scheduler registered (every 15m)");
    } catch (schedErr) {
      console.warn("[AutomationWorker] Could not register upsertJobScheduler (falling back to interval):", schedErr);
      setInterval(async () => {
        try {
          await this.queue.add("RUN_AUTOMATION_TICK", {}, { removeOnComplete: true });
        } catch {}
      }, 15 * 60 * 1000);
    }

    return worker;
  }

  private isWithinSendWindow(
    windowStart: string,
    windowEnd: string,
    daysOfWeek: number[]
  ): boolean {
    const now = new Date();
    const day = now.getUTCDay(); // 0 is Sunday, 1 is Monday ...

    if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0 && !daysOfWeek.includes(day)) {
      return false;
    }

    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

    const [startH, startM] = (windowStart || "09:00").split(":").map(Number);
    const [endH, endM] = (windowEnd || "18:00").split(":").map(Number);

    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  async processTick(specificCampaignId?: string) {
    const campaigns = await prisma.automationCampaign.findMany({
      where: specificCampaignId
        ? { id: specificCampaignId, status: AutomationStatus.ACTIVE }
        : { status: AutomationStatus.ACTIVE },
      include: {
        sequences: { orderBy: { stepIndex: "asc" } },
      },
    });

    console.log(`[AutomationWorker] Evaluating ${campaigns.length} active automation campaigns`);
    const results = [];

    for (const campaign of campaigns) {
      const days = Array.isArray(campaign.daysOfWeek) ? (campaign.daysOfWeek as number[]) : [1, 2, 3, 4, 5];
      const inWindow = this.isWithinSendWindow(
        campaign.sendWindowStart,
        campaign.sendWindowEnd,
        days
      );

      if (!inWindow) {
        console.log(`[AutomationWorker] Campaign "${campaign.name}" is outside send window (${campaign.sendWindowStart} - ${campaign.sendWindowEnd} UTC)`);
        continue;
      }

      // 1. Discover and populate new leads if below daily target
      let newLeadsEnrolled = 0;
      if (campaign.dailyLeadTarget > 0) {
        const enrolledCount = await prisma.automationRun.count({
          where: { campaignId: campaign.id },
        });

        const targetLimit = campaign.totalLeadTarget
          ? Math.min(campaign.dailyLeadTarget, campaign.totalLeadTarget - enrolledCount)
          : campaign.dailyLeadTarget;

        if (targetLimit > 0) {
          // Find matching businesses not yet in this campaign
          const existingRuns = await prisma.automationRun.findMany({
            where: { campaignId: campaign.id },
            select: { businessId: true },
          });
          const existingIds = existingRuns.map((r) => r.businessId);

          const candidateBusinesses = await prisma.business.findMany({
            where: {
              id: { notIn: existingIds },
              OR: [
                { category: { contains: campaign.searchQuery, mode: "insensitive" } },
                { name: { contains: campaign.searchQuery, mode: "insensitive" } },
              ],
              ...(campaign.location
                ? {
                    OR: [
                      { city: { contains: campaign.location, mode: "insensitive" } },
                      { state: { contains: campaign.location, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            take: targetLimit,
            select: { id: true },
          });

          for (const cand of candidateBusinesses) {
            await prisma.automationRun.create({
              data: {
                campaignId: campaign.id,
                businessId: cand.id,
                currentStep: 0,
                status: "ACTIVE",
                nextActionAt: new Date(),
              },
            });
            newLeadsEnrolled++;
          }

          if (newLeadsEnrolled > 0) {
            await prisma.automationCampaign.update({
              where: { id: campaign.id },
              data: { leadsDiscovered: { increment: newLeadsEnrolled } },
            });
          }
        }
      }

      // 2. Process pending runs ready for action
      const pendingRuns = await prisma.automationRun.findMany({
        where: {
          campaignId: campaign.id,
          status: "ACTIVE",
          OR: [{ nextActionAt: null }, { nextActionAt: { lte: new Date() } }],
        },
        take: 25,
        include: {
          business: {
            include: {
              emails: true,
              phones: true,
            },
          },
        },
      });

      let stepsExecuted = 0;

      for (const run of pendingRuns) {
        const step = campaign.sequences.find((s) => s.stepIndex === run.currentStep);
        if (!step) {
          // All steps completed
          await prisma.automationRun.update({
            where: { id: run.id },
            data: { status: "COMPLETED", nextActionAt: null },
          });
          continue;
        }

        // Check condition
        let shouldExecute = true;
        if (step.condition === "NOT_OPENED") {
          const openedEmail = await prisma.outreachEmail.findFirst({
            where: {
              businessId: run.businessId,
              status: { in: ["OPENED", "CLICKED"] },
            },
          });
          if (openedEmail) {
            shouldExecute = false;
          }
        }

        if (shouldExecute) {
          // Prepare message
          const recipientEmail = run.business.emails?.[0]?.value;
          const subject = (step.customSubject || "Outreach Inquiry")
            .replace(/{{businessName}}/g, run.business.name)
            .replace(/{{city}}/g, run.business.city || "your area");

          const body = (step.customBody || "<p>Hello {{businessName}}</p>")
            .replace(/{{businessName}}/g, run.business.name)
            .replace(/{{city}}/g, run.business.city || "your area")
            .replace(/{{category}}/g, run.business.category || "commercial service");

          if (step.channel === "EMAIL" && recipientEmail) {
            const userSmtp = await prisma.smtpAccount.findFirst({
              where: { userId: campaign.userId },
              orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            });

            await prisma.outreachEmail.create({
              data: {
                smtpAccountId: userSmtp?.id || null,
                businessId: run.businessId,
                toEmail: recipientEmail,
                subject,
                body,
                status: "PENDING", // Ready for dispatch
                templateId: step.templateId || null,
              },
            });

            await prisma.automationCampaign.update({
              where: { id: campaign.id },
              data: { emailsSent: { increment: 1 } },
            });
            stepsExecuted++;
          }
        }

        // Advance to next step
        const nextStepIndex = run.currentStep + 1;
        const nextStep = campaign.sequences.find((s) => s.stepIndex === nextStepIndex);

        if (nextStep) {
          const delayMs = (nextStep.delayDays * 24 * 60 + nextStep.delayHours * 60) * 60 * 1000;
          const nextActionAt = new Date(Date.now() + Math.max(delayMs, 60000));
          await prisma.automationRun.update({
            where: { id: run.id },
            data: {
              currentStep: nextStepIndex,
              nextActionAt,
            },
          });
        } else {
          await prisma.automationRun.update({
            where: { id: run.id },
            data: {
              status: "COMPLETED",
              nextActionAt: null,
            },
          });
        }
      }

      results.push({
        campaignId: campaign.id,
        name: campaign.name,
        newLeadsEnrolled,
        stepsExecuted,
      });
    }

    return { processedCampaigns: results.length, details: results };
  }
}
