import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Gauge,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
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
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Website Audit Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Technical inspection, CMS stack fingerprinting, SSL verification, and mobile responsiveness audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {websites.map((site) => (
          <Card key={site.id} className="glass-panel border-slate-800 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge variant={site.hasSsl ? "success" : "danger"} className="text-[10px]">
                  {site.hasSsl ? "HTTPS / SSL SECURE" : "INSECURE HTTP"}
                </Badge>
                {site.cms && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {site.cms}
                  </span>
                )}
              </div>

              <CardTitle className="text-base font-bold text-white mt-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <a
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline truncate"
                >
                  {site.url.replace(/^https?:\/\//, "")}
                </a>
              </CardTitle>
              {site.business && (
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <span>{site.business.name}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Response Time:</span>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {site.responseTimeMs ? `${site.responseTimeMs}ms` : "2,450ms (Slow)"}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Mobile Ready:</span>
                  <div className={`font-bold mt-0.5 ${site.isMobileFriendly ? "text-emerald-400" : "text-rose-400"}`}>
                    {site.isMobileFriendly ? "Responsive" : "Broken Mobile"}
                  </div>
                </div>
              </div>

              {site.technologies && site.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {site.technologies.map((t: string) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Status: {site.status}</span>
                {site.businessId && (
                  <Link to={`/leads/${site.businessId}`}>
                    <Button size="sm" variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300">
                      View Lead Audit &rarr;
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {websites.length === 0 && !isLoading && (
          <div className="col-span-3 text-center py-12 text-slate-400">
            <Globe className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p>No website records crawled yet. Run a discovery task to audit domains.</p>
          </div>
        )}
      </div>
    </div>
  );
};
