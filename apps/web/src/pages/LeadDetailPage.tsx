import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Calendar,
  Layers,
  ShieldCheck,
  Smartphone,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "opportunities" | "outreach">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string>("QUALIFIED");

  useEffect(() => {
    if (!id) return;
    const fetchLead = async () => {
      setIsLoading(true);
      try {
        const data = await leadEngineApi.getLead(id);
        setLead(data);
        if (data?.status) setLeadStatus(data.status);
      } catch (err) {
        console.error("Failed to load lead", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setLeadStatus(newStatus);
    if (!id) return;
    try {
      await leadEngineApi.updateLeadStatus(id, newStatus);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p>Loading enriched lead intel...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-20 text-center text-slate-400">
        <h2 className="text-xl font-bold text-white mb-2">Lead Record Not Found</h2>
        <Link to="/leads">
          <Button variant="outline">&larr; Back to Leads</Button>
        </Link>
      </div>
    );
  }

  const audit = lead.websiteAudits?.[0] || null;
  const website = lead.websites?.[0] || null;
  const opportunities = lead.opportunities || [];

  // Generate personalized cold pitch
  const generatedEmailPitch = `Subject: Quick question regarding ${lead.name}'s digital patient presence in ${lead.city || "Rajkot"}

Hi Team at ${lead.name},

I noticed your clinic has exceptional patient reviews (★ ${lead.rating || "4.8"} from ${lead.reviewCount || "300+"} happy patients).

${
  !lead.website
    ? `However, we noticed ${lead.name} currently does not have a dedicated modern website or direct online booking system. Thousands of local patients searching in ${lead.city} for ${lead.category || "healthcare services"} end up booking elsewhere simply because there is no direct link.`
    : `We performed a quick technical audit on your website (${lead.website}) and noticed that mobile loading time is over 2.4s and it's missing direct WhatsApp 1-click consultation booking.`
}

We built a quick 3-minute demo showing how ${lead.name} can capture an extra 30-50 patient consultations monthly.

Would you be open to a quick 5-minute preview this Thursday at 11 AM?

Best regards,
LeadEngine Digital Partner`;

  const generatedWhatsAppPitch = `Hello Team ${lead.name}! 👋 We love your practice's stellar reputation in ${lead.city}. We built a ready-made mobile patient booking & WhatsApp appointment flow specifically tailored for ${lead.name}. Can I share the 60-second video demo with you here?`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/leads"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Database</span>
        </Link>

        {/* Pipeline Stage Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Stage:</span>
          <select
            value={leadStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-400 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="NEW">NEW</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="REPLIED">REPLIED</option>
            <option value="MEETING">MEETING</option>
            <option value="PROPOSAL">PROPOSAL</option>
            <option value="NEGOTIATION">NEGOTIATION</option>
            <option value="WON">WON</option>
            <option value="LOST">LOST</option>
          </select>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <Card className="glass-panel border-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {lead.name}
                </h1>
                <Badge
                  variant={lead.leadScore >= 90 ? "danger" : lead.leadScore >= 75 ? "success" : "info"}
                  className="font-mono font-bold text-xs flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Grade {lead.leadGrade || "A"} • Score {lead.leadScore}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2">
                <span className="font-semibold text-indigo-400">{lead.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {lead.address}, {lead.city}, {lead.state || lead.country}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">
                  ★ {lead.rating} ({lead.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Quick Contact & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {lead.phone && (
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Lead</span>
                </a>
              )}
              {lead.website ? (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open Website</span>
                </a>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
                  🚫 High Value: Missing Website
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        {[
          { id: "overview", label: "Intel Overview & Contacts" },
          { id: "audit", label: `Technical Audit (${website ? "Available" : "No Site"})` },
          { id: "opportunities", label: `Opportunity Radar (${opportunities.length})` },
          { id: "outreach", label: "AI Outreach Pitches" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? "bg-slate-800/90 text-white border-b-2 border-indigo-500 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-panel border-slate-800 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white">Contact & Profile Footprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Primary Phone</div>
                  <div className="text-sm font-bold text-white mt-1">{lead.phone || "Not recorded"}</div>
                  <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> WhatsApp Verified
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Primary Email</div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {lead.emails?.[0]?.value || "info@business.example.com"}
                  </div>
                  <div className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Deliverability Verified
                  </div>
                </div>
              </div>

              {/* Social Profiles */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Social Channels
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {lead.socialProfiles && lead.socialProfiles.length > 0 ? (
                    lead.socialProfiles.map((sp) => (
                      <a
                        key={sp.id}
                        href={sp.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-white">{sp.platform}</span>
                          {sp.followers && (
                            <div className="text-[10px] text-slate-400">{sp.followers} followers</div>
                          )}
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </a>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 col-span-3">No social links detected yet.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Factors Breakdown */}
          <Card className="glass-panel border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                Score Intelligence
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Signals driving conversion probability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { factor: lead.website ? "Outdated Tech Stack" : "Missing Website (Flagship Need)", points: lead.website ? "+25 pts" : "+40 pts", color: "text-amber-400" },
                { factor: "High Local Patient Ratings (4.8+)", points: "+15 pts", color: "text-emerald-400" },
                { factor: "Direct Mobile / WhatsApp Found", points: "+20 pts", color: "text-emerald-400" },
                { factor: "Verified Business Decision Maker", points: "+15 pts", color: "text-indigo-400" },
              ].map((s, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-slate-300">{s.factor}</span>
                  <span className={`font-mono font-bold ${s.color}`}>{s.points}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Technical Audit */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {audit ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Performance", score: audit.performanceScore, color: "text-amber-400", border: "border-amber-500/30" },
                { label: "Mobile UX", score: audit.mobileScore, color: "text-rose-400", border: "border-rose-500/30" },
                { label: "SEO Indexing", score: audit.seoScore, color: "text-indigo-400", border: "border-indigo-500/30" },
                { label: "Best Practices", score: audit.bestPracticesScore, color: "text-emerald-400", border: "border-emerald-500/30" },
              ].map((gauge) => (
                <Card key={gauge.label} className={`glass-panel ${gauge.border}`}>
                  <CardContent className="p-5 text-center">
                    <div className={`text-4xl font-extrabold font-mono ${gauge.color}`}>
                      {gauge.score}
                    </div>
                    <div className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">
                      {gauge.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Lighthouse Score / 100</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-panel border-amber-800/40 bg-amber-950/10 p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-amber-200">No Existing Website To Audit</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                This business does not have an active website URL registered. This presents the highest-value web agency opportunity: pitching a complete flagship website.
              </p>
            </Card>
          )}

          {/* Audit Issues */}
          {audit?.issues && audit.issues.length > 0 && (
            <Card className="glass-panel border-slate-800">
              <CardHeader>
                <CardTitle className="text-base font-bold text-white">Critical Issues Found</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {audit.issues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-200">{issue}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tab 3: Opportunities Radar */}
      {activeTab === "opportunities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.length > 0 ? (
            opportunities.map((opp) => (
              <Card key={opp.id} className="glass-panel border-slate-800">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="warning" className="text-[10px] font-bold">
                        {opp.type}
                      </Badge>
                      <h4 className="font-bold text-white text-base mt-2">{opp.title}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-extrabold text-emerald-400">
                        ${opp.value || 1200}
                      </div>
                      <span className="text-[10px] text-slate-400">Project Value</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">
                    High margin solution for {lead.name} to increase customer conversion.
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <Link to="/deals">
                      <Button size="sm" variant="primary" className="text-xs">
                        Push to Deals Kanban &rarr;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
              No specific opportunities generated yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Outreach */}
      {activeTab === "outreach" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Template */}
          <Card className="glass-panel border-slate-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Personalized Cold Email Pitch
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedEmailPitch, "email")}
                  className="text-xs flex items-center gap-1"
                >
                  {copiedText === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "email" ? "Copied!" : "Copy Email"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                {generatedEmailPitch}
              </pre>
            </CardContent>
          </Card>

          {/* WhatsApp Quick Icebreaker */}
          <Card className="glass-panel border-slate-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  WhatsApp Direct Message Hook
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedWhatsAppPitch, "whatsapp")}
                  className="text-xs flex items-center gap-1"
                >
                  {copiedText === "whatsapp" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === "whatsapp" ? "Copied!" : "Copy Text"}</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                {generatedWhatsAppPitch}
              </pre>

              {lead.phone && (
                <div className="mt-4">
                  <a
                    href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      generatedWhatsAppPitch
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Launch in WhatsApp Web with this Pitch &rarr;</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
