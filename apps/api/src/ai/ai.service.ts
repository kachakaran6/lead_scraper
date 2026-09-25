import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import axios from "axios";
import { getEnv } from "@ultimate-leads/config";
import { prisma } from "@ultimate-leads/database";

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

  async generateWebsitePrompt(businessId: string): Promise<{
    businessId: string;
    businessName: string;
    category: string;
    location: string;
    promptText: string;
    suggestedTheme: {
      primaryColor: string;
      accentColor: string;
      backgroundColor: string;
      fontFamily: string;
      styleVibe: string;
    };
    suggestedSections: string[];
    sampleHtmlTemplate: string;
  }> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        opportunities: true,
        websites: true,
        websiteAudits: true,
        emails: true,
        phones: true,
        socialProfiles: true,
      },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${businessId} not found`);
    }

    const category = business.category || "Commercial Enterprise";
    const catLower = category.toLowerCase();
    const location = [business.address, business.city, business.state, business.country]
      .filter(Boolean)
      .join(", ");
    const primaryPhone = business.phones?.[0]?.value || business.phone || "Not specified";
    const primaryEmail = business.emails?.[0]?.value || "hello@example.com";
    const currentWebsite = business.website || "None (Greenfield Opportunity)";
    const ratingText = business.rating
      ? `${business.rating} / 5.0 (${business.reviewCount || 10}+ customer reviews)`
      : "High-reputation local business";

    // Detect industry styling theme
    let primaryColor = "#6366f1";
    let accentColor = "#06b6d4";
    let styleVibe = "Modern, high-conversion SaaS aesthetic with subtle glassmorphism";
    let fontFamily = "Inter, sans-serif";

    if (catLower.includes("dent") || catLower.includes("medic") || catLower.includes("clinic") || catLower.includes("health")) {
      primaryColor = "#0284c7";
      accentColor = "#14b8a6";
      styleVibe = "Sterile, trustworthy clinical aesthetic with calming cyan and emerald accents";
      fontFamily = "Plus Jakarta Sans, sans-serif";
    } else if (catLower.includes("law") || catLower.includes("legal") || catLower.includes("attorney") || catLower.includes("consult")) {
      primaryColor = "#1e3a8a";
      accentColor = "#d97706";
      styleVibe = "Authoritative, premium corporate presence with deep navy and warm champagne gold accents";
      fontFamily = "Merriweather, serif";
    } else if (catLower.includes("restaur") || catLower.includes("cafe") || catLower.includes("food") || catLower.includes("bakery")) {
      primaryColor = "#dc2626";
      accentColor = "#f59e0b";
      styleVibe = "Vibrant, appetizing culinary presentation with warm tones, full-bleed imagery, and instant online ordering";
      fontFamily = "Outfit, sans-serif";
    } else if (catLower.includes("gym") || catLower.includes("fit") || catLower.includes("crossfit")) {
      primaryColor = "#ea580c";
      accentColor = "#e11d48";
      styleVibe = "High-energy athletic dark mode with neon orange and crimson highlights";
      fontFamily = "Teko, sans-serif";
    } else if (catLower.includes("salon") || catLower.includes("spa") || catLower.includes("beauty")) {
      primaryColor = "#db2777";
      accentColor = "#c084fc";
      styleVibe = "Luxury boutique aesthetic with soft rose gradients, editorial serif typography, and instant calendar booking";
      fontFamily = "Playfair Display, serif";
    }

    const opportunityHighlights = business.opportunities?.length
      ? business.opportunities.map((o) => `• ${o.title} (${o.type}): ${o.description || "High priority"}`).join("\n")
      : `• Modern Mobile-First Responsive Website\n• Instant WhatsApp & One-Click Call Integration\n• Direct Online Booking & Lead Capture System\n• Local Google SEO & Schema.org Structured Data`;

    const sections = [
      "1. Header & Quick Action Bar (Logo, Hours, Phone Call button, Book Now CTA)",
      "2. Hero Banner (Value proposition headline, local social proof badge, lead capture modal trigger)",
      "3. Core Service Catalog (Interactive cards with pricing estimates & learn-more dialogs)",
      "4. Why Choose Us / Trust Differentiators (Credentials, equipment, speed, guarantees)",
      "5. Interactive Lead Capture & Appointment Scheduler",
      "6. Client Testimonials & Google Review Showcase",
      "7. Interactive Location & Hours (Google Maps integration, driving directions, parking info)",
      "8. Modern Footer & WhatsApp Floating Quick-Chat Action Button",
    ];

    const promptText = `### AI WEBSITE ENGINEERING SPECIFICATION & BUILD PROMPT

**Client / Entity Name:** ${business.name}
**Industry & Domain:** ${category}
**Physical Presence:** ${location || "Local Metropolitan Service Area"}
**Direct Contact Phone:** ${primaryPhone}
**Email:** ${primaryEmail}
**Current Digital State:** ${currentWebsite}
**Public Reputation:** ${ratingText}

---

#### 1. PROJECT OBJECTIVE
Build a production-ready, ultra-premium, high-converting responsive web application for **${business.name}**.
The website must convert local visitors searching for ${category} into paying appointments, calls, and WhatsApp inquiries.

#### 2. IDENTIFIED DIGITAL OPPORTUNITIES TO CAPITALIZE
${opportunityHighlights}

#### 3. BRAND AESTHETIC & DESIGN TOKENS
- **Design Archetype:** ${styleVibe}
- **Primary Color:** \`${primaryColor}\`
- **Accent Color:** \`${accentColor}\`
- **Background Palette:** Slate-950 dark background (\`#090d16\`) with elevated glassmorphic card surfaces (\`rgba(255, 255, 255, 0.04)\`)
- **Typography:** Modern clean hierarchy using Google Fonts (\`${fontFamily}\`)
- **Micro-Animations:** Smooth hover states, subtle gradient borders, backdrop-blur modals, and animated pulse badges for availability

#### 4. ARCHITECTURAL REQUIREMENTS & SECTIONS
${sections.join("\n")}

#### 5. CONVERSION & LEAD-GEN MECHANISMS
- **Floating WhatsApp Widget:** Direct one-click \`wa.me/${primaryPhone.replace(/[^0-9]/g, "")}\` pre-filled inquiry.
- **Click-to-Call Buttons:** Sticky phone header button for mobile visitors (\`tel:${primaryPhone.replace(/[^0-9+]/g, "")}\`).
- **Interactive Form:** Client-side validated form with service selector, preferred date/time, and instant confirmation toast.
- **Local SEO & Schema:** Complete \`LocalBusiness\` JSON-LD structured metadata embedded in \`<head>\`.

---

#### 6. PROMPT TO FEED INTO CODING LLM (CLAUDE / CURSOR / V0 / OPENAI)
\`\`\`text
You are an expert full-stack web designer and frontend architect. 
Build a complete, stunning, single-page website for "${business.name}", a premier ${category} in ${location || "our area"}.

Key Requirements:
1. Aesthetics: Use modern Tailwind CSS with a luxury sleek design. Primary color: ${primaryColor}, Accent: ${accentColor}.
2. Hero Section: Catchy headline ("Experience Premier ${category} in ${business.city || "Your City"}"), badge with "${ratingText}", and two CTAs ("Book Appointment Online", "Direct Call: ${primaryPhone}").
3. Services: 4-6 realistic services for ${category} with descriptions, icons, and pricing indicators.
4. Booking/Lead Form: Clean interactive form with name, phone, email, service dropdown, date picker, and submit button.
5. Trust & Social Proof: Showcase Google Reviews (4.9★), client quotes, and safety/quality badges.
6. Local Map & Hours: Business hours table (Mon-Sat 9AM-7PM) and address display.
7. Mobile Float: Sticky bottom action bar on mobile with Call and WhatsApp buttons.
8. Output a single, standalone index.html file with all CSS (via CDN) and vanilla JS interactions included.
\`\`\``;

    // Generate responsive HTML template preview
    const sampleHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business.name} | Premier ${category}</title>
  <meta name="description" content="Official website for ${business.name}. Leading ${category} in ${location}. Contact us at ${primaryPhone}.">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #090d16; color: #f8fafc; }
    .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glass-hover:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.16); }
    .gradient-text { background: linear-gradient(135deg, #fff 0%, ${accentColor} 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body class="min-h-screen selection:bg-indigo-500 selection:text-white">
  <!-- Top Announcement Bar -->
  <div class="border-b border-white/10 bg-white/5 py-2 px-4 text-center text-xs font-medium text-slate-300 flex justify-center items-center gap-3">
    <span>📍 ${location || "Serving local clients & surrounding areas"}</span>
    <span class="text-white/30">•</span>
    <span class="text-emerald-400 font-semibold">● Open Today: 09:00 AM - 07:00 PM</span>
    <span class="text-white/30">•</span>
    <a href="tel:${primaryPhone.replace(/[^0-9+]/g, "")}" class="underline hover:text-white">${primaryPhone}</a>
  </div>

  <!-- Navigation -->
  <nav class="sticky top-0 z-50 glass border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
        ${business.name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div class="font-bold text-base tracking-tight text-white">${business.name}</div>
        <div class="text-[11px] text-slate-400 uppercase tracking-wider">${category}</div>
      </div>
    </div>
    <div class="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
      <a href="#services" class="hover:text-white transition">Services</a>
      <a href="#about" class="hover:text-white transition">About</a>
      <a href="#reviews" class="hover:text-white transition">Reviews</a>
      <a href="#contact" class="hover:text-white transition">Contact</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="#book" class="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-90" style="background: ${primaryColor};">
        Book Appointment
      </a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative px-6 py-20 lg:py-32 max-w-6xl mx-auto text-center space-y-6">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold text-slate-200">
      <span class="text-amber-400">★ 4.9 Rating</span>
      <span class="text-white/30">•</span>
      <span>${ratingText}</span>
    </div>
    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
      Exceptional <span class="gradient-text">${category}</span> Crafted for You.
    </h1>
    <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
      Providing premier ${category.toLowerCase()} services in ${business.city || "your area"}. Designed for clients who demand reliability, modern care, and transparent pricing.
    </p>
    <div class="flex flex-wrap justify-center items-center gap-4 pt-4">
      <a href="#book" class="px-6 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition hover:scale-105" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
        Schedule Consultation Now
      </a>
      <a href="tel:${primaryPhone.replace(/[^0-9+]/g, "")}" class="px-6 py-3.5 rounded-xl font-semibold text-sm glass text-white glass-hover transition">
        Call ${primaryPhone}
      </a>
    </div>
  </section>

  <!-- Services Grid -->
  <section id="services" class="px-6 py-16 max-w-6xl mx-auto space-y-10">
    <div class="text-center space-y-2">
      <h2 class="text-xs uppercase tracking-widest font-bold text-slate-400">Our Expertise</h2>
      <p class="text-2xl sm:text-3xl font-bold text-white">Full-Spectrum ${category} Solutions</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass p-6 rounded-2xl space-y-3 glass-hover transition">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" style="background: ${primaryColor}33; color: ${primaryColor};">01</div>
        <h3 class="text-lg font-bold text-white">Primary Comprehensive Consultation</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Personalized analysis and in-depth diagnosis tailored to your exact requirements with upfront pricing.</p>
      </div>
      <div class="glass p-6 rounded-2xl space-y-3 glass-hover transition">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" style="background: ${accentColor}33; color: ${accentColor};">02</div>
        <h3 class="text-lg font-bold text-white">Specialized Professional Care</h3>
        <p class="text-xs text-slate-400 leading-relaxed">State-of-the-art procedures performed by certified specialists with maximum comfort and efficiency.</p>
      </div>
      <div class="glass p-6 rounded-2xl space-y-3 glass-hover transition">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" style="background: ${primaryColor}33; color: ${primaryColor};">03</div>
        <h3 class="text-lg font-bold text-white">Priority Support & Follow-up</h3>
        <p class="text-xs text-slate-400 leading-relaxed">Dedicated assistance and quick communication via WhatsApp and direct lines whenever you need us.</p>
      </div>
    </div>
  </section>

  <!-- Interactive Appointment Form -->
  <section id="book" class="px-6 py-16 max-w-4xl mx-auto">
    <div class="glass p-8 sm:p-10 rounded-3xl space-y-6 shadow-2xl border border-white/10">
      <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold text-white">Schedule Your Appointment</h2>
        <p class="text-xs text-slate-400">Fill out this quick form and our team will confirm within 15 minutes.</p>
      </div>
      <form class="grid grid-cols-1 sm:grid-cols-2 gap-4" onsubmit="event.preventDefault(); alert('Appointment request received! We will contact you at ' + this.phone.value);">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
          <input required type="text" name="name" placeholder="John Doe" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
          <input required type="tel" name="phone" placeholder="+1 (555) 000-0000" class="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400">
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-300 mb-1">Select Service Needed</label>
          <select name="service" class="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-400">
            <option>General Consultation & Evaluation</option>
            <option>Standard ${category} Package</option>
            <option>Urgent / Same-Day Inquiry</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition hover:opacity-90" style="background: linear-gradient(135deg, ${primaryColor}, ${accentColor});">
            Confirm & Request Booking
          </button>
        </div>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/10 py-10 px-6 max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
    <div>&copy; 2026 ${business.name}. All rights reserved.</div>
    <div class="flex gap-4">
      <a href="tel:${primaryPhone.replace(/[^0-9+]/g, "")}" class="hover:text-white">Call: ${primaryPhone}</a>
      <span>•</span>
      <a href="#services" class="hover:text-white">${category}</a>
    </div>
  </footer>
</body>
</html>`;

    return {
      businessId: business.id,
      businessName: business.name,
      category,
      location,
      promptText,
      suggestedTheme: {
        primaryColor,
        accentColor,
        backgroundColor: "#090d16",
        fontFamily,
        styleVibe,
      },
      suggestedSections: sections,
      sampleHtmlTemplate,
    };
  }
}
