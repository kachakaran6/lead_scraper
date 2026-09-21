import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Zap,
  ExternalLink,
  Send,
  Plus,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";
import { cn } from "../lib/utils";
import {
  WebsitesSkeleton,
  ErrorState,
  EmptyState,
} from "../components/ui/LoadingStates";

export const WebsitesPage: React.FC = () => {
  const [websites, setWebsites] = useState<any[]>([]);
  const [missingWebLeads, setMissingWebLeads] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState<"missing" | "audited">("missing");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [webData, missingData] = await Promise.all([
        leadEngineApi.getWebsites({ limit: 50 }),
        leadEngineApi.getLeads({ withoutWebsite: true, limit: 50 }),
      ]);
      setWebsites(Array.isArray(webData) ? webData : webData?.items || []);
      setMissingWebLeads(Array.isArray(missingData) ? missingData : missingData?.items || []);
    } catch (err: any) {
      console.error("Failed to load website audit data:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve website audit and missing website records. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSites = websites.length;
  const sslCount = websites.filter((s) => s.hasSsl).length;
  const mobileCount = websites.filter((s) => s.isMobileFriendly).length;

  if (isLoading) {
    return <WebsitesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-accent" />
            <span>Website Audits</span>
          </div>
        }
        description="Technical inspection records, mobile responsiveness, SSL security, and missing website acquisition targets."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/discover">
              <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 bg-accent text-white">
                <Plus className="w-3.5 h-3.5" />
                <span>Discover Prospects</span>
              </Button>
            </Link>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Unable to load website audits"
          message={error}
          onRetry={fetchData}
        />
      ) : (
        <>
          {/* 2. Overview Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-[11px] block">Audited Websites</span>
              <div className="text-xl font-bold font-mono text-text-primary">{totalSites}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-[11px] block">SSL Certificate Valid</span>
              <div className="text-xl font-bold font-mono text-success">
                {totalSites > 0 ? `${Math.round((sslCount / totalSites) * 100)}%` : "—"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-[11px] block">Mobile Optimized</span>
              <div className="text-xl font-bold font-mono text-accent">
                {totalSites > 0 ? `${Math.round((mobileCount / totalSites) * 100)}%` : "—"}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle space-y-1">
              <span className="text-text-tertiary text-[11px] block">Missing Website Targets</span>
              <div className="text-xl font-bold font-mono text-amber-400">{missingWebLeads.length}</div>
            </div>
          </div>

          {/* 3. Filter Tabs */}
          <div className="border-b border-border-subtle flex items-center gap-1 select-none overflow-x-auto">
            <button
              onClick={() => setActiveTab("missing")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                activeTab === "missing"
                  ? "border-accent text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Missing Website Opportunities ({missingWebLeads.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("audited")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap",
                activeTab === "audited"
                  ? "border-accent text-text-primary"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              )}
            >
              <Globe className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>Audited Web Properties ({websites.length})</span>
            </button>
          </div>

          {/* 4. Tab Content: Missing Website Opportunities */}
          {activeTab === "missing" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-text-primary flex items-start gap-3">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Core Acquisition Angle:</strong> These verified businesses operate physical practices with active telephones, but maintain zero registered web domain. They are prime prospects for custom website packages and booking systems.
                </div>
              </div>

              {missingWebLeads.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="No missing-website leads identified"
                  description="Run a discovery scrape to find local businesses operating without official websites."
                  actionLabel="Launch Discovery Scrape"
                  actionHref="/discover"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missingWebLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-5 rounded-xl bg-bg-surface border border-border-subtle hover:border-border-default space-y-3 shadow-sm flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/leads/${lead.id}`}
                              className="font-bold text-sm text-text-primary hover:text-accent transition-colors block truncate"
                            >
                              {lead.name}
                            </Link>
                            <span className="text-xs text-text-secondary block mt-0.5 truncate">
                              {lead.category || "Commercial Service"} • {lead.city || "Local"}
                            </span>
                          </div>

                          <span className="text-[10px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 shrink-0">
                            Score {lead.leadScore}
                          </span>
                        </div>

                        <div className="rounded-lg bg-bg-base border border-border-subtle p-2.5 text-xs text-text-secondary space-y-1">
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">Status:</span>
                            <span className="text-amber-400 font-medium">Zero Website Detected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-tertiary">Direct Phone:</span>
                            <span className="font-mono text-text-primary">{lead.phone || "Unlisted"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                        <Link to={`/leads/${lead.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full text-xs h-7">
                            <span>View Dossier</span>
                          </Button>
                        </Link>

                        <Link to={`/leads/${lead.id}?tab=outreach`} className="flex-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full text-xs h-7 bg-accent hover:bg-accent-hover text-white gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Pitch</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Tab Content: Technical Audits */}
          {activeTab === "audited" && (
            <div className="space-y-4">
              {websites.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="No audited web properties recorded"
                  description="Run a discovery scrape to crawl and inspect websites belonging to harvested businesses."
                  actionLabel="Discover Web Properties"
                  actionHref="/discover"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {websites.map((site) => (
                    <div
                      key={site.id}
                      className="p-5 rounded-xl bg-bg-surface border border-border-subtle hover:border-border-default space-y-3 shadow-sm flex flex-col justify-between transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 font-medium truncate">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                site.hasSsl ? "bg-success" : "bg-danger"
                              )}
                            />
                            <span className="truncate">{site.url.replace(/^https?:\/\//, "")}</span>
                          </span>

                          <a
                            href={site.url.startsWith("http") ? site.url : `https://${site.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text-tertiary hover:text-accent shrink-0 p-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-xs">
                          <div className="p-2 rounded bg-bg-base border border-border-subtle">
                            <span className="text-[10px] text-text-tertiary block">SSL Security</span>
                            <span
                              className={cn(
                                "font-semibold text-xs mt-0.5 block",
                                site.hasSsl ? "text-success" : "text-danger"
                              )}
                            >
                              {site.hasSsl ? "Valid SSL" : "Insecure"}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-bg-base border border-border-subtle">
                            <span className="text-[10px] text-text-tertiary block">Mobile Ready</span>
                            <span
                              className={cn(
                                "font-semibold text-xs mt-0.5 block",
                                site.isMobileFriendly ? "text-success" : "text-warning"
                              )}
                            >
                              {site.isMobileFriendly ? "Optimized" : "Laggy / Desktop"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border-subtle">
                        <Link to={`/leads/${site.businessId}`}>
                          <Button variant="ghost" size="sm" className="w-full text-xs text-accent hover:text-accent font-medium">
                            Inspect Business &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
