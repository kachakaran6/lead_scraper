export type UserRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "CONTACTED"
  | "REPLIED"
  | "MEETING"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type WebsiteStatus =
  | "NO_WEBSITE"
  | "WEBSITE_FOUND"
  | "WEBSITE_DOWN"
  | "WEBSITE_BROKEN"
  | "REDIRECT"
  | "PARKED_DOMAIN"
  | "SOCIAL_ONLY"
  | "DIRECTORY_ONLY";

export type EmailStatus =
  | "PUBLIC"
  | "VERIFIED"
  | "UNVERIFIED"
  | "GENERIC"
  | "PERSONAL"
  | "INVALID";

export type OpportunityType =
  | "NO_WEBSITE"
  | "WEBSITE_REDESIGN"
  | "SEO"
  | "PERFORMANCE"
  | "MOBILE_OPTIMIZATION"
  | "ECOMMERCE"
  | "BOOKING_SYSTEM"
  | "CRM"
  | "WHATSAPP_INTEGRATION"
  | "AUTOMATION"
  | "LANDING_PAGE"
  | "SOCIAL_MEDIA"
  | "LOCAL_SEO";

export type JobStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "FAILED" | "RETRYING" | "CANCELLED";

export type JobType =
  | "DISCOVER_BUSINESSES"
  | "NORMALIZE_LEAD"
  | "DEDUPLICATE"
  | "FIND_WEBSITE"
  | "CRAWL_WEBSITE"
  | "EXTRACT_EMAIL"
  | "EXTRACT_PHONE"
  | "DISCOVER_SOCIAL"
  | "AUDIT_WEBSITE"
  | "CALCULATE_SCORE"
  | "AI_ANALYSIS"
  | "EXPORT_DATA"
  | "CHANGE_DETECTION";

export type CampaignStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export type SourceType = "MAPS" | "SEARCH" | "DIRECTORY" | "IMPORT" | "API" | "MANUAL";

export interface ApiResult<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export interface SearchFilters {
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  radiusKm?: number;
  category?: string;
  keyword?: string;
  language?: string;
  minRating?: number;
  minReviews?: number;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasSocial?: boolean;
  hasWhatsapp?: boolean;
  websiteQuality?: "poor" | "good" | "excellent";
  minLeadScore?: number;
}

export interface LeadSummary {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  leadScore: number | null;
  opportunities: number;
  status: LeadStatus | null;
  firstSeen: Date;
}

export interface DashboardKpis {
  totalBusinesses: number;
  newToday: number;
  withoutWebsite: number;
  withWebsite: number;
  poorWebsite: number;
  withEmail: number;
  withPhone: number;
  withSocial: number;
  highOpportunity: number;
  contacted: number;
  replied: number;
  meetings: number;
  proposals: number;
  wonDeals: number;
}
