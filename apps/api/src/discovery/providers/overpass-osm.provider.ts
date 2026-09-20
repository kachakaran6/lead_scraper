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
    if (!cityName && !params.location && !params.bounds) return [];

    const overpassUrl =
      getEnv().OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

    const targetLocation = params.location || cityName || "";
    const categoryTag = this.resolveOsmTag(params.query);
    const limit = Math.min(params.limit || 25, 50);

    // 1. Resolve Bounding Box: Use passed cell bounds or Nominatim geocoding
    let bbox: [number, number, number, number] | null = null;
    if (params.bounds) {
      bbox = [
        params.bounds.minLat,
        params.bounds.maxLat,
        params.bounds.minLon,
        params.bounds.maxLon,
      ];
    } else {
      bbox = await this.getBoundingBox(targetLocation);
    }

    if (bbox) {
      const [south, north, west, east] = bbox;
      const qlQuery = `
        [out:json][timeout:15];
        (
          node[${categoryTag}](${south},${west},${north},${east});
          way[${categoryTag}](${south},${west},${north},${east});
        );
        out center ${limit};
      `;

      try {
        const response = await axios.post(
          overpassUrl,
          `data=${encodeURIComponent(qlQuery)}`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "User-Agent": "LeadEngine-Platform/2.0 (+https://leadengine.kachakaran.tech)",
            },
            timeout: 12000,
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
            city: tags["addr:city"] || cityName || targetLocation.split(",")[0]?.trim(),
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

        if (results.length > 0) {
          return results;
        }
      } catch (err: any) {
        console.warn("Overpass API error:", err?.message || err);
      }
    }

    // 2. Structured fallback search via Nominatim
    return this.searchNominatimFallback(params, cityName || targetLocation.split(",")[0]?.trim() || "");
  }

  private async getBoundingBox(
    locationStr: string
  ): Promise<[number, number, number, number] | null> {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationStr
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "LeadEngine-Platform/2.0 (+https://leadengine.kachakaran.tech)",
            Accept: "application/json",
          },
          timeout: 6000,
        }
      );
      const data = response.data?.[0];
      if (data && data.boundingbox && data.boundingbox.length === 4) {
        const [south, north, west, east] = data.boundingbox.map(Number);
        if (!isNaN(south) && !isNaN(north) && !isNaN(west) && !isNaN(east)) {
          return [south, north, west, east];
        }
      }
    } catch {
      // Nominatim lookup timed out or failed
    }
    return null;
  }

  private async searchNominatimFallback(
    params: DiscoverySearchParams,
    city: string
  ): Promise<DiscoveredLeadData[]> {
    try {
      const cleanCity = city || params.cityName || "";
      const searchTarget = params.countryCode
        ? `${params.query} in ${cleanCity}, ${params.countryCode}`
        : `${params.query} in ${cleanCity || params.location}`;

      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchTarget
        )}&format=json&addressdetails=1&extratags=1&limit=${Math.min(
          params.limit || 20,
          30
        )}`,
        {
          headers: {
            "User-Agent": "LeadEngine-Platform/2.0 (+https://leadengine.kachakaran.tech)",
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
        const itemCity = addr.city || addr.town || addr.municipality || cleanCity;
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
    const q = query.toLowerCase().trim();

    // Dental specialties (comprehensive mapping)
    if (
      q.includes("dent") ||
      q.includes("orthodont") ||
      q.includes("implant") ||
      q.includes("invisalign") ||
      q.includes("aligner") ||
      q.includes("smile") ||
      q.includes("teeth") ||
      q.includes("tooth") ||
      q.includes("prosthodont") ||
      q.includes("periodont") ||
      q.includes("endodont") ||
      q.includes("oral surgeon")
    ) {
      return '"amenity"="dentist"';
    }

    // Doctors, Clinics & Healthcare Specialties
    if (
      q.includes("doctor") ||
      q.includes("clinic") ||
      q.includes("physician") ||
      q.includes("general practice") ||
      q.includes("medical center") ||
      q.includes("health centre") ||
      q.includes("dermatolog") ||
      q.includes("skin") ||
      q.includes("pediatric")
    ) {
      return '"amenity"~"doctors|clinic"';
    }

    if (q.includes("hospital")) return '"amenity"="hospital"';
    if (q.includes("pharmacy") || q.includes("chemist") || q.includes("drugstore"))
      return '"amenity"="pharmacy"';
    if (q.includes("optometr") || q.includes("eye") || q.includes("optician"))
      return '"shop"="optician"';
    if (q.includes("veterin") || q.includes("vet ") || q.includes("animal hospital"))
      return '"amenity"="veterinary"';
    if (q.includes("physio") || q.includes("chiro") || q.includes("therapy"))
      return '"healthcare"~"physiotherapist|alternative|rehabilitation"';

    // Hospitality & Dining
    if (q.includes("restaurant") || q.includes("dining") || q.includes("pizzeria") || q.includes("grill"))
      return '"amenity"="restaurant"';
    if (q.includes("cafe") || q.includes("coffee") || q.includes("espresso"))
      return '"amenity"="cafe"';
    if (q.includes("hotel") || q.includes("resort") || q.includes("motel") || q.includes("inn"))
      return '"tourism"="hotel"';

    // Fitness & Leisure
    if (q.includes("gym") || q.includes("fitness") || q.includes("yoga") || q.includes("pilates") || q.includes("crossfit"))
      return '"leisure"="fitness_centre"';

    // Professional & Legal Services
    if (q.includes("lawyer") || q.includes("legal") || q.includes("attorney") || q.includes("advocate") || q.includes("law firm"))
      return '"office"="lawyer"';
    if (q.includes("accountant") || q.includes("cpa") || q.includes("tax") || q.includes("bookkeep"))
      return '"office"="accountant"';
    if (q.includes("real estate") || q.includes("realtor") || q.includes("property"))
      return '"office"="estate_agent"';

    // Personal Care & Services
    if (q.includes("salon") || q.includes("barber") || q.includes("spa") || q.includes("hair") || q.includes("beauty"))
      return '"shop"~"hairdresser|beauty"';
    if (q.includes("car") || q.includes("mechanic") || q.includes("auto repair") || q.includes("tire"))
      return '"shop"~"car|car_repair"';
    if (q.includes("plumber")) return '"craft"="plumber"';
    if (q.includes("electrician")) return '"craft"="electrician"';
    if (q.includes("bakery")) return '"shop"="bakery"';
    if (q.includes("supermarket") || q.includes("grocery"))
      return '"shop"="supermarket"';
    if (q.includes("school") || q.includes("college") || q.includes("academy") || q.includes("tutoring"))
      return '"amenity"~"school|college"';

    return '"name"~"' + query + '",i';
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }
}

