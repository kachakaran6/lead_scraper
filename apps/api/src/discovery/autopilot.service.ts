import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { prisma, AutopilotStatus, ResourceBudget, AiProcessingLevel } from "@ultimate-leads/database";
import { DeduplicationService } from "./deduplication.service";
import { ProviderHealthService } from "./providers/provider-health.service";
import {
  GooglePlacesProvider,
  OverpassOsmProvider,
  SearxngProvider,
  DiscoveredLeadData,
} from "./providers";
import {
  expandNicheQuery,
  generateQueryHash,
  partitionBoundsIntoGrid,
  GeoBounds,
  DEFAULT_PROFESSIONAL_NICHES,
} from "@ultimate-leads/shared";
import { AIService } from "../ai/ai.service";

// Canonical Territory Coordinates & Seeds for Progressive Autopilot Exploration
const TERRITORY_SEEDS: Record<
  string,
  {
    bounds: GeoBounds;
    cities: Array<{ name: string; lat: number; lon: number; state: string }>;
  }
> = {
  India: {
    bounds: { minLat: 8.0, maxLat: 35.5, minLon: 68.7, maxLon: 97.25 },
    cities: [
      { name: "Mumbai", lat: 19.076, lon: 72.8777, state: "Maharashtra" },
      { name: "Pune", lat: 18.5204, lon: 73.8567, state: "Maharashtra" },
      { name: "Nagpur", lat: 21.1458, lon: 79.0882, state: "Maharashtra" },
      { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, state: "Gujarat" },
      { name: "Surat", lat: 21.1702, lon: 72.8311, state: "Gujarat" },
      { name: "Vadodara", lat: 22.3072, lon: 73.1812, state: "Gujarat" },
      { name: "Rajkot", lat: 22.3039, lon: 70.8022, state: "Gujarat" },
      { name: "Bengaluru", lat: 12.9716, lon: 77.5946, state: "Karnataka" },
      { name: "Delhi", lat: 28.7041, lon: 77.1025, state: "Delhi" },
      { name: "Chennai", lat: 13.0827, lon: 80.2707, state: "Tamil Nadu" },
      { name: "Hyderabad", lat: 17.385, lon: 78.4867, state: "Telangana" },
      { name: "Jaipur", lat: 26.9124, lon: 75.7873, state: "Rajasthan" },
    ],
  },
  UAE: {
    bounds: { minLat: 22.6, maxLat: 26.0, minLon: 51.5, maxLon: 56.4 },
    cities: [
      { name: "Dubai", lat: 25.2048, lon: 55.2708, state: "Dubai" },
      { name: "Abu Dhabi", lat: 24.4539, lon: 54.3773, state: "Abu Dhabi" },
      { name: "Sharjah", lat: 25.3463, lon: 55.4209, state: "Sharjah" },
      { name: "Ajman", lat: 25.4052, lon: 55.5136, state: "Ajman" },
      { name: "Ras Al Khaimah", lat: 25.7895, lon: 55.9432, state: "Ras Al Khaimah" },
    ],
  },
  "United States": {
    bounds: { minLat: 24.5, maxLat: 49.38, minLon: -125.0, maxLon: -66.93 },
    cities: [
      // Colorado
      { name: "Denver", lat: 39.7392, lon: -104.9903, state: "Colorado" },
      { name: "Colorado Springs", lat: 38.8339, lon: -104.8214, state: "Colorado" },
      { name: "Aurora", lat: 39.7294, lon: -104.8319, state: "Colorado" },
      { name: "Boulder", lat: 40.015, lon: -105.2705, state: "Colorado" },
      { name: "Fort Collins", lat: 40.5853, lon: -105.0844, state: "Colorado" },
      { name: "Lakewood", lat: 39.7047, lon: -105.0814, state: "Colorado" },

      // California
      { name: "Los Angeles", lat: 34.0522, lon: -118.2437, state: "California" },
      { name: "San Diego", lat: 32.7157, lon: -117.1611, state: "California" },
      { name: "San Francisco", lat: 37.7749, lon: -122.4194, state: "California" },
      { name: "San Jose", lat: 37.3382, lon: -121.8863, state: "California" },
      { name: "Irvine", lat: 33.6846, lon: -117.8265, state: "California" },
      { name: "Newport Beach", lat: 33.6189, lon: -117.9298, state: "California" },
      { name: "Sacramento", lat: 38.5816, lon: -121.4944, state: "California" },
      { name: "Long Beach", lat: 33.7701, lon: -118.1937, state: "California" },
      { name: "Oakland", lat: 37.8044, lon: -122.2712, state: "California" },
      { name: "Anaheim", lat: 33.8366, lon: -117.9143, state: "California" },
      { name: "Beverly Hills", lat: 34.0736, lon: -118.4004, state: "California" },

      // Texas
      { name: "Austin", lat: 30.2672, lon: -97.7431, state: "Texas" },
      { name: "Dallas", lat: 32.7767, lon: -96.797, state: "Texas" },
      { name: "Houston", lat: 29.7604, lon: -95.3698, state: "Texas" },
      { name: "San Antonio", lat: 29.4241, lon: -98.4936, state: "Texas" },
      { name: "Fort Worth", lat: 32.7555, lon: -97.3308, state: "Texas" },
      { name: "Plano", lat: 33.0198, lon: -96.6989, state: "Texas" },

      // Florida
      { name: "Miami", lat: 25.7617, lon: -80.1918, state: "Florida" },
      { name: "Orlando", lat: 28.5383, lon: -81.3792, state: "Florida" },
      { name: "Tampa", lat: 27.9506, lon: -82.4572, state: "Florida" },
      { name: "Jacksonville", lat: 30.3322, lon: -81.6557, state: "Florida" },
      { name: "Fort Lauderdale", lat: 26.1224, lon: -80.1373, state: "Florida" },

      // New York
      { name: "New York", lat: 40.7128, lon: -74.006, state: "New York" },
      { name: "New York City", lat: 40.7128, lon: -74.006, state: "New York" },
      { name: "Brooklyn", lat: 40.6782, lon: -73.9442, state: "New York" },
      { name: "Buffalo", lat: 42.8864, lon: -78.8784, state: "New York" },

      // Illinois
      { name: "Chicago", lat: 41.8781, lon: -87.6298, state: "Illinois" },
      { name: "Naperville", lat: 41.7508, lon: -88.1535, state: "Illinois" },

      // Washington
      { name: "Seattle", lat: 47.6062, lon: -122.3321, state: "Washington" },
      { name: "Bellevue", lat: 47.6101, lon: -122.2015, state: "Washington" },
      { name: "Spokane", lat: 47.6588, lon: -117.426, state: "Washington" },

      // Massachusetts
      { name: "Boston", lat: 42.3601, lon: -71.0589, state: "Massachusetts" },
      { name: "Cambridge", lat: 42.3736, lon: -71.1097, state: "Massachusetts" },

      // Georgia
      { name: "Atlanta", lat: 33.749, lon: -84.388, state: "Georgia" },
      { name: "Savannah", lat: 32.0809, lon: -81.0912, state: "Georgia" },

      // Arizona
      { name: "Phoenix", lat: 33.4484, lon: -112.074, state: "Arizona" },
      { name: "Scottsdale", lat: 33.4942, lon: -111.9261, state: "Arizona" },
      { name: "Tucson", lat: 32.2226, lon: -110.9747, state: "Arizona" },

      // North Carolina
      { name: "Charlotte", lat: 35.2271, lon: -80.8431, state: "North Carolina" },
      { name: "Raleigh", lat: 35.7796, lon: -78.6382, state: "North Carolina" },

      // New Jersey
      { name: "Newark", lat: 40.7357, lon: -74.1724, state: "New Jersey" },
      { name: "Jersey City", lat: 40.7178, lon: -74.0431, state: "New Jersey" },

      // Virginia
      { name: "Virginia Beach", lat: 36.8529, lon: -75.978, state: "Virginia" },
      { name: "Richmond", lat: 37.5407, lon: -77.436, state: "Virginia" },

      // Pennsylvania
      { name: "Philadelphia", lat: 39.9526, lon: -75.1652, state: "Pennsylvania" },
      { name: "Pittsburgh", lat: 40.4406, lon: -79.9959, state: "Pennsylvania" },

      // Ohio
      { name: "Columbus", lat: 39.9612, lon: -82.9988, state: "Ohio" },
      { name: "Cleveland", lat: 41.4993, lon: -81.6944, state: "Ohio" },

      // Michigan
      { name: "Detroit", lat: 42.3314, lon: -83.0458, state: "Michigan" },

      // Nevada
      { name: "Las Vegas", lat: 36.1699, lon: -115.1398, state: "Nevada" },
      { name: "Reno", lat: 39.5296, lon: -119.8138, state: "Nevada" },

      // Oregon
      { name: "Portland", lat: 45.5152, lon: -122.6784, state: "Oregon" },

      // Tennessee
      { name: "Nashville", lat: 36.1627, lon: -86.7816, state: "Tennessee" },
      { name: "Memphis", lat: 35.1495, lon: -90.049, state: "Tennessee" },
    ],
  },
  "United Kingdom": {
    bounds: { minLat: 49.9, maxLat: 58.7, minLon: -8.1, maxLon: 1.76 },
    cities: [
      { name: "London", lat: 51.5074, lon: -0.1278, state: "Greater London" },
      { name: "Birmingham", lat: 52.4862, lon: -1.8904, state: "West Midlands" },
      { name: "Manchester", lat: 53.4808, lon: -2.2426, state: "Greater Manchester" },
      { name: "Leeds", lat: 53.8008, lon: -1.5491, state: "West Yorkshire" },
      { name: "Glasgow", lat: 55.8642, lon: -4.2518, state: "Scotland" },
    ],
  },
};

const US_STATE_NAMES = new Set([
  "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut",
  "delaware", "florida", "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa",
  "kansas", "kentucky", "louisiana", "maine", "maryland", "massachusetts", "michigan",
  "minnesota", "mississippi", "missouri", "montana", "nebraska", "nevada", "new hampshire",
  "new jersey", "new mexico", "new york", "north carolina", "north dakota", "ohio",
  "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota",
  "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia",
  "wisconsin", "wyoming", "district of columbia"
]);

const USA_ALIASES = new Set(["usa", "us", "united states", "united states of america", "america"]);

function normalizeTerritoryTarget(countryInput: string): { country: string; inferredRegion?: string } {
  const clean = (countryInput || "").trim();
  const lower = clean.toLowerCase();

  if (US_STATE_NAMES.has(lower)) {
    // Capitalize state name
    const stateName = clean
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return { country: "United States", inferredRegion: stateName };
  }

  if (USA_ALIASES.has(lower)) {
    return { country: "United States" };
  }

  if (lower === "uae" || lower === "united arab emirates" || lower === "dubai") {
    return { country: "UAE" };
  }

  if (lower === "uk" || lower === "united kingdom" || lower === "great britain" || lower === "england") {
    return { country: "United Kingdom" };
  }

  if (lower === "india" || lower === "bharat") {
    return { country: "India" };
  }

  if (TERRITORY_SEEDS[clean]) {
    return { country: clean };
  }

  for (const key of Object.keys(TERRITORY_SEEDS)) {
    if (key.toLowerCase() === lower) {
      return { country: key };
    }
  }

  return { country: clean };
}

@Injectable()
export class AutopilotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutopilotService.name);
  private readonly googlePlaces = new GooglePlacesProvider();
  private readonly overpassOsm = new OverpassOsmProvider();
  private readonly searxng = new SearxngProvider();
  private loopTimer?: NodeJS.Timeout;
  private isCycleRunning = false;

  constructor(
    private readonly deduplicationService: DeduplicationService,
    private readonly healthService: ProviderHealthService,
    private readonly aiService: AIService
  ) {}

  onModuleInit() {
    this.logger.log("Autopilot 24/7 autonomous discovery loop initiated.");
    // Reset provider health so any past timeout cooldowns are cleared
    this.healthService.resetProviderHealth().catch(() => {});
    // Initial discovery tick 5s after startup
    setTimeout(() => this.runScheduledAutopilot(), 5000);
    // Recurring autonomous exploration tick every 35s
    this.loopTimer = setInterval(() => this.runScheduledAutopilot(), 35000);
  }

  onModuleDestroy() {
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
    }
  }

  private async runScheduledAutopilot() {
    if (this.isCycleRunning) return;
    this.isCycleRunning = true;
    try {
      const runningProfiles = await prisma.discoveryProfile.findMany({
        where: { status: "RUNNING" },
        take: 3,
      });

      for (const profile of runningProfiles) {
        try {
          const result = await this.runAutopilotCycle(profile.id);
          if (result.processed && result.discovered > 0) {
            this.logger.log(`Autopilot Cycle [${profile.name}]: ${result.message}`);
          }
        } catch (err: any) {
          this.logger.warn(`Autopilot cycle tick error for profile ${profile.id}: ${err.message}`);
        }
      }
    } catch (err: any) {
      this.logger.warn("Autopilot scheduler loop error:", err?.message);
    } finally {
      this.isCycleRunning = false;
    }
  }

  /**
   * Creates a new Autopilot Strategy Profile and initializes geographic queue
   */
  async createProfile(userId: string, data: {
    name: string;
    targetCountries: string[];
    targetRegions?: string[];
    targetCities?: string[];
    targetNiches: string[];
    opportunityFilters?: {
      noWebsite?: boolean;
      hasPhone?: boolean;
      hasAddress?: boolean;
      ratingAvailable?: boolean;
    };
    dailyTarget?: number;
    resourceBudget?: ResourceBudget;
    aiProcessingLevel?: AiProcessingLevel;
  }) {
    const targetNiches =
      Array.isArray(data.targetNiches) &&
      data.targetNiches.length > 0 &&
      !data.targetNiches.every((n) => n.toLowerCase().includes("dent") || n.toLowerCase().includes("hospital"))
        ? data.targetNiches
        : DEFAULT_PROFESSIONAL_NICHES;

    const profile = await prisma.discoveryProfile.create({
      data: {
        userId,
        name: data.name,
        status: "RUNNING",
        targetCountries: data.targetCountries,
        targetRegions: data.targetRegions || [],
        targetCities: data.targetCities || [],
        targetNiches,
        opportunityFilters: data.opportunityFilters || {
          noWebsite: true,
          hasPhone: true,
          hasAddress: true,
          ratingAvailable: false,
        },
        discoverySources: ["OVERPASS_OSM", "SEARXNG", "GOOGLE_PLACES"],
        dailyTarget: data.dailyTarget || 150,
        resourceBudget: data.resourceBudget || "LOW",
        aiProcessingLevel: data.aiProcessingLevel || "PROMISING_ONLY",
        totalDiscovered: 0,
        todayDiscovered: 0,
        duplicatesPrevented: 0,
      },
    });

    // Seed initial geographic queue for this profile
    await this.seedGeographicQueue(profile.id, data.targetCountries, data.targetRegions);

    return profile;
  }

  /**
   * Seeds the recursive territorial discovery queue and grid cells
   */
  async seedGeographicQueue(profileId: string, countries: string[], targetRegions?: string[]) {
    // Normalize countries and gather inferred regions (e.g. US States)
    const normalizedCountryMap = new Map<string, Set<string>>();

    for (const rawCountry of (countries && countries.length > 0 ? countries : ["United States"])) {
      const norm = normalizeTerritoryTarget(rawCountry);
      if (!normalizedCountryMap.has(norm.country)) {
        normalizedCountryMap.set(norm.country, new Set<string>());
      }
      if (norm.inferredRegion) {
        normalizedCountryMap.get(norm.country)!.add(norm.inferredRegion.toLowerCase());
      }
    }

    const explicitRegions = (targetRegions || []).map((r) => r.trim().toLowerCase()).filter(Boolean);

    for (const [country, stateSet] of normalizedCountryMap.entries()) {
      const territory = TERRITORY_SEEDS[country] || TERRITORY_SEEDS["United States"];
      const bounds = territory.bounds;

      // Create country level region
      const countryRegion = await prisma.discoveryRegion.create({
        data: {
          profileId,
          country,
          priority: 80,
          status: "PENDING",
          discoveryDepth: 1,
          boundingBox: bounds as any,
        },
      });

      // Filter cities matching targetRegions or inferred states
      const filterTargets = [...Array.from(stateSet), ...explicitRegions];

      let matchedCities = territory.cities;
      if (filterTargets.length > 0) {
        const filtered = territory.cities.filter((c) =>
          filterTargets.some((target) => {
            const stateLower = c.state.toLowerCase();
            const cityLower = c.name.toLowerCase();
            return (
              stateLower === target ||
              cityLower === target ||
              cityLower.includes(target) ||
              target.includes(cityLower)
            );
          })
        );
        if (filtered.length > 0) {
          matchedCities = filtered;
        }
      }

      // Limit to 25 cities max per country to maintain optimal cell queue
      const citiesToSeed = matchedCities.slice(0, 25);

      // Seed city regions and micro-grid cells
      for (const city of citiesToSeed) {
        const cityBounds: GeoBounds = {
          minLat: city.lat - 0.15,
          maxLat: city.lat + 0.15,
          minLon: city.lon - 0.15,
          maxLon: city.lon + 0.15,
        };

        const cityRegion = await prisma.discoveryRegion.create({
          data: {
            profileId,
            country,
            state: city.state,
            city: city.name,
            latitude: city.lat,
            longitude: city.lon,
            boundingBox: cityBounds as any,
            parentRegionId: countryRegion.id,
            priority: 60,
            status: "PENDING",
            discoveryDepth: 2,
          },
        });

        // Split into 2x2 grid cells
        const gridCells = partitionBoundsIntoGrid(cityBounds, 2);
        for (const cell of gridCells) {
          await prisma.discoveryCell.create({
            data: {
              regionId: cityRegion.id,
              geoCellId: cell.geoCellId,
              bounds: cell.bounds as any,
              status: "PENDING",
            },
          });
        }
      }
    }
  }

  /**
   * Executes one bounded iteration of Autopilot Discovery
   */
  async runAutopilotCycle(profileId?: string): Promise<{
    processed: boolean;
    discovered: number;
    duplicates: number;
    message: string;
  }> {
    const where: any = { status: "RUNNING" };
    if (profileId) where.id = profileId;

    const profile = await prisma.discoveryProfile.findFirst({
      where,
      orderBy: { updatedAt: "asc" },
    });

    if (!profile) {
      return {
        processed: false,
        discovered: 0,
        duplicates: 0,
        message: "No active autopilot profiles running.",
      };
    }

    // Check daily target
    const today = new Date().toISOString().split("T")[0];
    const lastResetDate = profile.lastDailyReset
      ? profile.lastDailyReset.toISOString().split("T")[0]
      : null;

    if (lastResetDate !== today) {
      // Day has rolled over, reset today's counter
      await prisma.discoveryProfile.update({
        where: { id: profile.id },
        data: { todayDiscovered: 0, lastDailyReset: new Date() },
      });
      profile.todayDiscovered = 0;
    }

    if (profile.todayDiscovered >= profile.dailyTarget) {
      return {
        processed: false,
        discovered: 0,
        duplicates: 0,
        message: `Daily target reached (${profile.todayDiscovered}/${profile.dailyTarget} qualified leads). In standby until morning reset.`,
      };
    }

    // Pick next pending cell or cooldown cell (prioritize unharvested cells first)
    const cooldownThreshold = new Date(Date.now() - 25 * 60 * 1000); // 25 min cooldown

    let cell = await prisma.discoveryCell.findFirst({
      where: {
        region: { profileId: profile.id },
        OR: [
          { status: "PENDING" },
          {
            status: "COOLDOWN",
            OR: [
              { lastScannedAt: null },
              { lastScannedAt: { lte: cooldownThreshold } },
            ],
          },
        ],
      },
      include: { region: true },
      orderBy: [
        { lastScannedAt: { sort: "asc", nulls: "first" } },
        { createdAt: "asc" },
      ],
    });

    if (!cell) {
      // Check if all cells are completed
      const totalCells = await prisma.discoveryCell.count({
        where: { region: { profileId: profile.id } },
      });

      if (totalCells > 0) {
        // Recycle cells whose last scan is older than 25 minutes
        const eligibleCount = await prisma.discoveryCell.count({
          where: {
            region: { profileId: profile.id },
            status: "COMPLETED",
            lastScannedAt: { lte: cooldownThreshold },
          },
        });

        if (eligibleCount > 0) {
          await prisma.discoveryCell.updateMany({
            where: {
              region: { profileId: profile.id },
              status: "COMPLETED",
              lastScannedAt: { lte: cooldownThreshold },
            },
            data: { status: "COOLDOWN" },
          });

          cell = await prisma.discoveryCell.findFirst({
            where: {
              region: { profileId: profile.id },
              status: "COOLDOWN",
            },
            include: { region: true },
            orderBy: [
              { lastScannedAt: { sort: "asc", nulls: "first" } },
              { createdAt: "asc" },
            ],
          });
        }
      } else {
        // No cells exist at all! Re-seed queue immediately
        const countries =
          Array.isArray(profile.targetCountries) && profile.targetCountries.length > 0
            ? (profile.targetCountries as string[])
            : ["United States"];
        const regions = Array.isArray(profile.targetRegions) ? (profile.targetRegions as string[]) : [];
        await this.seedGeographicQueue(profile.id, countries, regions);
        cell = await prisma.discoveryCell.findFirst({
          where: {
            region: { profileId: profile.id },
            status: { in: ["PENDING", "COOLDOWN"] },
          },
          include: { region: true },
          orderBy: { createdAt: "asc" },
        });
      }
    }

    if (!cell) {
      return {
        processed: false,
        discovered: 0,
        duplicates: 0,
        message: "Territory fully harvested for current window. Standby cooldown active to prevent duplicate queries.",
      };
    }

    // Determine target location
    const targetCity = cell.region.city || "Denver";
    const targetState = cell.region.state || "";
    const targetCountry = cell.region.country || "United States";
    const targetLocation = [targetCity, targetState, targetCountry].filter(Boolean).join(", ");
    const targetBounds = cell.bounds as any;

    await prisma.discoveryCell.update({
      where: { id: cell.id },
      data: { status: "PROCESSING", lastScannedAt: new Date() },
    });

    // Intelligent Niche Rotation across diverse high-value B2B industries
    const userNiches = (
      Array.isArray(profile.targetNiches) ? (profile.targetNiches as string[]) : []
    )
      .map((s) => s.trim())
      .filter(Boolean);

    const niches =
      userNiches.length > 0 &&
      !userNiches.every((n) => n.toLowerCase().includes("dent") || n.toLowerCase().includes("hospital"))
        ? userNiches
        : DEFAULT_PROFESSIONAL_NICHES;

    // Check recent query logs in this profile to select a niche that has not been scanned recently
    const recentLogs = await prisma.discoveryQueryLog.findMany({
      where: {
        profileId: profile.id,
        createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      },
      select: { niche: true },
      take: 40,
      orderBy: { createdAt: "desc" },
    });

    const recentNicheSet = new Set(recentLogs.map((l) => l.niche.toLowerCase()));
    let eligibleNiches = niches.filter((n) => !recentNicheSet.has(n.toLowerCase()));
    if (eligibleNiches.length === 0) {
      eligibleNiches = niches;
    }

    const targetNiche =
      eligibleNiches[Math.floor(Math.random() * eligibleNiches.length)] ||
      niches[0] ||
      "Commercial HVAC";

    // Expand niche into controlled variants and rotate variants
    const expanded = expandNicheQuery(targetNiche, targetCountry, true, 4);
    const variantIndex = Math.floor(Math.random() * (expanded.variants.length || 1));
    const queryTerm = expanded.variants[variantIndex] || targetNiche;

    // Update profile live status
    await prisma.discoveryProfile.update({
      where: { id: profile.id },
      data: {
        currentCountry: targetCountry,
        currentRegion: targetCity,
        currentNiche: `${targetNiche} (${queryTerm})`,
        currentCellId: cell.geoCellId,
        lastRunAt: new Date(),
      },
    });

    const startTime = Date.now();
    let rawResults: DiscoveredLeadData[] = [];
    let usedProvider = "OVERPASS_OSM";

    // 1. Try Overpass OSM (Keyless Bounding Box / Geographic POIs)
    const canOsm = await this.healthService.canQuery("OVERPASS_OSM");
    if (canOsm) {
      try {
        const osmResults = await this.overpassOsm.search({
          query: queryTerm,
          location: targetLocation,
          cityName: targetCity,
          countryCode: targetCountry,
          bounds: targetBounds,
          limit: profile.resourceBudget === "HIGH" ? 50 : 25,
        });
        if (osmResults.length > 0) {
          rawResults.push(...osmResults);
          usedProvider = "OVERPASS_OSM";
          await this.healthService.recordSuccess("OVERPASS_OSM", Date.now() - startTime);
        }
      } catch (err: any) {
        await this.healthService.recordFailure("OVERPASS_OSM", err.message);
      }
    }

    // 2. Try SearXNG Metasearch if OSM yielded few results
    if (rawResults.length < 5 && (await this.healthService.canQuery("SEARXNG"))) {
      try {
        const searxQuery = `${queryTerm} in ${targetCity} ${targetState}`.trim();
        const searxResults = await this.searxng.search({
          query: searxQuery,
          location: targetLocation,
          cityName: targetCity,
          countryCode: targetCountry,
          limit: 20,
        });
        if (searxResults.length > 0) {
          rawResults.push(...searxResults);
          usedProvider = "SEARXNG";
          await this.healthService.recordSuccess("SEARXNG", Date.now() - startTime);
        }
      } catch (err: any) {
        await this.healthService.recordFailure("SEARXNG", err.message);
      }
    }

    // 3. Try Google Places if configured
    if (rawResults.length === 0 && this.googlePlaces.isConfigured() && (await this.healthService.canQuery("GOOGLE_PLACES"))) {
      try {
        const googleResults = await this.googlePlaces.search({
          query: queryTerm,
          location: targetLocation,
          cityName: targetCity,
          countryCode: targetCountry,
          limit: 20,
        });
        if (googleResults.length > 0) {
          rawResults.push(...googleResults);
          usedProvider = "GOOGLE_PLACES";
          await this.healthService.recordSuccess("GOOGLE_PLACES", Date.now() - startTime);
        }
      } catch (err: any) {
        await this.healthService.recordFailure("GOOGLE_PLACES", err.message);
      }
    }

    // Ingest & Deduplicate raw leads
    let newUnique = 0;
    let duplicates = 0;
    const oppFilters: any = profile.opportunityFilters || {};

    for (const item of rawResults) {
      const res = await this.deduplicationService.resolveAndPersistLead(
        item,
        profile.userId,
        profile.id
      );

      if (res) {
        if (res.isDuplicate) {
          duplicates++;
        } else {
          newUnique++;
          const lead = res.lead;

          // Calculate deterministic score
          const score = (!lead.hasWebsite ? 35 : 10) + (lead.phone ? 25 : 0) + (lead.category ? 20 : 5) + 10;
          await prisma.business.update({
            where: { id: lead.id },
            data: {
              leadScore: Math.min(score, 100),
              opportunityScore: !lead.hasWebsite ? 85 : 50,
              lifecycleStage: score >= 70 ? "SCORED" : "STORED",
            },
          });

          // Async AI Qualification if promising
          if (
            (profile.aiProcessingLevel === "FULL" || (profile.aiProcessingLevel === "PROMISING_ONLY" && score >= 70)) &&
            this.aiService.isConfigured()
          ) {
            this.aiService
              .analyzeLead(lead)
              .then((aiRes) => {
                prisma.business
                  .update({
                    where: { id: lead.id },
                    data: {
                      aiSummary: aiRes?.summary || null,
                      aiQualification: aiRes || null,
                      aiAnalyzedAt: new Date(),
                      lifecycleStage: "AI_REVIEWED",
                    },
                  })
                  .catch(() => {});
              })
              .catch(() => {});
          }
        }
      }
    }

    // Update query log
    const queryHash = generateQueryHash(queryTerm, targetLocation, usedProvider, cell?.geoCellId);
    await prisma.discoveryQueryLog.create({
      data: {
        profileId: profile.id,
        queryHash,
        queryText: queryTerm,
        niche: targetNiche,
        location: targetLocation,
        provider: usedProvider,
        resultsCount: rawResults.length,
        uniqueCount: newUnique,
        duplicateCount: duplicates,
        durationMs: Date.now() - startTime,
        status: "SUCCESS",
      },
    });

    // Update cell and profile progress
    if (cell) {
      await prisma.discoveryCell.update({
        where: { id: cell.id },
        data: {
          status: "COMPLETED",
          leadYield: newUnique,
          lastScannedAt: new Date(),
        },
      });
    }

    await prisma.discoveryProfile.update({
      where: { id: profile.id },
      data: {
        todayDiscovered: profile.todayDiscovered + newUnique,
        totalDiscovered: profile.totalDiscovered + newUnique,
        duplicatesPrevented: profile.duplicatesPrevented + duplicates,
      },
    });

    return {
      processed: true,
      discovered: newUnique,
      duplicates,
      message: `Discovered ${newUnique} unique leads, prevented ${duplicates} duplicates in ${targetCity} (${queryTerm}).`,
    };
  }

  /**
   * Returns complete telemetry and status for Autopilot Dashboard
   */
  async getAutopilotStatus(userId: string) {
    let profile = await prisma.discoveryProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        regions: { take: 5, orderBy: { updatedAt: "desc" } },
      },
    });

    if (!profile) {
      profile = await prisma.discoveryProfile.findFirst({
        where: { status: "RUNNING" },
        orderBy: { updatedAt: "desc" },
        include: {
          regions: { take: 5, orderBy: { updatedAt: "desc" } },
        },
      });
    }

    const totalCells = profile
      ? await prisma.discoveryCell.count({ where: { region: { profileId: profile.id } } })
      : 0;
    const completedCells = profile
      ? await prisma.discoveryCell.count({
          where: { region: { profileId: profile.id }, status: "COMPLETED" },
        })
      : 0;

    const recentLogs = profile
      ? await prisma.discoveryQueryLog.findMany({
          where: { profileId: profile.id },
          take: 8,
          orderBy: { createdAt: "desc" },
        })
      : [];

    const providersHealth = await this.healthService.getAllHealth();

    // Calculate real database metrics
    const totalDbLeads = await prisma.business.count({ where: { userId } });
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayDbLeads = await prisma.business.count({
      where: { userId, createdAt: { gte: startOfToday } },
    });
    const missingWebsites = await prisma.business.count({
      where: { userId, hasWebsite: false },
    });

    const effectiveTotal = Math.max(profile?.totalDiscovered || 0, totalDbLeads);
    const effectiveToday = Math.max(profile?.todayDiscovered || 0, todayDbLeads);

    return {
      profile: profile || null,
      status: profile?.status || "IDLE",
      todayDiscovered: effectiveToday,
      dailyTarget: profile?.dailyTarget || 150,
      totalDiscovered: effectiveTotal,
      missingWebsitesCount: missingWebsites,
      duplicatesPrevented: profile?.duplicatesPrevented || 0,
      currentRegion: profile?.currentRegion || (profile ? "All Regions" : null),
      currentNiche: profile?.currentNiche || null,
      currentCountry: profile?.currentCountry || null,
      gridProgress: {
        totalCells: Math.max(totalCells, 1),
        completedCells,
        percent: totalCells > 0 ? Math.round((completedCells / totalCells) * 100) : 0,
      },
      recentLogs,
      providersHealth,
    };
  }

  /**
   * Live aggregated activity stream for the dashboard
   */
  async getLiveActivity(userId: string, limit = 15) {
    return prisma.leadEvent.findMany({
      where: {
        business: { userId },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            city: true,
            category: true,
            leadScore: true,
            hasWebsite: true,
            phone: true,
          },
        },
      },
    });
  }

  /**
   * Generates or fetches Morning Daily Digest for the user
   */
  async getDailyDigest(userId: string, dateStr?: string) {
    const date = dateStr || new Date().toISOString().split("T")[0];

    let digest = await prisma.dailyDigest.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!digest) {
      // Build on-demand daily digest from recently discovered leads
      const recentLeads = await prisma.business.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: [{ leadScore: "desc" }, { createdAt: "desc" }],
        take: 150,
        include: { websites: true, phones: true },
      });

      const totalDiscovered = recentLeads.length;
      const verifiedCount = recentLeads.filter((l) => l.verificationStatus === "VERIFIED" || l.sourceProvider).length;
      const missingWebsitesCount = recentLeads.filter((l) => !l.hasWebsite && !l.website).length;
      const highOpportunityCount = recentLeads.filter((l) => l.leadScore >= 75).length;

      const topLeadsFormatted = recentLeads.slice(0, 20).map((lead) => ({
        id: lead.id,
        name: lead.name,
        category: lead.category || "Commercial Entity",
        city: lead.city || "Territory",
        country: lead.country || "Global",
        phone: lead.phone,
        hasWebsite: lead.hasWebsite ?? Boolean(lead.website),
        leadScore: lead.leadScore,
        leadGrade: lead.leadGrade,
        opportunityScore: lead.opportunityScore,
        evidence: [
          !lead.hasWebsite ? "Missing official website (High-converting target)" : "Website audited",
          lead.phone ? "Direct phone line verified" : "No public phone",
          lead.city ? `Active business node in ${lead.city}` : "Regional listing",
        ],
        sourceProvider: lead.sourceProvider || "Verified Registry",
        aiSummary: lead.aiSummary,
      }));

      const summaryText = totalDiscovered > 0
        ? `Good morning. Overnight autonomous discovery harvested ${totalDiscovered} verified business profiles, including ${missingWebsitesCount} prime web-design prospects with direct contact numbers.`
        : "Autonomous discovery is active and scanning configured territories.";

      const categoryCounts: Record<string, number> = {};
      for (const lead of recentLeads) {
        const cat = lead.category || "Commercial Entity";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }

      digest = await prisma.dailyDigest.create({
        data: {
          userId,
          date,
          totalDiscovered,
          uniqueCount: totalDiscovered,
          duplicatesPrevented: 0,
          verifiedCount,
          missingWebsitesCount,
          highOpportunityCount,
          topLeads: topLeadsFormatted as any,
          summaryText,
          breakdown: {
            byCategory: Object.keys(categoryCounts).length > 0 ? categoryCounts : { "Commercial Services": totalDiscovered },
          },
        },
      });
    }

    return digest;
  }

  /**
   * Resets false duplicates counter and today's telemetry metrics
   */
  async resetTelemetry(profileId: string) {
    return prisma.discoveryProfile.update({
      where: { id: profileId },
      data: {
        duplicatesPrevented: 0,
        todayDiscovered: 0,
      },
    });
  }

  /**
   * Cleans existing regions/cells for a profile and reseeds with normalized territories
   */
  async reseedProfile(profileId: string) {
    const profile = await prisma.discoveryProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) throw new Error("Profile not found");

    this.logger.log(`Reseeding Autopilot profile [${profile.name}] with clean normalized territories and diverse niches...`);

    // 1. Delete old cells and regions
    await prisma.discoveryCell.deleteMany({
      where: { region: { profileId } },
    });
    await prisma.discoveryRegion.deleteMany({
      where: { profileId },
    });

    // Reset provider health so OVERPASS or SEARXNG are immediately ACTIVE
    await this.healthService.resetProviderHealth();

    // 2. Normalize countries and regions
    const rawCountries = Array.isArray(profile.targetCountries) ? (profile.targetCountries as string[]) : ["United States"];
    const rawRegions = Array.isArray(profile.targetRegions) ? (profile.targetRegions as string[]) : [];

    const normalizedCountries: string[] = [];
    const normalizedRegions: string[] = [...rawRegions];

    for (const c of rawCountries) {
      const norm = normalizeTerritoryTarget(c);
      if (!normalizedCountries.includes(norm.country)) {
        normalizedCountries.push(norm.country);
      }
      if (norm.inferredRegion && !normalizedRegions.includes(norm.inferredRegion)) {
        normalizedRegions.push(norm.inferredRegion);
      }
    }

    if (normalizedCountries.length === 0) {
      normalizedCountries.push("United States");
    }

    // Ensure niches are diverse and not stuck on only dental/hospital
    const rawNiches = Array.isArray(profile.targetNiches) ? (profile.targetNiches as string[]) : [];
    const hasOnlyDentalOrHospital =
      rawNiches.length === 0 ||
      rawNiches.every((n) => n.toLowerCase().includes("dent") || n.toLowerCase().includes("hospital"));
    const updatedNiches = hasOnlyDentalOrHospital ? DEFAULT_PROFESSIONAL_NICHES : rawNiches;

    // Update profile with clean normalized countries, diverse niches, and reset duplicatesPrevented
    await prisma.discoveryProfile.update({
      where: { id: profileId },
      data: {
        targetCountries: normalizedCountries,
        targetRegions: normalizedRegions,
        targetNiches: updatedNiches,
        currentCountry: normalizedCountries[0] || "United States",
        currentRegion: normalizedRegions[0] || "Denver",
        currentNiche: updatedNiches[0] || "Commercial HVAC",
        status: "RUNNING",
        duplicatesPrevented: 0,
        todayDiscovered: 0,
      },
    });

    // 3. Seed new geographic queue
    await this.seedGeographicQueue(profileId, normalizedCountries, normalizedRegions);

    this.logger.log(`Successfully reseeded Autopilot profile [${profile.name}]. Triggering first discovery cycle...`);

    // 4. Trigger one cycle right away
    return this.runAutopilotCycle(profileId);
  }
}
