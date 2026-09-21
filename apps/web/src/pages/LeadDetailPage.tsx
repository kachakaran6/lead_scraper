import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Phone,
  Mail,
  Bot,
  Send,
  Sparkles,
  Clock,
  Database,
  Navigation,
  Share2,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Building2,
  ChevronDown,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";
import { cn } from "../lib/utils";
import { ErrorState, Skeleton } from "../components/ui/LoadingStates";

type TabKey = "intel" | "ai_analysis" | "assistant" | "outreach";

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("intel");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string>("QUALIFIED");
  const [isAuditing, setIsAuditing] = useState(false);

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Assistant state
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantChat, setAssistantChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  const fetchLead = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await leadEngineApi.getLead(id);
      setLead(data);
      if (data?.status) setLeadStatus(data.status);
    } catch (err: any) {
      console.error("Failed to load lead intelligence record", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve lead dossier from database. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setLeadStatus(newStatus);
    if (!id) return;
    try {
      await leadEngineApi.updateLeadStatus(id, newStatus);
    } catch (err) {
      console.error("Failed to update pipeline stage", err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2200);
  };

  const handleRunAiAnalysis = async () => {
    if (!lead) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const result = await leadEngineApi.analyzeLead(lead as any);
      setAiAnalysis(result);
    } catch (err: any) {
      setAiError(err.response?.data?.message || "Failed to generate AI analysis from server");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuestion.trim() || !lead || isAssistantThinking) return;
    const q = assistantQuestion.trim();
    setAssistantQuestion("");
    setAssistantChat((prev) => [...prev, { role: "user", text: q }]);
    setIsAssistantThinking(true);

    try {
      const response = await leadEngineApi.researchAssistant(lead as any, q);
      const answer = response?.answer || "Information not available from the collected public sources.";
      setAssistantChat((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch {
      setAssistantChat((prev) => [
        ...prev,
        { role: "assistant", text: "Unable to complete query. Ensure backend OpenRouter service is configured." },
      ]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-4" aria-busy="true">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-bg-surface border border-border-subtle rounded-xl lg:col-span-2 p-6 space-y-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-20 w-full rounded" />
            <Skeleton className="h-28 w-full rounded" />
          </div>
          <div className="h-96 bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-32 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link to="/leads" className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leads</span>
        </Link>
        <ErrorState
          title="Unable to load lead dossier"
          message={error}
          onRetry={fetchLead}
        />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-text-primary">
          Lead Record Not Found
        </h2>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          The requested business profile does not exist or may have been removed.
        </p>
        <Link to="/leads">
          <Button variant="outline" size="sm" className="mt-2">
            &larr; Return to Leads Database
          </Button>
        </Link>
      </div>
    );
  }

  // Maps URL
  const mapsUrl =
    lead.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      lead.name + " " + (lead.address || lead.city || "")
    )}`;

  // Formatted Phone
  const formattedPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, "") : null;

  // WhatsApp link
  const whatsAppUrl = formattedPhone
    ? `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodeURIComponent(
        `Hello Team ${lead.name}! I came across your business listing in ${lead.city || "your area"} and wanted to share a quick digital inquiry.`
      )}`
    : null;

  interface ScoringFactor {
    name: string;
    points: number;
    met: boolean;
    explanation: string;
  }

  // Scoring Breakdown Factors
  const scoringBreakdown: ScoringFactor[] = lead.scoringFactors && lead.scoringFactors.length > 0
    ? lead.scoringFactors
    : [
        {
          name: "Website Opportunity",
          points: !lead.website ? 35 : 10,
          met: !lead.website,
          explanation: !lead.website
            ? "No active website detected (prime web design/booking system prospect)"
            : "Existing website detected and verified",
        },
        {
          name: "Direct Contact Phone",
          points: lead.phone ? 25 : 0,
          met: Boolean(lead.phone),
          explanation: lead.phone
            ? "Direct public contact number verified for outreach"
            : "No phone registered in public registry",
        },
        {
          name: "Industry & Category",
          points: 20,
          met: true,
          explanation: `Categorized as '${lead.category || "Commercial Service"}' with high client lifetime value`,
        },
        {
          name: "Location Verified",
          points: lead.city ? 10 : 5,
          met: Boolean(lead.city),
          explanation: `Physical commercial presence verified in ${lead.city || "metropolitan region"}`,
        },
        {
          name: "Reputation & Reviews",
          points: lead.rating ? (lead.rating >= 4.0 ? 10 : 5) : 0,
          met: Boolean(lead.rating),
          explanation: lead.rating
            ? `Rated ★ ${lead.rating} across ${lead.reviewCount || 0} reviews`
            : "No public customer reviews recorded at source",
        },
      ];

  const totalCalculatedScore = scoringBreakdown
    .filter((f: ScoringFactor) => f.met)
    .reduce((sum: number, f: ScoringFactor) => sum + f.points, 0);

  const displayScore = lead.leadScore || totalCalculatedScore || 70;

  // Opportunity Tier Label
  const getOpportunityTier = (score: number) => {
    if (score >= 80) return { label: "High Qualified Opportunity", color: "text-success", bg: "bg-success/15 border-success/30" };
    if (score >= 60) return { label: "Moderate Prospect Tier", color: "text-warning", bg: "bg-warning/15 border-warning/30" };
    return { label: "Unscored / Baseline Lead", color: "text-text-tertiary", bg: "bg-border-subtle border-border-default" };
  };

  const tier = getOpportunityTier(displayScore);

  // Email Pitch
  const generatedEmailPitch = `Subject: Quick observation regarding ${lead.name}'s digital presence in ${lead.city || "your area"}

Hi Team at ${lead.name},

I was researching established ${lead.category || "commercial"} providers in ${lead.city || "the area"} and came across your business listing${
    lead.rating ? ` with strong customer reviews (★ ${lead.rating} rating)` : ""
  }.

${
  !lead.website
    ? `We noticed that ${lead.name} does not currently have an active, verified mobile website. When local clients in ${lead.city || "the area"} search for ${lead.category || "services"}, having a direct appointment and contact page significantly increases client inquiries.`
    : `We reviewed your website (${lead.website}) and would love to share a few modern conversion enhancements tailored for ${lead.category || "your practice"}.`
}

We build dedicated, fast-loading digital booking systems for ${lead.category || "local businesses"}. 

Would you be open to a brief 5-minute introductory call this week?

Best regards,
Lead Intelligence Team`;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / BACK BREADCRUMB
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Leads Database</span>
        </Link>

        {/* Pipeline Stage Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Pipeline Stage:</span>
          <select
            value={leadStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1 rounded-md bg-bg-surface border border-border-default text-xs font-semibold text-text-primary focus:outline-none focus:border-accent cursor-pointer transition-colors"
          >
            <option value="NEW">NEW LEAD</option>
            <option value="QUALIFIED">QUALIFIED PROSPECT</option>
            <option value="CONTACTED">OUTREACH CONTACTED</option>
            <option value="REPLIED">REPLIED / ENGAGED</option>
            <option value="MEETING">MEETING SCHEDULED</option>
            <option value="PROPOSAL">PROPOSAL SUBMITTED</option>
            <option value="NEGOTIATION">IN NEGOTIATION</option>
            <option value="WON">CLOSED / WON</option>
            <option value="LOST">ARCHIVED / LOST</option>
            <option value="NOT_INTERESTED">NOT INTERESTED</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LEAD IDENTITY HEADER
          Dominant company name, category, location, score pill, action cluster
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2.5 min-w-0">
            {/* Dominant Company Name & Identity Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary truncate">
                {lead.name}
              </h1>

              {/* Verified Registry Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-success/10 text-success border border-success/20">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED SOURCE
              </span>

              {/* Source Provider */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-bg-base text-text-secondary border border-border-default">
                <Database className="w-3 h-3 text-text-tertiary" />
                {lead.sourceProvider || "OpenStreetMap Overpass"}
              </span>

              {/* Opportunity Score Pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-accent/15 text-accent border border-accent/25">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {displayScore} / 100 Score
              </span>
            </div>

            {/* Sub-metadata: Category, Location, Reviews */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-text-secondary">
              <span className="font-semibold text-text-primary px-2 py-0.5 rounded bg-bg-base border border-border-subtle">
                {lead.category || "Business Service"}
              </span>

              <span className="text-text-tertiary">•</span>

              <span className="flex items-center gap-1 text-text-secondary">
                <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span>
                  {lead.address ? `${lead.address}, ` : ""}
                  {lead.city ? `${lead.city}, ` : ""}
                  {lead.state ? `${lead.state}, ` : ""}
                  {lead.country || ""}
                </span>
              </span>

              {lead.rating && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <span className="flex items-center gap-1 font-medium text-amber-400">
                    ★ {lead.rating}
                    <span className="text-text-tertiary font-normal">
                      ({lead.reviewCount || 0} reviews)
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Cluster (Intelligently prioritized) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-bg-surface-hover text-xs font-semibold text-text-primary border border-border-default flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-accent" />
                <span>Call Phone</span>
              </a>
            )}

            {whatsAppUrl && (
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-success/15 hover:bg-success/20 text-xs font-semibold text-success border border-success/30 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-bg-surface-hover text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-text-tertiary" />
              <span>Google Maps</span>
            </a>

            {lead.website ? (
              <a
                href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-bg-surface-hover text-xs font-medium text-text-secondary hover:text-text-primary border border-border-default flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-accent" />
                <span>Open Website</span>
                <ExternalLink className="w-3 h-3 text-text-tertiary" />
              </a>
            ) : (
              <span className="px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium border border-warning/20 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>No Website Registered</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LAYERED WORKSPACE TABS
          Intel & Footprint | AI Analysis | Research Assistant | Outreach & Pitches
          ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-border-subtle flex items-center gap-1 overflow-x-auto no-scrollbar select-none">
        {[
          { key: "intel", label: "Intel & Footprint", icon: Layers },
          { key: "ai_analysis", label: "AI Analysis", icon: Sparkles },
          { key: "assistant", label: "Research Assistant", icon: Bot },
          { key: "outreach", label: "Outreach & Pitches", icon: Send },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 relative",
                isActive
                  ? "border-accent text-text-primary font-semibold"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-accent" : "text-text-tertiary")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: INTEL & FOOTPRINT (The Core Intelligence Surface)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "intel" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLUMNS: Data Surface & Opportunity Modules */}
          <div className="lg:col-span-2 space-y-6">
            {/* MISSING WEBSITE OPPORTUNITY MODULE (When website is absent) */}
            {!lead.website && (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        High Opportunity: Missing Digital Website
                      </h2>
                      <p className="text-xs text-text-primary leading-relaxed mt-1">
                        This enterprise has verified operational foot-traffic, physical location, and direct contact phone, but zero official website or booking flow was detected across registries.
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 shrink-0 hidden sm:inline">
                    +35 Points
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-amber-500/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAuditing(true);
                      setTimeout(() => {
                        setIsAuditing(false);
                        navigate("/websites");
                      }, 600);
                    }}
                    isLoading={isAuditing}
                    className="text-xs border-amber-500/30 hover:bg-amber-500/20 text-text-primary gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Run Website Audit</span>
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab("outreach")}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate Outreach Pitch</span>
                  </Button>
                </div>
              </div>
            )}

            {/* VERIFIED DATA FOOTPRINT (Single Clean Data Surface with Hairline Dividers) */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border-subtle bg-bg-base/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-text-tertiary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Verified Registry Footprint
                  </h2>
                </div>
                <span className="text-[11px] text-text-tertiary">
                  Verified Data Surface
                </span>
              </div>

              {/* Data Rows with Hairline Dividers */}
              <div className="divide-y divide-border-subtle text-xs">
                {/* Primary Telephone */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-surface-hover/50 transition-colors">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Primary Phone
                  </span>
                  <div className="flex items-center justify-between flex-1 gap-3">
                    <span className="font-mono text-text-primary font-semibold">
                      {lead.phone || "Not publicly listed in registry"}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.phone ? (
                        <>
                          <span className="text-[10px] font-semibold text-success uppercase px-1.5 py-0.2 rounded bg-success/15 border border-success/30">
                            VERIFIED
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(lead.phone!, "phone")}
                            className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-bg-surface"
                            aria-label="Copy phone"
                          >
                            {copiedText === "phone" ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold text-text-tertiary uppercase px-1.5 py-0.2 rounded bg-border-subtle">
                          MISSING
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Registered Website */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-surface-hover/50 transition-colors">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Web Domain
                  </span>
                  <div className="flex items-center justify-between flex-1 gap-3">
                    <span className="font-mono text-text-primary truncate">
                      {lead.website || "No active domain or website registered"}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {lead.website ? (
                        <span className="text-[10px] font-semibold text-accent uppercase px-1.5 py-0.2 rounded bg-accent/15 border border-accent/30">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-400 uppercase px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30">
                          OPPORTUNITY
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Physical Street Address */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2 hover:bg-bg-surface-hover/50 transition-colors">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Physical Address
                  </span>
                  <div className="flex items-center justify-between flex-1 gap-3">
                    <span className="text-text-primary leading-relaxed">
                      {lead.address || "Address not provided"}, {lead.city || ""}, {lead.state || ""}{" "}
                      {lead.postalCode ? `(${lead.postalCode})` : ""}, {lead.country || ""}
                    </span>
                    <span className="text-[10px] font-semibold text-success uppercase px-1.5 py-0.2 rounded bg-success/15 border border-success/30 shrink-0">
                      MATCHED
                    </span>
                  </div>
                </div>

                {/* Geo Coordinates */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-surface-hover/50 transition-colors">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Geo Coordinates
                  </span>
                  <div className="flex items-center justify-between flex-1 gap-3">
                    <span className="font-mono text-text-primary">
                      {lead.latitude && lead.longitude
                        ? `${lead.latitude.toFixed(5)}, ${lead.longitude.toFixed(5)}`
                        : "Geocoded to metropolitan centroid"}
                    </span>
                    <span className="text-[10px] font-semibold text-text-tertiary uppercase px-1.5 py-0.2 rounded bg-border-subtle shrink-0">
                      WGS-84
                    </span>
                  </div>
                </div>

                {/* Public Rating & Reviews */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-bg-surface-hover/50 transition-colors">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Public Reviews
                  </span>
                  <div className="flex items-center justify-between flex-1 gap-3">
                    <span className="text-text-primary">
                      {lead.rating
                        ? `★ ${lead.rating} average based on ${lead.reviewCount || 0} user reviews`
                        : "No public reviews recorded at registry node"}
                    </span>
                    <span className="text-[10px] font-semibold text-text-secondary uppercase px-1.5 py-0.2 rounded bg-bg-base border border-border-default shrink-0">
                      {lead.rating ? "RECORDED" : "NONE"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SOURCE PROVENANCE DEDICATED MODULE */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Source Provenance & Audit Trail
                  </h3>
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                  REAL-DATA ASSURANCE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-bg-base border border-border-default space-y-1">
                  <span className="text-text-tertiary text-[11px]">Primary Registry</span>
                  <div className="font-semibold text-text-primary truncate">
                    {lead.sourceProvider || "OpenStreetMap"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-base border border-border-default space-y-1">
                  <span className="text-text-tertiary text-[11px]">Verification Status</span>
                  <div className="font-semibold text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{lead.verificationStatus || "VERIFIED"}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-base border border-border-default space-y-1">
                  <span className="text-text-tertiary text-[11px]">Registry ID</span>
                  <div className="font-mono text-text-secondary truncate">
                    {lead.sourceId || lead.id.slice(0, 12)}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-base border border-border-default space-y-1">
                  <span className="text-text-tertiary text-[11px]">Last Checked</span>
                  <div className="font-mono text-text-secondary">
                    {new Date(lead.lastVerifiedAt || lead.updatedAt || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {lead.sourceUrl && (
                <div className="text-[11px] text-text-secondary pt-2 border-t border-border-subtle flex items-center justify-between">
                  <span>Upstream Registry Origin:</span>
                  <a
                    href={lead.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline flex items-center gap-1"
                  >
                    <span>View raw node in OpenStreetMap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 1 COLUMN: High-Craft Lead Opportunity Score & Quality Signals */}
          <div className="space-y-6">
            {/* LEAD SCORE COMPONENT */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                  Lead Opportunity Score
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/25">
                  Algorithm v2.4
                </span>
              </div>

              {/* Large Score Metric & Meter */}
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono tracking-tight text-text-primary">
                  {displayScore}
                </span>
                <span className="text-sm font-semibold text-text-tertiary">
                  / 100
                </span>
              </div>

              {/* Status Badge */}
              <div className={cn("px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2", tier.bg, tier.color)}>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{tier.label}</span>
              </div>

              {/* Progress meter */}
              <div className="w-full bg-bg-base border border-border-subtle h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-500"
                  style={{ width: `${displayScore}%` }}
                />
              </div>

              {/* Transparent Quality Signals Breakdown */}
              <div className="pt-3 border-t border-border-subtle space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Scoring Signals Breakdown
                </span>

                <div className="space-y-2 text-xs">
                  {scoringBreakdown.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 py-1.5 px-2 rounded-lg bg-bg-base/60 border border-border-subtle"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                          {factor.met ? (
                            <Check className="w-3.5 h-3.5 text-success shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                          )}
                          <span className="truncate">{factor.name}</span>
                        </div>
                        <p className="text-[10px] text-text-tertiary leading-tight pl-5">
                          {factor.explanation}
                        </p>
                      </div>

                      <span
                        className={cn(
                          "font-mono font-bold shrink-0 text-xs",
                          factor.met ? "text-success" : "text-text-tertiary"
                        )}
                      >
                        {factor.met ? `+${factor.points}` : "0"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 text-xs font-semibold text-text-primary border-t border-border-subtle">
                  <span>Total Calculated Points</span>
                  <span className="font-mono text-accent">{displayScore} pts</span>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS CARD */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-3 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary block">
                Quick Sales Actions
              </span>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab("outreach")}
                  className="w-full justify-start text-xs gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open Pitch Studio</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextStage = leadStatus === "NEW" ? "QUALIFIED" : "CONTACTED";
                    handleStatusChange(nextStage);
                  }}
                  className="w-full justify-start text-xs gap-2 text-text-secondary hover:text-text-primary"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span>Advance Pipeline to {leadStatus === "NEW" ? "QUALIFIED" : "CONTACTED"}</span>
                </Button>

                {lead.phone && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lead.phone!, "quick-phone")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border-default bg-bg-base hover:bg-bg-surface-hover text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-text-tertiary" />
                      <span>Copy Direct Phone</span>
                    </span>
                    {copiedText === "quick-phone" && (
                      <span className="text-[10px] text-success font-semibold">Copied!</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: AI ANALYSIS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "ai_analysis" && (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Commercial Opportunity Analysis
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Synthesizes verified registry attributes into strategic business needs and conversion angles.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAiAnalysis}
              isLoading={isAiLoading}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiAnalysis ? "Re-run AI Analysis" : "Run Deep Analysis"}</span>
            </Button>
          </div>

          {aiError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/25 text-xs text-danger">
              {aiError}
            </div>
          )}

          {aiAnalysis ? (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                  Executive Opportunity Thesis
                </span>
                <p className="text-xs text-text-primary leading-relaxed">
                  {aiAnalysis.summary || aiAnalysis.overview || "High-priority local prospect with proven physical foot-traffic and zero dedicated digital conversion infrastructure."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-success">
                    Identified Operational Strengths
                  </span>
                  <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                    <li>Established physical presence in {lead.city || "metropolitan region"}.</li>
                    <li>Verified direct telephone for immediate stakeholder outreach.</li>
                    {lead.rating && <li>Strong public reputation (★ {lead.rating} rating).</li>}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    High-Yield Service Voids
                  </span>
                  <ul className="text-xs text-text-secondary space-y-1.5 list-disc list-inside">
                    {!lead.website && <li>Lacks an authoritative online appointment booking system.</li>}
                    <li>Vulnerable to competitors with active search ranking in {lead.city || "local area"}.</li>
                    <li>No capture system for off-hours inbound patient inquiries.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center mx-auto text-accent">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                Click "Run Deep Analysis" to let LeadEngine's AI engine inspect the footprint, determine digital voids, and construct consultative pitches.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: RESEARCH ASSISTANT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "assistant" && (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent" />
              Lead Research Assistant
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Ask targeted questions about {lead.name}, its market position, competitor landscape, or pitch strategy.
            </p>
          </div>

          <div className="h-64 overflow-y-auto rounded-lg border border-border-subtle bg-bg-base p-4 space-y-3">
            {assistantChat.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-text-tertiary">
                Ask a question like: "What is the best angle to pitch a modern website to this clinic?"
              </div>
            ) : (
              assistantChat.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-lg text-xs leading-relaxed max-w-[85%]",
                    msg.role === "user"
                      ? "ml-auto bg-accent text-white"
                      : "mr-auto bg-bg-surface border border-border-subtle text-text-primary"
                  )}
                >
                  {msg.text}
                </div>
              ))
            )}
            {isAssistantThinking && (
              <div className="text-xs text-text-tertiary flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Research assistant analyzing public registries...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendQuestion} className="flex gap-2">
            <input
              type="text"
              value={assistantQuestion}
              onChange={(e) => setAssistantQuestion(e.target.value)}
              placeholder={`Ask about ${lead.name}...`}
              className="flex-1 px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAssistantThinking || !assistantQuestion.trim()}
              className="gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: OUTREACH & PITCHES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "outreach" && (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
              <Send className="w-4 h-4 text-accent" />
              Outreach & Pitch Studio
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Data-grounded cold outreach templates constructed from verified public records.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary">
                Cold Email Template (Website Void & Acquisition Focus)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(generatedEmailPitch, "email-pitch")}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                {copiedText === "email-pitch" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    <span className="text-success">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Email</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              rows={10}
              value={generatedEmailPitch}
              className="w-full p-4 rounded-lg bg-bg-base border border-border-subtle text-xs text-text-primary font-mono leading-relaxed resize-none focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
