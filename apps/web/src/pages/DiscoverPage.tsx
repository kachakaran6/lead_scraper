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
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LocationSelector, LocationSelection } from "../components/ui/LocationSelector";
import { leadEngineApi } from "../lib/api";

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

      const items = Array.isArray(data) ? data : (data as any)?.items || [];
      setResults(items);
    } catch (err: any) {
      console.error("Discovery error:", err);
      setResults([]);
      setSearchError(
        err?.response?.data?.message ||
          "Unable to complete live discovery. Please verify search parameters or network connectivity."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (onlyNoWebsite && (r.hasWebsite || r.website)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Discovery Engine
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Keyless business discovery via OpenStreetMap & SearXNG engines (Google Places optional)
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/leads">
            <Button variant="secondary" size="sm" className="text-xs font-medium">
              View All Leads ({results.length > 0 ? results.length : "CRM"})
            </Button>
          </Link>
        </div>
      </div>

      {/* Query Search Panel */}
      <Card className="border border-border-subtle bg-bg-surface shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              <div className="md:col-span-4">
                <Input
                  label="Target Niche / Category"
                  placeholder="e.g. Dentist, Orthopedic, Gym, Cafe"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  icon={<Search className="w-4 h-4 text-text-tertiary" />}
                  required
                />
              </div>

              <div className="md:col-span-8">
                <LocationSelector
                  value={locationDetails}
                  onChange={handleLocationChange}
                  label="Geographic Location (Country → State → City)"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-normal text-text-secondary">
                <span>Discovery Search Radius</span>
                <span className="font-mono tabular-nums text-text-primary font-medium">
                  {radius} km around market
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-accent h-1.5 bg-bg-surface-hover rounded cursor-pointer"
              />
            </div>

            {/* Filter and Trigger Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary select-none">
                  <input
                    type="checkbox"
                    checked={onlyNoWebsite}
                    onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default bg-bg-base text-accent accent-accent"
                  />
                  <span>Target businesses without website only</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSearching}
                className="text-xs px-4"
              >
                Run Live Discovery
              </Button>
            </div>

            {/* Dynamic Status / Progress Banner */}
            {isSearching && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/25 text-xs text-text-primary flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-accent animate-spin shrink-0" />
                <span>{searchStatus}</span>
              </div>
            )}

            {/* Search Error Banner */}
            {searchError && (
              <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/25 text-danger text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasSearched && !isSearching && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <h2 className="text-sm font-semibold text-text-primary">
              Discovered Business Records ({filteredResults.length})
            </h2>
            <span className="text-xs text-text-tertiary">
              Strict real data verification • Zero synthetic entries
            </span>
          </div>

          {filteredResults.length === 0 ? (
            <Card className="border border-border-subtle bg-bg-surface py-12 text-center">
              <CardContent className="space-y-2">
                <Globe className="w-8 h-8 text-text-tertiary mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-semibold text-text-primary">
                  No verified businesses found
                </h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto">
                  No registered physical entities matched "{query}" in "{location}". Try broadening the search radius or choosing another city.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResults.map((lead) => {
                const hasWeb = Boolean(lead.website || lead.hasWebsite);

                return (
                  <Card
                    key={lead.id}
                    className="border border-border-subtle bg-bg-surface hover:border-accent/40 transition-all flex flex-col justify-between"
                  >
                    <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Top badge row */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-bg-base border border-border-subtle text-text-secondary truncate">
                            {lead.category || query}
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                lead.leadGrade === "A"
                                  ? "bg-success/15 text-success border border-success/30"
                                  : lead.leadGrade === "B"
                                  ? "bg-accent/15 text-accent border border-accent/30"
                                  : "bg-warning/15 text-warning border border-warning/30"
                              }`}
                            >
                              Grade {lead.leadGrade} ({lead.leadScore} pts)
                            </span>
                          </div>
                        </div>

                        {/* Business Title */}
                        <h3 className="text-sm font-semibold text-text-primary leading-tight">
                          {lead.name}
                        </h3>

                        {/* Location */}
                        <div className="flex items-start gap-1.5 text-xs text-text-secondary">
                          <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0 mt-0.5" />
                          <span className="line-clamp-1">
                            {lead.address || `${lead.city || locationDetails.cityName}, ${lead.state || ""}`}
                          </span>
                        </div>

                        {/* Website Status Badge */}
                        <div className="pt-1">
                          {hasWeb ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-success/10 border border-success/20 text-success text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3" />
                              <span className="truncate max-w-[200px]">
                                {lead.website ? (
                                  <a
                                    href={lead.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline flex items-center gap-1"
                                  >
                                    Website Verified <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  "Website Verified"
                                )}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-warning/10 border border-warning/30 text-warning text-[11px] font-medium">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>No Website Found (High Opportunity)</span>
                            </div>
                          )}
                        </div>

                        {/* Phone status */}
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-0.5">
                          <Phone className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                          <span>{lead.phone ? lead.phone : "Not available at source"}</span>
                        </div>

                        {/* Transparent score factors */}
                        {lead.scoringFactors && lead.scoringFactors.length > 0 && (
                          <div className="pt-2 border-t border-border-subtle/60 text-[11px] space-y-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary block">
                              Score Breakdown:
                            </span>
                            {lead.scoringFactors.slice(0, 3).map((f, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-text-secondary text-[11px]"
                              >
                                <span className="truncate mr-2">• {f.name}</span>
                                <span
                                  className={`font-mono text-[10px] ${
                                    f.met ? "text-success font-medium" : "text-text-tertiary"
                                  }`}
                                >
                                  {f.met ? `+${f.points}` : "0"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Action footer */}
                      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2 mt-auto">
                        <div className="text-[10px] text-text-tertiary flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-success" />
                          <span>{lead.sourceProvider || "OpenStreetMap"}</span>
                        </div>

                        <Link to={`/leads/${lead.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                            Intel & Pitch &rarr;
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
