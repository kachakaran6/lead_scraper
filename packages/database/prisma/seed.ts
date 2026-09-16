import { PrismaClient, BusinessSource, LeadStatus, WebsiteStatus, EmailStatus, PhoneType, SocialPlatform, OpportunityType } from "@prisma/client";
import { DEFAULT_SCORING_RULES, PIPELINE_STAGES } from "../../shared/src";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Ultimate Lead Engine database...");

  // 1. Seed Pipeline Stages
  for (const stage of PIPELINE_STAGES) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: { position: stage.position, color: stage.color },
      create: {
        name: stage.name,
        position: stage.position,
        color: stage.color,
      },
    });
  }
  console.log("Pipeline stages seeded.");

  // 2. Seed Scoring Rules
  for (const rule of DEFAULT_SCORING_RULES) {
    await prisma.scoringRule.upsert({
      where: { name: rule.name },
      update: { weight: rule.weight, enabled: rule.enabled },
      create: {
        name: rule.name,
        signal: rule.signal,
        operator: rule.operator,
        value: rule.value,
        weight: rule.weight,
        enabled: rule.enabled,
      },
    });
  }
  console.log("Scoring rules seeded.");

  // 3. Seed Default Crawler Settings
  const existingSetting = await prisma.crawlerSetting.findFirst();
  if (!existingSetting) {
    await prisma.crawlerSetting.create({
      data: {
        maxDepth: 3,
        maxPages: 50,
        concurrent: 5,
        delayMs: 1000,
        allowedDomains: [],
        blockedDomains: ["localhost", "127.0.0.1", "169.254.169.254"],
        userAgent: "UltimateLeadBot/1.0 (+https://ultimate-leads.io/bot)",
        respectRobots: true,
      },
    });
    console.log("Crawler settings seeded.");
  }

  // 4. Seed Admin User (password: admin123)
  const adminPasswordHash = "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ultimate-leads.com" },
    update: {},
    create: {
      email: "admin@ultimate-leads.com",
      passwordHash: adminPasswordHash,
      name: "Lead Engine Admin",
      role: "OWNER",
    },
  });
  console.log("Admin user seeded:", adminUser.email);

  // 5. Seed Outreach Templates
  const templates = [
    {
      name: "Website Modernization & Mobile Optimization",
      subject: "Quick question regarding {{businessName}}'s online presence",
      body: "Hi {{contactName}},\n\nI came across {{businessName}} and was really impressed by your {{reviewCount}}+ positive reviews on Google.\n\nHowever, I noticed that your website currently lacks mobile optimization and is loading slowly on smartphones (score {{performanceScore}}/100). Over 68% of local clients now browse on mobile devices.\n\nWe recently helped another {{category}} business increase their online appointments by 42% with a fast, modern website and direct WhatsApp booking.\n\nWould you be open to a quick 10-minute chat this Thursday to see a mockup?\n\nBest regards,\n{{senderName}}",
      channel: "EMAIL",
    },
    {
      name: "High-Opportunity Direct WhatsApp Offer",
      subject: "New client booking system for {{businessName}}",
      body: "Hello {{contactName}}! I noticed {{businessName}} is doing great in {{city}}, but currently doesn't have an instant WhatsApp chat or appointment booking system on your website.\n\nWe can install a seamless WhatsApp booking widget in under 24 hours so you never miss a patient or client inquiry. Would you like a 2-minute demo video?",
      channel: "WHATSAPP",
    },
  ];

  for (const t of templates) {
    const existing = await prisma.outreachTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.outreachTemplate.create({ data: t });
    }
  }
  console.log("Outreach templates seeded.");

  // 6. Seed Demo Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: "Rajkot Dental Clinics Campaign",
      query: "dental clinic",
      location: "Rajkot, Gujarat, India",
      radiusKm: 25,
      status: "COMPLETED",
      discovered: 124,
      unique: 118,
      noWebsite: 48,
      highOpportunity: 37,
      startedAt: new Date(Date.now() - 3600 * 24 * 3000),
      completedAt: new Date(Date.now() - 3600 * 24 * 2500),
    },
  });

  const qualifiedStage = await prisma.pipelineStage.findUnique({ where: { name: "QUALIFIED" } });
  const meetingStage = await prisma.pipelineStage.findUnique({ where: { name: "MEETING" } });

  // 7. Seed Sample Businesses with full intelligence
  const demoBusinesses = [
    {
      name: "SmileCare Dental Speciality Hospital",
      category: "Dental Clinic",
      address: "Ring Road, Near Indira Circle",
      city: "Rajkot",
      state: "Gujarat",
      country: "India",
      postalCode: "360005",
      phone: "+919825012345",
      website: "https://smilecaredental-rajkot.example.com",
      latitude: 22.2936,
      longitude: 70.7818,
      rating: 4.9,
      reviewCount: 384,
      source: BusinessSource.MAPS,
      status: LeadStatus.QUALIFIED,
      leadScore: 88,
      leadGrade: "A",
      opportunityScore: 92,
      websiteQuality: "poor",
      websiteData: {
        url: "https://smilecaredental-rajkot.example.com",
        status: WebsiteStatus.WEBSITE_FOUND,
        httpStatus: 200,
        responseTimeMs: 2450,
        hasSsl: true,
        isMobileFriendly: false,
        hasContactForm: false,
        hasWhatsApp: false,
        hasBooking: false,
        cms: "WordPress 5.2",
        technologies: ["WordPress", "Apache", "jQuery 1.12", "Contact Form 7"],
        metaTitle: "Smile Care Dental - Rajkot",
        metaDescription: "Best dentist in Rajkot for implants and root canal.",
      },
      audit: {
        performanceScore: 34,
        accessibilityScore: 58,
        bestPracticesScore: 60,
        seoScore: 42,
        mobileScore: 28,
        issues: [
          "Page load time exceeds 2.4 seconds",
          "No mobile viewport meta tag configured properly",
          "Missing WhatsApp direct contact button",
          "Outdated WordPress 5.2 installation (security risk)",
          "No structured Schema.org MedicalClinic markup",
        ],
      },
      emails: ["contact@smilecaredental.example.com", "dr.patel@smilecaredental.example.com"],
      phones: ["+919825012345", "+912812554433"],
      socials: [
        { platform: SocialPlatform.INSTAGRAM, url: "https://instagram.com/smilecare_rajkot", followers: 4200 },
        { platform: SocialPlatform.FACEBOOK, url: "https://facebook.com/smilecaredentalrajkot" },
      ],
      contacts: [
        { firstName: "Dr. Rajesh", lastName: "Patel", title: "Chief Dental Surgeon & Founder", email: "dr.patel@smilecaredental.example.com", isPrimary: true },
      ],
      opportunities: [
        { type: OpportunityType.WEBSITE_REDESIGN, title: "Modern High-Performance Website Redesign", value: 1200 },
        { type: OpportunityType.MOBILE_OPTIMIZATION, title: "Mobile UX & Fast Page Speed Optimization", value: 450 },
        { type: OpportunityType.WHATSAPP_INTEGRATION, title: "Direct WhatsApp Patient Appointment Booking", value: 300 },
        { type: OpportunityType.LOCAL_SEO, title: "Local Dental Clinic SEO & Schema Markup", value: 600 },
      ],
      deal: {
        title: "SmileCare - Full Modernization & WhatsApp CRM",
        value: 1950,
        stageId: qualifiedStage?.id,
      },
    },
    {
      name: "Shreeji Super Speciality Dental Clinic",
      category: "Dentist",
      address: "Yagnik Road, Opposite Imperial Palace",
      city: "Rajkot",
      state: "Gujarat",
      country: "India",
      postalCode: "360001",
      phone: "+919712098765",
      website: null,
      latitude: 22.3012,
      longitude: 70.8021,
      rating: 4.8,
      reviewCount: 512,
      source: BusinessSource.MAPS,
      status: LeadStatus.MEETING,
      leadScore: 96,
      leadGrade: "A",
      opportunityScore: 98,
      websiteQuality: null,
      emails: ["info@shreejidental.example.com"],
      phones: ["+919712098765"],
      socials: [
        { platform: SocialPlatform.INSTAGRAM, url: "https://instagram.com/shreeji_dental_clinic", followers: 8900 },
      ],
      contacts: [
        { firstName: "Dr. Anand", lastName: "Mehta", title: "Owner & Specialist", phone: "+919712098765", isPrimary: true },
      ],
      opportunities: [
        { type: OpportunityType.NO_WEBSITE, title: "Create Complete Clinic Website from scratch", value: 1500 },
        { type: OpportunityType.BOOKING_SYSTEM, title: "Online Patient Appointment Management", value: 600 },
        { type: OpportunityType.SOCIAL_MEDIA, title: "Instagram to Website Funnel Conversion", value: 400 },
      ],
      deal: {
        title: "Shreeji Dental - New Flagship Web & Appointment Portal",
        value: 2500,
        stageId: meetingStage?.id,
      },
    },
    {
      name: "Apex Multi-Speciality Diagnostic & Lab",
      category: "Medical Diagnostic Center",
      address: "Kalawad Road, Near KKV Hall",
      city: "Rajkot",
      state: "Gujarat",
      country: "India",
      postalCode: "360005",
      phone: "+919898033221",
      website: "https://apexdiagnostic.example.com",
      latitude: 22.2855,
      longitude: 70.7654,
      rating: 4.6,
      reviewCount: 190,
      source: BusinessSource.SEARCH,
      status: LeadStatus.NEW,
      leadScore: 74,
      leadGrade: "B",
      opportunityScore: 80,
      websiteQuality: "good",
      websiteData: {
        url: "https://apexdiagnostic.example.com",
        status: WebsiteStatus.WEBSITE_FOUND,
        httpStatus: 200,
        responseTimeMs: 1100,
        hasSsl: true,
        isMobileFriendly: true,
        hasContactForm: true,
        hasWhatsApp: false,
        hasBooking: false,
        cms: "Custom HTML",
        technologies: ["React", "Node.js", "Cloudflare"],
        metaTitle: "Apex Diagnostics Lab Rajkot",
        metaDescription: "Blood test, pathology and scan center.",
      },
      audit: {
        performanceScore: 72,
        accessibilityScore: 84,
        bestPracticesScore: 80,
        seoScore: 65,
        mobileScore: 75,
        issues: [
          "No online test report download portal",
          "Missing WhatsApp home blood collection booking",
          "Incomplete local business schema metadata",
        ],
      },
      emails: ["support@apexdiagnostic.example.com"],
      phones: ["+919898033221"],
      socials: [
        { platform: SocialPlatform.FACEBOOK, url: "https://facebook.com/apexdiagnostics" },
        { platform: SocialPlatform.LINKEDIN, url: "https://linkedin.com/company/apexdiagnostic" },
      ],
      contacts: [
        { firstName: "Pooja", lastName: "Shah", title: "Operations Director", email: "pooja@apexdiagnostic.example.com", isPrimary: true },
      ],
      opportunities: [
        { type: OpportunityType.WHATSAPP_INTEGRATION, title: "Home Blood Sample Collection via WhatsApp Bot", value: 800 },
        { type: OpportunityType.CRM, title: "Diagnostic CRM & Automated SMS/Email Report Delivery", value: 1400 },
      ],
    },
  ];

  for (const b of demoBusinesses) {
    const createdBusiness = await prisma.business.create({
      data: {
        name: b.name,
        category: b.category,
        address: b.address,
        city: b.city,
        state: b.state,
        country: b.country,
        postalCode: b.postalCode,
        phone: b.phone,
        website: b.website,
        latitude: b.latitude,
        longitude: b.longitude,
        rating: b.rating,
        reviewCount: b.reviewCount,
        source: b.source,
        status: b.status,
        leadScore: b.leadScore,
        leadGrade: b.leadGrade,
        opportunityScore: b.opportunityScore,
        websiteQuality: b.websiteQuality,
      },
    });

    // Create Website & Audit if applicable
    if (b.websiteData) {
      await prisma.website.create({
        data: {
          businessId: createdBusiness.id,
          ...b.websiteData,
        },
      });
    }

    if (b.audit) {
      await prisma.websiteAudit.create({
        data: {
          businessId: createdBusiness.id,
          performanceScore: b.audit.performanceScore,
          accessibilityScore: b.audit.accessibilityScore,
          bestPracticesScore: b.audit.bestPracticesScore,
          seoScore: b.audit.seoScore,
          mobileScore: b.audit.mobileScore,
          issues: b.audit.issues,
        },
      });
    }

    // Create Emails
    for (const email of b.emails) {
      await prisma.email.create({
        data: {
          businessId: createdBusiness.id,
          value: email,
          status: EmailStatus.VERIFIED,
          isGeneric: email.startsWith("info") || email.startsWith("contact") || email.startsWith("support"),
        },
      });
    }

    // Create Phones
    for (const phone of b.phones) {
      await prisma.phone.create({
        data: {
          businessId: createdBusiness.id,
          value: phone,
          formatted: phone,
          type: phone.startsWith("+919") || phone.startsWith("+918") || phone.startsWith("+917") ? PhoneType.MOBILE : PhoneType.LANDLINE,
          hasWhatsApp: phone.startsWith("+919") || phone.startsWith("+917"),
        },
      });
    }

    // Create Socials
    for (const s of b.socials) {
      await prisma.socialProfile.create({
        data: {
          businessId: createdBusiness.id,
          platform: s.platform,
          url: s.url,
          followers: s.followers,
        },
      });
    }

    // Create Contacts
    for (const c of b.contacts) {
      await prisma.contact.create({
        data: {
          businessId: createdBusiness.id,
          firstName: c.firstName,
          lastName: c.lastName,
          title: c.title,
          email: c.email,
          phone: c.phone,
          isPrimary: c.isPrimary,
        },
      });
    }

    // Create Opportunities
    for (const opp of b.opportunities) {
      await prisma.opportunity.create({
        data: {
          businessId: createdBusiness.id,
          type: opp.type,
          title: opp.title,
          value: opp.value,
          status: "OPEN",
          priority: opp.value > 1000 ? "HIGH" : "MEDIUM",
        },
      });
    }

    // Create Deal if applicable
    if (b.deal && b.deal.stageId) {
      await prisma.deal.create({
        data: {
          businessId: createdBusiness.id,
          title: b.deal.title,
          value: b.deal.value,
          stageId: b.deal.stageId,
          priority: "HIGH",
        },
      });
    }

    // Add activity
    await prisma.activity.create({
      data: {
        businessId: createdBusiness.id,
        type: "LEAD_DISCOVERED",
        description: `Discovered from ${b.source} search in ${b.city}. Calculated lead score: ${b.leadScore} (${b.leadGrade}).`,
      },
    });
  }

  console.log("Seeded demo businesses with full intelligence and deals successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });