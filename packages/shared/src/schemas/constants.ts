export const GENERIC_EMAIL_PREFIXES = [
  "info",
  "hello",
  "contact",
  "support",
  "sales",
  "admin",
  "office",
  "team",
  "mail",
  "help",
  "service",
  "enquiry",
  "inquiry",
  "careers",
  "hr",
  "marketing",
  "press",
  "media",
  "billing",
  "accounts",
  "reception",
  "bookings",
  "reservations",
];

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "x",
  "twitter",
  "tiktok",
  "threads",
  "pinterest",
  "snapchat",
  "whatsapp",
] as const;

export const WEBSITE_STATUS_LABELS: Record<string, string> = {
  NO_WEBSITE: "No Website",
  WEBSITE_FOUND: "Website Found",
  WEBSITE_DOWN: "Website Down",
  WEBSITE_BROKEN: "Website Broken",
  REDIRECT: "Redirect",
  PARKED_DOMAIN: "Parked Domain",
  SOCIAL_ONLY: "Social Only",
  DIRECTORY_ONLY: "Directory Only",
};

export const OPPORTUNITY_TYPE_LABELS: Record<string, string> = {
  NO_WEBSITE: "No Website",
  WEBSITE_REDESIGN: "Website Redesign",
  SEO: "SEO",
  PERFORMANCE: "Performance",
  MOBILE_OPTIMIZATION: "Mobile Optimization",
  ECOMMERCE: "E-commerce",
  BOOKING_SYSTEM: "Booking System",
  CRM: "CRM",
  WHATSAPP_INTEGRATION: "WhatsApp Integration",
  AUTOMATION: "Automation",
  LANDING_PAGE: "Landing Page",
  SOCIAL_MEDIA: "Social Media",
  LOCAL_SEO: "Local SEO",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  DISCOVER_BUSINESSES: "Discover Businesses",
  NORMALIZE_LEAD: "Normalize Lead",
  DEDUPLICATE: "Deduplicate",
  FIND_WEBSITE: "Find Website",
  CRAWL_WEBSITE: "Crawl Website",
  EXTRACT_EMAIL: "Extract Email",
  EXTRACT_PHONE: "Extract Phone",
  DISCOVER_SOCIAL: "Discover Social",
  AUDIT_WEBSITE: "Audit Website",
  CALCULATE_SCORE: "Calculate Score",
  AI_ANALYSIS: "AI Analysis",
  EXPORT_DATA: "Export Data",
  CHANGE_DETECTION: "Change Detection",
};

export const PIPELINE_STAGES = [
  { name: "NEW", position: 0, color: "#8b5cf6" },
  { name: "QUALIFIED", position: 1, color: "#3b82f6" },
  { name: "CONTACTED", position: 2, color: "#06b6d4" },
  { name: "REPLIED", position: 3, color: "#10b981" },
  { name: "MEETING", position: 4, color: "#f59e0b" },
  { name: "PROPOSAL", position: 5, color: "#f97316" },
  { name: "NEGOTIATION", position: 6, color: "#ef4444" },
  { name: "WON", position: 7, color: "#22c55e" },
  { name: "LOST", position: 8, color: "#6b7280" },
];

export const DEFAULT_SCORING_RULES = [
  { name: "No Website", signal: "website.status", operator: "equals", value: "NO_WEBSITE", weight: 40, enabled: true },
  { name: "Poor Website", signal: "website.quality", operator: "equals", value: "poor", weight: 25, enabled: true },
  { name: "No Mobile Optimization", signal: "website.mobile", operator: "equals", value: "poor", weight: 15, enabled: true },
  { name: "No Contact Form", signal: "website.hasContactForm", operator: "equals", value: "false", weight: 10, enabled: true },
  { name: "No WhatsApp", signal: "website.hasWhatsApp", operator: "equals", value: "false", weight: 10, enabled: true },
  { name: "Active Social Media", signal: "social.count", operator: "gte", value: "1", weight: 10, enabled: true },
  { name: "Large Review Count", signal: "reviews.count", operator: "gte", value: "50", weight: 10, enabled: true },
  { name: "Public Email", signal: "email.count", operator: "gte", value: "1", weight: 10, enabled: true },
  { name: "Public Phone", signal: "phone.count", operator: "gte", value: "1", weight: 10, enabled: true },
];

export function isGenericEmail(email: string): boolean {
  const local = email.split("@")[0]?.toLowerCase() || "";
  return GENERIC_EMAIL_PREFIXES.includes(local);
}

export function scoreToGrade(score: number): string {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}
