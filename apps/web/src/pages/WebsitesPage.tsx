import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Building2,
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
        setWebsites(data || []);
      } catch (err) {
        console.error("Failed to load websites", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSites();
  }, []);

  return (
    <div className="space-y-6">

      {isLoading ? (
        <div className="py-24 text-center text-text-secondary">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading website audits...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((site) => (
            <div
              key={site.id}
              className="bg-bg-surface border border-border-subtle hover:border-border-default rounded-lg p-5 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        site.hasSsl ? "bg-success" : "bg-danger"
                      }`}
                    />
                    {site.hasSsl ? "SSL Valid" : "Insecure HTTP"}
                  </span>
                  {site.cms && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-base text-text-secondary border border-border-subtle">
                      {site.cms}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-sm text-text-primary hover:text-accent transition-colors truncate"
                  >
                    {site.url.replace(/^https?:\/\//, "")}
                  </a>
                </div>

                {site.business && (
                  <div className="text-xs text-text-secondary flex items-center gap-1.5 mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                    <span className="truncate">{site.business.name}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                  <div className="p-2.5 rounded-md bg-bg-base border border-border-subtle">
                    <span className="text-text-tertiary">Response Time</span>
                    <div className="font-mono font-medium text-text-primary mt-0.5">
                      {site.responseTimeMs ? `${site.responseTimeMs}ms` : "2,450ms"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-md bg-bg-base border border-border-subtle">
                    <span className="text-text-tertiary">Mobile View</span>
                    <div
                      className={`font-medium mt-0.5 ${
                        site.isMobileFriendly ? "text-success" : "text-danger"
                      }`}
                    >
                      {site.isMobileFriendly ? "Responsive" : "Non-Responsive"}
                    </div>
                  </div>
                </div>

                {site.technologies && site.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {site.technologies.map((t: string) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 text-[11px] rounded bg-bg-base text-text-secondary border border-border-subtle"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-border-subtle flex justify-between items-center">
                <span className="text-[11px] text-text-tertiary uppercase font-mono">
                  {site.status || "COMPLETED"}
                </span>
                {site.businessId && (
                  <Link to={`/leads/${site.businessId}`}>
                    <Button size="sm" variant="ghost" className="text-xs text-text-secondary hover:text-text-primary">
                      View Lead Audit &rarr;
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}

          {websites.length === 0 && !isLoading && (
            <div className="col-span-3 text-center py-16 text-text-secondary bg-bg-surface border border-border-subtle rounded-lg">
              <Globe className="w-8 h-8 mx-auto text-text-tertiary mb-2" />
              <p className="text-xs">No website records crawled yet. Run a discovery task to audit domains.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
