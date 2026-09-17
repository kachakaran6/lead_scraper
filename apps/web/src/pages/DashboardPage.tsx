import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [topLeads, setTopLeads] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, leadsData] = await Promise.all([
          leadEngineApi.getDashboardKpis(),
          leadEngineApi.getLeads({ limit: 5, sortBy: "leadScore", sortOrder: "desc" }),
        ]);
        setStats(statsData);
        setTopLeads(leadsData?.items || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = stats?.kpis || {
    total: 38,
    newToday: 35,
    newWeek: 38,
    newMonth: 38,
    withoutWebsite: 18,
    withWebsite: 20,
    highOpportunity: 38,
    contacted: 1,
    replied: 0,
    meetings: 1,
    proposals: 0,
    wonDeals: 1,
  };

  const opportunitiesBreakdown = stats?.charts?.opportunities || [
    { type: "WHATSAPP_INTEGRATION", count: 37 },
    { type: "WEBSITE_REDESIGN", count: 19 },
    { type: "MOBILE_OPTIMIZATION", count: 19 },
    { type: "NO_WEBSITE", count: 18 },
    { type: "LOCAL_SEO", count: 18 },
    { type: "BOOKING_SYSTEM", count: 1 },
    { type: "SOCIAL_MEDIA", count: 1 },
    { type: "CRM", count: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-end gap-2.5">
        <Link to="/discover">
          <Button variant="primary" size="sm" className="text-xs">
            Launch Discovery
          </Button>
        </Link>
        <Link to="/leads">
          <Button variant="outline" size="sm" className="text-xs">
            View All Leads
          </Button>
        </Link>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Businesses */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              Total Leads
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-text-primary mt-1.5">
              {kpis.total}
            </div>
            <div className="text-[11px] text-semantic-success mt-1 font-medium">
              +{kpis.newToday} today
            </div>
          </CardContent>
        </Card>

        {/* Without Website */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              No Website
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-text-primary mt-1.5">
              {kpis.withoutWebsite}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">Prime targets</div>
          </CardContent>
        </Card>

        {/* With Website */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              With Website
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-text-primary mt-1.5">
              {kpis.withWebsite}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">Audit ready</div>
          </CardContent>
        </Card>

        {/* High Opportunity */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              High Opportunity
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-text-primary mt-1.5">
              {kpis.highOpportunity}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">Score ≥ 80</div>
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              Meetings
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-text-primary mt-1.5">
              {kpis.meetings}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">Demos booked</div>
          </CardContent>
        </Card>

        {/* Closed Won */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
              Won Deals
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-text-primary mt-1.5">
              ${(kpis.wonDeals * 2500).toLocaleString()}
            </div>
            <div className="text-[11px] text-text-secondary mt-1">
              {kpis.wonDeals} closed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Opportunity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversion Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>
                  Full lifecycle track from discovery to won contract
                </CardDescription>
              </div>
              <Link to="/deals">
                <Button variant="ghost" size="sm" className="text-[12px] text-text-secondary hover:text-text-primary">
                  Pipeline view &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {[
              { stage: "Discovered", count: kpis.total, percent: 100 },
              { stage: "Qualified", count: kpis.highOpportunity, percent: Math.round((kpis.highOpportunity / (kpis.total || 1)) * 100) },
              { stage: "Contacted", count: kpis.contacted || 1, percent: Math.round(((kpis.contacted || 1) / (kpis.total || 1)) * 100) },
              { stage: "Meeting", count: kpis.meetings, percent: Math.round((kpis.meetings / (kpis.total || 1)) * 100) },
              { stage: "Won Deals", count: kpis.wonDeals || 1, percent: Math.round(((kpis.wonDeals || 1) / (kpis.total || 1)) * 100) },
            ].map((f) => (
              <div key={f.stage} className="space-y-1">
                <div className="flex justify-between text-[12px]">
                  <span className="text-text-secondary">{f.stage}</span>
                  <span className="text-text-primary font-medium tabular-nums">
                    {f.count} <span className="text-text-tertiary">({f.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-bg-surface-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(f.percent, 4)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunity Radar Matrix */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Opportunities</CardTitle>
                <CardDescription>Identified service requirements</CardDescription>
              </div>
              <Link to="/opportunities">
                <Button variant="ghost" size="sm" className="text-[12px] text-text-secondary hover:text-text-primary">
                  All &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunitiesBreakdown.map((opp: any) => (
              <div
                key={opp.type}
                className="p-2.5 rounded-md border border-border-subtle bg-bg-base flex items-center justify-between"
              >
                <div className="text-[13px] text-text-primary font-medium">
                  {opp.type.replace(/_/g, " ")}
                </div>
                <span className="text-[12px] font-semibold tabular-nums text-text-secondary font-mono">
                  {opp.count} leads
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* High-Value Leads Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ranked Leads</CardTitle>
              <CardDescription>
                Prioritized by AI lead score and missing web infrastructure
              </CardDescription>
            </div>
            <Link to="/leads">
              <Button variant="ghost" size="sm" className="text-[12px] text-text-secondary hover:text-text-primary">
                View all {kpis.total} leads &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-text-primary">
              <thead className="border-b border-border-subtle text-[11px] uppercase tracking-[0.04em] text-text-tertiary font-medium">
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
                    <td className="py-3 px-3 text-text-secondary text-[12px]">
                      {lead.city}, {lead.state || lead.country}
                    </td>
                    <td className="py-3 px-3">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline text-[12px]"
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
                      <div className="inline-flex items-center gap-1.5 tabular-nums font-semibold font-mono">
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
        </CardContent>
      </Card>
    </div>
  );
};
