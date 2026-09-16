import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Globe,
  Calendar,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
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
    total: 3,
    newToday: 3,
    newWeek: 3,
    newMonth: 3,
    withoutWebsite: 1,
    withWebsite: 2,
    highOpportunity: 3,
    contacted: 0,
    replied: 0,
    meetings: 1,
    proposals: 0,
    wonDeals: 0,
  };

  const opportunitiesBreakdown = stats?.charts?.opportunities || [
    { type: "WHATSAPP_INTEGRATION", count: 2 },
    { type: "NO_WEBSITE", count: 1 },
    { type: "WEBSITE_REDESIGN", count: 1 },
    { type: "LOCAL_SEO", count: 1 },
    { type: "MOBILE_OPTIMIZATION", count: 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#232326]">
        <div>
          <h1 className="text-[22px] font-semibold text-[#EDEDEF] tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-[#9B9BA1] mt-0.5">
            Real-time pipeline analytics, lead signals, and conversion metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/discover">
            <Button variant="primary" size="sm">
              Launch Discovery
            </Button>
          </Link>
          <Link to="/leads">
            <Button variant="outline" size="sm">
              View All Leads
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Businesses */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
              Total Leads
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-[#EDEDEF] mt-1.5">
              {kpis.total}
            </div>
            <div className="text-[11px] text-[#34A874] mt-1 font-medium">
              +{kpis.newToday} today
            </div>
          </CardContent>
        </Card>

        {/* Without Website */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
              No Website
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-[#EDEDEF] mt-1.5">
              {kpis.withoutWebsite}
            </div>
            <div className="text-[11px] text-[#9B9BA1] mt-1">Prime targets</div>
          </CardContent>
        </Card>

        {/* With Website */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
              With Website
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-[#EDEDEF] mt-1.5">
              {kpis.withWebsite}
            </div>
            <div className="text-[11px] text-[#9B9BA1] mt-1">Audit ready</div>
          </CardContent>
        </Card>

        {/* High Opportunity */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
              High Opportunity
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-[#EDEDEF] mt-1.5">
              {kpis.highOpportunity}
            </div>
            <div className="text-[11px] text-[#9B9BA1] mt-1">Score ≥ 80</div>
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
              Meetings
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-[#EDEDEF] mt-1.5">
              {kpis.meetings}
            </div>
            <div className="text-[11px] text-[#9B9BA1] mt-1">Demos booked</div>
          </CardContent>
        </Card>

        {/* Closed Won */}
        <Card>
          <CardContent className="p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
              Won Deals
            </div>
            <div className="text-[24px] font-semibold tabular-nums text-[#EDEDEF] mt-1.5">
              ${(kpis.wonDeals * 2500).toLocaleString()}
            </div>
            <div className="text-[11px] text-[#9B9BA1] mt-1">
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
                <Button variant="ghost" size="sm" className="text-[12px] text-[#9B9BA1] hover:text-[#EDEDEF]">
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
                  <span className="text-[#9B9BA1]">{f.stage}</span>
                  <span className="text-[#EDEDEF] font-medium tabular-nums">
                    {f.count} <span className="text-[#6B6B70]">({f.percent}%)</span>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#1B1B1E] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4C7CF0]"
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
                <Button variant="ghost" size="sm" className="text-[12px] text-[#9B9BA1] hover:text-[#EDEDEF]">
                  All &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunitiesBreakdown.map((opp: any) => (
              <div
                key={opp.type}
                className="p-2.5 rounded-md border border-[#232326] bg-[#0A0A0B] flex items-center justify-between"
              >
                <div className="text-[13px] text-[#EDEDEF] font-medium">
                  {opp.type.replace(/_/g, " ")}
                </div>
                <span className="text-[12px] font-semibold tabular-nums text-[#9B9BA1] font-mono">
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
              <Button variant="ghost" size="sm" className="text-[12px] text-[#9B9BA1] hover:text-[#EDEDEF]">
                View all {kpis.total} leads &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-[#EDEDEF]">
              <thead className="border-b border-[#232326] text-[11px] uppercase tracking-[0.04em] text-[#6B6B70] font-medium">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Business</th>
                  <th className="py-2.5 px-3 font-medium">Location</th>
                  <th className="py-2.5 px-3 font-medium">Website</th>
                  <th className="py-2.5 px-3 font-medium text-right">Score</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232326]">
                {topLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#1B1B1E] transition-colors h-14">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#EDEDEF]">{lead.name}</div>
                      <div className="text-[11px] text-[#6B6B70]">{lead.category || "General"}</div>
                    </td>
                    <td className="py-3 px-3 text-[#9B9BA1] text-[12px]">
                      {lead.city}, {lead.state || lead.country}
                    </td>
                    <td className="py-3 px-3">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#4C7CF0] hover:underline text-[12px]"
                        >
                          {lead.website.replace(/^https?:\/\//, "").slice(0, 24)}
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#D14D4D] font-medium">
                          No website
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 tabular-nums font-semibold font-mono">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            lead.leadScore >= 90 ? "bg-[#34A874]" : lead.leadScore >= 75 ? "bg-[#C98A2E]" : "bg-[#6B6B70]"
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
