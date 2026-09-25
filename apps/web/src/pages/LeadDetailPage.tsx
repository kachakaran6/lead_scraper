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
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Building2,
  Layers,
  RefreshCw,
  FileCode,
  Monitor,
  Tablet,
  Smartphone,
  Download,
  Settings as SettingsIcon,
  UserCheck,
  Briefcase,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";
import { cn } from "../lib/utils";
import { ErrorState, Skeleton } from "../components/ui/LoadingStates";

type TabKey = "data" | "prompt" | "mail" | "whatsapp" | "ai";

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("data");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string>("QUALIFIED");
  const [isAuditing, setIsAuditing] = useState(false);

  // Tab: Prompt state
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptData, setPromptData] = useState<{
    promptText: string;
    suggestedTheme: {
      primaryColor: string;
      accentColor: string;
      backgroundColor: string;
      fontFamily: string;
      styleVibe: string;
    };
    suggestedSections: string[];
    sampleHtmlTemplate: string;
  } | null>(null);
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [promptViewMode, setPromptViewMode] = useState<"prompt" | "preview" | "code">("prompt");

  // Tab: Mail / SMTP state
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [selectedSmtpId, setSelectedSmtpId] = useState<string>("");
  const [selectedToEmail, setSelectedToEmail] = useState<string>("");
  const [mailSubject, setMailSubject] = useState<string>("");
  const [mailBody, setMailBody] = useState<string>("");
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [mailFeedback, setMailFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sentEmailsList, setSentEmailsList] = useState<any[]>([]);

  // Tab: WhatsApp state
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [whatsappMessage, setWhatsappMessage] = useState<string>("");
  const [isLoggingWhatsapp, setIsLoggingWhatsapp] = useState(false);
  const [whatsappFeedback, setWhatsappFeedback] = useState<string | null>(null);
  const [whatsappHistory, setWhatsappHistory] = useState<any[]>([]);

  // Tab: AI state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
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

      // Pre-fill email and phone selectors
      if (data.emails && data.emails.length > 0) {
        setSelectedToEmail(data.emails[0].value);
      }
      if (data.phone) {
        setSelectedPhone(data.phone.replace(/[^0-9+]/g, ""));
      } else if (data.phones && data.phones.length > 0) {
        setSelectedPhone(data.phones[0].value.replace(/[^0-9+]/g, ""));
      }

      // Initialize email template
      setMailSubject(`Quick observation regarding ${data.name}'s digital presence`);
      setMailBody(
        `<p>Hi Team at ${data.name},</p>
<p>I was researching established ${data.category || "commercial"} providers in ${data.city || "your area"} and came across your listing.</p>
${
  !data.website
    ? `<p>We noticed that <strong>${data.name}</strong> does not currently have an active mobile-optimized website. When local clients search for ${data.category || "your services"}, having a direct appointment scheduler and digital showcase significantly increases client inquiries.</p>`
    : `<p>We reviewed your website (${data.website}) and would love to share a few conversion enhancements tailored for ${data.category || "your practice"}.</p>`
}
<p>We build dedicated, fast-loading digital booking portals and client engagement systems. Would you be open to a brief 5-minute introductory call this week?</p>
<p>Best regards,<br/><strong>Lead Intelligence Outreach Team</strong></p>`
      );

      // Initialize WhatsApp message
      setWhatsappMessage(
        `Hello Team ${data.name}! I came across your business in ${data.city || "your area"} and wanted to share a quick inquiry regarding your online booking and digital presence.`
      );
    } catch (err: any) {
      console.error("Failed to load lead record", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve lead dossier from database. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadSmtpAccountsAndOutreach = async () => {
    try {
      const accounts = await leadEngineApi.getSmtpAccounts();
      setSmtpAccounts(accounts || []);
      const defaultAcc = accounts?.find((a: any) => a.isDefault) || accounts?.[0];
      if (defaultAcc) setSelectedSmtpId(defaultAcc.id);
    } catch (err) {
      console.warn("Notice: Failed to fetch SMTP accounts:", err);
    }

    if (id) {
      try {
        const sentRes = await leadEngineApi.getOutreachEmails({ businessId: id });
        setSentEmailsList(sentRes?.items || []);
      } catch (err) {
        console.warn("Notice: Failed to fetch sent outreach emails:", err);
      }

      try {
        const waRes = await leadEngineApi.getWhatsappMessages(id);
        setWhatsappHistory(waRes || []);
      } catch (err) {
        console.warn("Notice: Failed to fetch WhatsApp messages:", err);
      }
    }
  };

  useEffect(() => {
    fetchLead();
    loadSmtpAccountsAndOutreach();
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

  // Generate Website Prompt
  const handleGenerateWebsitePrompt = async () => {
    if (!id) return;
    setIsGeneratingPrompt(true);
    try {
      const data = await leadEngineApi.generateWebsitePrompt(id);
      setPromptData(data);
    } catch (err: any) {
      console.error("Failed to generate website prompt", err);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Send Email via SMTP
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToEmail || !mailSubject.trim() || !mailBody.trim()) {
      setMailFeedback({ type: "error", message: "Please enter a valid recipient email, subject, and message body." });
      return;
    }

    setIsSendingMail(true);
    setMailFeedback(null);
    try {
      const sentRecord = await leadEngineApi.sendOutreachEmail({
        smtpAccountId: selectedSmtpId || undefined,
        businessId: id,
        toEmail: selectedToEmail,
        subject: mailSubject,
        body: mailBody,
      });

      setMailFeedback({
        type: "success",
        message: `Email successfully dispatched to ${selectedToEmail} via SMTP!`,
      });
      setSentEmailsList((prev) => [sentRecord, ...prev]);
      setLeadStatus("CONTACTED");
    } catch (err: any) {
      setMailFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to send email. Please check your SMTP settings.",
      });
    } finally {
      setIsSendingMail(false);
    }
  };

  // Log WhatsApp Message
  const handleLogWhatsAppMessage = async () => {
    if (!selectedPhone || !whatsappMessage.trim()) return;
    setIsLoggingWhatsapp(true);
    setWhatsappFeedback(null);
    try {
      const res = await leadEngineApi.sendWhatsappMessage({
        businessId: id,
        toPhone: selectedPhone,
        message: whatsappMessage,
      });
      setWhatsappHistory((prev) => [res.message, ...prev]);
      setWhatsappFeedback("WhatsApp outreach recorded in lead timeline!");
      setLeadStatus("CONTACTED");
      setTimeout(() => setWhatsappFeedback(null), 3000);
    } catch (err: any) {
      console.error("Failed to log WhatsApp outreach", err);
    } finally {
      setIsLoggingWhatsapp(false);
    }
  };

  // Run AI Analysis
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

  // Assistant Question
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
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-bg-surface border border-border-subtle rounded-xl lg:col-span-2 p-6" />
          <div className="h-96 bg-bg-surface border border-border-subtle rounded-xl p-6" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <Link to="/leads" className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leads</span>
        </Link>
        <ErrorState
          title="Lead Record Not Available"
          message={error || "The requested business profile does not exist or may have been removed."}
          onRetry={fetchLead}
        />
      </div>
    );
  }

  // Maps URL & Phone Formats
  const mapsUrl =
    lead.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      lead.name + " " + (lead.address || lead.city || "")
    )}`;

  const formattedPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, "") : null;
  const whatsAppDirectUrl = formattedPhone
    ? `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const displayScore = lead.leadScore || 75;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / PIPELINE STATUS
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
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary truncate">
                {lead.name}
              </h1>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-success/10 text-success border border-success/20">
                <ShieldCheck className="w-3 h-3" />
                VERIFIED SOURCE
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-accent/15 text-accent border border-accent/25">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {displayScore} / 100 Score
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-text-secondary">
              <span className="font-semibold text-text-primary px-2 py-0.5 rounded bg-bg-base border border-border-subtle">
                {lead.category || "Business Service"}
              </span>
              <span className="text-text-tertiary">•</span>
              <span className="flex items-center gap-1 text-text-secondary">
                <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                <span>
                  {[lead.address, lead.city, lead.state, lead.country].filter(Boolean).join(", ")}
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

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 rounded-lg bg-bg-base hover:bg-bg-surface-hover text-xs font-semibold text-text-primary border border-border-default flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-accent" />
                <span>Call Phone</span>
              </a>
            )}

            <button
              onClick={() => setActiveTab("mail")}
              className="px-3 py-1.5 rounded-lg bg-accent/15 hover:bg-accent/20 text-xs font-semibold text-accent border border-accent/30 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Lead</span>
            </button>

            <button
              onClick={() => setActiveTab("whatsapp")}
              className="px-3 py-1.5 rounded-lg bg-success/15 hover:bg-success/20 text-xs font-semibold text-success border border-success/30 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("prompt");
                if (!promptData) handleGenerateWebsitePrompt();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/20 text-xs font-semibold text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Website Prompt</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. 5-TAB ARCHITECTURE BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="border-b border-border-subtle flex items-center gap-1 overflow-x-auto no-scrollbar select-none">
        {[
          { key: "data", label: "📊 Data Intel", icon: Layers },
          { key: "prompt", label: "✨ Template Prompt", icon: FileCode },
          { key: "mail", label: "📧 Mail (SMTP)", icon: Mail },
          { key: "whatsapp", label: "💬 WhatsApp", icon: MessageSquare },
          { key: "ai", label: "🤖 AI Analysis", icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabKey);
                if (tab.key === "prompt" && !promptData) {
                  handleGenerateWebsitePrompt();
                }
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all shrink-0 relative",
                isActive
                  ? "border-accent text-text-primary font-semibold"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-default"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-accent" : "text-text-tertiary")} />
              <span>{tab.label}</span>
              {tab.key === "mail" && sentEmailsList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-accent/20 text-accent font-bold">
                  {sentEmailsList.length}
                </span>
              )}
              {tab.key === "whatsapp" && whatsappHistory.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-success/20 text-success font-bold">
                  {whatsappHistory.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DATA (Full Structured Intel Card)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "data" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Missing website banner if absent */}
            {!lead.website && (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        High Yield: Missing Business Website
                      </h2>
                      <p className="text-xs text-text-primary leading-relaxed mt-1">
                        Zero active website detected. This enterprise is losing high-intent local clients to competitors with digital booking.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setActiveTab("prompt");
                      if (!promptData) handleGenerateWebsitePrompt();
                    }}
                    className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
                  >
                    Generate Website Prompt &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* Verified Footprint Rows */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-border-subtle bg-bg-base/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-text-tertiary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Verified Digital Footprint
                  </h2>
                </div>
                <span className="text-[11px] text-text-tertiary font-mono">
                  ID: {lead.id.slice(0, 8)}...
                </span>
              </div>

              <div className="divide-y divide-border-subtle text-xs">
                {/* Emails list */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Verified Emails
                  </span>
                  <div className="flex-1 space-y-2">
                    {lead.emails && lead.emails.length > 0 ? (
                      lead.emails.map((e) => (
                        <div key={e.id} className="flex items-center justify-between gap-2 p-2 rounded bg-bg-base border border-border-subtle">
                          <span className="font-mono text-text-primary">{e.value}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-success/15 text-success border border-success/30">
                              {e.status}
                            </span>
                            <button
                              onClick={() => copyToClipboard(e.value, `email-${e.id}`)}
                              className="p-1 rounded text-text-tertiary hover:text-text-primary"
                            >
                              {copiedText === `email-${e.id}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-text-tertiary">No email addresses found in public registry</span>
                    )}
                  </div>
                </div>

                {/* Phones list */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <span className="text-text-secondary font-medium w-40 shrink-0">
                    Verified Phones
                  </span>
                  <div className="flex-1 space-y-2">
                    {lead.phones && lead.phones.length > 0 ? (
                      lead.phones.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 p-2 rounded bg-bg-base border border-border-subtle">
                          <span className="font-mono text-text-primary">{p.value}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-accent/15 text-accent border border-accent/30">
                              {p.type || "PHONE"}
                            </span>
                            <button
                              onClick={() => copyToClipboard(p.value, `phone-${p.id}`)}
                              className="p-1 rounded text-text-tertiary hover:text-text-primary"
                            >
                              {copiedText === `phone-${p.id}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : lead.phone ? (
                      <div className="flex items-center justify-between p-2 rounded bg-bg-base border border-border-subtle">
                        <span className="font-mono text-text-primary">{lead.phone}</span>
                        <button
                          onClick={() => copyToClipboard(lead.phone!, "phone-main")}
                          className="p-1 rounded text-text-tertiary hover:text-text-primary"
                        >
                          {copiedText === "phone-main" ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-text-tertiary">No telephone registered in registry</span>
                    )}
                  </div>
                </div>

                {/* Website & Tech */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-text-secondary font-medium w-40 shrink-0">Official Website</span>
                  <div className="flex items-center justify-between flex-1">
                    {lead.website ? (
                      <a
                        href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent hover:underline flex items-center gap-1 font-mono"
                      >
                        {lead.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-amber-400 font-semibold">No Website Registered</span>
                    )}
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <span className="text-text-secondary font-medium w-40 shrink-0">Social Media</span>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {lead.socialProfiles && lead.socialProfiles.length > 0 ? (
                      lead.socialProfiles.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-bg-base hover:bg-bg-surface-hover border border-border-default text-text-primary flex items-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3 h-3 text-accent" />
                          <span>{s.platform}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-text-tertiary" />
                        </a>
                      ))
                    ) : (
                      <span className="text-text-tertiary">No public social handles indexed</span>
                    )}
                  </div>
                </div>

                {/* Key Contacts */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <span className="text-text-secondary font-medium w-40 shrink-0">Key Contacts</span>
                  <div className="flex-1 space-y-2">
                    {lead.contacts && lead.contacts.length > 0 ? (
                      lead.contacts.map((c) => (
                        <div key={c.id} className="p-2 rounded bg-bg-base border border-border-subtle flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-accent" />
                            <span className="font-semibold text-text-primary">
                              {c.firstName} {c.lastName || ""}
                            </span>
                            {c.title && <span className="text-text-tertiary">({c.title})</span>}
                          </div>
                          {c.isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-accent/20 text-accent">
                              PRIMARY
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-text-tertiary">No verified individual contacts indexed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Opportunities Detected */}
            {lead.opportunities && lead.opportunities.length > 0 && (
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  Identified High-Yield Opportunities ({lead.opportunities.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lead.opportunities.map((opp) => (
                    <div key={opp.id} className="p-3 rounded-lg bg-bg-base border border-border-subtle space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-text-primary">{opp.title}</span>
                        <span className="text-[10px] font-semibold text-accent px-1.5 py-0.2 rounded bg-accent/15">
                          {opp.type}
                        </span>
                      </div>
                      {opp.description && (
                        <p className="text-[11px] text-text-secondary leading-snug">{opp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Mini Sidebar / Stats */}
          <div className="space-y-6">
            {/* Quick Actions Panel */}
            <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Outreach Launcher
              </h2>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActiveTab("prompt");
                    if (!promptData) handleGenerateWebsitePrompt();
                  }}
                  className="w-full justify-start text-xs gap-2"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Generate Website Pitch Prompt</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("mail")}
                  className="w-full justify-start text-xs gap-2 text-text-primary"
                >
                  <Mail className="w-3.5 h-3.5 text-accent" />
                  <span>Compose SMTP Email</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("whatsapp")}
                  className="w-full justify-start text-xs gap-2 text-success hover:bg-success/10 border-success/30"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Launch WhatsApp Direct</span>
                </Button>
              </div>
            </div>

            {/* Audit Scorecard if available */}
            {lead.websiteAudits && lead.websiteAudits.length > 0 && (
              <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  Website Audit Scores
                </h2>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-bg-base border border-border-subtle">
                    <div className="text-lg font-bold font-mono text-accent">
                      {lead.websiteAudits[0].performanceScore}/100
                    </div>
                    <div className="text-[10px] text-text-tertiary uppercase mt-1">Performance</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-base border border-border-subtle">
                    <div className="text-lg font-bold font-mono text-success">
                      {lead.websiteAudits[0].seoScore}/100
                    </div>
                    <div className="text-[10px] text-text-tertiary uppercase mt-1">SEO Health</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-base border border-border-subtle">
                    <div className="text-lg font-bold font-mono text-amber-400">
                      {lead.websiteAudits[0].mobileScore}/100
                    </div>
                    <div className="text-[10px] text-text-tertiary uppercase mt-1">Mobile Fit</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-base border border-border-subtle">
                    <div className="text-lg font-bold font-mono text-purple-400">
                      {lead.websiteAudits[0].accessibilityScore}/100
                    </div>
                    <div className="text-[10px] text-text-tertiary uppercase mt-1">Accessibility</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PROMPT (Website Template Prompt Generator)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "prompt" && (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                AI Website Brief & Full HTML Template Generator
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Generates a bespoke, copy-to-use AI engineering prompt and complete HTML/CSS/JS template tailored for {lead.name}.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateWebsitePrompt}
              isLoading={isGeneratingPrompt}
              className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{promptData ? "Regenerate Template" : "Generate Website Brief"}</span>
            </Button>
          </div>

          {promptData ? (
            <div className="space-y-6">
              {/* Brand theme summary pills */}
              <div className="p-4 rounded-xl bg-bg-base border border-border-subtle flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-text-secondary">Detected Brand Theme:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-xs">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: promptData.suggestedTheme.primaryColor }}
                    />
                    <span className="font-mono text-text-primary">{promptData.suggestedTheme.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-xs">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: promptData.suggestedTheme.accentColor }}
                    />
                    <span className="font-mono text-text-primary">{promptData.suggestedTheme.accentColor}</span>
                  </div>
                  <span className="text-xs text-text-tertiary">
                    Style: <strong className="text-text-primary">{promptData.suggestedTheme.styleVibe}</strong>
                  </span>
                </div>

                {/* Sub-view switcher */}
                <div className="flex items-center gap-1 bg-bg-surface border border-border-default rounded-lg p-1">
                  <button
                    onClick={() => setPromptViewMode("prompt")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition",
                      promptViewMode === "prompt"
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    AI Prompt
                  </button>
                  <button
                    onClick={() => setPromptViewMode("preview")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition flex items-center gap-1",
                      promptViewMode === "preview"
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Live Preview</span>
                  </button>
                  <button
                    onClick={() => setPromptViewMode("code")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-medium transition",
                      promptViewMode === "code"
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    HTML Code
                  </button>
                </div>
              </div>

              {/* Sub-view: AI Engineering Prompt */}
              {promptViewMode === "prompt" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                      Ready-to-Use Prompt (Copy & paste into Claude 3.7, Cursor, v0, or ChatGPT)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(promptData.promptText, "prompt-copy")}
                      className="text-xs gap-1.5"
                    >
                      {copiedText === "prompt-copy" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-success" />
                          <span className="text-success">Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-accent" />
                          <span>Copy Prompt</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    rows={16}
                    value={promptData.promptText}
                    className="w-full p-4 rounded-xl bg-bg-base border border-border-subtle text-xs text-text-primary font-mono leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              )}

              {/* Sub-view: Live Responsive HTML Preview */}
              {promptViewMode === "preview" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-bg-base p-2 rounded-lg border border-border-subtle">
                    <span className="text-xs font-medium text-text-secondary">Interactive Viewport:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewViewport("desktop")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs flex items-center gap-1",
                          previewViewport === "desktop" ? "bg-accent text-white" : "text-text-secondary"
                        )}
                      >
                        <Monitor className="w-3 h-3" /> Desktop (100%)
                      </button>
                      <button
                        onClick={() => setPreviewViewport("tablet")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs flex items-center gap-1",
                          previewViewport === "tablet" ? "bg-accent text-white" : "text-text-secondary"
                        )}
                      >
                        <Tablet className="w-3 h-3" /> Tablet (768px)
                      </button>
                      <button
                        onClick={() => setPreviewViewport("mobile")}
                        className={cn(
                          "px-2.5 py-1 rounded text-xs flex items-center gap-1",
                          previewViewport === "mobile" ? "bg-accent text-white" : "text-text-secondary"
                        )}
                      >
                        <Smartphone className="w-3 h-3" /> Mobile (375px)
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-center bg-black/40 p-4 rounded-xl border border-border-subtle overflow-hidden">
                    <iframe
                      title="Website Preview"
                      srcDoc={promptData.sampleHtmlTemplate}
                      style={{
                        width:
                          previewViewport === "desktop"
                            ? "100%"
                            : previewViewport === "tablet"
                            ? "768px"
                            : "375px",
                        height: "620px",
                        border: "none",
                        borderRadius: "12px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Sub-view: Standalone HTML Code */}
              {promptViewMode === "code" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                      Standalone HTML5 + Tailwind CSS Template
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(promptData.sampleHtmlTemplate, "code-copy")}
                        className="text-xs gap-1.5"
                      >
                        {copiedText === "code-copy" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-success" />
                            <span className="text-success">Code Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy HTML</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const blob = new Blob([promptData.sampleHtmlTemplate], { type: "text/html" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${lead.name.replace(/[^a-zA-Z0-9]/g, "_")}_website.html`;
                          a.click();
                        }}
                        className="text-xs gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download HTML</span>
                      </Button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    rows={16}
                    value={promptData.sampleHtmlTemplate}
                    className="w-full p-4 rounded-xl bg-bg-base border border-border-subtle text-xs text-text-primary font-mono leading-relaxed resize-none focus:outline-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto text-indigo-400">
                <FileCode className="w-6 h-6" />
              </div>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Generate a full AI prompt that creates a high-converting website with Tailwind CSS, booking forms, and WhatsApp widgets for {lead.name}.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateWebsitePrompt}
                isLoading={isGeneratingPrompt}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Template Prompt</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: MAIL (Compose & Send via SMTP + History)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "mail" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Mail Composer */}
          <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent" />
                  Compose Outreach Email
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Sends directly from your connected SMTP account with open & click tracking pixel.
                </p>
              </div>

              <Link
                to="/settings"
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>Manage SMTP</span>
              </Link>
            </div>

            {mailFeedback && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs flex items-center gap-2",
                  mailFeedback.type === "success"
                    ? "bg-success/15 border border-success/30 text-success"
                    : "bg-danger/15 border border-danger/30 text-danger"
                )}
              >
                {mailFeedback.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                <span>{mailFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* From Selector */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  From (Outgoing SMTP Account):
                </label>
                {smtpAccounts.length > 0 ? (
                  <select
                    value={selectedSmtpId}
                    onChange={(e) => setSelectedSmtpId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent"
                  >
                    {smtpAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.username}) {acc.isDefault ? "— Default" : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-center justify-between">
                    <span>No SMTP accounts connected yet.</span>
                    <Link to="/settings" className="underline font-bold">
                      Add SMTP in Settings &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* To Selector */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  To (Recipient Lead Email):
                </label>
                {lead.emails && lead.emails.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {lead.emails.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedToEmail(e.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-mono border transition",
                          selectedToEmail === e.value
                            ? "bg-accent/15 border-accent text-accent font-bold"
                            : "bg-bg-base border-border-default text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {e.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="email"
                    value={selectedToEmail}
                    onChange={(e) => setSelectedToEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Subject Line:
                </label>
                <input
                  type="text"
                  required
                  value={mailSubject}
                  onChange={(e) => setMailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  HTML Message Body:
                </label>
                <textarea
                  required
                  rows={8}
                  value={mailBody}
                  onChange={(e) => setMailBody(e.target.value)}
                  className="w-full p-3 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary font-mono leading-relaxed resize-none focus:outline-none focus:border-accent"
                />
                <span className="text-[11px] text-text-tertiary">
                  * Automatic 1x1 tracking pixel and click redirects will be embedded automatically.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSendingMail}
                disabled={smtpAccounts.length === 0}
                className="w-full gap-2 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Email to {selectedToEmail || "Lead"}</span>
              </Button>
            </form>
          </div>

          {/* Right Column: Sent History for This Lead */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center justify-between">
              <span>Email History ({sentEmailsList.length})</span>
              <button
                onClick={loadSmtpAccountsAndOutreach}
                className="text-text-tertiary hover:text-text-primary"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </h2>

            {sentEmailsList.length > 0 ? (
              <div className="space-y-3">
                {sentEmailsList.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-bg-base border border-border-subtle space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-primary truncate max-w-[150px]">
                        {item.subject}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.2 rounded border",
                          item.status === "OPENED"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : item.status === "CLICKED"
                            ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                            : item.status === "FAILED"
                            ? "bg-danger/15 text-danger border-danger/30"
                            : "bg-accent/15 text-accent border-accent/30"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-text-tertiary flex items-center justify-between">
                      <span>To: {item.toEmail}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    {item.openedAt && (
                      <div className="text-[10px] text-emerald-400">
                        ✓ Opened on {new Date(item.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-tertiary">
                No emails sent to this lead yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: WHATSAPP (Direct Chat & Log)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-success" />
                  WhatsApp Direct Outreach
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  Launch one-click chat via WhatsApp Web or app with pre-filled pitch copy.
                </p>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success/15 text-success border border-success/30">
                Phase 3A Active
              </span>
            </div>

            {whatsappFeedback && (
              <div className="p-3 rounded-lg text-xs bg-success/15 border border-success/30 text-success flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{whatsappFeedback}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Phone Selector */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Target WhatsApp Phone:
                </label>
                {lead.phones && lead.phones.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {lead.phones.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPhone(p.value.replace(/[^0-9+]/g, ""))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-mono border transition",
                          selectedPhone === p.value.replace(/[^0-9+]/g, "")
                            ? "bg-success/15 border-success text-success font-bold"
                            : "bg-bg-base border-border-default text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {p.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-success"
                  />
                )}
              </div>

              {/* Message Composer */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Prefilled WhatsApp Message:
                </label>
                <textarea
                  rows={5}
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full p-3 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary font-mono leading-relaxed resize-none focus:outline-none focus:border-success"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {whatsAppDirectUrl ? (
                  <a
                    href={whatsAppDirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleLogWhatsAppMessage}
                    className="px-4 py-2.5 rounded-lg bg-success hover:bg-success/90 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp & Log Outreach</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Button disabled variant="outline" size="sm" className="text-xs">
                    No Phone Available
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogWhatsAppMessage}
                  isLoading={isLoggingWhatsapp}
                  className="text-xs border-border-default text-text-secondary hover:text-text-primary"
                >
                  Log Sent Message Manually
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: WhatsApp History */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center justify-between">
              <span>WhatsApp Log ({whatsappHistory.length})</span>
              <button
                onClick={loadSmtpAccountsAndOutreach}
                className="text-text-tertiary hover:text-text-primary"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </h2>

            {whatsappHistory.length > 0 ? (
              <div className="space-y-3">
                {whatsappHistory.map((msg) => (
                  <div key={msg.id} className="p-3 rounded-lg bg-bg-base border border-border-subtle space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-text-primary font-bold">
                        {msg.toPhone}
                      </span>
                      <span className="text-[10px] text-success font-semibold px-1.5 py-0.2 rounded bg-success/15 border border-success/30">
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug line-clamp-2">
                      {msg.message}
                    </p>
                    <div className="text-[10px] text-text-tertiary">
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-tertiary">
                No WhatsApp conversations logged yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: AI ANALYSIS & RESEARCH ASSISTANT
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "ai" && (
        <div className="space-y-6">
          {/* Executive AI Analysis */}
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
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center mx-auto text-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Click "Run Deep Analysis" to let LeadEngine's AI engine inspect the footprint, determine digital voids, and construct consultative pitches.
                </p>
              </div>
            )}
          </div>

          {/* Research Assistant Chat */}
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
        </div>
      )}
    </div>
  );
};
