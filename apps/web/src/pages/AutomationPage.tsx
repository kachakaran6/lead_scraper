import React, { useEffect, useState } from "react";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  Search,
  Mail,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Users,
  Send,
  Eye,
  MousePointer,
  RefreshCw,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { leadEngineApi } from "../lib/api";
import { cn } from "../lib/utils";

interface SequenceStep {
  stepIndex: number;
  channel: string;
  customSubject?: string;
  customBody?: string;
  delayDays: number;
  delayHours: number;
  condition?: string;
}

export const AutomationPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaignAnalytics, setSelectedCampaignAnalytics] = useState<any | null>(null);
  const [selectedCampaignRuns, setSelectedCampaignRuns] = useState<any[]>([]);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // New Campaign Form State
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuery, setFormQuery] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDailyTarget, setFormDailyTarget] = useState(15);
  const [formSendWindowStart, setFormSendWindowStart] = useState("09:00");
  const [formSendWindowEnd, setFormSendWindowEnd] = useState("18:00");
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [formSequences, setFormSequences] = useState<SequenceStep[]>([
    {
      stepIndex: 0,
      channel: "EMAIL",
      customSubject: "Quick observation regarding {{businessName}}'s digital presence in {{city}}",
      customBody:
        "<p>Hi Team at {{businessName}},</p><p>I was researching established {{category}} providers in {{city}} and noticed an opportunity to enhance your mobile booking flow and online client inquiries.</p><p>We build dedicated, high-converting digital portals for local businesses. Would you be open to a 5-minute introduction this week?</p><p>Best regards,<br/>Outreach Team</p>",
      delayDays: 0,
      delayHours: 0,
      condition: "ALWAYS",
    },
    {
      stepIndex: 1,
      channel: "EMAIL",
      customSubject: "Follow-up: Client booking portal for {{businessName}}",
      customBody:
        "<p>Hi again {{businessName}} team,</p><p>Following up on my previous note. We've helped similar {{category}} practices in {{city}} increase inbound appointments by 40% with automated booking and WhatsApp widgets.</p><p>Let me know if you'd like to see a live 2-minute demonstration.</p>",
      delayDays: 2,
      delayHours: 0,
      condition: "NOT_OPENED",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await leadEngineApi.getAutomations();
      setCampaigns(data || []);
    } catch (err) {
      console.error("Failed to load automations", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === "ACTIVE") {
        await leadEngineApi.pauseAutomation(id);
      } else {
        await leadEngineApi.startAutomation(id);
      }
      await fetchCampaigns();
    } catch (err: any) {
      console.error("Failed to toggle automation status", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this automation campaign?")) return;
    try {
      await leadEngineApi.deleteAutomation(id);
      await fetchCampaigns();
    } catch (err) {
      console.error("Failed to delete automation", err);
    }
  };

  const handleOpenAnalytics = async (campaign: any) => {
    setIsLoadingDetails(true);
    setIsAnalyticsModalOpen(true);
    try {
      const [analytics, runs] = await Promise.all([
        leadEngineApi.getAutomationAnalytics(campaign.id).catch(() => null),
        leadEngineApi.getAutomationRuns(campaign.id).catch(() => []),
      ]);
      setSelectedCampaignAnalytics(analytics || campaign);
      setSelectedCampaignRuns(runs || []);
    } catch (err) {
      console.error("Failed to load analytics details", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuery.trim()) {
      setFeedback({ type: "error", message: "Please provide a campaign name and lead search query." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await leadEngineApi.createAutomation({
        name: formName,
        description: formDescription || undefined,
        searchQuery: formQuery,
        location: formLocation || undefined,
        dailyLeadTarget: Number(formDailyTarget) || 15,
        sendWindowStart: formSendWindowStart,
        sendWindowEnd: formSendWindowEnd,
        daysOfWeek: formDaysOfWeek,
        sequences: formSequences,
      });

      setFeedback({ type: "success", message: "Automation campaign created successfully!" });
      setIsCreateModalOpen(false);
      // Reset form
      setFormName("");
      setFormDescription("");
      setFormQuery("");
      setFormLocation("");
      await fetchCampaigns();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to create automation campaign.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSequenceStep = () => {
    setFormSequences([
      ...formSequences,
      {
        stepIndex: formSequences.length,
        channel: "EMAIL",
        customSubject: "Checking back regarding {{businessName}}",
        customBody: "<p>Hi {{businessName}} team, just floating this to the top of your inbox.</p>",
        delayDays: 3,
        delayHours: 0,
        condition: "NOT_OPENED",
      },
    ]);
  };

  const removeSequenceStep = (index: number) => {
    if (formSequences.length <= 1) return;
    const updated = formSequences.filter((_, i) => i !== index).map((s, idx) => ({ ...s, stepIndex: idx }));
    setFormSequences(updated);
  };

  // Aggregated Header KPIs
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE").length;
  const totalDiscovered = campaigns.reduce((acc, c) => acc + (c.leadsDiscovered || 0), 0);
  const totalSent = campaigns.reduce((acc, c) => acc + (c.emailsSent || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.emailsOpened || 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (c.emailsClicked || 0), 0);
  const overallOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const overallClickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Automations & Outreach Engine"
        description="Set daily lead discovery targets, configure multi-step cold outreach sequences, and automate verified conversions."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Automation</span>
          </Button>
        </div>
      </PageHeader>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[11px] uppercase font-bold tracking-wider">Active Campaigns</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">{activeCount}</div>
          <div className="text-[10px] text-text-tertiary">Out of {campaigns.length} total</div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[11px] uppercase font-bold tracking-wider">Leads Discovered</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">{totalDiscovered}</div>
          <div className="text-[10px] text-text-tertiary">Populated into pipelines</div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[11px] uppercase font-bold tracking-wider">Outreach Dispatched</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-text-primary">{totalSent}</div>
          <div className="text-[10px] text-text-tertiary">Emails delivered via SMTP</div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[11px] uppercase font-bold tracking-wider">Open Rate</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{overallOpenRate}%</div>
          <div className="text-[10px] text-text-tertiary">{totalOpened} total opens tracked</div>
        </div>

        <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-text-tertiary">
            <span className="text-[11px] uppercase font-bold tracking-wider">Click Through</span>
            <MousePointer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">{overallClickRate}%</div>
          <div className="text-[10px] text-text-tertiary">{totalClicked} total clicks recorded</div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Automated Campaigns ({campaigns.length})</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-text-tertiary">Loading automation pipelines...</div>
        ) : campaigns.length === 0 ? (
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">No Automations Created Yet</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto mt-1">
                Automations continuously discover fresh local leads matching your niche and send high-converting multi-step email sequences on autopilot.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Automation</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => {
              const isActive = camp.status === "ACTIVE";
              return (
                <div
                  key={camp.id}
                  className="bg-bg-surface border border-border-subtle hover:border-border-default rounded-xl p-5 space-y-4 flex flex-col justify-between transition shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-sm text-text-primary leading-tight">{camp.name}</h3>
                        {camp.description && (
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">{camp.description}</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0",
                          isActive
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : camp.status === "PAUSED"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-border-subtle text-text-tertiary border-border-default"
                        )}
                      >
                        {camp.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                      <span className="flex items-center gap-1 font-semibold text-text-primary">
                        <Search className="w-3 h-3 text-text-tertiary" />
                        <span>{camp.searchQuery}</span>
                      </span>
                      {camp.location && (
                        <>
                          <span className="text-text-tertiary">•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-text-tertiary" />
                            <span>{camp.location}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Sequence Steps Pills */}
                    <div className="text-[11px] text-text-tertiary flex items-center gap-1.5 pt-1 border-t border-border-subtle">
                      <Clock className="w-3 h-3" />
                      <span>
                        {camp.sequences?.length || 1} Sequence Steps • {camp.sendWindowStart}-{camp.sendWindowEnd} UTC
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                      <div className="p-2 rounded bg-bg-base border border-border-subtle">
                        <div className="text-xs font-mono font-bold text-text-primary">{camp.leadsDiscovered || 0}</div>
                        <div className="text-[9px] text-text-tertiary uppercase mt-0.5">Leads</div>
                      </div>
                      <div className="p-2 rounded bg-bg-base border border-border-subtle">
                        <div className="text-xs font-mono font-bold text-indigo-400">{camp.emailsSent || 0}</div>
                        <div className="text-[9px] text-text-tertiary uppercase mt-0.5">Sent</div>
                      </div>
                      <div className="p-2 rounded bg-bg-base border border-border-subtle">
                        <div className="text-xs font-mono font-bold text-emerald-400">{camp.emailsOpened || 0}</div>
                        <div className="text-[9px] text-text-tertiary uppercase mt-0.5">Opened</div>
                      </div>
                      <div className="p-2 rounded bg-bg-base border border-border-subtle">
                        <div className="text-xs font-mono font-bold text-purple-400">{camp.emailsClicked || 0}</div>
                        <div className="text-[9px] text-text-tertiary uppercase mt-0.5">Clicked</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                    <Button
                      variant={isActive ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleToggleStatus(camp.id, camp.status)}
                      className={cn(
                        "text-xs gap-1.5 flex-1",
                        !isActive && "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      )}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAnalytics(camp)}
                      className="text-xs gap-1"
                    >
                      <BarChart3 className="w-3 h-3 text-accent" />
                      <span>Analytics</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(camp.id)}
                      className="text-xs text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CREATE AUTOMATION WIZARD MODAL
          ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Automated Outreach Campaign"
        subtitle="Configure daily discovery and automated multi-step sequences"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateCampaign} className="space-y-6 text-xs">
          {/* Step 1: Target Definition */}
          <div className="space-y-3 p-4 rounded-xl bg-bg-base border border-border-subtle">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>1. Discovery Parameters</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Campaign Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Austin Dental Practices"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">Target Niche / Search Query</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Dentist, Dental Clinic, Orthodontist"
                  value={formQuery}
                  onChange={(e) => setFormQuery(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">Location Target</label>
                <Input
                  type="text"
                  placeholder="e.g. Austin, TX or London, UK"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">Daily Discovered Lead Cap</label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formDailyTarget}
                  onChange={(e) => setFormDailyTarget(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Schedule & Send Window */}
          <div className="space-y-3 p-4 rounded-xl bg-bg-base border border-border-subtle">
            <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>2. Delivery Window (UTC)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-text-secondary font-medium mb-1">Window Start (HH:MM)</label>
                <Input
                  type="text"
                  placeholder="09:00"
                  value={formSendWindowStart}
                  onChange={(e) => setFormSendWindowStart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-text-secondary font-medium mb-1">Window End (HH:MM)</label>
                <Input
                  type="text"
                  placeholder="18:00"
                  value={formSendWindowEnd}
                  onChange={(e) => setFormSendWindowEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Multi-Step Sequences */}
          <div className="space-y-3 p-4 rounded-xl bg-bg-base border border-border-subtle">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>3. Multi-Step Sequence Pipeline ({formSequences.length} Steps)</span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSequenceStep}
                className="text-[11px] gap-1 h-7"
              >
                <Plus className="w-3 h-3" />
                <span>Add Follow-Up Step</span>
              </Button>
            </div>

            <div className="space-y-4">
              {formSequences.map((step, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-bg-surface border border-border-default space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary text-xs">
                      Step #{idx + 1} {idx === 0 ? "— Immediate Initial Outreach" : `— Follow-up (+${step.delayDays} days)`}
                    </span>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSequenceStep(idx)}
                        className="text-danger hover:underline text-[11px]"
                      >
                        Remove Step
                      </button>
                    )}
                  </div>

                  {idx > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-text-tertiary text-[11px] mb-0.5">Delay (Days)</label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={step.delayDays}
                          onChange={(e) => {
                            const updated = [...formSequences];
                            updated[idx].delayDays = Number(e.target.value);
                            setFormSequences(updated);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-text-tertiary text-[11px] mb-0.5">Dispatch Condition</label>
                        <select
                          value={step.condition}
                          onChange={(e) => {
                            const updated = [...formSequences];
                            updated[idx].condition = e.target.value;
                            setFormSequences(updated);
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary"
                        >
                          <option value="NOT_OPENED">If Previous Email NOT Opened</option>
                          <option value="ALWAYS">Always Send Follow-Up</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-text-tertiary text-[11px] mb-0.5">Subject</label>
                    <Input
                      type="text"
                      required
                      value={step.customSubject}
                      onChange={(e) => {
                        const updated = [...formSequences];
                        updated[idx].customSubject = e.target.value;
                        setFormSequences(updated);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-text-tertiary text-[11px] mb-0.5">Message Body</label>
                    <textarea
                      rows={4}
                      required
                      value={step.customBody}
                      onChange={(e) => {
                        const updated = [...formSequences];
                        updated[idx].customBody = e.target.value;
                        setFormSequences(updated);
                      }}
                      className="w-full p-2.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary font-mono leading-relaxed resize-none focus:outline-none focus:border-accent"
                    />
                    <span className="text-[10px] text-text-tertiary">
                      Variables available: {"{{businessName}}"}, {"{{city}}"}, {"{{category}}"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Launch Automation</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          ANALYTICS & LEADS IN SEQUENCE MODAL
          ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        title={selectedCampaignAnalytics?.name || "Campaign Analytics"}
        subtitle="Real-time conversion funnel and per-lead sequence status"
        maxWidth="2xl"
      >
        {isLoadingDetails ? (
          <div className="py-12 text-center text-xs text-text-tertiary">Loading campaign telemetry...</div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Funnel Visualization */}
            <div className="p-4 rounded-xl bg-bg-base border border-border-subtle space-y-3">
              <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-accent" />
                <span>Outreach Conversion Funnel</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div className="text-sm font-bold font-mono text-text-primary">
                    {selectedCampaignAnalytics?.leadsDiscovered || 0}
                  </div>
                  <div className="text-[10px] text-text-tertiary uppercase mt-1">Discovered</div>
                </div>
                <div className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div className="text-sm font-bold font-mono text-indigo-400">
                    {selectedCampaignAnalytics?.emailsSent || 0}
                  </div>
                  <div className="text-[10px] text-text-tertiary uppercase mt-1">Sent</div>
                </div>
                <div className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {selectedCampaignAnalytics?.emailsOpened || 0} ({selectedCampaignAnalytics?.openRate || 0}%)
                  </div>
                  <div className="text-[10px] text-text-tertiary uppercase mt-1">Opened</div>
                </div>
                <div className="p-3 rounded-lg bg-bg-surface border border-border-subtle">
                  <div className="text-sm font-bold font-mono text-purple-400">
                    {selectedCampaignAnalytics?.emailsClicked || 0} ({selectedCampaignAnalytics?.clickRate || 0}%)
                  </div>
                  <div className="text-[10px] text-text-tertiary uppercase mt-1">Clicked</div>
                </div>
              </div>
            </div>

            {/* Per-Lead Sequence Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-text-primary uppercase tracking-wider text-[11px] flex items-center justify-between">
                <span>Leads Currently in Sequence ({selectedCampaignRuns.length})</span>
              </h4>

              {selectedCampaignRuns.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-tertiary">
                  No active lead runs enrolled in this campaign yet.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64 rounded-xl border border-border-subtle">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg-base text-text-tertiary border-b border-border-subtle">
                      <tr>
                        <th className="p-2.5">Business Lead</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">Current Step</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Next Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-bg-surface">
                      {selectedCampaignRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-bg-surface-hover/50">
                          <td className="p-2.5 font-bold text-text-primary">
                            {run.business?.name || "Business"}
                          </td>
                          <td className="p-2.5 text-text-secondary">
                            {run.business?.city || "Area"}
                          </td>
                          <td className="p-2.5 font-mono text-text-secondary">
                            Step #{run.currentStep + 1}
                          </td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent/15 text-accent border border-accent/25">
                              {run.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-text-tertiary font-mono text-[11px]">
                            {run.nextActionAt ? new Date(run.nextActionAt).toLocaleString() : "Completed"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
