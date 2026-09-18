import axios from "axios";
import { getEnv } from "@ultimate-leads/config";
import {
  BusinessDataProvider,
  DiscoveredLeadData,
  DiscoverySearchParams,
} from "./provider.interface";

export class OverpassOsmProvider implements BusinessDataProvider {
  readonly name = "OpenStreetMap Overpass";

  isConfigured(): boolean {
    return true; // Overpass is an open API
  }

  async search(params: DiscoverySearchParams): Promise<DiscoveredLeadData[]> {
    const cityName = params.cityName || params.location?.split(",")[0]?.trim();
    if (!cityName) return [];

    const overpassUrl =
      getEnv().OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

    // Map common user queries to OSM tags
    const categoryTag = this.resolveOsmTag(params.query);

    // Overpass QL query: search for matching nodes/ways within the area
    const qlQuery = `
      [out:json][timeout:15];
      area["name"="${cityName}"]->.searchArea;
      (
        node[${categoryTag}](area.searchArea);
        way[${categoryTag}](area.searchArea);
      );
      out center ${Math.min(params.limit || 25, 50)};
    `;

    try {
      const response = await axios.post(
        overpassUrl,
        `data=${encodeURIComponent(qlQuery)}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "LeadScrapper-Engineering/1.0",
          },
          timeout: 15000,
        }
      );

      const elements = response.data?.elements || [];
      const results: DiscoveredLeadData[] = [];

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags["name:en"] || tags.brand;
        if (!name || name.trim().length < 2) continue;

        const street = tags["addr:street"] || tags["addr:housename"] || "";
        const houseNumber = tags["addr:housenumber"] || "";
        const address = [houseNumber, street].filter(Boolean).join(" ");

        const phone =
          tags["contact:phone"] ||
          tags.phone ||
          tags["contact:mobile"] ||
          tags.mobile ||
          null;

        const website =
          tags["contact:website"] ||
          tags.website ||
          tags["contact:url"] ||
          tags.url ||
          null;

        const lat = el.lat || el.center?.lat;
        const lon = el.lon || el.center?.lon;

        results.push({
          name: name.trim(),
          category: params.query,
          address: address || undefined,
          city: tags["addr:city"] || cityName,
          state: tags["addr:state"] || params.stateCode,
          country: tags["addr:country"] || params.countryCode,
          postalCode: tags["addr:postcode"],
          latitude: lat,
          longitude: lon,
          phone: phone ? phone.trim() : null,
          website: website ? this.normalizeUrl(website.trim()) : null,
          sourceProvider: "OVERPASS_OSM",
          sourceId: `osm-${el.type}-${el.id}`,
          sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
          verificationStatus: "VERIFIED",
          raw: tags,
        });
      }

      // If Overpass returned nothing (city boundary resolution issue in OSM),
      // attempt Nominatim structured query as secondary real data source
      if (results.length === 0) {
        return this.searchNominatimFallback(params, cityName);
      }

      return results;
    } catch (err: any) {
      console.warn("Overpass API error:", err?.message || err);
      // Fallback to Nominatim live search for real verified places
      return this.searchNominatimFallback(params, cityName);
    }
  }

  private async searchNominatimFallback(
    params: DiscoverySearchParams,
    city: string
  ): Promise<DiscoveredLeadData[]> {
    try {
      const q = params.location
        ? `${params.query} in ${params.location}`
        : `${params.query} in ${city}`;

      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          q
        )}&format=json&addressdetails=1&extratags=1&limit=${Math.min(
          params.limit || 15,
          20
        )}`,
        {
          headers: {
            "User-Agent": "LeadScrapper-Engineering/1.0",
            Accept: "application/json",
          },
          timeout: 8000,
        }
      );

      const items = response.data || [];
      const leads: DiscoveredLeadData[] = [];

      for (const item of items) {
        const rawName = item.name || item.display_name?.split(",")[0];
        if (!rawName || rawName.length < 2) continue;

        const addr = item.address || {};
        const extra = item.extratags || {};
        const itemCity = addr.city || addr.town || addr.municipality || city;
        const road = addr.road || addr.suburb || addr.neighbourhood || "";

        const phone = extra.phone || extra["contact:phone"] || null;
        const website = extra.website || extra["contact:website"] || null;

        leads.push({
          name: rawName.trim(),
          category: params.query,
          address: road ? `${road}, ${itemCity}` : undefined,
          city: itemCity,
          state: addr.state || params.stateCode,
          country: addr.country || params.countryCode,
          postalCode: addr.postcode,
          latitude: item.lat ? parseFloat(item.lat) : undefined,
          longitude: item.lon ? parseFloat(item.lon) : undefined,
          phone: phone ? phone.trim() : null,
          website: website ? this.normalizeUrl(website.trim()) : null,
          sourceProvider: "OVERPASS_OSM",
          sourceId: `osm-nom-${item.osm_type || "node"}-${item.osm_id}`,
          sourceUrl: `https://www.openstreetmap.org/${item.osm_type || "node"}/${item.osm_id}`,
          verificationStatus: "VERIFIED",
        });
      }

      return leads;
    } catch {
      return [];
    }
  }

  private resolveOsmTag(query: string): string {
    const q = query.toLowerCase();
    if (q.includes("dent")) return '"amenity"="dentist"';
    if (q.includes("doctor") || q.includes("clinic"))
      return '"amenity"~"doctors|clinic"';
    if (q.includes("hospital")) return '"amenity"="hospital"';
    if (q.includes("pharmacy")) return '"amenity"="pharmacy"';
    if (q.includes("restaurant")) return '"amenity"="restaurant"';
    if (q.includes("cafe") || q.includes("coffee")) return '"amenity"="cafe"';
    if (q.includes("hotel")) return '"tourism"="hotel"';
    if (q.includes("gym") || q.includes("fitness"))
      return '"leisure"="fitness_centre"';
    if (q.includes("lawyer") || q.includes("legal"))
      return '"office"="lawyer"';
    if (q.includes("accountant")) return '"office"="accountant"';
    if (q.includes("real estate") || q.includes("realtor"))
      return '"office"="estate_agent"';
    if (q.includes("car") || q.includes("mechanic"))
      return '"shop"="car_repair"';
    if (q.includes("salon") || q.includes("barber"))
      return '"shop"="hairdresser"';
    return '"name"~"' + query + '",i';
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }
}
