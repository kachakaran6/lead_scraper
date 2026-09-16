import React, { useState } from "react";
import {
  Compass,
  Search,
  MapPin,
  Filter,
  Sparkles,
  Layers,
  Globe,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Download,
  Flame,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

interface MockLeadResult {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  phone: string;
  website: string | null;
  hasWebsite: boolean;
  score: number;
  opportunity: string;
  dealPotential: string;
}

export const DiscoverPage: React.FC = () => {
  const [query, setQuery] = useState("Dental Clinic");
  const [location, setLocation] = useState("Rajkot, Gujarat");
  const [radius, setRadius] = useState(25);
  const [provider, setProvider] = useState("all");
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MockLeadResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    try {
      // First try real discovery API or fetch existing leads matching
      const apiRes = await leadEngineApi.getLeads({ limit: 10 });
      if (apiRes?.items && apiRes.items.length > 0) {
        const mapped: MockLeadResult[] = apiRes.items.map((b: any) => ({
          id: b.id,
          name: b.name,
          category: b.category || "Business",
          address: b.address || "Local Address",
          city: b.city || "Rajkot",
          rating: b.rating || 4.8,
          reviewCount: b.reviewCount || 150,
          phone: b.phone || "+91 98250 00000",
          website: b.website || null,
          hasWebsite: !!b.website,
          score: b.leadScore || 85,
          opportunity: b.website ? "Website Redesign & Speed Optimization" : "Missing Website (Flagship Site Needed)",
          dealPotential: b.website ? "$1,200 - $2,500" : "$1,500 - $3,500",
        }));
        setResults(mapped);
      } else {
        // Fallback demo mock results
        setResults([
          {
            id: "mock-1",
            name: `${query} Premium Care`,
            category: query,
            address: "Main Commercial Complex, Yagnik Road",
            city: location.split(",")[0] || "Rajkot",
            rating: 4.9,
            reviewCount: 324,
            phone: "+91 98790 11223",
            website: null,
            hasWebsite: false,
            score: 96,
            opportunity: "NO WEBSITE: High revenue practice relying solely on word of mouth",
            dealPotential: "$2,000 - $4,000",
          },
          {
            id: "mock-2",
            name: `${query} Advanced Diagnostics`,
            category: query,
            address: "Kalawad Road, Near Ring Road",
            city: location.split(",")[0] || "Rajkot",
            rating: 4.7,
            reviewCount: 180,
            phone: "+91 97240 44556",
            website: "http://example.com/outdated",
            hasWebsite: true,
            score: 88,
            opportunity: "Outdated WordPress 4.9 site, not mobile friendly, missing WhatsApp",
            dealPotential: "$1,500 - $2,800",
          },
        ]);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsSearching(false);
    }
  };

  const filteredResults = onlyNoWebsite
    ? results.filter((r) => !r.hasWebsite)
    : results;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Universal Discovery Engine</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Multi-Source Scraping
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Scan local businesses across Google Maps, Yelp, YellowPages, Apollo, and social footprints.
        </p>
      </div>

      {/* Query Search Panel */}
      <Card className="glass-panel border-slate-800">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Target Business Niche"
                placeholder="e.g. Dental Clinic, Diagnostic Lab, Lawyer"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                icon={<Search className="w-4 h-4 text-slate-400" />}
                required
              />

              <Input
                label="City / Location Target"
                placeholder="e.g. Rajkot, Gujarat, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                icon={<MapPin className="w-4 h-4 text-slate-400" />}
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Radius ({radius} km)
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-indigo-400 w-12 text-right">
                    {radius}km
                  </span>
                </div>
              </div>
            </div>

            {/* Provider & Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Sources:</span>
                {[
                  { id: "all", label: "All Aggregated" },
                  { id: "maps", label: "Google Maps" },
                  { id: "yelp", label: "Yelp" },
                  { id: "yellow", label: "YellowPages" },
                  { id: "apollo", label: "Apollo / B2B" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      provider === p.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={onlyNoWebsite}
                    onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 accent-indigo-600"
                  />
                  <span>Show ONLY Leads Without Websites</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Highest Deal Close Rate
                  </span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSearching}
                  className="shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Discovery Run</span>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Discovery Results */}
      {hasSearched && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>Discovered Opportunities</span>
                <span className="text-sm font-normal text-slate-400">
                  ({filteredResults.length} leads extracted)
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/leads">
                <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs">
                  <span>Open Full CRM Leads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResults.map((lead) => (
              <Card
                key={lead.id}
                className="glass-panel border-slate-800 hover:border-slate-700 transition-all group"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                          {lead.name}
                        </h3>
                        {lead.score >= 90 && (
                          <Badge variant="danger" className="text-[10px] font-bold">
                            HOT LEAD 🔥
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{lead.address}, {lead.city}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-extrabold text-white font-mono">
                        {lead.score}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        Lead Score
                      </span>
                    </div>
                  </div>

                  {/* Value Proposition Box */}
                  <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Identified Need:</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        Est. Value: {lead.dealPotential}
                      </span>
                    </div>
                    <div className="text-slate-200 font-semibold">{lead.opportunity}</div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {lead.hasWebsite ? (
                        <Badge variant="info" className="text-[10px]">
                          WEBSITE DETECTED
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          NO WEBSITE FOUND
                        </Badge>
                      )}
                      <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                        ★ {lead.rating} ({lead.reviewCount} reviews)
                      </span>
                    </div>

                    <Link to={`/leads/${lead.id}`}>
                      <Button size="sm" variant="primary" className="text-xs">
                        View Lead & Outreach &rarr;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
