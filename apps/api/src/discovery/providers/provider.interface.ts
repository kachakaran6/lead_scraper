export interface DiscoveredLeadData {
  name: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  phone?: string | null;
  website?: string | null;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  sourceProvider: "GOOGLE_PLACES" | "OVERPASS_OSM" | "SEARXNG";
  sourceUrl?: string;
  sourceId?: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED" | "UNKNOWN";
  raw?: Record<string, unknown>;
}

export interface DiscoverySearchParams {
  query: string;
  location?: string;
  cityName?: string;
  stateCode?: string;
  countryCode?: string;
  radiusKm?: number;
  limit?: number;
}

export interface BusinessDataProvider {
  readonly name: string;
  isConfigured(): boolean;
  search(params: DiscoverySearchParams): Promise<DiscoveredLeadData[]>;
}
