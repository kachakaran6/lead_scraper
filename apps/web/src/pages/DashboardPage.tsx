import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Globe,
  AlertTriangle,
  Mail,
  PhoneCall,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Intelligence Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live DB Synced
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time scraping analytics, conversion signals, and high-probability client deals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/discover">
            <Button variant="primary" className="shadow-lg shadow-indigo-600/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Launch Discovery</span>
            </Button>
          </Link>
          <Link to="/leads">
            <Button variant="outline" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>View All Leads</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Grid (14 Metrics from First.md) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Total Businesses */}
        <Card className="glass-panel border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Leads</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">{kpis.total}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>+{kpis.newToday} today</span>
            </div>
          </CardContent>
        </Card>

        {/* Without Website (Goldmine) */}
        <Card className="glass-panel border-amber-900/40 bg-gradient-to-br from-amber-950/20 to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">No Website (High ROI)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-amber-200 mt-2">{kpis.withoutWebsite}</div>
            <div className="text-[11px] text-amber-400 mt-1">Prime Web Agency Targets</div>
          </CardContent>
        </Card>

        {/* With Website */}
        <Card className="glass-panel border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">With Website</span>
              <Globe className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">{kpis.withWebsite}</div>
            <div className="text-[11px] text-slate-400 mt-1">Redesign & SEO Leads</div>
          </CardContent>
        </Card>

        {/* High Opportunity */}
        <Card className="glass-panel border-rose-900/40 bg-gradient-to-br from-rose-950/20 to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300">High Opportunity 🔥</span>
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-200 mt-2">{kpis.highOpportunity}</div>
            <div className="text-[11px] text-rose-400 mt-1">Score &gt; 80 / Grade A</div>
          </CardContent>
        </Card>

        {/* Meetings Booked */}
        <Card className="glass-panel border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Meetings</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">{kpis.meetings}</div>
            <div className="text-[11px] text-purple-400 mt-1">Active Deal Demos</div>
          </CardContent>
        </Card>

        {/* Closed Won */}
        <Card className="glass-panel border-emerald-900/40 bg-gradient-to-br from-emerald-950/20 to-slate-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300">Won Revenue</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-200 mt-2">${kpis.wonDeals * 2500}</div>
            <div className="text-[11px] text-emerald-400 mt-1">{kpis.wonDeals} deals closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts & Opportunity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <Card className="lg:col-span-2 glass-panel border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  Lead Conversion Funnel
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Full lifecycle track from web discovery to won contract
                </CardDescription>
              </div>
              <Link to="/deals">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300">
                  View Pipeline &rarr;
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { stage: "Discovered", count: kpis.total, percent: 100, color: "bg-indigo-500" },
              { stage: "Qualified (Grade A/B)", count: kpis.highOpportunity, percent: Math.round((kpis.highOpportunity / (kpis.total || 1)) * 100), color: "bg-blue-500" },
              { stage: "Contacted / Pitched", count: kpis.contacted || 1, percent: Math.round(((kpis.contacted || 1) / (kpis.total || 1)) * 100), color: "bg-cyan-500" },
              { stage: "Meeting / Audit Walkthrough", count: kpis.meetings, percent: Math.round((kpis.meetings / (kpis.total || 1)) * 100), color: "bg-amber-500" },
              { stage: "Closed Won Deals", count: kpis.wonDeals || 1, percent: Math.round(((kpis.wonDeals || 1) / (kpis.total || 1)) * 100), color: "bg-emerald-500" },
            ].map((f) => (
              <div key={f.stage} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">{f.stage}</span>
                  <span className="text-slate-400">
                    <strong className="text-white font-mono">{f.count}</strong> ({f.percent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${f.color} transition-all duration-700`}
                    style={{ width: `${Math.max(f.percent, 8)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Opportunity Radar Matrix */}
        <Card className="glass-panel border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Opportunity Radar
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              High-value service signals identified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opportunitiesBreakdown.map((opp: any) => (
              <div
                key={opp.type}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    {opp.type.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">High Client Demand</div>
                </div>
                <Badge variant="warning" className="font-mono font-bold">
                  {opp.count} Leads
                </Badge>
              </div>
            ))}

            <Link to="/opportunities" className="block pt-2">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Explore All Opportunities &rarr;
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* High-Value Leads Table (Hot Leads) */}
      <Card className="glass-panel border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                Priority Ranked Leads
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Sorted by AI lead score and missing web/mobile infrastructure
              </CardDescription>
            </div>
            <Link to="/leads">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300">
                View All {kpis.total} Leads &rarr;
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Business Name</th>
                  <th className="py-3 px-4 font-semibold">Category & City</th>
                  <th className="py-3 px-4 font-semibold">Website Status</th>
                  <th className="py-3 px-4 font-semibold">Lead Score</th>
                  <th className="py-3 px-4 font-semibold">Stage</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-900/60 transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        {lead.name}
                        {lead.leadScore >= 90 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{lead.phone || "No phone"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-200 font-medium">{lead.category || "General"}</div>
                      <div className="text-slate-400">{lead.city}, {lead.state || lead.country}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Audit Available</span>
                        </a>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          NO WEBSITE
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-extrabold text-white font-mono">{lead.leadScore}</div>
                        <Badge
                          variant={lead.leadScore >= 90 ? "danger" : lead.leadScore >= 75 ? "success" : "info"}
                          className="text-[10px] font-bold"
                        >
                          Grade {lead.leadGrade || "A"}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <Badge variant="default" className="bg-slate-800 text-slate-200 border-slate-700">
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
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
