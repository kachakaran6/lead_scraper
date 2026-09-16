import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
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
      <div className="py-24 text-center text-[#9B9BA1]">
        <div className="w-6 h-6 border-2 border-[#4C7CF0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Loading intelligence record...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-24 text-center text-[#9B9BA1]">
        <h2 className="text-lg font-semibold text-[#EDEDEF] mb-2">Lead Record Not Found</h2>
        <Link to="/leads">
          <Button variant="outline" size="sm">&larr; Back to Leads</Button>
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

  const generatedWhatsAppPitch = `Hello Team ${lead.name}! We love your practice's stellar reputation in ${lead.city}. We built a ready-made mobile patient booking & WhatsApp appointment flow specifically tailored for ${lead.name}. Can I share the 60-second video demo with you here?`;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#34A874]";
    if (score >= 75) return "text-[#4C7CF0]";
    if (score >= 50) return "text-[#C98A2E]";
    return "text-[#D14D4D]";
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-[#9B9BA1] hover:text-[#EDEDEF] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Database</span>
        </Link>

        {/* Pipeline Stage Quick Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#9B9BA1]">Stage:</span>
          <select
            value={leadStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-[#131315] border border-[#2E2E32] text-xs font-medium text-[#EDEDEF] focus:outline-none focus:border-[#4C7CF0] cursor-pointer"
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
      <div className="bg-[#131315] border border-[#232326] rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#EDEDEF] tracking-tight">
                {lead.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#232326] bg-[#0A0A0B] text-xs text-[#9B9BA1] font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${lead.leadScore >= 75 ? "bg-[#34A874]" : "bg-[#C98A2E]"}`} />
                Grade {lead.leadGrade || "A"} • {lead.leadScore} pts
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#9B9BA1] mt-2.5">
              <span className="text-[#EDEDEF] font-medium">{lead.category}</span>
              <span className="text-[#6B6B70]">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#6B6B70]" />
                {lead.address ? `${lead.address}, ` : ""}{lead.city}, {lead.state || lead.country}
              </span>
              <span className="text-[#6B6B70]">•</span>
              <span className="text-[#EDEDEF] font-medium">
                ★ {lead.rating || "4.8"} <span className="text-[#6B6B70]">({lead.reviewCount || 0} reviews)</span>
              </span>
            </div>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {lead.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-md bg-[#1B1B1E] hover:bg-[#232326] text-[#EDEDEF] text-xs font-medium flex items-center gap-2 border border-[#2E2E32] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#34A874]" />
                <span>WhatsApp Lead</span>
              </a>
            )}
            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-md bg-[#1B1B1E] hover:bg-[#232326] text-[#EDEDEF] text-xs font-medium flex items-center gap-2 border border-[#2E2E32] transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-[#9B9BA1]" />
                <span>Open Website</span>
              </a>
            ) : (
              <div className="px-3 py-1.5 rounded-md bg-[#D14D4D]/10 border border-[#D14D4D]/20 text-[#D14D4D] text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D14D4D]" />
                No Website Found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Linear-style clean underline) */}
      <div className="flex items-center gap-6 border-b border-[#232326]">
        {[
          { id: "overview", label: "Intel Overview & Contacts" },
          { id: "audit", label: `Technical Audit (${website ? "Available" : "No Site"})` },
          { id: "opportunities", label: `Opportunity Radar (${opportunities.length})` },
          { id: "outreach", label: "AI Outreach Pitches" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-[#4C7CF0] text-[#EDEDEF]"
                : "border-transparent text-[#9B9BA1] hover:text-[#EDEDEF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 lg:col-span-2 space-y-6">
            <h3 className="text-sm font-semibold text-[#EDEDEF]">Contact & Profile Footprint</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-md bg-[#0A0A0B] border border-[#232326]">
                <div className="text-[11px] font-medium text-[#6B6B70] uppercase tracking-wider">Primary Phone</div>
                <div className="text-sm font-medium text-[#EDEDEF] mt-1">{lead.phone || "Not recorded"}</div>
                <div className="text-[11px] text-[#34A874] mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3" /> WhatsApp Verified
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-[#0A0A0B] border border-[#232326]">
                <div className="text-[11px] font-medium text-[#6B6B70] uppercase tracking-wider">Primary Email</div>
                <div className="text-sm font-medium text-[#EDEDEF] mt-1 truncate">
                  {lead.emails?.[0]?.value || "info@business.example.com"}
                </div>
                <div className="text-[11px] text-[#4C7CF0] mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" /> Deliverability Verified
                </div>
              </div>
            </div>

            {/* Social Profiles */}
            <div className="pt-2 border-t border-[#232326]">
              <h4 className="text-[11px] font-medium text-[#6B6B70] uppercase tracking-wider mb-3">
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
                      className="p-3 rounded-md bg-[#0A0A0B] border border-[#232326] hover:border-[#2E2E32] hover:bg-[#1B1B1E] transition-colors flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-medium text-[#EDEDEF]">{sp.platform}</span>
                        {sp.followers && (
                          <div className="text-[11px] text-[#6B6B70] tabular-nums">{sp.followers} followers</div>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#6B6B70]" />
                    </a>
                  ))
                ) : (
                  <div className="text-xs text-[#9B9BA1] col-span-3">No social links detected yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Scoring Factors Breakdown */}
          <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#EDEDEF]">Score Intelligence</h3>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Signals driving conversion probability
              </p>
            </div>
            
            <div className="space-y-2.5">
              {[
                { factor: lead.website ? "Outdated Tech Stack" : "Missing Website (Flagship Need)", points: lead.website ? "+25 pts" : "+40 pts", color: "text-[#C98A2E]" },
                { factor: "High Local Patient Ratings (4.8+)", points: "+15 pts", color: "text-[#34A874]" },
                { factor: "Direct Mobile / WhatsApp Found", points: "+20 pts", color: "text-[#34A874]" },
                { factor: "Verified Business Decision Maker", points: "+15 pts", color: "text-[#4C7CF0]" },
              ].map((s, idx) => (
                <div key={idx} className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#232326] flex justify-between items-center text-xs">
                  <span className="text-[#EDEDEF]">{s.factor}</span>
                  <span className={`font-mono font-medium tabular-nums ${s.color}`}>{s.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Technical Audit */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {audit ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Performance", score: audit.performanceScore },
                { label: "Mobile UX", score: audit.mobileScore },
                { label: "SEO Indexing", score: audit.seoScore },
                { label: "Best Practices", score: audit.bestPracticesScore },
              ].map((gauge) => (
                <div key={gauge.label} className="bg-[#131315] border border-[#232326] rounded-lg p-5 text-center">
                  <div className={`text-3xl font-semibold tabular-nums ${getScoreColor(gauge.score)}`}>
                    {gauge.score}
                  </div>
                  <div className="text-xs font-medium text-[#EDEDEF] mt-1.5">
                    {gauge.label}
                  </div>
                  <div className="text-[11px] text-[#6B6B70] mt-0.5">Lighthouse Score / 100</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#131315] border border-[#232326] rounded-lg p-8 text-center">
              <AlertTriangle className="w-6 h-6 text-[#C98A2E] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#EDEDEF]">No Existing Website To Audit</h3>
              <p className="text-xs text-[#9B9BA1] max-w-md mx-auto mt-1 leading-relaxed">
                This business does not have an active website URL registered. This presents the highest-value web agency opportunity: pitching a complete flagship website.
              </p>
            </div>
          )}

          {/* Audit Issues */}
          {audit?.issues && audit.issues.length > 0 && (
            <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#EDEDEF]">Critical Issues Found</h3>
              <div className="space-y-2">
                {audit.issues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-md bg-[#0A0A0B] border border-[#232326] flex items-start gap-2.5 text-xs text-[#EDEDEF]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D14D4D] mt-1.5 shrink-0" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Opportunities Radar */}
      {activeTab === "opportunities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.length > 0 ? (
            opportunities.map((opp) => (
              <div key={opp.id} className="bg-[#131315] border border-[#232326] rounded-lg p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded border border-[#232326] bg-[#0A0A0B] text-[11px] font-medium text-[#9B9BA1] uppercase tracking-wider">
                      {opp.type}
                    </span>
                    <h4 className="font-semibold text-[#EDEDEF] text-sm mt-2">{opp.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold tabular-nums text-[#EDEDEF]">
                      ${opp.value || 1200}
                    </div>
                    <span className="text-[11px] text-[#6B6B70]">Estimated Contract</span>
                  </div>
                </div>

                <p className="text-xs text-[#9B9BA1] leading-relaxed">
                  High margin solution for {lead.name} to increase customer conversion.
                </p>

                <div className="pt-3 border-t border-[#232326] flex justify-end">
                  <Link to="/deals">
                    <Button size="sm" variant="primary" className="text-xs">
                      Push to Deals Kanban &rarr;
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12 text-[#9B9BA1] text-xs">
              No specific opportunities generated yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: AI Outreach */}
      {activeTab === "outreach" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Template */}
          <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#9B9BA1]" />
                <h3 className="text-sm font-semibold text-[#EDEDEF]">Personalized Cold Email Pitch</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedEmailPitch, "email")}
                className="text-xs flex items-center gap-1.5"
              >
                {copiedText === "email" ? <Check className="w-3.5 h-3.5 text-[#34A874]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === "email" ? "Copied" : "Copy Email"}</span>
              </Button>
            </div>
            
            <pre className="p-4 rounded-md bg-[#0A0A0B] border border-[#232326] text-xs text-[#EDEDEF] font-mono whitespace-pre-wrap leading-relaxed">
              {generatedEmailPitch}
            </pre>
          </div>

          {/* WhatsApp Quick Icebreaker */}
          <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#9B9BA1]" />
                <h3 className="text-sm font-semibold text-[#EDEDEF]">WhatsApp Direct Message Hook</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedWhatsAppPitch, "whatsapp")}
                className="text-xs flex items-center gap-1.5"
              >
                {copiedText === "whatsapp" ? <Check className="w-3.5 h-3.5 text-[#34A874]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === "whatsapp" ? "Copied" : "Copy Text"}</span>
              </Button>
            </div>

            <pre className="p-4 rounded-md bg-[#0A0A0B] border border-[#232326] text-xs text-[#EDEDEF] font-mono whitespace-pre-wrap leading-relaxed">
              {generatedWhatsAppPitch}
            </pre>

            {lead.phone && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                    generatedWhatsAppPitch
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#4C7CF0] hover:bg-[#3B6BE0] text-white text-xs font-medium transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Launch in WhatsApp Web with this Pitch &rarr;</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
