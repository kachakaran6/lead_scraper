import React, { useState, useEffect } from "react";
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
  Bot,
  Play,
  Pause,
  Clock,
  Sparkles,
  Settings2,
  Activity,
  Award,
  Filter,
  ArrowRight,
  Plus,
  Cpu,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LocationSelector, LocationSelection } from "../components/ui/LocationSelector";
import { leadEngineApi } from "../lib/api";
import { cn } from "../lib/utils";

import { PageHeader } from "../components/ui/PageHeader";

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
  // Discovery Mode: 'autopilot' | 'manual'
  const [activeTab, setActiveTab] = useState<"autopilot" | "manual">("autopilot");

  // --- Autopilot State ---
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [dailyDigest, setDailyDigest] = useState<any>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Autopilot Config Form State
  const [strategyName, setStrategyName] = useState("Healthcare & Dental Growth Engine");
  const [nichesInput, setNichesInput] = useState("Dentist, Dental Clinic, Orthodontist");
  const [countriesInput, setCountriesInput] = useState("India, UAE");
  const [regionsInput, setRegionsInput] = useState("Gujarat, Maharashtra, Dubai");
  const [dailyTarget, setDailyTarget] = useState(150);
  const [resourceBudget, setResourceBudget] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [aiProcessingLevel, setAiProcessingLevel] = useState<"PROMISING_ONLY" | "FULL" | "MINIMAL">("PROMISING_ONLY");
  const [oppFilterNoWebsite, setOppFilterNoWebsite] = useState(true);
  const [oppFilterHasPhone, setOppFilterHasPhone] = useState(true);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  // Sync state when autopilot status loads
  useEffect(() => {
    if (autopilotStatus?.profile) {
      const p = autopilotStatus.profile;
      if (p.name) setStrategyName(p.name);
      if (Array.isArray(p.targetNiches) && p.targetNiches.length > 0) {
        setNichesInput(p.targetNiches.join(", "));
      }
      if (Array.isArray(p.targetCountries) && p.targetCountries.length > 0) {
        setCountriesInput(p.targetCountries.join(", "));
      }
      if (Array.isArray(p.targetRegions) && p.targetRegions.length > 0) {
        setRegionsInput(p.targetRegions.join(", "));
      }
      if (p.dailyTarget) setDailyTarget(p.dailyTarget);
      if (p.resourceBudget) setResourceBudget(p.resourceBudget);
      if (p.aiProcessingLevel) setAiProcessingLevel(p.aiProcessingLevel);
      if (p.opportunityFilters) {
        setOppFilterNoWebsite(Boolean(p.opportunityFilters.noWebsite));
        setOppFilterHasPhone(Boolean(p.opportunityFilters.hasPhone));
      }
    }
  }, [autopilotStatus?.profile?.id]);

  // --- Manual Discovery State ---
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

  // Fetch Autopilot Status & Digest
  const fetchAutopilotData = async () => {
    try {
      const [status, activity, digest] = await Promise.all([
        leadEngineApi.getAutopilotStatus(),
        leadEngineApi.getAutopilotActivity(8),
        leadEngineApi.getTodayDigest(),
      ]);
      setAutopilotStatus(status);
      setActivityFeed(activity);
      setDailyDigest(digest);
    } catch (err) {
      console.warn("Failed to fetch autopilot data:", err);
    }
  };

  useEffect(() => {
    fetchAutopilotData();
    const interval = setInterval(fetchAutopilotData, 10000); // 10s live pulse
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutopilot = async () => {
    if (!autopilotStatus?.profile?.id) {
      setShowConfigModal(true);
      return;
    }
    setIsToggling(true);
    try {
      await leadEngineApi.toggleAutopilot(autopilotStatus.profile.id);
      await fetchAutopilotData();
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      await leadEngineApi.triggerAutopilotRun(autopilotStatus?.profile?.id);
      await fetchAutopilotData();
    } catch (err) {
      console.error("Trigger error:", err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStrategy(true);

    const parsedNiches = nichesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedCountries = countriesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedRegions = regionsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: strategyName.trim() || "LeadEngine Growth Strategy",
      targetNiches: parsedNiches.length > 0 ? parsedNiches : ["Dentist"],
      targetCountries: parsedCountries.length > 0 ? parsedCountries : ["India"],
      targetRegions: parsedRegions,
      dailyTarget: Number(dailyTarget) || 150,
      resourceBudget,
      aiProcessingLevel,
      opportunityFilters: {
        noWebsite: oppFilterNoWebsite,
        hasPhone: oppFilterHasPhone,
        hasAddress: true,
        ratingAvailable: false,
      },
    };

    try {
      let targetProfileId = autopilotStatus?.profile?.id;
      if (targetProfileId) {
        await leadEngineApi.updateAutopilotProfile(targetProfileId, payload);
        await leadEngineApi.reseedAutopilotProfile(targetProfileId);
      } else {
        const created = await leadEngineApi.createAutopilotProfile(payload);
        targetProfileId = created?.id;
      }
      setShowConfigModal(false);
      await fetchAutopilotData();
    } catch (err) {
      console.error("Save profile error:", err);
    } finally {
      setIsSavingStrategy(false);
    }
  };

  const handleLocationChange = (sel: LocationSelection) => {
    setLocationDetails(sel);
    setLocation(sel.formatted);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
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

  const isRunning = autopilotStatus?.status === "RUNNING";
  const todayCount = autopilotStatus?.todayDiscovered || 0;
  const targetCount = autopilotStatus?.dailyTarget || 150;
  const progressPercent = Math.min(Math.round((todayCount / targetCount) * 100), 100);

  return (
    <div className="space-y-6">
      {/* 1. Standardized Global Page Header with Dual Mode Switcher */}
      <PageHeader
        title={
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-text-primary">
            <Zap className="w-5 h-5 text-accent" />
            <span>Discovery</span>
          </div>
        }
        description="Autonomous 24/7 territory harvesting, multi-signal deduplication, and verified lead collection."
        actions={
          <div className="flex items-center p-1 rounded-lg bg-bg-surface border border-border-subtle shrink-0">
            <button
              onClick={() => setActiveTab("autopilot")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                activeTab === "autopilot"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Autopilot Engine (24/7)</span>
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all",
                activeTab === "manual"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual Registry Search</span>
            </button>
          </div>
        }
      />

      {/* ======================================================== */}
      {/* AUTOPILOT MODE                                           */}
      {/* ======================================================== */}
      {activeTab === "autopilot" && (
        <div className="space-y-6">
          {/* A. Status & Control Banner */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                    isRunning
                      ? "bg-success/15 border-success/30 text-success"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  )}
                >
                  <Bot className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-text-primary">
                      {autopilotStatus?.profile?.name || "Autonomous Lead Harvester"}
                    </h2>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        isRunning
                          ? "bg-success/15 border-success/30 text-success"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isRunning ? "bg-success animate-ping" : "bg-amber-400"
                        )}
                      />
                      {isRunning ? "RUNNING 24/7" : "PAUSED"}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Continuously exploring geographic grid cells & collecting verified business entities.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant={isRunning ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleToggleAutopilot}
                  isLoading={isToggling}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Autopilot</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Autopilot</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTriggerCycle}
                  isLoading={isTriggering}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isTriggering && "animate-spin")} />
                  <span>Scan Next Cell</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Configure Strategy</span>
                </Button>
              </div>
            </div>

            {/* B. Telemetry Strip */}
            <div className="pt-3 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-text-tertiary text-[11px]">Active Territory</span>
                <div className="font-semibold text-text-primary truncate">
                  {autopilotStatus?.currentRegion || "Ahmedabad"} · {autopilotStatus?.currentCountry || "India"}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-text-tertiary text-[11px]">Current Niche</span>
                <div className="font-semibold text-accent truncate">
                  {autopilotStatus?.currentNiche || "Dentist & Dental Clinics"}
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-text-tertiary text-[11px]">Resource Budget</span>
                <div className="font-semibold text-text-primary flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>{autopilotStatus?.profile?.resourceBudget || "LOW (2 Workers)"}</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-text-tertiary text-[11px]">Duplicates Prevented</span>
                <div className="font-semibold font-mono text-emerald-400">
                  {autopilotStatus?.duplicatesPrevented || 0} duplicates
                </div>
              </div>
            </div>
          </div>

          {/* C. Daily Progress & Discovery KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Daily Target Card */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary font-medium">Today's Qualified Leads</span>
                <span className="font-mono text-accent font-semibold">{progressPercent}%</span>
              </div>
              <div className="text-2xl font-bold font-mono text-text-primary">
                {todayCount} <span className="text-sm font-normal text-text-tertiary">/ {targetCount}</span>
              </div>
              <div className="w-full bg-bg-base rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Total Harvested */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-xs block font-medium">All-Time Unique Leads</span>
              <div className="text-2xl font-bold font-mono text-text-primary">
                {autopilotStatus?.totalDiscovered || 0}
              </div>
              <span className="text-[11px] text-success flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>One canonical record per entity</span>
              </span>
            </div>

            {/* Missing Websites */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-xs block font-medium">Missing Website Prospects</span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {dailyDigest?.missingWebsitesCount || Math.round(todayCount * 0.45)}
              </div>
              <span className="text-[11px] text-text-secondary">
                Prime web design & booking targets
              </span>
            </div>

            {/* Multi-Signal Deduplication */}
            <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-xs block font-medium">Multi-Signal Dedup</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {autopilotStatus?.duplicatesPrevented || 0}
              </div>
              <span className="text-[11px] text-text-secondary">
                Phone, domain & geo-hash checked
              </span>
            </div>
          </div>

          {/* D. Morning Daily Digest / Today's Leads Card */}
          {dailyDigest && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-bg-surface to-bg-surface/80 border border-accent/20 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                      Today's Morning Lead Digest
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-secondary">
                        {dailyDigest.date}
                      </span>
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {dailyDigest.summaryText}
                    </p>
                  </div>
                </div>

                <Link to="/leads">
                  <Button variant="secondary" size="sm" className="text-xs font-semibold gap-1">
                    <span>View Today's Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Top Recommended Leads Table */}
              {Array.isArray(dailyDigest.topLeads) && dailyDigest.topLeads.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border-subtle">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary block">
                    Top Priority Prospects Ready for Outreach:
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dailyDigest.topLeads.slice(0, 3).map((lead: any) => (
                      <div
                        key={lead.id}
                        className="p-3 rounded-lg bg-bg-base border border-border-subtle hover:border-accent/40 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="font-bold text-xs text-text-primary hover:text-accent truncate block"
                          >
                            {lead.name}
                          </Link>
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-accent/15 text-accent">
                            Score {lead.leadScore}
                          </span>
                        </div>

                        <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-text-tertiary" />
                          <span>{lead.city}, {lead.country}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {lead.evidence?.map((ev: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-text-secondary"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. Live Activity Feed */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-sm text-text-primary">Live Discovery Stream</h3>
              </div>
              <span className="text-[11px] font-mono text-text-tertiary">Real-time Node Ingestion</span>
            </div>

            <div className="space-y-2">
              {activityFeed.length > 0 ? (
                activityFeed.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-bg-base border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary truncate">
                          {evt.title || evt.description}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-success/15 text-success">
                          Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary truncate">{evt.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-text-tertiary text-[11px] font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(evt.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-text-secondary">
                  Autopilot is active. Incoming discovery events will stream here automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TARGETED MANUAL SEARCH MODE                              */}
      {/* ======================================================== */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          {/* Filter Workspace */}
          <div className="p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-4 shadow-sm">
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Target Business Niche / Service
                  </label>
                  <Input
                    placeholder="e.g. Dentist, Law Firm, HVAC Contractor, Dermatologist"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    icon={<Search className="w-4 h-4 text-text-tertiary" />}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Geographic Territory
                  </label>
                  <LocationSelector value={locationDetails} onChange={handleLocationChange} />
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-2 text-text-secondary hover:text-text-primary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyNoWebsite}
                      onChange={(e) => setOnlyNoWebsite(e.target.checked)}
                      className="rounded border-border-default text-accent focus:ring-accent accent-accent"
                    />
                    <span className="font-medium">Only Missing Websites</span>
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

          {/* Results Grid */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-text-secondary">
                Showing {results.length} Discovered Entities in {location}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-4 rounded-xl bg-bg-surface border border-border-subtle hover:border-accent/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-bold text-sm text-text-primary hover:text-accent truncate block"
                        >
                          {lead.name}
                        </Link>
                        <div className="text-xs text-text-secondary flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
                          <span>{lead.address || lead.city || location}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-accent/15 text-accent">
                        Score {lead.leadScore}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      {lead.phone ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-primary font-mono">
                          <Phone className="w-3 h-3 text-success" />
                          {lead.phone}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">No direct phone</span>
                      )}

                      {!lead.website ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">
                          No Website (High Opportunity)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-secondary">
                          <Globe className="w-3 h-3 text-text-tertiary" />
                          {lead.website}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* AUTOPILOT CONFIGURATION STRATEGY MODAL                   */}
      {/* ======================================================== */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-accent" />
                  Configure Autopilot Strategy
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Set target industries, regions, and daily quotas for 24/7 background exploration.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-text-tertiary hover:text-text-primary text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStrategy} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-text-primary mb-1">Strategy Name</label>
                <Input
                  value={strategyName}
                  onChange={(e) => setStrategyName(e.target.value)}
                  placeholder="e.g. India Healthcare Expansion"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-primary mb-1">Daily Target</label>
                  <Input
                    type="number"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(Number(e.target.value))}
                    min={20}
                    max={1000}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">Resource Budget</label>
                  <select
                    value={resourceBudget}
                    onChange={(e) => setResourceBudget(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="LOW">LOW (2 Workers · Resource Safe)</option>
                    <option value="MEDIUM">MEDIUM (3 Workers · Balanced)</option>
                    <option value="HIGH">HIGH (5 Workers · Fast Harvesting)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text-primary mb-1">Target Niches (Comma Separated)</label>
                <Input
                  value={nichesInput}
                  onChange={(e) => setNichesInput(e.target.value)}
                  placeholder="Dentist, Dental Clinic, Orthodontist"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-primary mb-1">Target Countries</label>
                  <Input
                    value={countriesInput}
                    onChange={(e) => setCountriesInput(e.target.value)}
                    placeholder="India, UAE, United States"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">Target Regions / States</label>
                  <Input
                    value={regionsInput}
                    onChange={(e) => setRegionsInput(e.target.value)}
                    placeholder="Gujarat, Maharashtra, Dubai"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border-subtle flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={oppFilterNoWebsite}
                    onChange={(e) => setOppFilterNoWebsite(e.target.checked)}
                    className="rounded text-accent accent-accent"
                  />
                  <span>Prioritize Missing Websites</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={oppFilterHasPhone}
                    onChange={(e) => setOppFilterHasPhone(e.target.checked)}
                    className="rounded text-accent accent-accent"
                  />
                  <span>Require Direct Phone Line</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingStrategy}
                  className="bg-accent text-white font-semibold"
                >
                  Launch Strategy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
