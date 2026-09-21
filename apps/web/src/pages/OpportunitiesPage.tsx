import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Globe,
  Layout,
  MessageSquare,
  Smartphone,
  MapPin,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Target,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { leadEngineApi } from "../lib/api";
import { PageHeader } from "../components/ui/PageHeader";
import {
  OpportunitiesSkeleton,
  ErrorState,
  EmptyState,
} from "../components/ui/LoadingStates";

interface OpportunityItem {
  id: string;
  businessId?: string;
  type: string;
  title: string;
  description?: string | null;
  value: number;
  status: string;
  priority: string;
  detectedAt?: string;
  createdAt?: string;
  business?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"value_desc" | "value_asc" | "newest">("value_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    setError(null);
    try {
      const data = await leadEngineApi.getOpportunities();
      const items = Array.isArray(data) ? data : (data as any)?.items || [];
      setOpportunities(items);
    } catch (err: any) {
      console.error("Failed to load opportunities", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve opportunity signals from server. Please retry."
      );
      setOpportunities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOpportunities();
  };

  const getOpportunityConfig = (type: string) => {
    switch (type) {
      case "WHATSAPP_INTEGRATION":
        return {
          label: "WhatsApp CRM",
          icon: MessageSquare,
          dotColor: "bg-semantic-success",
          descriptionFallback:
            "Identified missing direct instant messaging funnel. Automated WhatsApp lead capture and booking bot can increase conversion by 35%.",
        };
      case "NO_WEBSITE":
        return {
          label: "Missing Website",
          icon: Globe,
          dotColor: "bg-semantic-danger",
          descriptionFallback:
            "Prospect operates with zero verified web presence. High urgency to establish custom high-converting website and local business credibility.",
        };
      case "WEBSITE_REDESIGN":
        return {
          label: "Website Redesign",
          icon: Layout,
          dotColor: "bg-accent",
          descriptionFallback:
            "Detected legacy layout with weak mobile responsiveness. Modern conversion redesign will dramatically cut bounce rate and boost appointment volume.",
        };
      case "MOBILE_OPTIMIZATION":
        return {
          label: "Mobile Speed Fix",
          icon: Smartphone,
          dotColor: "bg-text-secondary",
          descriptionFallback:
            "Slow performance on mobile devices failing Google Core Web Vitals. Compressing assets and code splitting will prevent lost inbound traffic.",
        };
      case "LOCAL_SEO":
        return {
          label: "Local SEO 3-Pack",
          icon: MapPin,
          dotColor: "bg-semantic-warning",
          descriptionFallback:
            "Missing local schema markup and citation consistency. Target top 3 placement in local Google Maps search results to dominate local demand.",
        };
      case "BOOKING_SYSTEM":
        return {
          label: "Online Booking",
          icon: Calendar,
          dotColor: "bg-accent",
          descriptionFallback:
            "Relies solely on phone inquiries. Deploying self-service digital scheduling captures customers after business hours and cuts receptionist load.",
        };
      default:
        return {
          label: type ? type.replace(/_/g, " ") : "Deal Signal",
          icon: Zap,
          dotColor: "bg-text-tertiary",
          descriptionFallback:
            "Opportunity detected from automated multi-point intelligence audit of digital footprint and conversion assets.",
        };
    }
  };

  // Filter and sort logic
  const filteredAndSortedOpportunities = useMemo(() => {
    let result = [...opportunities];

    if (typeFilter !== "ALL") {
      result = result.filter((o) => o.type === typeFilter);
    }

    if (priorityFilter !== "ALL") {
      result = result.filter((o) => (o.priority || "MEDIUM").toUpperCase() === priorityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.business?.name?.toLowerCase().includes(q) ||
          o.business?.city?.toLowerCase().includes(q) ||
          o.business?.state?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "value_desc") {
        return (Number(b.value) || 0) - (Number(a.value) || 0);
      }
      if (sortBy === "value_asc") {
        return (Number(a.value) || 0) - (Number(b.value) || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return 0;
    });

    return result;
  }, [opportunities, typeFilter, priorityFilter, searchQuery, sortBy]);

  const totalPipelineValue = useMemo(() => {
    return filteredAndSortedOpportunities.reduce(
      (acc, curr) => acc + (Number(curr.value) || 0),
      0
    );
  }, [filteredAndSortedOpportunities]);

  const highPriorityCount = useMemo(() => {
    return filteredAndSortedOpportunities.filter(
      (o) => (o.priority || "").toUpperCase() === "HIGH"
    ).length;
  }, [filteredAndSortedOpportunities]);

  const avgValue = useMemo(() => {
    if (filteredAndSortedOpportunities.length === 0) return 0;
    return Math.round(totalPipelineValue / filteredAndSortedOpportunities.length);
  }, [filteredAndSortedOpportunities, totalPipelineValue]);

  if (isLoading) {
    return <OpportunitiesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-accent" />
            <span>Opportunities & Deal Signals</span>
          </div>
        }
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-border-default bg-bg-surface text-text-secondary font-semibold">
            {opportunities.length} Detected
          </span>
        }
        description="Service gaps identified from scraped business directories, technical audits, and digital footprints."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-accent" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Sync Signals"}</span>
            </Button>

            <Link to="/discover">
              <Button size="sm" variant="primary" className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white">
                <Zap className="w-3.5 h-3.5" />
                <span>Scan More Leads</span>
              </Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Unable to load opportunities"
          message={error}
          onRetry={fetchOpportunities}
        />
      ) : (
        <>
          {/* KPI Metrics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Pipeline Value */}
            <Card className="border border-border-subtle bg-bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-meta text-text-tertiary">
                    Filtered Pipeline Value
                  </span>
                  <div className="text-[24px] sm:text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
                    ${totalPipelineValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    Across {filteredAndSortedOpportunities.length} active leads
                  </div>
                </div>
                <div className="w-8 h-8 rounded-md bg-bg-surface-hover border border-border-subtle text-text-secondary flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
            </Card>

            {/* Metric 2: High Priority Deals */}
            <Card className="border border-border-subtle bg-bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-meta text-priority font-medium">
                    High Priority Signals
                  </span>
                  <div className="text-[24px] sm:text-[26px] font-bold tabular-nums text-priority mt-2 tracking-tight">
                    {highPriorityCount}
                  </div>
                  <div className="text-xs text-priority mt-1 font-medium">
                    Urgent outreach candidates
                  </div>
                </div>
                <div className="w-8 h-8 rounded-md bg-priority-subtle border border-priority/20 text-priority flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
              </div>
            </Card>

            {/* Metric 3: Average Deal Size */}
            <Card className="border border-border-subtle bg-bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-meta text-text-tertiary">
                    Avg. Deal Potential
                  </span>
                  <div className="text-[24px] sm:text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
                    ${avgValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    Standard opportunity value
                  </div>
                </div>
                <div className="w-8 h-8 rounded-md bg-bg-surface-hover border border-border-subtle text-text-secondary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </Card>

            {/* Metric 4: Total Opportunity Categories */}
            <Card className="border border-border-subtle bg-bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-meta text-text-tertiary">
                    Signal Categories
                  </span>
                  <div className="text-[24px] sm:text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
                    {new Set(opportunities.map((o) => o.type)).size}
                  </div>
                  <div className="text-xs text-semantic-success mt-1 font-medium">
                    Verified opportunity niches
                  </div>
                </div>
                <div className="w-8 h-8 rounded-md bg-bg-surface-hover border border-border-subtle text-text-secondary flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Bar & Controls */}
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search company, opportunity title, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-1.5 text-xs w-full rounded-lg bg-bg-base border border-border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Select filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Opportunity Types</option>
                <option value="NO_WEBSITE">Missing Website</option>
                <option value="WEBSITE_REDESIGN">Website Redesign</option>
                <option value="WHATSAPP_INTEGRATION">WhatsApp CRM</option>
                <option value="BOOKING_SYSTEM">Online Booking</option>
                <option value="MOBILE_OPTIMIZATION">Mobile Speed Fix</option>
                <option value="LOCAL_SEO">Local SEO & Maps</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="value_desc">Highest Value ($)</option>
                <option value="value_asc">Lowest Value ($)</option>
                <option value="newest">Recently Detected</option>
              </select>
            </div>
          </div>

          {/* Category Quick-Select Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: "All Signals", count: opportunities.length },
              { id: "NO_WEBSITE", label: "Missing Website", count: opportunities.filter((o) => o.type === "NO_WEBSITE").length },
              { id: "WEBSITE_REDESIGN", label: "Website Redesign", count: opportunities.filter((o) => o.type === "WEBSITE_REDESIGN").length },
              { id: "WHATSAPP_INTEGRATION", label: "WhatsApp CRM", count: opportunities.filter((o) => o.type === "WHATSAPP_INTEGRATION").length },
              { id: "BOOKING_SYSTEM", label: "Booking System", count: opportunities.filter((o) => o.type === "BOOKING_SYSTEM").length },
              { id: "MOBILE_OPTIMIZATION", label: "Mobile Speed", count: opportunities.filter((o) => o.type === "MOBILE_OPTIMIZATION").length },
              { id: "LOCAL_SEO", label: "Local SEO", count: opportunities.filter((o) => o.type === "LOCAL_SEO").length },
            ].map((pill) => {
              const isActive = typeFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setTypeFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex items-center gap-2 border ${
                    isActive
                      ? "bg-accent-subtle text-accent border-accent/30 font-semibold"
                      : "bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary hover:bg-bg-surface-hover font-medium"
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`text-[11px] font-semibold tabular-nums ${isActive ? "text-accent" : "text-text-primary"}`}>
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          {filteredAndSortedOpportunities.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="No matching opportunities found"
              description={
                opportunities.length === 0
                  ? "No deal signals recorded yet. Launch discovery scrapes to identify prospects with missing web assets or service gaps."
                  : "No deal signals match your current filter selection. Try changing filters or reset your query."
              }
              actionLabel={opportunities.length === 0 ? "Launch Discovery" : "Reset Filters"}
              onAction={
                opportunities.length === 0
                  ? undefined
                  : () => {
                      setTypeFilter("ALL");
                      setPriorityFilter("ALL");
                      setSearchQuery("");
                    }
              }
              actionHref={opportunities.length === 0 ? "/discover" : undefined}
            />
          ) : (
            /* Opportunities Card Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedOpportunities.map((opp) => {
                const config = getOpportunityConfig(opp.type);
                const isHighPriority = (opp.priority || "").toUpperCase() === "HIGH";

                return (
                  <div
                    key={opp.id}
                    className={`rounded-lg p-5 flex flex-col justify-between transition-colors duration-150 group ${
                      isHighPriority
                        ? "bg-bg-surface border border-border-subtle border-l-[3px] border-l-priority hover:border-border-default"
                        : "bg-bg-surface border border-border-subtle hover:border-border-default"
                    }`}
                  >
                    <div>
                      {/* Top Row: Type Dot + Value */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary font-medium truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0`} />
                          <span className="truncate">{config.label}</span>
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {isHighPriority && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-priority font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-priority" />
                              Urgent
                            </span>
                          )}
                          <span className="text-xs font-semibold tabular-nums text-text-primary font-mono px-2 py-0.5 rounded bg-bg-base border border-border-subtle">
                            ${(Number(opp.value) || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-body font-semibold text-text-primary mt-3 leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {opp.title}
                      </h3>

                      {/* Business & Location Row */}
                      {opp.business && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                          <div className="flex items-center gap-1 font-normal text-text-primary truncate">
                            <Building2 className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                            <span className="truncate">{opp.business.name}</span>
                          </div>
                          {(opp.business.city || opp.business.state) && (
                            <div className="flex items-center gap-1 text-text-tertiary shrink-0 text-[11px]">
                              <span>•</span>
                              <span>
                                {[opp.business.city, opp.business.state].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Opportunity Pitch Hook Box */}
                      <div className="mt-3.5 p-3 rounded-md bg-bg-base border border-border-subtle text-xs text-text-secondary leading-relaxed">
                        <div className="text-[11px] font-medium text-text-primary mb-1">
                          Opportunity Hook:
                        </div>
                        <p className="line-clamp-2 text-text-secondary text-[11px]">
                          {opp.description || config.descriptionFallback}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Win Potential & Action CTA */}
                    <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between gap-2">
                      <span className="text-[11px] font-normal text-text-tertiary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                        <span>High Win Potential</span>
                      </span>

                      {opp.businessId ? (
                        <Link to={`/leads/${opp.businessId}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent font-medium">
                            View Lead &rarr;
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/leads">
                          <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent font-medium">
                            View Leads &rarr;
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
