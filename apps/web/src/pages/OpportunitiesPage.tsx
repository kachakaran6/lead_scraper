import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  DollarSign,
  Building2,
  Globe,
  ArrowRight,
  Filter,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";

export const OpportunitiesPage: React.FC = () => {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOpp = async () => {
      setIsLoading(true);
      try {
        const data = await leadEngineApi.getOpportunities();
        setOpportunities(data || []);
      } catch (err) {
        console.error("Failed to load opportunities", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOpp();
  }, []);

  const filtered = typeFilter === "ALL"
    ? opportunities
    : opportunities.filter((o) => o.type === typeFilter);

  const totalValue = filtered.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Opportunity Radar</h1>
            <Badge variant="warning" className="font-bold text-xs">
              ${totalValue.toLocaleString()} Pipeline Value
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic detection of missing digital assets, low mobile scores, and revenue bottlenecks.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Opportunity Types</option>
            <option value="NO_WEBSITE">🚫 Missing Website</option>
            <option value="WEBSITE_REDESIGN">🎨 Website Redesign</option>
            <option value="WHATSAPP_INTEGRATION">💬 WhatsApp CRM Integration</option>
            <option value="BOOKING_SYSTEM">📅 Online Booking System</option>
            <option value="MOBILE_OPTIMIZATION">📱 Mobile Speed Optimization</option>
            <option value="LOCAL_SEO">📍 Local SEO & Schema</option>
          </select>
        </div>
      </div>

      {/* Grid of opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((opp) => (
          <Card
            key={opp.id}
            className="glass-panel border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge
                  variant={
                    opp.type === "NO_WEBSITE"
                      ? "danger"
                      : opp.type === "WEBSITE_REDESIGN"
                      ? "warning"
                      : "info"
                  }
                  className="text-[10px] font-bold"
                >
                  {opp.type.replace(/_/g, " ")}
                </Badge>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  ${opp.value || 800}
                </span>
              </div>
              <CardTitle className="text-base font-bold text-white mt-2">
                {opp.title}
              </CardTitle>
              {opp.business && (
                <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1 mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{opp.business.name}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              <p className="text-xs text-slate-400">
                Identified automatically from lack of web presence, poor mobile performance, or absent direct consultation funnel.
              </p>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> High Conversion
                </span>

                {opp.businessId && (
                  <Link to={`/leads/${opp.businessId}`}>
                    <Button size="sm" variant="primary" className="text-xs flex items-center gap-1">
                      <span>View & Pitch</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
