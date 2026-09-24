import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  Globe,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Play,
  Pause,
  Clock,
  Sparkles,
  Settings2,
  Activity,
  ArrowRight,
  Cpu,
  Radio,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LocationSelector, LocationSelection } from "../components/ui/LocationSelector";
import { leadEngineApi } from "../lib/api";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/ui/PageHeader";
import {
  DiscoverySkeleton,
  ErrorState,
  EmptyState,
  InlineSpinner,
} from "../components/ui/LoadingStates";

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
}

export const NICHE_PRESETS = [
  {
    label: "🏢 All High-Value B2B",
    description: "Diverse commercial services & high-ticket B2B targets",
    niches: [
      "Commercial HVAC",
      "Roofing Contractor",
      "Commercial Electrician",
      "Commercial Plumbing",
      "Solar Installation",
      "Law Firm",
      "CPA & Accountant",
      "Wealth Management",
      "Digital Marketing Agency",
      "Managed IT Services",
    ],
  },
  {
    label: "🔨 Trade & Contractors",
    description: "High-ticket commercial and residential contractors",
    niches: [
      "Roofing Contractor",
      "Commercial HVAC",
      "Commercial Electrician",
      "Commercial Plumbing",
      "General Contractor",
      "Solar Energy Equipment",
      "Landscaping Contractor",
    ],
  },
  {
    label: "⚖️ Legal & Financial",
    description: "Attorneys, accounting firms, wealth advisors",
    niches: [
      "Law Firm",
      "Personal Injury Attorney",
      "Corporate Law Firm",
      "CPA & Accountant",
      "Wealth Management",
      "Commercial Insurance Agency",
    ],
  },
  {
    label: "💻 Tech & Digital",
    description: "MSPs, cyber, web agencies, SaaS marketing",
    niches: [
      "Managed IT Services",
      "Cybersecurity Provider",
      "Digital Marketing Agency",
      "Web Design & SEO Agency",
      "Commercial Printing",
    ],
  },
  {
    label: "🏥 Healthcare & Clinical",
    description: "Dermatology, orthopedics, therapy, specialized care",
    niches: [
      "Dermatology Clinic",
      "Orthopedic Clinic",
      "Physical Therapy Clinic",
      "Veterinary Hospital",
      "Dental Practice",
    ],
  },
];

export const DiscoverPage: React.FC = () => {
  // Mode: 'autopilot' | 'manual'
  const [activeTab, setActiveTab] = useState<"autopilot" | "manual">("autopilot");

  // --- Autopilot State ---
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [dailyDigest, setDailyDigest] = useState<any>(null);
  const [isLoadingAutopilot, setIsLoadingAutopilot] = useState(true);
  const [autopilotError, setAutopilotError] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isResettingTelemetry, setIsResettingTelemetry] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Autopilot Config Form State
  const [strategyName, setStrategyName] = useState("");
  const [nichesInput, setNichesInput] = useState(NICHE_PRESETS[0].niches.join(", "));
  const [countriesInput, setCountriesInput] = useState("");
  const [regionsInput, setRegionsInput] = useState("");
  const [dailyTarget, setDailyTarget] = useState(150);
  const [resourceBudget, setResourceBudget] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [aiProcessingLevel, setAiProcessingLevel] = useState<"PROMISING_ONLY" | "FULL" | "MINIMAL">("PROMISING_ONLY");
  const [oppFilterNoWebsite, setOppFilterNoWebsite] = useState(true);
  const [oppFilterHasPhone, setOppFilterHasPhone] = useState(true);
  const [isSavingStrategy, setIsSavingStrategy] = useState(false);

  // --- Manual Discovery State ---
  const [query, setQuery] = useState("");
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

  // Sync config form state when autopilot status loads
  useEffect(() => {
    if (autopilotStatus?.profile) {
      const p = autopilotStatus.profile;
      if (p.name) setStrategyName(p.name);
      if (Array.isArray(p.targetNiches) && p.targetNiches.length > 0) {
        const onlyDentalOrHospital = p.targetNiches.every(
          (n: string) => n.toLowerCase().includes("dent") || n.toLowerCase().includes("hospital")
        );
        if (onlyDentalOrHospital) {
          setNichesInput(NICHE_PRESETS[0].niches.join(", "));
        } else {
          setNichesInput(p.targetNiches.join(", "));
        }
      } else {
        setNichesInput(NICHE_PRESETS[0].niches.join(", "));
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

  // Fetch Autopilot Status & Activity
  const fetchAutopilotData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoadingAutopilot(true);
    setAutopilotError(null);
    try {
      const [status, activity, digest] = await Promise.all([
        leadEngineApi.getAutopilotStatus(),
        leadEngineApi.getAutopilotActivity(8).catch(() => []),
        leadEngineApi.getTodayDigest().catch(() => null),
      ]);
      setAutopilotStatus(status);
      setActivityFeed(Array.isArray(activity) ? activity : []);
      setDailyDigest(digest);
    } catch (err: any) {
      console.warn("Failed to fetch autopilot data:", err);
      if (isInitial) {
        setAutopilotError(
          err?.response?.data?.message ||
            "Unable to connect with the Autopilot Discovery Engine. Please verify server availability."
        );
      }
    } finally {
      if (isInitial) setIsLoadingAutopilot(false);
    }
  }, []);

  useEffect(() => {
    fetchAutopilotData(true);
    const interval = setInterval(() => fetchAutopilotData(false), 12000);
    return () => clearInterval(interval);
  }, [fetchAutopilotData]);

  const handleToggleAutopilot = async () => {
    if (!autopilotStatus?.profile?.id) {
      setShowConfigModal(true);
      return;
    }
    setIsToggling(true);
    try {
      await leadEngineApi.toggleAutopilot(autopilotStatus.profile.id);
      await fetchAutopilotData(false);
    } catch (err: any) {
      console.error("Toggle error:", err);
    } finally {
      setIsToggling(false);
    }
  };

  const handleResetTelemetry = async () => {
    if (!autopilotStatus?.profile?.id) return;
    setIsResettingTelemetry(true);
    try {
      await leadEngineApi.resetAutopilotTelemetry(autopilotStatus.profile.id);
      await fetchAutopilotData(false);
    } catch (err: any) {
      console.error("Reset telemetry error:", err);
    } finally {
      setIsResettingTelemetry(false);
    }
  };

  const handleReseedStrategy = async () => {
    if (!autopilotStatus?.profile?.id) return;
    setIsReseeding(true);
    try {
      await leadEngineApi.reseedAutopilotProfile(autopilotStatus.profile.id);
      await fetchAutopilotData(false);
    } catch (err: any) {
      console.error("Reseed strategy error:", err);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleTriggerCycle = async () => {
    setIsTriggering(true);
    try {
      await leadEngineApi.triggerAutopilotRun(autopilotStatus?.profile?.id);
      await fetchAutopilotData(false);
    } catch (err: any) {
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
      targetNiches: parsedNiches.length > 0 ? parsedNiches : ["Commercial Services"],
      targetCountries: parsedCountries.length > 0 ? parsedCountries : ["United States"],
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
      await fetchAutopilotData(false);
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

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
  const hasProfile = Boolean(autopilotStatus?.profile);
  const todayCount = typeof autopilotStatus?.todayDiscovered === "number" ? autopilotStatus.todayDiscovered : null;
  const targetCount = typeof autopilotStatus?.dailyTarget === "number" ? autopilotStatus.dailyTarget : 150;
  const progressPercent =
    todayCount !== null && targetCount > 0
      ? Math.min(Math.round((todayCount / targetCount) * 100), 100)
      : 0;

  const activeTerritory =
    autopilotStatus?.currentRegion && autopilotStatus?.currentCountry
      ? `${autopilotStatus.currentRegion} · ${autopilotStatus.currentCountry}`
      : autopilotStatus?.currentRegion || autopilotStatus?.currentCountry || null;

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Responsive Mode Switcher */}
      <PageHeader
        title={
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-text-primary">
            <Radio className="w-5 h-5 text-accent" />
            <span>Discovery</span>
          </div>
        }
        description="Autonomous 24/7 territory harvesting, multi-signal deduplication, and verified lead collection."
        actions={
          <div className="flex flex-wrap items-center p-1 rounded-lg bg-bg-surface border border-border-subtle shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("autopilot")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all focus-ring",
                activeTab === "autopilot"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Autopilot Engine (24/7)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all focus-ring",
                activeTab === "manual"
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Manual Search</span>
            </button>
          </div>
        }
      />

      {/* ======================================================== */}
      {/* AUTOPILOT MODE                                           */}
      {/* ======================================================== */}
      {activeTab === "autopilot" && (
        <>
          {isLoadingAutopilot ? (
            <DiscoverySkeleton />
          ) : autopilotError ? (
            <ErrorState
              title="Autopilot Service Unavailable"
              message={autopilotError}
              onRetry={() => fetchAutopilotData(true)}
            />
          ) : (
            <div className="space-y-6">
              {/* A. Status & Control Banner */}
              <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-subtle shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 sm:mt-0",
                        isRunning
                          ? "bg-success/15 border-success/30 text-success"
                          : hasProfile
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                          : "bg-border-subtle border-border-default text-text-tertiary"
                      )}
                    >
                      <Bot className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-bold text-text-primary truncate">
                          {autopilotStatus?.profile?.name || "Autonomous Lead Harvester"}
                        </h2>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            isRunning
                              ? "bg-success/15 border-success/30 text-success"
                              : hasProfile
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                              : "bg-border-subtle border-border-default text-text-tertiary"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isRunning ? "bg-success animate-ping" : hasProfile ? "bg-amber-400" : "bg-text-tertiary"
                            )}
                          />
                          {isRunning ? "RUNNING 24/7" : hasProfile ? "PAUSED" : "IDLE / UNCONFIGURED"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Continuously exploring geographic grid cells & collecting verified business entities.
                      </p>
                    </div>
                  </div>

                  {/* Responsive Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {hasProfile && (
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
                    )}

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

                    {hasProfile && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleReseedStrategy}
                        isLoading={isReseeding}
                        className="gap-1.5 text-xs font-semibold text-accent hover:text-accent"
                        title="Rebuild geographic cell queue and diversify target niches across commercial industries"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Diversify Strategy</span>
                      </Button>
                    )}

                    <Button
                      variant={hasProfile ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => setShowConfigModal(true)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{hasProfile ? "Configure Strategy" : "Setup Strategy"}</span>
                    </Button>
                  </div>
                </div>

                {/* B. Telemetry Strip */}
                <div className="pt-3 border-t border-border-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px]">Active Territory</span>
                    <div className="font-semibold text-text-primary truncate">
                      {activeTerritory || "—"}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px]">Current Niche</span>
                    <div className="font-semibold text-accent truncate">
                      {autopilotStatus?.currentNiche || "—"}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-text-tertiary text-[11px]">Resource Budget</span>
                    <div className="font-semibold text-text-primary flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                      <span>{autopilotStatus?.profile?.resourceBudget || "LOW (2 Workers)"}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-text-tertiary text-[11px]">Duplicates Prevented</span>
                      {(autopilotStatus?.duplicatesPrevented ?? 0) > 0 && (
                        <button
                          type="button"
                          onClick={handleResetTelemetry}
                          disabled={isResettingTelemetry}
                          className="text-[10px] text-accent hover:underline font-medium"
                          title="Reset duplicate counter"
                        >
                          {isResettingTelemetry ? "Resetting..." : "Reset"}
                        </button>
                      )}
                    </div>
                    <div className="font-semibold font-mono text-emerald-400">
                      {(autopilotStatus?.duplicatesPrevented ?? 0).toLocaleString()} duplicates
                    </div>
                  </div>
                </div>
              </div>

              {/* C. Daily Progress & Discovery KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Daily Target Card */}
                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary font-medium">Today's Qualified Leads</span>
                    <span className="font-mono text-accent font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-text-primary">
                    {todayCount !== null ? todayCount : 0}{" "}
                    <span className="text-sm font-normal text-text-tertiary">/ {targetCount}</span>
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
                    {typeof autopilotStatus?.totalDiscovered === "number"
                      ? autopilotStatus.totalDiscovered.toLocaleString()
                      : "—"}
                  </div>
                  <span className="text-[11px] text-success flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>One canonical record per entity</span>
                  </span>
                </div>

                {/* Missing Websites */}
                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
                  <span className="text-text-tertiary text-xs block font-medium">Missing Website Prospects</span>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {typeof autopilotStatus?.missingWebsitesCount === "number"
                      ? autopilotStatus.missingWebsitesCount.toLocaleString()
                      : "—"}
                  </div>
                  <span className="text-[11px] text-text-secondary">
                    Prime web design & booking targets
                  </span>
                </div>

                {/* Multi-Signal Deduplication */}
                <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
                  <span className="text-text-tertiary text-xs block font-medium">Multi-Signal Dedup</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {typeof autopilotStatus?.duplicatesPrevented === "number"
                      ? autopilotStatus.duplicatesPrevented.toLocaleString()
                      : "0"}
                  </div>
                  <span className="text-[11px] text-text-secondary">
                    Phone, domain & geo-hash checked
                  </span>
                </div>
              </div>

              {/* D. Morning Daily Digest Card (if present) */}
              {dailyDigest && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-bg-surface to-bg-surface/80 border border-accent/20 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
                          Today's Morning Lead Digest
                          {dailyDigest.date && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-secondary">
                              {dailyDigest.date}
                            </span>
                          )}
                        </h3>
                        {dailyDigest.summaryText && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            {dailyDigest.summaryText}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link to="/leads">
                      <Button variant="secondary" size="sm" className="text-xs font-semibold gap-1 shrink-0">
                        <span>View Today's Leads</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Top Recommended Leads */}
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
                                className="font-bold text-xs text-text-primary hover:text-accent truncate block flex-1"
                              >
                                {lead.name}
                              </Link>
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-accent/15 text-accent shrink-0">
                                Score {lead.leadScore}
                              </span>
                            </div>

                            <div className="text-[11px] text-text-secondary flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-text-tertiary shrink-0" />
                              <span className="truncate">{lead.city}, {lead.country}</span>
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
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary truncate">
                              {evt.title || evt.description}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-success/15 text-success shrink-0">
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
                      {isRunning
                        ? "Autopilot is actively scanning. Incoming discovery events will stream here automatically."
                        : "No discovery events logged yet. Launch a scan or configure a strategy to begin streaming."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* TARGETED MANUAL SEARCH MODE                              */}
      {/* ======================================================== */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          {/* Filter Workspace */}
          <div className="p-4 sm:p-5 rounded-xl bg-bg-surface border border-border-subtle space-y-4 shadow-sm">
            <form onSubmit={handleManualSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Target Business Niche / Service
                  </label>
                  <Input
                    placeholder="e.g. Commercial HVAC, Dental Clinic, Law Firm, Solar Installer"
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

                <div className="flex flex-wrap items-center gap-3">
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
                    disabled={isSearching}
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

          {/* Search Status / Skeletons */}
          {isSearching && (
            <div className="p-8 rounded-xl bg-bg-surface border border-border-subtle text-center space-y-3">
              <InlineSpinner size="md" label={searchStatus || "Scanning verified registries..."} />
              <p className="text-xs text-text-secondary">
                Normalizing geo-hashes and validating contact signals...
              </p>
            </div>
          )}

          {searchError && (
            <ErrorState
              title="Discovery Search Error"
              message={searchError}
              onRetry={handleManualSearch}
            />
          )}

          {/* Empty Results State */}
          {!isSearching && hasSearched && !searchError && results.length === 0 && (
            <EmptyState
              icon={Search}
              title="No commercial leads found"
              description={`No entities matched "${query}" in "${location}". Try broadening the search radius or choosing a different trade category.`}
            />
          )}

          {/* Results Grid */}
          {!isSearching && results.length > 0 && (
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
                      <div className="space-y-1 min-w-0 flex-1">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-bold text-sm text-text-primary hover:text-accent truncate block"
                        >
                          {lead.name}
                        </Link>
                        <div className="text-xs text-text-secondary flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                          <span className="truncate">{lead.address || lead.city || location}</span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-accent/15 text-accent shrink-0">
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
                          No Website (Opportunity)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-secondary truncate max-w-[200px]">
                          <Globe className="w-3 h-3 text-text-tertiary shrink-0" />
                          <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto">
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
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-text-tertiary hover:text-text-primary text-sm font-semibold p-1 focus-ring rounded"
                aria-label="Close modal"
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
                  placeholder="e.g. Healthcare Expansion Strategy"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-primary mb-1">Daily Target (Leads)</label>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-text-primary">Target Niches (Comma Separated)</label>
                  <span className="text-[10px] text-text-tertiary">Quick 1-Click Presets:</span>
                </div>

                {/* 1-Click Industry Presets */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {NICHE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNichesInput(preset.niches.join(", "))}
                      className="px-2.5 py-1 rounded-lg bg-bg-base border border-border-subtle hover:border-accent/60 text-text-secondary hover:text-text-primary text-[11px] font-medium transition-colors"
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Input
                  value={nichesInput}
                  onChange={(e) => setNichesInput(e.target.value)}
                  placeholder="e.g. Commercial HVAC, Roofing Contractor, Solar, Law Firm, CPA"
                  required
                />
                <p className="text-[10px] text-text-tertiary mt-1">
                  Autopilot rotates automatically across all configured niches each cycle.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-text-primary mb-1">Target Countries</label>
                  <Input
                    value={countriesInput}
                    onChange={(e) => setCountriesInput(e.target.value)}
                    placeholder="e.g. United States, India, UAE"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-primary mb-1">Target Regions / States</label>
                  <Input
                    value={regionsInput}
                    onChange={(e) => setRegionsInput(e.target.value)}
                    placeholder="e.g. California, Texas, Gujarat"
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
                  Save & Launch Strategy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
