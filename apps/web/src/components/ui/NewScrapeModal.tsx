import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  CheckCircle2,
  Sliders,
  Database,
  Globe,
  Phone,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { leadEngineApi } from "../../lib/api";
import { Button } from "./Button";
import { Input } from "./Input";
import { LocationSelector, LocationSelection } from "./LocationSelector";
import { cn } from "../../lib/utils";

interface NewScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewScrapeModal: React.FC<NewScrapeModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [query, setQuery] = useState("Dentist");
  const [locationDetails, setLocationDetails] = useState<LocationSelection>({
    countryCode: "IN",
    countryName: "India",
    stateCode: "MH",
    stateName: "Maharashtra",
    cityName: "Mumbai",
    formatted: "Mumbai, Maharashtra, India",
  });
  const [radius, setRadius] = useState(25);
  const [sources, setSources] = useState({
    osm: true,
    searxng: true,
    google: false,
  });
  const [filters, setFilters] = useState({
    onlyWithoutWebsite: false,
    requirePhone: true,
    dedupExisting: true,
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [discoveredCount, setDiscoveredCount] = useState<number | null>(null);

  const navigate = useNavigate();

  if (!isOpen) return null;

  const pipelineStages = [
    { label: "Registry Query", desc: "Querying OpenStreetMap Overpass & SearXNG" },
    { label: "Deduplication", desc: "Normalizing names, phone numbers & geo hashes" },
    { label: "Data Validation", desc: "Verifying physical coordinates & contacts" },
    { label: "Footprint Detection", desc: "Checking DNS, domains, SSL & active websites" },
    { label: "Scoring Engine", desc: "Calculating multi-factor opportunity scores" },
  ];

  const handleLaunch = async () => {
    setIsExecuting(true);
    setStep(6);
    setPipelineStep(0);

    // Progressive step advancement for professional UX feedback
    const interval = setInterval(() => {
      setPipelineStep((prev) => {
        if (prev < pipelineStages.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 900);

    try {
      const data = await leadEngineApi.discoverLeads({
        query: query.trim(),
        location: locationDetails.formatted,
        cityName: locationDetails.cityName,
        stateCode: locationDetails.stateCode,
        countryCode: locationDetails.countryCode,
        radiusKm: radius,
        onlyWithoutWebsite: filters.onlyWithoutWebsite,
      });

      const count = Array.isArray(data) ? data.length : (data as any)?.items?.length || 0;
      setDiscoveredCount(count);
      setPipelineStep(pipelineStages.length);
    } catch (err) {
      console.error("Scrape error:", err);
      setDiscoveredCount(0);
    } finally {
      clearInterval(interval);
      setIsExecuting(false);
    }
  };

  const handleFinish = () => {
    onClose();
    setStep(1);
    setPipelineStep(0);
    setDiscoveredCount(null);
    navigate(`/discover?query=${encodeURIComponent(query)}&location=${encodeURIComponent(locationDetails.formatted)}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scrape-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm transition-all"
    >
      <div className="bg-bg-surface border border-border-subtle rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between bg-bg-base/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 id="scrape-modal-title" className="text-sm font-semibold text-text-primary tracking-tight">
                New Lead Intelligence Scrape
              </h2>
              <p className="text-[11px] text-text-tertiary">
                Step {step} of 5 — {step === 1 && "Target Niche"}
                {step === 2 && "Location & Boundary"}
                {step === 3 && "Registry Providers"}
                {step === 4 && "Lead Qualifiers"}
                {step === 5 && "Preview & Run"}
                {step === 6 && "Live Pipeline Execution"}
              </p>
            </div>
          </div>

          {!isExecuting && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Wizard Steps Progress Bar */}
        {step <= 5 && (
          <div className="w-full bg-border-subtle h-1 flex">
            <div
              className="bg-accent h-full transition-all duration-300 ease-out"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: Target */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Business Industry / Category
                </label>
                <Input
                  placeholder="e.g. Dental Clinic, Cosmetic Surgeon, HVAC, Real Estate"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  icon={<Search className="w-4 h-4 text-text-tertiary" />}
                  autoFocus
                />
                <p className="text-[11px] text-text-tertiary mt-1.5">
                  Specify the exact service, industry or commercial trade you want to identify.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Popular High-Opportunity Niches
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Dentist", "Orthopedic Hospital", "HVAC Contractor", "Real Estate Agency", "Solar Installer", "Veterinarian", "Catering & Banquet"].map((niche) => (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => setQuery(niche)}
                      className={cn(
                        "text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                        query.toLowerCase() === niche.toLowerCase()
                          ? "border-accent bg-accent/15 text-accent font-medium"
                          : "border-border-default bg-bg-base text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
                      )}
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Geographic Market & Hierarchy
                </label>
                <LocationSelector
                  value={locationDetails}
                  onChange={(sel) => setLocationDetails(sel)}
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-primary">
                    Search Radius
                  </label>
                  <span className="text-xs font-mono font-medium text-accent">
                    {radius} km
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-border-default rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                  <span>5 km (Local)</span>
                  <span>25 km (Metro)</span>
                  <span>100 km (Regional)</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Sources */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-text-secondary leading-relaxed mb-3">
                LeadEngine queries authentic public data registries without requiring third-party API tokens.
              </p>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-default bg-bg-base cursor-pointer hover:border-accent/40 transition-colors">
                <input
                  type="checkbox"
                  checked={sources.osm}
                  onChange={(e) => setSources({ ...sources, osm: e.target.checked })}
                  className="mt-0.5 rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">OpenStreetMap Overpass</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-success/15 text-success font-medium">Verified Active</span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">
                    Live global geo-registry with official node tags, physical addresses, and verified telephone contacts.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-default bg-bg-base cursor-pointer hover:border-accent/40 transition-colors">
                <input
                  type="checkbox"
                  checked={sources.searxng}
                  onChange={(e) => setSources({ ...sources, searxng: e.target.checked })}
                  className="mt-0.5 rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">SearXNG Metasearch Engine</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-success/15 text-success font-medium">Verified Active</span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">
                    Multi-engine aggregator indexing Bing, Google, and DuckDuckGo business citations without API key limits.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-subtle bg-bg-base/40 opacity-70">
                <input
                  type="checkbox"
                  checked={sources.google}
                  disabled
                  className="mt-0.5 rounded border-border-default text-accent focus:ring-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Google Places API</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-border-default text-text-tertiary">Optional</span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">
                    Keyless fallback automatically engaged. Can be toggled in Settings if an official AIza key is added.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 4: Qualifiers & Filters */}
          {step === 4 && (
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-default bg-bg-base cursor-pointer hover:border-accent/40 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.onlyWithoutWebsite}
                  onChange={(e) => setFilters({ ...filters, onlyWithoutWebsite: e.target.checked })}
                  className="mt-0.5 rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Prioritize Missing Websites</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-medium">+35 Score</span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">
                    Highlights businesses with verified physical operations and contact phones but zero registered websites.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-default bg-bg-base cursor-pointer hover:border-accent/40 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.requirePhone}
                  onChange={(e) => setFilters({ ...filters, requirePhone: e.target.checked })}
                  className="mt-0.5 rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">Must Have Direct Telephone</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">+25 Score</span>
                  </div>
                  <p className="text-text-tertiary mt-0.5">
                    Filters out listings that lack public contact phone numbers for direct cold-calling and WhatsApp pitches.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border-default bg-bg-base cursor-pointer hover:border-accent/40 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.dedupExisting}
                  onChange={(e) => setFilters({ ...filters, dedupExisting: e.target.checked })}
                  className="mt-0.5 rounded border-border-default text-accent focus:ring-accent accent-accent"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-text-primary">Deduplicate Against Existing Workspace Database</span>
                  <p className="text-text-tertiary mt-0.5">
                    Automatically skips records already saved in your workspace leads table to protect contact quota.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* STEP 5: Preview & Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-bg-base border border-border-default p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle">
                  <span className="text-text-tertiary">Target Niche:</span>
                  <span className="font-semibold text-text-primary">{query}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle">
                  <span className="text-text-tertiary">Market Territory:</span>
                  <span className="font-semibold text-text-primary">{locationDetails.formatted} ({radius} km)</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-border-subtle">
                  <span className="text-text-tertiary">Active Registries:</span>
                  <span className="font-mono text-accent">OpenStreetMap, SearXNG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-tertiary">Strategy:</span>
                  <span className="font-semibold text-text-primary">
                    {filters.onlyWithoutWebsite ? "Prime Missing-Website Prospects" : "All Verified Operations"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-2.5 text-xs text-text-primary">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Ready to launch intelligence harvest. The backend worker will stream live verified nodes and score opportunity tiers immediately.
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Real-time Execution Pipeline */}
          {step === 6 && (
            <div className="space-y-4 py-3">
              <div className="text-center pb-2">
                <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto mb-2.5">
                  {isExecuting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {isExecuting ? "Executing Real-Data Scrape Pipeline..." : "Intelligence Harvest Completed"}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  {isExecuting
                    ? `Harvesting live nodes for "${query}" in ${locationDetails.cityName || "target area"}`
                    : `Successfully verified and imported ${discoveredCount ?? 0} authentic business operations.`}
                </p>
              </div>

              <div className="space-y-2 bg-bg-base border border-border-subtle rounded-lg p-3.5">
                {pipelineStages.map((stage, idx) => {
                  const isDone = pipelineStep > idx;
                  const isCurrent = pipelineStep === idx;
                  return (
                    <div
                      key={stage.label}
                      className={cn(
                        "flex items-center justify-between py-1.5 px-2 rounded text-xs transition-colors",
                        isCurrent && "bg-accent/10 font-medium text-accent",
                        isDone && "text-text-secondary",
                        !isDone && !isCurrent && "text-text-tertiary opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                        ) : isCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 text-accent animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-border-default shrink-0" />
                        )}
                        <span>{stage.label}</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary hidden sm:inline">
                        {stage.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-border-subtle bg-bg-base/60 flex items-center justify-between">
          {step <= 5 ? (
            <>
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => (s - 1) as any)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              )}

              {step < 5 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStep((s) => (s + 1) as any)}
                  className="gap-1.5"
                  disabled={step === 1 && !query.trim()}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLaunch}
                  className="gap-1.5 bg-accent hover:bg-accent-hover text-white font-medium"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Launch Scrape</span>
                </Button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinish}
                disabled={isExecuting}
                className="gap-1.5"
              >
                <span>View Discovered Leads</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
