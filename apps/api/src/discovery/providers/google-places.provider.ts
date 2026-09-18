import axios from "axios";
import { getEnv } from "@ultimate-leads/config";
import {
  BusinessDataProvider,
  DiscoveredLeadData,
  DiscoverySearchParams,
} from "./provider.interface";

export class GooglePlacesProvider implements BusinessDataProvider {
  readonly name = "Google Places";

  isConfigured(): boolean {
    const key = getEnv().GOOGLE_MAPS_API_KEY;
    return Boolean(key && key.trim().length > 5);
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveredLeadData[]> {
    const apiKey = getEnv().GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return [];
    }

    const textQuery = [params.query, params.location || params.cityName]
      .filter(Boolean)
      .join(" in ");

    try {
      // Use official Google Places Text Search endpoint
      const response = await axios.post(
        "https://places.googleapis.com/v1/places:searchText",
        {
          textQuery,
          pageSize: Math.min(params.limit || 20, 20),
          languageCode: "en",
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.primaryTypeDisplayName",
          },
          timeout: 10000,
        }
      );

      const places = response.data?.places || [];
      return places.map((p: any) => {
        const name = p.displayName?.text || p.displayName || "Unknown Business";
        const phone = p.internationalPhoneNumber || p.nationalPhoneNumber || null;
        const website = p.websiteUri || null;
        const category = p.primaryTypeDisplayName?.text || params.query;

        return {
          name,
          category,
          address: p.formattedAddress || undefined,
          city: params.cityName || this.extractCity(p.formattedAddress),
          state: params.stateCode,
          country: params.countryCode,
          latitude: p.location?.latitude,
          longitude: p.location?.longitude,
          rating: p.rating,
          reviewCount: p.userRatingCount,
          phone,
          website,
          googlePlaceId: p.id,
          googleMapsUrl: p.googleMapsUri,
          sourceProvider: "GOOGLE_PLACES",
          sourceId: p.id,
          sourceUrl: p.googleMapsUri,
          verificationStatus: "VERIFIED",
          raw: p,
        } as DiscoveredLeadData;
      });
    } catch (error: any) {
      console.warn(
        "Google Places API search failed:",
        error?.response?.data || error.message
      );
      return [];
    }
  }

  private extractCity(address?: string): string | undefined {
    if (!address) return undefined;
    const parts = address.split(",").map((s) => s.trim());
    if (parts.length >= 2) {
      return parts[parts.length - 2];
    }
    return undefined;
  }
}
