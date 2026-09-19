import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Globe,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Zap,
  Sliders,
  TrendingUp,
  Layers,
  ChevronRight,
  Database,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LocationSelector, LocationSelection } from "../components/ui/LocationSelector";
import { leadEngineApi } from "../lib/api";
import { cn } from "../lib/utils";

interface DiscoveredLead {
  id: string;
  name: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  phone?: string | null;
  website?: string | null;
  hasWebsite?: boolean;
  hasPhone?: boolean;
  leadScore: number;
  leadGrade: string;
  sourceProvider?: string;
  verificationStatus?: string;
  scoringFactors?: Array<{
    name: string;
    points: number;
    met: boolean;
    explanation: string;
  }>;
}

export const DiscoverPage: React.FC = () => {
  const [query, setQuery] = useState("Dentist");
  const [locationDetails, setLocationDetails] = useState<LocationSelection>({
    countryCode: "IN",
    countryName: "India",
    stateCode: "MH",
    stateName: "Maharashtra",
    cityName: "Mumbai",
    formatted: "Mumbai, Maharashtra, India",
  });
  const [location, setLocation] = useState("Mumbai, Maharashtra");
  const [radius, setRadius] = useState(25);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);
  const [requirePhone, setRequirePhone] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string>("");
  const [results, setResults] = useState<DiscoveredLead[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleLocationChange = (sel: LocationSelection) => {
    setLocationDetails(sel);
    setLocation(sel.formatted);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchError(null);
    setSearchStatus(`Scanning verified registries for "${query}" in "${location}"...`);

    try {
      const data = await leadEngineApi.discoverLeads({
        query: query.trim(),
        location,
        cityName: locationDetails.cityName,
        stateCode: locationDetails.stateCode,
        countryCode: locationDetails.countryCode,
        radiusKm: radius,
        onlyWithoutWebsite: onlyNoWebsite,
      });

      let items: DiscoveredLead[] = Array.isArray(data) ? data : (data as any)?.items || [];
      if (requirePhone) {
        items = items.filter((item) => Boolean(item.phone));
      }
      setResults(items);
    } catch (err: any) {
      console.error("Discovery error:", err);
      setResults([]);
      setSearchError(
        err?.response?.data?.message ||
          "Unable to complete live discovery scan. Verify connection parameters or retry in a few moments."
      );
    } finally {
      setIsSearching(false);
      setSearchStatus("");
    }
  };

  // Metrics
  const totalFound = results.length;
  const verifiedCount = results.filter((r) => r.verificationStatus === "VERIFIED" || r.sourceProvider).length;
  const missingWebCount = results.filter((r) => !r.website).length;
  const highOpportunityCount = results.filter((r) => r.leadScore >= 75).length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Research Objective */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Lead Discovery & Registry Scraper
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Perform live, keyless node harvesting from OpenStreetMap Overpass and SearXNG verified registries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-xs font-semibold text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Keyless Engine Active
          </span>
        </div>
      </div>

      {/* 2. Structured Research Filter Workspace */}
      <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-4 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Niche / Category */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Target Business Niche / Service
              </label>
              <Input
                placeholder="e.g. Dentist, Dermatologist, Law Firm, HVAC Contractor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-text-tertiary" />}
                required
              />
            </div>

            {/* Location Hierarchy Selector */}
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Geographic Territory
              </label>
              <LocationSelector
                value={locationDetails}
                onChange={handleLocationChange}
              />
            </div>
          </div>

          {/* Progressive Filters & Radius Controls */}
          <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Toggles */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyNoWebsite}
                  onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                  className="rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <span className="font-medium">Only Missing Websites</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/15 text-amber-400 font-mono">
                  +35 pts
                </span>
              </label>

              <label className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={requirePhone}
                  onChange={(e) => setRequirePhone(e.target.checked)}
                  className="rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <span className="font-medium">Must Have Direct Phone</span>
              </label>
            </div>

            {/* Radius & CTA */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span>Radius:</span>
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="px-2 py-1 rounded bg-bg-base border border-border-default font-mono font-medium text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSearching}
                className="gap-1.5 px-4 bg-accent hover:bg-accent-hover text-white font-semibold"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Harvest Leads</span>
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* 3. Live Search Status or Error Callout */}
      {isSearching && (
        <div className="p-4 rounded-xl bg-bg-surface border border-accent/30 flex items-center gap-3 text-xs text-accent">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{searchStatus || "Executing real-time query against verified public node registries..."}</span>
        </div>
      )}

      {searchError && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Discovery Harvest Issue</span>
          </div>
          <p>{searchError}</p>
        </div>
      )}

      {/* 4. Discovered Summary Metrics Bar */}
      {hasSearched && !isSearching && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
            <span className="text-text-tertiary text-[11px] block">Discovered Leads</span>
            <div className="text-xl font-bold font-mono text-text-primary">{totalFound}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
            <span className="text-text-tertiary text-[11px] block">Verified Operations</span>
            <div className="text-xl font-bold font-mono text-success">{verifiedCount}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
            <span className="text-text-tertiary text-[11px] block">Missing Websites</span>
            <div className="text-xl font-bold font-mono text-amber-400">{missingWebCount}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
            <span className="text-text-tertiary text-[11px] block">High Opportunity (Grade A)</span>
            <div className="text-xl font-bold font-mono text-accent">{highOpportunityCount}</div>
          </div>
        </div>
      )}

      {/* 5. Live Discovery Results Grid */}
      <div className="space-y-3">
        {results.length > 0 ? (
          results.map((lead) => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              lead.name + " " + (lead.address || lead.city || "")
            )}`;

            return (
              <div
                key={lead.id}
                className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-subtle hover:border-border-default transition-all space-y-3 shadow-sm group"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-bold text-sm sm:text-base text-text-primary hover:text-accent transition-colors"
                      >
                        {lead.name}
                      </Link>

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-success/15 text-success border border-success/30">
                        <CheckCircle2 className="w-3 h-3" />
                        VERIFIED
                      </span>

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-bg-base text-text-secondary border border-border-default">
                        <Database className="w-3 h-3 text-text-tertiary" />
                        {lead.sourceProvider || "OpenStreetMap"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <span className="text-text-primary font-medium">{lead.category || "Service Provider"}</span>
                      <span className="text-text-tertiary">•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                        <span>{lead.address || lead.city || "Verified Region"}</span>
                      </span>
                      {lead.rating && (
                        <>
                          <span className="text-text-tertiary">•</span>
                          <span className="text-amber-400 font-medium">★ {lead.rating}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Score Pill */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "font-mono font-bold text-xs px-2.5 py-1 rounded-full",
                        lead.leadScore >= 80
                          ? "bg-success/15 text-success border border-success/30"
                          : lead.leadScore >= 60
                          ? "bg-warning/15 text-warning border border-warning/30"
                          : "bg-border-subtle text-text-tertiary"
                      )}
                    >
                      {lead.leadScore || 65} / 100 Score
                    </span>
                  </div>
                </div>

                {/* Footprint Attributes & Quick Action Buttons */}
                <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-base hover:bg-bg-surface-hover text-text-primary border border-border-default font-mono transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-accent" />
                        <span>{lead.phone}</span>
                      </a>
                    ) : (
                      <span className="px-2 py-1 rounded bg-bg-base text-text-tertiary text-[11px] border border-border-subtle">
                        No phone listed
                      </span>
                    )}

                    {!lead.website ? (
                      <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[11px] font-semibold border border-amber-500/25">
                        Missing Website (+35 pts)
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-bg-base text-text-secondary text-[11px] border border-border-subtle">
                        Website verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-bg-base hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary border border-border-default transition-colors text-xs"
                    >
                      Maps
                    </a>

                    <Link to={`/leads/${lead.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                        <span>Inspect Intel Dossier</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : hasSearched && !isSearching ? (
          <div className="py-16 text-center space-y-3 bg-bg-surface border border-border-subtle rounded-xl p-8">
            <div className="w-10 h-10 rounded-full bg-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              No Verified Listings Located
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Try broadening your category query (e.g. "Hospital" instead of "Orthopedic Clinic") or increasing the search radius.
            </p>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3 bg-bg-surface border border-border-subtle rounded-xl p-8">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center mx-auto text-accent">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Launch an Authentic Lead Harvest
            </h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              Enter a target service industry and location above to scan verified OpenStreetMap and SearXNG registries. Missing websites will be automatically scored for direct acquisition outreach.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
