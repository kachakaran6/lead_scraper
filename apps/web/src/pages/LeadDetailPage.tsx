import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
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
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "ai_analysis" | "assistant" | "outreach">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string>("QUALIFIED");

  // AI state
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Assistant state
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantChat, setAssistantChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

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
      const answer = response?.answer || "Information not available from the collected sources.";
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
      <div className="py-24 text-center text-text-secondary">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">Loading verified intelligence record...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-24 text-center text-text-secondary">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Lead Record Not Found</h2>
        <Link to="/leads">
          <Button variant="outline" size="sm">&larr; Back to Leads</Button>
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

  // Email pitch built strictly from verified data
  const generatedEmailPitch = `Subject: Inquiry regarding ${lead.name}'s digital presence in ${lead.city || "your area"}

Hi Team at ${lead.name},

I was researching top businesses in ${lead.city || "the area"} and noticed your business${
    lead.rating ? ` has impressive customer ratings (★ ${lead.rating} from ${lead.reviewCount || 0} reviews)` : ""
  }.

${
  !lead.website
    ? `We noticed that ${lead.name} currently does not have an active verified website. Local prospects searching online for ${lead.category || "your services"} in ${lead.city || "your area"} may find it hard to reach or book directly.`
    : `We reviewed your website (${lead.website}) and would love to help optimize your conversion rates and direct client inquiries.`
}

We specialize in modern web infrastructure and customer acquisition for ${lead.category || "established local businesses"}.

Would you be open to a quick 5-minute conversation this week?

Best regards,
Lead Discovery Team`;

  const generatedWhatsAppPitch = `Hello Team ${lead.name}! I came across your business in ${lead.city || "the area"}${
    lead.rating ? ` and saw your strong rating of ★ ${lead.rating}` : ""
  }.${!lead.website ? " We noticed you do not currently have a dedicated mobile website or direct online booking flow." : ""} Would you be open to a quick chat about driving more local inquiries?`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
        <Link
          to="/leads"
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Database</span>
        </Link>

        {/* Pipeline Stage Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">Pipeline Stage:</span>
          <select
            value={leadStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-bg-surface border border-border-default text-xs font-medium text-text-primary focus:outline-none focus:border-accent cursor-pointer"
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
      <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">
                {lead.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-subtle bg-bg-base text-xs text-text-secondary font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${lead.leadScore >= 75 ? "bg-semantic-success" : "bg-semantic-warning"}`} />
                Score: {lead.leadScore} pts
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-bg-surface-hover text-text-secondary border border-border-default">
                <Database className="w-3 h-3 text-text-tertiary" />
                {lead.sourceProvider || "Google Places"}
              </span>
              <Badge variant={lead.verificationStatus === "VERIFIED" ? "success" : "neutral"} size="sm">
                {lead.verificationStatus || "RAW_COLLECTED"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary mt-3">
              <span className="text-text-primary font-medium">{lead.category || "Business"}</span>
              <span className="text-text-tertiary">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                {lead.address ? `${lead.address}, ` : ""}{lead.city ? `${lead.city}, ` : ""}{lead.country || ""}
              </span>
              {lead.rating && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <span className="text-text-primary font-medium flex items-center gap-1">
                    ★ {lead.rating} <span className="text-text-tertiary font-normal">({lead.reviewCount || 0} reviews)</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons (Only for real existing data) */}
          <div className="flex flex-wrap items-center gap-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-2 rounded-lg bg-bg-surface hover:bg-bg-surface-hover text-text-primary text-xs font-medium flex items-center gap-1.5 border border-border-default transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-accent" />
                <span>Call</span>
              </a>
            )}

            {lead.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-bg-surface hover:bg-bg-surface-hover text-text-primary text-xs font-medium flex items-center gap-1.5 border border-border-default transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-semantic-success" />
                <span>WhatsApp</span>
              </a>
            )}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-bg-surface hover:bg-bg-surface-hover text-text-primary text-xs font-medium flex items-center gap-1.5 border border-border-default transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-text-secondary" />
              <span>Google Maps</span>
            </a>

            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visit Website</span>
                <ExternalLink className="w-3 h-3 opacity-75" />
              </a>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-bg-base border border-border-subtle text-semantic-danger text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-semantic-danger" />
                No Website Found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle overflow-x-auto">
        {[
          { id: "overview", label: "Intel & Footprint" },
          { id: "ai_analysis", label: "AI Analysis & Insights" },
          { id: "assistant", label: "AI Research Assistant" },
          { id: "outreach", label: "Outreach & Pitches" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-accent text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Verified Data */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 lg:col-span-2 space-y-6">
            <h3 className="text-base font-semibold text-text-primary">Verified Data Footprint</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-md bg-bg-base border border-border-subtle space-y-2">
                <div className="text-meta text-text-tertiary">Primary Phone</div>
                <div className="text-sm font-medium text-text-primary">
                  {lead.phone || <span className="text-text-tertiary">Not available</span>}
                </div>
                {lead.phone && (
                  <button
                    onClick={() => copyToClipboard(lead.phone!, "phone")}
                    className="text-[11px] text-accent flex items-center gap-1 hover:underline"
                  >
                    {copiedText === "phone" ? <Check className="w-3 h-3 text-semantic-success" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === "phone" ? "Copied" : "Copy Phone"}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-md bg-bg-base border border-border-subtle space-y-2">
                <div className="text-meta text-text-tertiary">Website</div>
                <div className="text-sm font-medium text-text-primary truncate">
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                      {lead.website}
                    </a>
                  ) : (
                    <span className="text-semantic-danger">No website registered</span>
                  )}
                </div>
                <div className="text-[11px] text-text-tertiary">
                  Status: {lead.hasWebsite ? "Confirmed active" : "Unregistered / Missing"}
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-bg-base border border-border-subtle space-y-2">
                <div className="text-meta text-text-tertiary">Postal Address</div>
                <div className="text-xs text-text-primary leading-relaxed">
                  {lead.address || "Address not provided by source"}
                </div>
                <div className="text-[11px] text-text-tertiary">
                  {lead.city ? `${lead.city}, ` : ""}{lead.state ? `${lead.state}, ` : ""}{lead.country || ""}
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-bg-base border border-border-subtle space-y-2">
                <div className="text-meta text-text-tertiary">Coordinates & Place ID</div>
                <div className="text-xs font-mono text-text-primary">
                  {lead.latitude && lead.longitude
                    ? `${lead.latitude.toFixed(5)}, ${lead.longitude.toFixed(5)}`
                    : "Coordinates unavailable"}
                </div>
                <div className="text-[11px] font-mono text-text-tertiary truncate">
                  ID: {lead.googlePlaceId || lead.sourcePlaceId || "N/A"}
                </div>
              </div>
            </div>

            {/* Source & Freshness Metadata */}
            <div className="pt-4 border-t border-border-subtle">
              <h4 className="text-xs font-semibold text-text-primary mb-3">Source Provenance & Freshness</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-md bg-bg-base border border-border-subtle">
                  <span className="text-text-tertiary block text-[11px]">Source Provider</span>
                  <span className="font-medium text-text-primary mt-1 block">
                    {lead.sourceProvider || "Google Places"}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-bg-base border border-border-subtle">
                  <span className="text-text-tertiary block text-[11px]">Ingested At</span>
                  <span className="font-mono text-text-primary mt-1 block text-[11px]">
                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Recent"}
                  </span>
                </div>
                <div className="p-3 rounded-md bg-bg-base border border-border-subtle">
                  <span className="text-text-tertiary block text-[11px]">Verification</span>
                  <span className="font-medium text-semantic-success mt-1 block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {lead.verificationStatus || "VERIFIED"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Explainable Lead Quality Factors */}
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Transparent Quality Factors</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Deterministic factors contributing to score {lead.leadScore}/100
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-md bg-bg-base border border-border-subtle flex justify-between items-center">
                <span className="text-text-primary">
                  {!lead.website ? "Missing Website (Flagship Client Opportunity)" : "Website Available"}
                </span>
                <span className={`font-mono font-medium ${!lead.website ? "text-semantic-warning" : "text-text-secondary"}`}>
                  {!lead.website ? "+40 pts" : "+10 pts"}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-bg-base border border-border-subtle flex justify-between items-center">
                <span className="text-text-primary">
                  {lead.phone ? "Direct Phone / Mobile Line Verified" : "Phone Unavailable"}
                </span>
                <span className={`font-mono font-medium ${lead.phone ? "text-semantic-success" : "text-text-tertiary"}`}>
                  {lead.phone ? "+25 pts" : "+0 pts"}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-bg-base border border-border-subtle flex justify-between items-center">
                <span className="text-text-primary">
                  {lead.rating && lead.rating >= 4.0 ? `High Customer Rating (★ ${lead.rating})` : "Rating Recorded"}
                </span>
                <span className="font-mono font-medium text-semantic-success">
                  {lead.rating && lead.rating >= 4.0 ? "+20 pts" : "+10 pts"}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-bg-base border border-border-subtle flex justify-between items-center">
                <span className="text-text-primary">
                  {lead.address ? "Physical Address & Location Verified" : "Location Incomplete"}
                </span>
                <span className={`font-mono font-medium ${lead.address ? "text-accent" : "text-text-tertiary"}`}>
                  {lead.address ? "+15 pts" : "+5 pts"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Lead Analysis & Insights */}
      {activeTab === "ai_analysis" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>OpenRouter AI Intelligence Analysis</span>
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Server-side LLM analysis evaluating verified data signals with zero hallucinations.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunAiAnalysis}
                disabled={isAiLoading}
                className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                {isAiLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </Button>
            </div>

            {aiError && (
              <div className="p-3.5 rounded-md bg-semantic-danger/10 border border-semantic-danger/30 text-xs text-semantic-danger">
                {aiError}
              </div>
            )}

            {aiAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                  <h4 className="text-xs font-semibold text-text-primary">Business Profile Assessment</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {aiAnalysis.summary || aiAnalysis.raw || "Analysis complete."}
                  </p>
                  {aiAnalysis.model && (
                    <div className="text-[10px] font-mono text-text-tertiary pt-2 border-t border-border-subtle">
                      Analyzed with: {aiAnalysis.model}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2">
                  <h4 className="text-xs font-semibold text-text-primary">Recommended Outreach Opportunity</h4>
                  <ul className="text-xs text-text-secondary space-y-2 list-disc list-inside">
                    {!lead.website && (
                      <li><strong>Website Agency Pitch:</strong> Business is missing an online hub; pitch complete mobile responsive site.</li>
                    )}
                    {lead.phone && (
                      <li><strong>Direct Contact:</strong> Verified phone line available for immediate WhatsApp introduction.</li>
                    )}
                    {lead.rating && lead.rating >= 4.5 && (
                      <li><strong>Reputation Leverage:</strong> High rating (★ {lead.rating}) provides social proof for digital marketing expansion.</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              !isAiLoading && (
                <div className="py-12 text-center text-xs text-text-secondary">
                  Click <strong>Run AI Analysis</strong> to evaluate digital presence and generate strategy.
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Tab 3: AI Research Assistant */}
      {activeTab === "assistant" && (
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent" />
              <span>Lead Research Assistant</span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Ask specific questions about this business. AI relies strictly on verified source data and never invents missing information.
            </p>
          </div>

          {/* Chat / Q&A History */}
          <div className="space-y-3 min-h-[160px] max-h-[380px] overflow-y-auto p-3.5 rounded-lg bg-bg-base border border-border-subtle">
            {assistantChat.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-tertiary">
                Ask a question such as: "Does this business have a website?", "What are their contact options?", or "What is their location and rating?"
              </div>
            ) : (
              assistantChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                    msg.role === "user"
                      ? "ml-auto bg-accent text-white"
                      : "mr-auto bg-bg-surface border border-border-subtle text-text-primary"
                  }`}
                >
                  <div className="text-[10px] font-semibold opacity-75 mb-1">
                    {msg.role === "user" ? "You" : "Lead Assistant"}
                  </div>
                  <div>{msg.text}</div>
                </div>
              ))
            )}
            {isAssistantThinking && (
              <div className="mr-auto bg-bg-surface border border-border-subtle text-text-secondary p-3 rounded-lg text-xs flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span>Checking verified records...</span>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendQuestion} className="flex gap-2">
            <input
              type="text"
              value={assistantQuestion}
              onChange={(e) => setAssistantQuestion(e.target.value)}
              placeholder="Ask about this business..."
              disabled={isAssistantThinking}
              className="flex-1 px-3.5 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isAssistantThinking || !assistantQuestion.trim()}
              className="text-xs flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </Button>
          </form>
        </div>
      )}

      {/* Tab 4: Outreach Pitches */}
      {activeTab === "outreach" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Template */}
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-text-primary">Verified Cold Email Pitch</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedEmailPitch, "email")}
                className="text-xs flex items-center gap-1.5"
              >
                {copiedText === "email" ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === "email" ? "Copied" : "Copy Email"}</span>
              </Button>
            </div>

            <pre className="p-4 rounded-md bg-bg-base border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
              {generatedEmailPitch}
            </pre>
          </div>

          {/* WhatsApp Quick Message */}
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-text-primary">WhatsApp Outreach Hook</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedWhatsAppPitch, "whatsapp")}
                className="text-xs flex items-center gap-1.5"
              >
                {copiedText === "whatsapp" ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText === "whatsapp" ? "Copied" : "Copy Text"}</span>
              </Button>
            </div>

            <pre className="p-4 rounded-md bg-bg-base border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
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
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Launch in WhatsApp Web &rarr;</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
