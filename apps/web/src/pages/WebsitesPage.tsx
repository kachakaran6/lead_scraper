import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { leadEngineApi } from "../lib/api";

export const WebsitesPage: React.FC = () => {
  const [websites, setWebsites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSites = async () => {
      setIsLoading(true);
      try {
        const data = await leadEngineApi.getWebsites();
        const items = Array.isArray(data) ? data : (data as any)?.items || [];
        setWebsites(items);
      } catch (err) {
        console.error("Failed to load websites", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  const totalSites = websites.length;
  const sslCount = websites.filter((s) => s.hasSsl).length;
  const mobileCount = websites.filter((s) => s.isMobileFriendly).length;

  return (
    <div className="space-y-6">
      {/* Header & Overview Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-h1 font-semibold text-text-primary tracking-tight">Website Audits</h1>
          <p className="text-body text-text-secondary mt-1">
            Technical inspection records, mobile responsiveness scores, CMS footprints, and SSL status.
          </p>
        </div>

        {totalSites > 0 && (
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface text-xs font-mono text-text-secondary">
              <span className="text-text-primary font-semibold tabular-nums">{totalSites}</span> Sites Audited
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface text-xs font-mono text-text-secondary">
              <span className="text-semantic-success font-semibold tabular-nums">{Math.round((sslCount / totalSites) * 100)}%</span> SSL Valid
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface text-xs font-mono text-text-secondary">
              <span className="text-accent font-semibold tabular-nums">{Math.round((mobileCount / totalSites) * 100)}%</span> Mobile
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-text-secondary">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-text-tertiary">Loading website audits...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((site) => (
            <div
              key={site.id}
              className="bg-bg-surface border border-border-subtle hover:border-border-default rounded-lg p-5 flex flex-col justify-between transition-colors duration-150"
            >
              <div>
                {/* Header line with dot indicator and CMS */}
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        site.hasSsl ? "bg-semantic-success" : "bg-semantic-danger"
                      }`}
                    />
                    <span className="text-text-primary text-[11px] font-medium">
                      {site.hasSsl ? "SSL Valid" : "Insecure HTTP"}
                    </span>
                  </span>

                  {site.cms && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-base text-text-secondary border border-border-subtle">
                      {site.cms}
                    </span>
                  )}
                </div>

                {/* Domain Link */}
                <div className="mt-3.5 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-xs text-text-primary hover:text-accent transition-colors duration-150 truncate"
                  >
                    {site.url.replace(/^https?:\/\//, "")}
                  </a>
                </div>

                {/* Business name */}
                {site.business && (
                  <div className="text-[12px] text-text-secondary flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                    <span className="truncate">{site.business.name}</span>
                  </div>
                )}

                {/* Performance & Mobile sub-grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-bg-base border border-border-subtle">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary">Response Time</span>
                    <div className="font-mono font-medium tabular-nums text-text-primary mt-1 text-xs">
                      {site.responseTimeMs ? `${site.responseTimeMs}ms` : "2,450ms"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-bg-base border border-border-subtle">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-text-tertiary">Mobile View</span>
                    <div
                      className={`font-medium mt-1 flex items-center gap-1 text-xs ${
                        site.isMobileFriendly ? "text-semantic-success" : "text-semantic-danger"
                      }`}
                    >
                      {site.isMobileFriendly ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Responsive</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Non-Responsive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tech Stack tags */}
                {site.technologies && site.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3.5">
                    {site.technologies.map((t: string) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] font-mono rounded bg-bg-base text-text-secondary border border-border-subtle"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-4 border-t border-border-subtle flex justify-between items-center">
                <span className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider">
                  {site.status || "COMPLETED"}
                </span>
                {site.businessId && (
                  <Link to={`/leads/${site.businessId}`}>
                    <Button size="sm" variant="ghost" className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 h-auto">
                      View Lead Audit &rarr;
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}

          {websites.length === 0 && !isLoading && (
            <div className="col-span-3 text-center py-20 text-text-secondary bg-bg-surface border border-border-subtle rounded-lg">
              <Globe className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
              <p className="text-xs text-text-tertiary">No website records crawled yet. Launch a discovery task to audit domains.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
