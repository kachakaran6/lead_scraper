import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";
import { Bot, Zap, Play, Pause, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";

import { PageHeader } from "../components/ui/PageHeader";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [topLeads, setTopLeads] = useState<Business[]>([]);
  const [autopilotStatus, setAutopilotStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, leadsData, autoData] = await Promise.all([
          leadEngineApi.getDashboardKpis(),
          leadEngineApi.getLeads({ limit: 5, sortBy: "leadScore", sortOrder: "desc" }),
          leadEngineApi.getAutopilotStatus(),
        ]);
        setStats(statsData);
        setTopLeads(leadsData?.items || []);
        setAutopilotStatus(autoData);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = stats?.kpis || {
    total: 0,
    newToday: 0,
    newWeek: 0,
    newMonth: 0,
    withoutWebsite: 0,
    withWebsite: 0,
    highOpportunity: 0,
    contacted: 0,
    replied: 0,
    meetings: 0,
    proposals: 0,
    wonDeals: 0,
  };

  const opportunitiesBreakdown = stats?.charts?.opportunities || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard Overview"
        description="Real-time pipeline analytics, lead signals, and conversion metrics."
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/discover">
              <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 bg-accent text-white">
                <Zap className="w-3.5 h-3.5" />
                <span>Launch Discovery</span>
              </Button>
            </Link>
            <Link to="/leads">
              <Button variant="secondary" size="sm" className="text-xs font-medium">
                View All Leads
              </Button>
            </Link>
          </div>
        }
      />

      {/* Autopilot 24/7 Autonomous Discovery Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-bg-surface via-bg-surface to-accent/5 border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text-primary">
                Autopilot 24/7 Discovery Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 border border-success/30 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                {autopilotStatus?.status === "RUNNING" ? "RUNNING" : "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Territory: <span className="text-text-primary font-medium">{autopilotStatus?.currentRegion || "Ahmedabad, India"}</span> · Niche: <span className="text-accent font-medium">{autopilotStatus?.currentNiche || "Dentist & Dental Clinics"}</span> · Today: <span className="font-mono text-text-primary font-semibold">{autopilotStatus?.todayDiscovered || 0} / {autopilotStatus?.dailyTarget || 150} leads</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/discover">
            <Button variant="outline" size="sm" className="text-xs font-medium gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Manage Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Businesses */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-meta text-text-tertiary">
                Total Leads
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
            <div className="text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
              {kpis.total}
            </div>
            <div className="text-xs text-semantic-success mt-1 font-medium flex items-center gap-1">
              <span>+{kpis.newToday}</span>
              <span className="text-text-tertiary font-normal">today</span>
            </div>
          </CardContent>
        </Card>

        {/* Without Website */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-meta text-text-tertiary">
                No Website
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning" />
            </div>
            <div className="text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
              {kpis.withoutWebsite}
            </div>
            <div className="text-xs text-text-secondary mt-1">Prime targets</div>
          </CardContent>
        </Card>

        {/* With Website */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-meta text-text-tertiary">
                With Website
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
            </div>
            <div className="text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
              {kpis.withWebsite}
            </div>
            <div className="text-xs text-text-secondary mt-1">Audit ready</div>
          </CardContent>
        </Card>

        {/* High Opportunity */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-meta text-priority">
                High Priority
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-priority" />
            </div>
            <div className="text-[26px] font-bold tabular-nums text-priority mt-2 tracking-tight">
              {kpis.highOpportunity}
            </div>
            <div className="text-xs text-text-secondary mt-1">Score ≥ 80</div>
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-meta text-text-tertiary">
                Meetings
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary" />
            </div>
            <div className="text-[26px] font-semibold tabular-nums text-text-primary mt-2 tracking-tight">
              {kpis.meetings}
            </div>
            <div className="text-xs text-text-secondary mt-1">Scheduled</div>
          </CardContent>
        </Card>

        {/* Won Deals */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-meta text-semantic-success">
                Won Deals
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
            </div>
            <div className="text-[26px] font-bold tabular-nums text-accent mt-2 tracking-tight">
              {kpis.wonDeals || 1}
            </div>
            <div className="text-xs text-semantic-success mt-1 font-medium">Closed client</div>
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Analytic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Conversion Funnel */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardHeader className="border-b border-border-subtle pb-3.5 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h2 font-semibold text-text-primary tracking-tight">
                  Conversion Funnel
                </h2>
                <p className="text-body-secondary text-xs mt-0.5">
                  Full lifecycle track from discovery to won contract
                </p>
              </div>
              <Link to="/deals">
                <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent font-medium">
                  Pipeline view &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {[
              { stage: "Discovered", count: kpis.total, percent: 100 },
              { stage: "Qualified", count: kpis.highOpportunity, percent: Math.round((kpis.highOpportunity / (kpis.total || 1)) * 100) },
              { stage: "Contacted", count: kpis.contacted || 1, percent: Math.round(((kpis.contacted || 1) / (kpis.total || 1)) * 100) },
              { stage: "Meeting", count: kpis.meetings, percent: Math.round((kpis.meetings / (kpis.total || 1)) * 100) },
              { stage: "Won Deals", count: kpis.wonDeals || 1, percent: Math.round(((kpis.wonDeals || 1) / (kpis.total || 1)) * 100) },
            ].map((f) => (
              <div key={f.stage} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary font-medium">{f.stage}</span>
                  <span className="text-text-primary font-semibold tabular-nums">
                    {f.count} <span className="font-semibold text-text-primary">({f.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      f.stage === "Discovered" ? "bg-accent/25" :
                      f.stage === "Qualified" ? "bg-accent/45" :
                      f.stage === "Contacted" ? "bg-accent/65" :
                      f.stage === "Meeting" ? "bg-accent/85" : "bg-accent"
                    }`}
                    style={{ width: `${Math.max(f.percent, 2)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunity Radar Matrix */}
        <Card className="border border-border-subtle bg-bg-surface">
          <CardHeader className="border-b border-border-subtle pb-3.5 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h2 font-semibold text-text-primary tracking-tight">
                  Opportunities
                </h2>
                <p className="text-body-secondary text-xs mt-0.5">Identified service requirements</p>
              </div>
              <Link to="/opportunities">
                <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent font-medium">
                  All &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {opportunitiesBreakdown.length > 0 ? (
              opportunitiesBreakdown.map((opp: any) => (
                <div
                  key={opp.type}
                  className="p-2.5 rounded-md border border-border-subtle bg-bg-base hover:bg-bg-surface-hover transition-colors duration-150 flex items-center justify-between"
                >
                  <div className="text-xs text-text-primary font-medium">
                    {opp.type.replace(/_/g, " ")}
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-text-primary">
                    {opp.count} <span className="text-text-tertiary font-normal text-[11px]">leads</span>
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-text-secondary">
                No opportunities logged yet. Discovered leads will populate here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* High-Value Leads Table & Mobile Cards */}
      <Card className="border border-border-subtle bg-bg-surface">
        <CardHeader className="border-b border-border-subtle pb-3.5 mb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h2 font-semibold text-text-primary tracking-tight">
                Ranked Leads
              </h2>
              <p className="text-body-secondary text-xs mt-0.5">
                Prioritized by algorithmic lead score and verified missing web infrastructure
              </p>
            </div>
            <Link to="/leads">
              <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent font-medium">
                View all {kpis.total} leads &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {topLeads.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-xs text-text-secondary mb-3">No verified leads stored in database yet.</p>
              <Link to="/discover">
                <Button variant="primary" size="sm" className="text-xs">
                  Launch Lead Discovery &rarr;
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout (< md) */}
              <div className="block md:hidden space-y-3">
                {topLeads.map((lead) => (
                  <div key={lead.id} className="p-3.5 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-text-primary text-xs">{lead.name}</div>
                        <div className="text-[11px] text-text-tertiary">{lead.category || "Business"}</div>
                      </div>
                      <div className="inline-flex items-center gap-1 tabular-nums font-semibold text-xs">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            lead.leadScore >= 90 ? "bg-semantic-success" : lead.leadScore >= 75 ? "bg-semantic-warning" : "bg-text-tertiary"
                          }`}
                        />
                        <span>{lead.leadScore}</span>
                      </div>
                    </div>

                    <div className="text-xs text-text-secondary">
                      {lead.city ? `${lead.city}, ` : ""}{lead.country || ""}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                      {lead.website ? (
                        <span className="text-accent text-[11px] truncate max-w-[140px]">{lead.website.replace(/^https?:\/\//, "")}</span>
                      ) : (
                        <span className="text-semantic-danger text-[11px] font-medium">No website</span>
                      )}
                      <Link to={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                          Inspect &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-text-primary">
                  <thead className="border-b border-border-subtle text-meta text-text-tertiary">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Business</th>
                      <th className="py-2.5 px-3 font-medium">Location</th>
                      <th className="py-2.5 px-3 font-medium">Website</th>
                      <th className="py-2.5 px-3 font-medium text-right">Score</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {topLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-bg-surface-hover transition-colors h-14">
                        <td className="py-3 px-3">
                          <div className="font-medium text-text-primary">{lead.name}</div>
                          <div className="text-[11px] text-text-tertiary">{lead.category || "General"}</div>
                        </td>
                        <td className="py-3 px-3 text-text-secondary">
                          {lead.city}, {lead.state || lead.country}
                        </td>
                        <td className="py-3 px-3">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                            >
                              {lead.website.replace(/^https?:\/\//, "").slice(0, 24)}
                            </a>
                          ) : (
                            <span className="text-[11px] text-semantic-danger font-medium">
                              No website
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 tabular-nums font-semibold">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                lead.leadScore >= 90 ? "bg-semantic-success" : lead.leadScore >= 75 ? "bg-semantic-warning" : "bg-text-tertiary"
                              }`}
                            />
                            <span>{lead.leadScore}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge size="sm">{lead.status}</Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link to={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              Inspect &rarr;
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
