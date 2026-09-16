import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Building2,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
import { Business, LeadStatus } from "../types";

export const LeadsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [leads, setLeads] = useState<Business[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [websiteFilter, setWebsiteFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 50 };
      if (search) params.search = search;
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (gradeFilter !== "ALL") params.grade = gradeFilter;
      if (websiteFilter === "NO_WEBSITE") params.hasWebsite = false;
      if (websiteFilter === "HAS_WEBSITE") params.hasWebsite = true;

      const data = await leadEngineApi.getLeads(params);
      setLeads(data?.items || []);
      setTotalCount(data?.meta?.total || data?.items?.length || 0);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, websiteFilter, gradeFilter]);

  const handleExport = (format: "csv" | "json") => {
    const dataStr =
      format === "json"
        ? "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2))
        : "data:text/csv;charset=utf-8," +
          encodeURIComponent(
            "Name,Category,City,Phone,Website,LeadScore,Grade,Status\n" +
              leads
                .map(
                  (l) =>
                    `"${l.name}","${l.category || ""}","${l.city || ""}","${l.phone || ""}","${
                      l.website || "NO_WEBSITE"
                    }",${l.leadScore},"${l.leadGrade}","${l.status}"`
                )
                .join("\n")
          );

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ultimate_leads_${Date.now()}.${format}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Leads Database</h1>
          <p className="text-sm text-slate-400 mt-1">
            Enriched business profiles, contact records, website audits, and conversion scores.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>
          <Link to="/discover">
            <Button variant="primary" size="sm" className="text-xs shadow-lg shadow-indigo-600/25">
              + Discover New
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="glass-panel border-slate-800">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by name, phone, category, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">New</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONTACTED">Contacted</option>
                <option value="MEETING">Meeting</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="WON">Won</option>
              </select>

              {/* Website Filter */}
              <select
                value={websiteFilter}
                onChange={(e) => setWebsiteFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Websites</option>
                <option value="NO_WEBSITE">🚫 No Website Only (High ROI)</option>
                <option value="HAS_WEBSITE">🌐 Has Website (Redesign/SEO)</option>
              </select>

              {/* Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Grades</option>
                <option value="A">Grade A (80+ Score)</option>
                <option value="B">Grade B (60-79)</option>
                <option value="C">Grade C (40-59)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="glass-panel border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Business / Company</th>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-4 font-semibold">Contact Intel</th>
                <th className="py-3.5 px-4 font-semibold">Web Presence</th>
                <th className="py-3.5 px-4 font-semibold">Lead Score</th>
                <th className="py-3.5 px-4 font-semibold">Pipeline</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-900/60 transition-colors group">
                  {/* Name & Category */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                      <Link to={`/leads/${lead.id}`} className="hover:underline">
                        {lead.name}
                      </Link>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{lead.category || "Local Business"}</div>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-xs">
                    <div className="text-slate-200">{lead.city || "Rajkot"}</div>
                    <div className="text-slate-400">{lead.state || lead.country || "India"}</div>
                  </td>

                  {/* Contact Intel */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      {lead.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.emails && lead.emails.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{lead.emails[0].value}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Website */}
                  <td className="py-4 px-4 text-xs">
                    {lead.website ? (
                      <div className="space-y-1">
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline flex items-center gap-1 max-w-[160px] truncate"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
                        </a>
                        <span className="text-[10px] text-slate-400">Audit Ready</span>
                      </div>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] font-bold">
                        🚫 NO WEBSITE
                      </Badge>
                    )}
                  </td>

                  {/* Lead Score */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-extrabold text-white font-mono">
                        {lead.leadScore}
                      </div>
                      <Badge
                        variant={lead.leadScore >= 90 ? "danger" : lead.leadScore >= 75 ? "success" : "info"}
                        className="text-[10px] font-bold"
                      >
                        Grade {lead.leadGrade || "A"}
                      </Badge>
                    </div>
                  </td>

                  {/* Stage */}
                  <td className="py-4 px-4 text-xs">
                    <Badge variant="default" className="bg-slate-800 text-slate-200 border-slate-700">
                      {lead.status}
                    </Badge>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right">
                    <Link to={`/leads/${lead.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        View Lead &rarr;
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leads.length === 0 && !isLoading && (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <p className="text-base font-semibold text-slate-300">No leads match your current filter</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting search or discover new businesses.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
