import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Download,
  Phone,
  Mail,
  Plus,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
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
        leadEngineApi.getDashboardKpis(),
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

  const handleExport = (format: "csv" | "json") => {
    const dataStr =
      format === "json"
        ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2))
        : "data:text/csv;charset=utf-8," +
          encodeURIComponent(
            "Name,Category,City,State,Phone,Website,LeadScore,Grade,Status\n" +
              leads
                .map(
                  (l) =>
                    `"${l.name}","${l.category || ""}","${l.city || ""}","${l.state || ""}","${l.phone || ""}","${
                      l.website || "NO_WEBSITE"
                    }",${l.leadScore},"${l.leadGrade}","${l.status}"`
                )
                .join("\n")
          );

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `leads_${Date.now()}.${format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-mono tabular-nums text-text-tertiary">
          {totalCount} Total Records
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleExport("csv")}
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => handleExport("json")}
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </Button>
          <Link to="/discover">
            <Button variant="primary" size="sm" className="text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Scrape New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by name, phone, niche, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-bg-base border border-border-default text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* City Filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-bg-base border border-border-default text-[12px] text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Cities</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-bg-base border border-border-default text-[12px] text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Stages</option>
                <option value="NEW">NEW</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="MEETING">MEETING</option>
                <option value="PROPOSAL">PROPOSAL</option>
                <option value="WON">WON</option>
              </select>

              {/* Website Filter */}
              <select
                value={websiteFilter}
                onChange={(e) => setWebsiteFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-bg-base border border-border-default text-[12px] text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Websites</option>
                <option value="NO_WEBSITE">No Website</option>
                <option value="HAS_WEBSITE">Has Website</option>
              </select>

              {/* Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-md bg-bg-base border border-border-default text-[12px] text-text-primary focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="ALL">All Grades</option>
                <option value="A">Grade A (≥80)</option>
                <option value="B">Grade B (60–79)</option>
                <option value="C">Grade C (&lt;60)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] text-text-primary">
            <thead className="border-b border-border-subtle text-[11px] uppercase tracking-[0.04em] text-text-tertiary font-medium bg-bg-surface-hover">
              <tr>
                <th className="py-2.5 px-4 font-medium">Business</th>
                <th className="py-2.5 px-4 font-medium">Location</th>
                <th className="py-2.5 px-4 font-medium">Contact</th>
                <th className="py-2.5 px-4 font-medium">Website</th>
                <th className="py-2.5 px-4 font-medium text-right">Lead Score</th>
                <th className="py-2.5 px-4 font-medium">Stage</th>
                <th className="py-2.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-bg-surface-hover transition-colors h-14">
                  {/* Name & Category */}
                  <td className="py-3 px-4">
                    <Link to={`/leads/${lead.id}`} className="font-medium text-text-primary hover:text-accent transition-colors">
                      {lead.name}
                    </Link>
                    <div className="text-[11px] text-text-tertiary mt-0.5">{lead.category || "Local Business"}</div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4 text-[12px]">
                    <div className="text-text-primary">{lead.city || "Local"}</div>
                    <div className="text-text-tertiary">{lead.state || lead.country || "India"}</div>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5 text-[12px]">
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-text-secondary tabular-nums">
                          <Phone className="w-3 h-3 text-text-tertiary shrink-0" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.emails && lead.emails.length > 0 && (
                        <div className="flex items-center gap-1 text-text-tertiary">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[140px]">{lead.emails[0].value}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Website */}
                  <td className="py-3 px-4 text-[12px]">
                    {lead.website ? (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline truncate max-w-[150px] inline-block"
                      >
                        {lead.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      <span className="text-[11px] text-semantic-danger font-medium">
                        No website
                      </span>
                    )}
                  </td>

                  {/* Lead Score */}
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5 tabular-nums font-semibold font-mono">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          lead.leadScore >= 90 ? "bg-semantic-success" : lead.leadScore >= 75 ? "bg-semantic-warning" : "bg-text-tertiary"
                        }`}
                      />
                      <span>{lead.leadScore}</span>
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="py-3 px-4">
                    <Badge size="sm">{lead.status}</Badge>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <Link to={`/leads/${lead.id}`}>
                      <Button variant="ghost" size="sm">
                        View &rarr;
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leads.length === 0 && !isLoading && (
            <div className="py-12 text-center text-text-tertiary text-[13px]">
              No leads match your current filter.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
