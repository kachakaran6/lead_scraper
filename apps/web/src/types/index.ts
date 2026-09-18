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

export interface Business {
  id: string;
  name: string;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  source: string;
  sourceUrl?: string | null;
  sourceProvider?: string | null;
  sourcePlaceId?: string | null;
  googlePlaceId?: string | null;
  googleMapsUrl?: string | null;
  hasWebsite?: boolean | null;
  hasPhone?: boolean | null;
  hasEmail?: boolean | null;
  verificationStatus?: string | null;
  retrievedAt?: string | null;
  lastVerifiedAt?: string | null;
  status: LeadStatus;
  leadScore: number;
  leadGrade: string;
  opportunityScore: number;
  websiteQuality?: string | null;
  firstSeen: string;
  lastSeen: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  emails?: Email[];
  phones?: Phone[];
  websites?: Website[];
  websiteAudits?: WebsiteAudit[];
  socialProfiles?: SocialProfile[];
  contacts?: Contact[];
  opportunities?: Opportunity[];
  deals?: Deal[];
  notes?: Note[];
  activities?: Activity[];
}

export interface Website {
  id: string;
  businessId: string;
  url: string;
  status: WebsiteStatus;
  httpStatus?: number | null;
  responseTimeMs?: number | null;
  hasSsl: boolean;
  isMobileFriendly: boolean;
  hasContactForm: boolean;
  hasWhatsApp: boolean;
  hasBooking: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  cms?: string | null;
  technologies?: string[] | null;
}

export interface WebsiteAudit {
  id: string;
  businessId: string;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  mobileScore: number;
  issues?: string[] | null;
  technologies?: string[] | null;
  createdAt: string;
}

export interface Email {
  id: string;
  value: string;
  status: string;
  isGeneric: boolean;
}

export interface Phone {
  id: string;
  value: string;
  formatted?: string | null;
  type: string;
  hasWhatsApp: boolean;
}

export interface SocialProfile {
  id: string;
  platform: string;
  url: string;
  username?: string | null;
  followers?: number | null;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName?: string | null;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  isPrimary: boolean;
}

export interface Opportunity {
  id: string;
  businessId: string;
  type: OpportunityType;
  title: string;
  description?: string | null;
  value?: number | null;
  status: string;
  priority: string;
  detectedAt: string;
  business?: {
    id: string;
    name: string;
    city?: string | null;
    category?: string | null;
  };
}

export interface PipelineStage {
  id: string;
  name: string;
  position: number;
  color: string;
  deals?: Deal[];
}

export interface Deal {
  id: string;
  businessId: string;
  title: string;
  value: number;
  stageId: string;
  priority: string;
  closeDate?: string | null;
  business?: {
    id: string;
    name: string;
    city?: string | null;
  };
}

export interface Campaign {
  id: string;
  name: string;
  query: string;
  location?: string | null;
  radiusKm?: number | null;
  status: string;
  discovered: number;
  unique: number;
  noWebsite: number;
  highOpportunity: number;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  user?: { name: string } | null;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  signal: string;
  operator: string;
  value: string;
  weight: number;
  enabled: boolean;
}
