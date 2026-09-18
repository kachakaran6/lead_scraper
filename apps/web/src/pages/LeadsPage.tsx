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
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { api, leadEngineApi } from "../lib/api";
import { Business } from "../types";

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

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
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
      console.error("Failed to fetch leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, cityFilter, websiteFilter, gradeFilter]);

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
      console.error("Server-side export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Leads Database
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {totalCount} verified business profiles with real data intelligence
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            disabled={isExporting || leads.length === 0}
            onClick={() => handleExport("csv")}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>CSV Export</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            disabled={isExporting || leads.length === 0}
            onClick={() => handleExport("json")}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>JSON</span>
          </Button>

          <Link to="/discover">
            <Button variant="primary" size="sm" className="text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Discover More</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by business name, niche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-bg-surface border border-border-default text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Website Filter */}
          <select
            value={websiteFilter}
            onChange={(e) => setWebsiteFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border-default text-text-primary"
          >
            <option value="ALL">All Website Status</option>
            <option value="NO_WEBSITE">Missing Website (Opportunities)</option>
            <option value="HAS_WEBSITE">Has Website</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border-default text-text-primary"
          >
            <option value="ALL">All Grades</option>
            <option value="A">Grade A (High Intent)</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>

          {/* City Filter */}
          {availableCities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border-default text-text-primary"
            >
              <option value="ALL">All Cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {(search || websiteFilter !== "ALL" || gradeFilter !== "ALL" || cityFilter !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 text-text-tertiary hover:text-text-primary"
              onClick={() => {
                setSearch("");
                setWebsiteFilter("ALL");
                setGradeFilter("ALL");
                setCityFilter("ALL");
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area: Responsive Table (Desktop) / Cards (Mobile) */}
      {isLoading ? (
        <div className="py-20 text-center text-text-secondary">
          <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto mb-2" />
          <span className="text-xs">Loading verified leads database...</span>
        </div>
      ) : leads.length === 0 ? (
        <Card className="border border-border-subtle bg-bg-surface py-16 text-center">
          <CardContent className="space-y-3">
            <Filter className="w-8 h-8 text-text-tertiary mx-auto opacity-50" />
            <h3 className="text-sm font-semibold text-text-primary">No leads match filters</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Try adjusting your search criteria or run a new discovery scan to gather more real records.
            </p>
            <Link to="/discover">
              <Button variant="primary" size="sm" className="mt-2 text-xs">
                Launch Discovery
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards (<md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {leads.map((lead) => {
              const hasWeb = Boolean(lead.website);

              return (
                <Card
                  key={lead.id}
                  className="border border-border-subtle bg-bg-surface hover:border-accent/40 transition-colors"
                >
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-bg-base border border-border-subtle text-text-secondary">
                        {lead.category || "Business"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          lead.leadGrade === "A"
                            ? "bg-success/15 text-success"
                            : "bg-accent/15 text-accent"
                        }`}
                      >
                        Grade {lead.leadGrade} • {lead.leadScore} pts
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-text-primary">{lead.name}</h3>

                    <div className="text-xs text-text-secondary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                      <span>{lead.city || "Unknown City"}</span>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                      {hasWeb ? (
                        <span className="inline-flex items-center gap-1 text-success text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Website Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-warning text-[11px]">
                          <AlertTriangle className="w-3 h-3" /> No Website Found
                        </span>
                      )}

                      {lead.phone && (
                        <span className="text-text-tertiary text-[11px]">
                          • {lead.phone}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border-subtle flex justify-end">
                      <Link to={`/leads/${lead.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          View Intel Record &rarr;
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop Table (md+) */}
          <div className="hidden md:block rounded-xl border border-border-subtle bg-bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-base/60 text-text-tertiary font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Website Status</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {leads.map((lead) => {
                    const hasWeb = Boolean(lead.website);

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-bg-surface-hover/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-text-primary">
                          <Link
                            to={`/leads/${lead.id}`}
                            className="hover:text-accent transition-colors block"
                          >
                            <span className="font-semibold text-text-primary">{lead.name}</span>
                            <span className="block text-[11px] text-text-tertiary font-normal">
                              {lead.category || "General Business"}
                            </span>
                          </Link>
                        </td>

                        <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                          {lead.city || "—"}, {lead.state || ""}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {hasWeb ? (
                            <span className="inline-flex items-center gap-1.5 text-success font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[130px]">{lead.website}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-warning font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>No Website Found</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-text-secondary whitespace-nowrap">
                          {lead.phone ? (
                            <span className="font-mono text-xs">{lead.phone}</span>
                          ) : (
                            <span className="text-text-tertiary">Not available</span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                              lead.leadGrade === "A"
                                ? "bg-success/15 text-success"
                                : "bg-accent/15 text-accent"
                            }`}
                          >
                            {lead.leadScore} ({lead.leadGrade})
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-bg-base border border-border-subtle text-text-secondary">
                            {lead.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link to={`/leads/${lead.id}`}>
                            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                              Intel &rarr;
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
