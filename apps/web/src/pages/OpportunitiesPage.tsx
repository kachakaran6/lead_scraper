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
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-subtle bg-bg-surface text-xs font-mono text-text-secondary">
          <span className="text-text-primary font-semibold tabular-nums">${totalValue.toLocaleString()}</span>
          <span>Pipeline Value</span>
        </span>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-md bg-bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent cursor-pointer"
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
        <div className="py-24 text-center text-text-secondary">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading opportunities...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-text-secondary bg-bg-surface border border-border-subtle rounded-lg">
          <p className="text-xs">No opportunities found for the selected filter.</p>
        </div>
      ) : (
        /* Grid of opportunities */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp) => (
            <div
              key={opp.id}
              className="bg-bg-surface border border-border-subtle hover:border-border-default rounded-lg p-5 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary border border-border-subtle bg-bg-base rounded px-2 py-0.5">
                    {opp.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-text-primary font-mono">
                    ${opp.value || 800}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-text-primary mt-3">
                  {opp.title}
                </h3>

                {opp.business && (
                  <div className="text-xs text-text-secondary flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="truncate">{opp.business.name}</span>
                  </div>
                )}

                <p className="text-xs text-text-secondary mt-2.5 leading-relaxed line-clamp-2">
                  Identified automatically from lack of web presence, poor mobile performance, or absent direct consultation funnel.
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
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
