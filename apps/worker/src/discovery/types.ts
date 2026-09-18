export interface DiscoveryResult {
  name: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  sourceUrl?: string;
  sourceId?: string;
  [key: string]: unknown;
}

export interface DiscoveryParams {
  query: string;
  location?: string;
  radiusKm?: number;
  limit?: number;
}

export interface DiscoveryProvider {
  readonly name: string;
  discover(params: DiscoveryParams): Promise<DiscoveryResult[]>;
}

export function normalizeDiscoveryResult(result: DiscoveryResult) {
  return {
    name: result.name?.trim(),
    category: result.category,
    address: result.address,
    city: result.city,
    state: result.state,
    country: result.country,
    phone: result.phone,
    website: result.website,
    latitude: result.latitude,
    longitude: result.longitude,
    rating: result.rating,
    reviewCount: result.reviewCount,
    sourceUrl: result.sourceUrl,
    sourceId: result.sourceId,
  };
}
