import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#EDEDEF] tracking-tight">Opportunity Radar</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#232326] bg-[#131315] text-xs font-mono text-[#9B9BA1]">
              <span className="text-[#EDEDEF] font-semibold tabular-nums">${totalValue.toLocaleString()}</span>
              <span>Pipeline Value</span>
            </span>
          </div>
          <p className="text-xs text-[#9B9BA1] mt-1">
            Algorithmic detection of missing digital assets, low mobile scores, and revenue bottlenecks.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-[#131315] border border-[#2E2E32] text-xs text-[#EDEDEF] focus:outline-none focus:border-[#4C7CF0] cursor-pointer"
          >
            <option value="ALL">All Opportunity Types</option>
            <option value="NO_WEBSITE">Missing Website</option>
            <option value="WEBSITE_REDESIGN">Website Redesign</option>
            <option value="WHATSAPP_INTEGRATION">WhatsApp CRM Integration</option>
            <option value="BOOKING_SYSTEM">Online Booking System</option>
            <option value="MOBILE_OPTIMIZATION">Mobile Speed Optimization</option>
            <option value="LOCAL_SEO">Local SEO & Schema</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-[#9B9BA1]">
          <div className="w-6 h-6 border-2 border-[#4C7CF0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-[#9B9BA1] bg-[#131315] border border-[#232326] rounded-lg">
          <p className="text-xs">No opportunities found for the selected filter.</p>
        </div>
      ) : (
        /* Grid of opportunities */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              className="bg-[#131315] border border-[#232326] hover:border-[#2E2E32] rounded-lg p-5 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#9B9BA1] border border-[#232326] bg-[#0A0A0B] rounded px-2 py-0.5">
                    {opp.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-[#EDEDEF] font-mono">
                    ${opp.value || 800}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#EDEDEF] mt-3">
                  {opp.title}
                </h3>

                {opp.business && (
                  <div className="text-xs text-[#9B9BA1] flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6B6B70]" />
                    <span className="truncate">{opp.business.name}</span>
                  </div>
                )}

                <p className="text-xs text-[#9B9BA1] mt-2.5 leading-relaxed line-clamp-2">
                  Identified automatically from lack of web presence, poor mobile performance, or absent direct consultation funnel.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#232326] flex items-center justify-between">
                <span className="text-xs text-[#34A874] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A874]" />
                  High Conversion
                </span>

                {opp.businessId && (
                  <Link to={`/leads/${opp.businessId}`}>
                    <Button size="sm" variant="outline" className="text-xs flex items-center gap-1">
                      <span>View & Pitch</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
