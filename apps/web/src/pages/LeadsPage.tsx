import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Download,
  Phone,
  Plus,
  MapPin,
  Globe,
  Building2,
  ChevronRight,
  Database,
  ArrowUpDown,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  Undo2,
  Filter,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { api, leadEngineApi } from "../lib/api";
import { Business, LeadStatus } from "../types";
import { cn } from "../lib/utils";
import {
  TableSkeleton,
  ErrorState,
  EmptyState,
} from "../components/ui/LoadingStates";

export const LeadsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialSearch = searchParams.get("search") || "";
  const initialWebsite = searchParams.get("website") || "ALL";
  const initialStage = searchParams.get("stage") || "ALL";
  const initialCity = searchParams.get("city") || "ALL";
  const initialSort = searchParams.get("sort") || "score_desc";
  const initialPage = parseInt(searchParams.get("page") || "1", 10) || 1;

  const [search, setSearch] = useState(initialSearch);
  const [websiteFilter, setWebsiteFilter] = useState(initialWebsite);
  const [stageFilter, setStageFilter] = useState(initialStage);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Data states
  const [leads, setLeads] = useState<Business[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Not Interested Disposition Modal State
  const [dispositionLead, setDispositionLead] = useState<Business | null>(null);
  const [dispositionReason, setDispositionReason] = useState("Not a fit / Wrong niche");
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [isSubmittingDisposition, setIsSubmittingDisposition] = useState(false);

  // Undo Toast State
  const [undoToast, setUndoToast] = useState<{
    leadId: string;
    leadName: string;
    previousStatus: string;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pageSize = 20;

  // Load distinct cities once from backend
  useEffect(() => {
    leadEngineApi
      .getCities()
      .then((cities) => {
        if (Array.isArray(cities) && cities.length > 0) {
          setAvailableCities(cities);
        }
      })
      .catch((err) => console.error("Failed to load distinct cities:", err));
  }, []);

  // Sync state to URL search parameters
  const updateUrlParams = useCallback(
    (newParams: {
      search?: string;
      website?: string;
      stage?: string;
      city?: string;
      sort?: string;
      page?: number;
    }) => {
      const params = new URLSearchParams();
      const s = newParams.search !== undefined ? newParams.search : search;
      const w = newParams.website !== undefined ? newParams.website : websiteFilter;
      const st = newParams.stage !== undefined ? newParams.stage : stageFilter;
      const c = newParams.city !== undefined ? newParams.city : cityFilter;
      const so = newParams.sort !== undefined ? newParams.sort : sortBy;
      const p = newParams.page !== undefined ? newParams.page : currentPage;

      if (s.trim()) params.set("search", s.trim());
      if (w !== "ALL") params.set("website", w);
      if (st !== "ALL") params.set("stage", st);
      if (c !== "ALL") params.set("city", c);
      if (so !== "score_desc") params.set("sort", so);
      if (p > 1) params.set("page", String(p));

      setSearchParams(params, { replace: true });
    },
    [search, websiteFilter, stageFilter, cityFilter, sortBy, currentPage, setSearchParams]
  );

  // Main Fetch Leads callback
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        limit: pageSize,
      };

      if (search.trim()) params.search = search.trim();
      if (websiteFilter !== "ALL") params.website = websiteFilter.toLowerCase();
      if (stageFilter !== "ALL") params.stage = stageFilter;
      if (cityFilter !== "ALL") params.city = cityFilter;
      if (sortBy) params.sort = sortBy;

      const data = await leadEngineApi.getLeads(params);

      const items: Business[] = Array.isArray(data) ? data : data?.items || [];
      setLeads(items);

      const total = typeof data?.meta?.total === "number" ? data.meta.total : items.length;
      setTotalCount(total);
      setTotalPages(data?.meta?.totalPages || Math.ceil(total / pageSize) || 1);
    } catch (err: any) {
      console.error("Failed to fetch leads from API", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve leads database records. Verify your network or backend connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, [search, websiteFilter, stageFilter, cityFilter, sortBy, currentPage]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handlers for filter changes (reset to page 1)
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    updateUrlParams({ search: value, page: 1 });
  };

  const handleWebsiteFilterChange = (value: string) => {
    setWebsiteFilter(value);
    setCurrentPage(1);
    updateUrlParams({ website: value, page: 1 });
  };

  const handleStageFilterChange = (value: string) => {
    setStageFilter(value);
    setCurrentPage(1);
    updateUrlParams({ stage: value, page: 1 });
  };

  const handleCityFilterChange = (value: string) => {
    setCityFilter(value);
    setCurrentPage(1);
    updateUrlParams({ city: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
    updateUrlParams({ sort: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlParams({ page: newPage });
  };

  const handleResetFilters = () => {
    setSearch("");
    setWebsiteFilter("ALL");
    setStageFilter("ALL");
    setCityFilter("ALL");
    setSortBy("score_desc");
    setCurrentPage(1);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters =
    Boolean(search.trim()) ||
    websiteFilter !== "ALL" ||
    stageFilter !== "ALL" ||
    cityFilter !== "ALL" ||
    sortBy !== "score_desc";

  // Mark Not Interested Action
  const handleConfirmNotInterested = async () => {
    if (!dispositionLead) return;
    setIsSubmittingDisposition(true);
    try {
      const res = await leadEngineApi.markLeadNotInterested(
        dispositionLead.id,
        dispositionReason,
        dispositionNotes.trim() || undefined
      );

      // Set Undo Toast
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      setUndoToast({
        leadId: dispositionLead.id,
        leadName: dispositionLead.name,
        previousStatus: res?.previousStatus || dispositionLead.status || "NEW",
      });
      undoTimeoutRef.current = setTimeout(() => {
        setUndoToast(null);
      }, 7000);

      setDispositionLead(null);
      setDispositionNotes("");
      await fetchLeads();
    } catch (err: any) {
      console.error("Failed to mark lead not interested:", err);
      alert(err.response?.data?.message || "Failed to update lead disposition status");
    } finally {
      setIsSubmittingDisposition(false);
    }
  };

  // Undo Not Interested Action
  const handleUndoNotInterested = async () => {
    if (!undoToast) return;
    try {
      await leadEngineApi.restoreLeadStatus(undoToast.leadId, undoToast.previousStatus);
      setUndoToast(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      await fetchLeads();
    } catch (err) {
      console.error("Failed to undo lead status:", err);
    }
  };

  // Export Data
  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      const res = await api.post(
        "/exports/download",
        {
          format,
          query: search.trim() || undefined,
          city: cityFilter !== "ALL" ? cityFilter : undefined,
          stage: stageFilter !== "ALL" ? stageFilter : undefined,
          website: websiteFilter !== "ALL" ? websiteFilter.toLowerCase() : undefined,
        },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], {
        type: (res.headers["content-type"] as string) || (format === "json" ? "application/json" : "text/csv"),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setIsExporting(false);
    }
  };

  const startRecord = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-5 font-sans">
      {/* 1. Header & Primary Actions */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <span>Leads Database</span>
          </div>
        }
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-border-default bg-bg-surface text-text-secondary font-semibold">
            {totalCount} Records
          </span>
        }
        description="Browse, filter, inspect, and manage verified commercial prospects across real-time registries."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              isLoading={isExporting}
              disabled={isExporting || totalCount === 0}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>

            <Link to="/discover">
              <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 bg-accent text-white">
                <Plus className="w-3.5 h-3.5" />
                <span>Discover Leads</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Omnibar Search & Composable Filter Cluster */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Text Search Omnibar */}
          <div className="relative lg:col-span-4">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search business name, category, address, phone..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="lg:col-span-8 flex flex-wrap items-center gap-2">
            {/* Website Presence */}
            <select
              value={websiteFilter}
              onChange={(e) => handleWebsiteFilterChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Websites</option>
              <option value="MISSING">Missing Website</option>
              <option value="ACTIVE">Has Active Website</option>
            </select>

            {/* Pipeline Stage */}
            <select
              value={stageFilter}
              onChange={(e) => handleStageFilterChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="ACTIVE">Active Pipeline (Actionable)</option>
              <option value="NEW">New</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONTACTED">Contacted</option>
              <option value="REPLIED">Replied</option>
              <option value="MEETING">Meeting</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="WON">Closed / Won</option>
              <option value="LOST">Lost</option>
              <option value="NOT_INTERESTED">Not Interested</option>
            </select>

            {/* Dynamic City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => handleCityFilterChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer max-w-[160px]"
            >
              <option value="ALL">All Cities</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="score_desc">Score High to Low</option>
              <option value="score_asc">Score Low to High</option>
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
            </select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default hover:bg-bg-surface-hover text-xs text-text-secondary hover:text-accent flex items-center gap-1 transition-colors"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Server Count & Result Details */}
        <div className="flex items-center justify-between text-xs text-text-tertiary pt-1 border-t border-border-subtle">
          <span>
            Displaying <strong className="text-text-primary font-mono">{startRecord}–{endRecord}</strong> of{" "}
            <strong className="text-text-primary font-mono">{totalCount}</strong> verified leads
          </span>

          {hasActiveFilters && (
            <span className="text-[11px] text-accent font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Filters applied</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Table / Loading / Empty State */}
      {error ? (
        <ErrorState title="Unable to load leads" message={error} onRetry={fetchLeads} />
      ) : isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No verified leads match your query"
          description={
            hasActiveFilters
              ? "No leads matched your specific filter combination. Try clearing filters or selecting different criteria."
              : "No commercial leads have been stored yet. Launch Autopilot or manual discovery to start populating your pipeline."
          }
          actionLabel={hasActiveFilters ? "Clear Filters" : "Launch Discovery"}
          actionHref={hasActiveFilters ? undefined : "/discover"}
          onAction={hasActiveFilters ? handleResetFilters : undefined}
        />
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden md:block bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-base/60 text-text-tertiary font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Business & Niche</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Web Presence</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4">Registry Source</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border-subtle">
                  {leads.map((lead) => {
                    const isNotInterested = lead.status === "NOT_INTERESTED";
                    return (
                      <tr
                        key={lead.id}
                        className={cn(
                          "hover:bg-bg-surface-hover/60 transition-colors group",
                          isNotInterested && "opacity-75 bg-bg-base/40"
                        )}
                      >
                        {/* Business & Niche */}
                        <td className="py-3 px-4">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="font-semibold text-text-primary hover:text-accent transition-colors block truncate max-w-[220px]"
                          >
                            {lead.name}
                          </Link>
                          <span className="text-[11px] text-text-tertiary block truncate max-w-[200px]">
                            {lead.category || "Commercial Service"}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 text-text-secondary truncate max-w-[160px]">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-text-tertiary shrink-0" />
                            <span className="truncate">
                              {lead.city || lead.state || lead.country || "Registered"}
                            </span>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-4 font-mono text-text-secondary whitespace-nowrap">
                          {lead.phone ? (
                            <span className="text-text-primary font-medium">{lead.phone}</span>
                          ) : (
                            <span className="text-text-tertiary text-[11px]">Unlisted</span>
                          )}
                        </td>

                        {/* Website Presence */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {lead.website ? (
                            <a
                              href={
                                lead.website.startsWith("http") ? lead.website : `https://${lead.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-accent hover:underline"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">
                                {lead.website.replace(/^https?:\/\//, "")}
                              </span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              No Website
                            </span>
                          )}
                        </td>

                        {/* Lead Score */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded",
                              lead.leadScore >= 80
                                ? "bg-success/15 text-success border border-success/25"
                                : lead.leadScore >= 60
                                ? "bg-warning/15 text-warning border border-warning/25"
                                : "bg-border-subtle text-text-tertiary"
                            )}
                          >
                            {typeof lead.leadScore === "number" ? lead.leadScore : "—"}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4 text-text-tertiary text-[11px] whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {lead.sourceProvider || lead.source || "Registry"}
                          </span>
                        </td>

                        {/* Pipeline Stage */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isNotInterested ? (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20"
                              title={lead.dispositionReason ? `Reason: ${lead.dispositionReason}` : undefined}
                            >
                              Not Interested
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-bg-base border border-border-default text-text-secondary">
                              {lead.status || "NEW"}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isNotInterested && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDispositionLead(lead);
                                  setDispositionReason("Not a fit / Wrong niche");
                                  setDispositionNotes("");
                                }}
                                className="px-2 py-1 rounded text-[11px] text-text-tertiary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Mark as Not Interested"
                              >
                                Not Interested
                              </button>
                            )}

                            <Link to={`/leads/${lead.id}`}>
                              <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                                <span>Inspect</span>
                                <ChevronRight className="w-3 h-3 ml-0.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout (< md) */}
          <div className="md:hidden space-y-3">
            {leads.map((lead) => {
              const isNotInterested = lead.status === "NOT_INTERESTED";
              return (
                <div
                  key={lead.id}
                  className={cn(
                    "p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm",
                    isNotInterested && "opacity-75 bg-bg-base/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="font-bold text-sm text-text-primary hover:text-accent transition-colors block truncate"
                      >
                        {lead.name}
                      </Link>
                      <span className="text-xs text-text-secondary block mt-0.5 truncate">
                        {lead.category || "Commercial Service"} • {lead.city || lead.state || "Registered"}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0",
                        lead.leadScore >= 80
                          ? "bg-success/15 text-success border border-success/25"
                          : lead.leadScore >= 60
                          ? "bg-warning/15 text-warning border border-warning/25"
                          : "bg-border-subtle text-text-tertiary"
                      )}
                    >
                      {typeof lead.leadScore === "number" ? `${lead.leadScore} pts` : "—"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 text-text-primary font-mono px-2 py-1 rounded bg-bg-base border border-border-default truncate max-w-[160px]"
                      >
                        <Phone className="w-3 h-3 text-accent shrink-0" />
                        <span className="truncate">{lead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-text-tertiary text-[11px] px-2 py-1 rounded bg-bg-base border border-border-subtle">
                        No phone listed
                      </span>
                    )}

                    {!lead.website ? (
                      <span className="text-amber-500 font-medium text-[11px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                        No Website
                      </span>
                    ) : (
                      <span className="text-text-secondary text-[11px] px-2 py-1 rounded bg-bg-base border border-border-subtle">
                        Website verified
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase">
                      {isNotInterested ? (
                        <span className="text-red-500 font-bold">NOT INTERESTED</span>
                      ) : (
                        `Stage: ${lead.status || "NEW"}`
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isNotInterested && (
                        <button
                          type="button"
                          onClick={() => {
                            setDispositionLead(lead);
                            setDispositionReason("Not a fit / Wrong niche");
                            setDispositionNotes("");
                          }}
                          className="px-2 py-1 rounded text-[11px] text-text-tertiary hover:text-red-500 transition-colors"
                        >
                          Not Interested
                        </button>
                      )}

                      <Link to={`/leads/${lead.id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                          <span>Inspect &rarr;</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 4. Server-Side Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 text-xs">
              <span className="text-text-tertiary">
                Page <strong className="text-text-primary font-mono">{currentPage}</strong> of{" "}
                <strong className="text-text-primary font-mono">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="text-xs h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="text-xs h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Mark as Not Interested Modal */}
      {dispositionLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-bg-surface border border-border-default rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary">Mark as Not Interested</h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Deprioritize <strong className="text-text-primary">{dispositionLead.name}</strong> from your active outreach.
                </p>
              </div>
              <button
                onClick={() => setDispositionLead(null)}
                className="text-text-tertiary hover:text-text-primary p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Reason for disposition:
                </label>
                <select
                  value={dispositionReason}
                  onChange={(e) => setDispositionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="Not a fit / Wrong niche">Not a fit / Wrong niche</option>
                  <option value="Already has existing provider">Already has existing provider</option>
                  <option value="Not interested in digital/web services">Not interested in web services</option>
                  <option value="Invalid contact / Out of business">Invalid contact / Out of business</option>
                  <option value="Duplicate or irrelevant">Duplicate or irrelevant</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary font-medium mb-1">
                  Additional note (optional):
                </label>
                <textarea
                  rows={2}
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                  placeholder="e.g., Requested callback in Q4 or currently under contract..."
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent text-xs resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDispositionLead(null)}
                disabled={isSubmittingDisposition}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmNotInterested}
                isLoading={isSubmittingDisposition}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm & Deprioritize
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Undo Floating Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-surface border border-border-default shadow-2xl text-xs text-text-primary animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Marked <strong>{undoToast.leadName}</strong> as Not Interested.
          </span>
          <button
            type="button"
            onClick={handleUndoNotInterested}
            className="ml-2 px-2.5 py-1 rounded bg-bg-base border border-border-default hover:bg-bg-surface-hover text-accent font-semibold flex items-center gap-1 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
};
