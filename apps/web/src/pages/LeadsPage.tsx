import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Download,
  Phone,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MapPin,
  RefreshCw,
  Globe,
  Sliders,
  ChevronDown,
  Building2,
  ChevronRight,
  Database,
  ArrowUpDown,
  Check,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { api, leadEngineApi } from "../lib/api";
import { Business } from "../types";
import { cn } from "../lib/utils";

export const LeadsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [leads, setLeads] = useState<Business[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [websiteFilter, setWebsiteFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting
  const [sortBy, setSortBy] = useState<"leadScore" | "name" | "createdAt">("leadScore");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        limit: 100,
        sortBy,
        sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (cityFilter !== "ALL") params.city = cityFilter;
      if (gradeFilter !== "ALL") params.grade = gradeFilter;
      if (websiteFilter === "NO_WEBSITE") params.hasWebsite = false;
      if (websiteFilter === "HAS_WEBSITE") params.hasWebsite = true;

      const [data, statsData] = await Promise.all([
        leadEngineApi.getLeads(params),
        leadEngineApi.getDashboardKpis().catch(() => null),
      ]);

      setLeads(data?.items || []);
      setTotalCount(data?.meta?.total || data?.items?.length || 0);

      const cities = statsData?.charts?.byCity?.map((c: any) => c.city).filter(Boolean) || [];
      if (cities.length > 0) {
        setAvailableCities(Array.from(new Set(cities)));
      }
    } catch (err) {
      console.error("Failed to fetch leads from API", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, cityFilter, websiteFilter, gradeFilter, sortBy, sortOrder]);

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      const res = await api.post("/exports/download", {
        format,
        query: search.trim() || undefined,
        city: cityFilter !== "ALL" ? cityFilter : undefined,
        hasWebsite:
          websiteFilter === "NO_WEBSITE"
            ? false
            : websiteFilter === "HAS_WEBSITE"
            ? true
            : undefined,
      });

      const blob = new Blob(
        [format === "json" ? JSON.stringify(res.data.data, null, 2) : res.data.data],
        {
          type:
            res.data.contentType ||
            (format === "json" ? "application/json" : "text/csv"),
        }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.filename || `leads_export_${Date.now()}.${format}`;
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

  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(leads.length / pageSize) || 1;

  return (
    <div className="space-y-5">
      {/* 1. Standardized Page Header & Quick Export Actions */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <span>Leads Database</span>
          </div>
        }
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full border border-border-default bg-bg-surface text-text-secondary font-semibold">
            {leads.length} Records
          </span>
        }
        description="Browse, filter, and inspect verified commercial prospects harvested from authentic public registries."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              isLoading={isExporting}
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

      {/* 2. Omnibar Search & Multi-Attribute Filters Bar */}
      <div className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business name, trade category, or address..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Filters cluster */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Website Presence Filter */}
            <select
              value={websiteFilter}
              onChange={(e) => setWebsiteFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Websites</option>
              <option value="NO_WEBSITE">Missing Website (+35)</option>
              <option value="HAS_WEBSITE">Has Active Website</option>
            </select>

            {/* Pipeline Stage Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="NEW">New</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONTACTED">Contacted</option>
              <option value="REPLIED">Replied</option>
              <option value="WON">Closed / Won</option>
            </select>

            {/* City Filter */}
            {availableCities.length > 0 && (
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Cities</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            )}

            {/* Sort order toggle */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="px-2.5 py-1.5 rounded-lg bg-bg-base border border-border-default hover:bg-bg-surface-hover text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Score {sortOrder === "desc" ? "High to Low" : "Low to High"}</span>
            </button>
          </div>
        </div>

        {/* Active count & summary */}
        <div className="flex items-center justify-between text-xs text-text-tertiary pt-1 border-t border-border-subtle">
          <span>
            Displaying <strong className="text-text-primary font-mono">{leads.length}</strong> of{" "}
            <strong className="text-text-primary font-mono">{totalCount}</strong> verified leads
          </span>

          {(search || websiteFilter !== "ALL" || statusFilter !== "ALL" || cityFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setWebsiteFilter("ALL");
                setStatusFilter("ALL");
                setCityFilter("ALL");
              }}
              className="text-accent hover:underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. DESKTOP DATA TABLE (Visible >= md) */}
      <div className="hidden md:block bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="py-4 px-4">
                    <div className="h-4 bg-bg-surface-hover rounded w-3/4" />
                  </td>
                </tr>
              ))
            ) : paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-tertiary">
                  No verified leads found matching your criteria. Try adjusting filters or launch a new discovery scrape.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-bg-surface-hover/60 transition-colors group"
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
                      <span className="truncate">{lead.city || lead.state || lead.country || "Registered"}</span>
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

                  {/* Website presence */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{lead.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
                      {lead.leadScore || 65}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="py-3 px-4 text-text-tertiary text-[11px] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {lead.sourceProvider || "OpenStreetMap"}
                    </span>
                  </td>

                  {/* Pipeline Stage */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-bg-base border border-border-default text-text-secondary">
                      {lead.status || "NEW"}
                    </span>
                  </td>

                  {/* Action link */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <Link to={`/leads/${lead.id}`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                        <span>Inspect Intel</span>
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MOBILE CARD LIST (< md screens: Never squeezed, 100% responsive) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-text-tertiary">
            Loading verified leads...
          </div>
        ) : paginatedLeads.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-tertiary">
            No leads found matching criteria.
          </div>
        ) : (
          paginatedLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-4 rounded-xl bg-bg-surface border border-border-subtle space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/leads/${lead.id}`}
                    className="font-bold text-sm text-text-primary hover:text-accent transition-colors block"
                  >
                    {lead.name}
                  </Link>
                  <span className="text-xs text-text-secondary block mt-0.5">
                    {lead.category || "Commercial Service"} • {lead.city || lead.state || "Area"}
                  </span>
                </div>

                <span
                  className={cn(
                    "font-mono font-bold text-xs px-2 py-0.5 rounded shrink-0",
                    lead.leadScore >= 80
                      ? "bg-success/15 text-success border border-success/25"
                      : "bg-warning/15 text-warning border border-warning/25"
                  )}
                >
                  {lead.leadScore || 65} pts
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    className="inline-flex items-center gap-1 text-text-primary font-mono px-2 py-1 rounded bg-bg-base border border-border-default"
                  >
                    <Phone className="w-3 h-3 text-accent" />
                    <span>{lead.phone}</span>
                  </a>
                ) : (
                  <span className="text-text-tertiary text-[11px] px-2 py-1 rounded bg-bg-base border border-border-subtle">
                    No phone listed
                  </span>
                )}

                {!lead.website ? (
                  <span className="text-amber-400 font-medium text-[11px] px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
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
                  Stage: {lead.status || "NEW"}
                </span>

                <Link to={`/leads/${lead.id}`}>
                  <Button variant="outline" size="sm" className="text-xs h-7 px-3">
                    <span>Inspect Intel &rarr;</span>
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-text-tertiary">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="text-xs h-8"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="text-xs h-8"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
