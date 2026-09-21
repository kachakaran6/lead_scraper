import React, { useEffect, useState, useCallback } from "react";
import {
  Building2,
  Plus,
  DollarSign,
  Kanban,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { leadEngineApi } from "../lib/api";
import {
  DealsSkeleton,
  ErrorState,
  EmptyState,
} from "../components/ui/LoadingStates";

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("");
  const [newDealBusinessId, setNewDealBusinessId] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dealsData, statsData, leadsData] = await Promise.all([
        leadEngineApi.getDeals(),
        leadEngineApi.getDashboardKpis().catch(() => null),
        leadEngineApi.getLeads({ limit: 50 }).catch(() => ({ items: [] })),
      ]);
      setDeals(Array.isArray(dealsData) ? dealsData : (dealsData as any)?.items || []);
      setBusinesses(leadsData?.items || []);
      if (statsData?.charts?.pipeline?.length) {
        setStages(statsData.charts.pipeline);
      }
    } catch (err: any) {
      console.error("Failed to load deals pipeline:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve pipeline deals from the server. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim()) return;

    try {
      await leadEngineApi.createDeal({
        title: newDealTitle.trim(),
        value: Number(newDealValue) || 1000,
        businessId: newDealBusinessId || undefined,
        stage: "NEW",
      });
      setIsNewDealOpen(false);
      setNewDealTitle("");
      setNewDealValue("");
      setNewDealBusinessId("");
      fetchData();
    } catch (err) {
      console.error("Failed to create deal:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageName: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;

    // Optimistic UI update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: stageName } : d))
    );

    try {
      await leadEngineApi.updateDealStage(dealId, stageName);
    } catch (err) {
      console.error("Failed to update deal stage:", err);
      fetchData();
    }
  };

  const totalPipeline = deals.reduce((acc, d) => acc + (d.value || 0), 0);

  const pipelineStages = stages.length > 0
    ? stages
    : [
        { id: "s1", name: "NEW", color: "var(--accent)" },
        { id: "s2", name: "QUALIFIED", color: "var(--accent)" },
        { id: "s3", name: "CONTACTED", color: "var(--accent)" },
        { id: "s4", name: "MEETING", color: "var(--warning)" },
        { id: "s5", name: "PROPOSAL", color: "var(--warning)" },
        { id: "s6", name: "WON", color: "var(--success)" },
      ];

  if (isLoading) {
    return <DealsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <PageHeader
        title="Deals Pipeline"
        description="Track deal conversions, manage stage progression, and monitor active revenue pipeline."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface text-xs font-mono text-text-secondary">
              <span className="text-accent font-bold tabular-nums text-sm">
                ${totalPipeline.toLocaleString()}
              </span>
              <span>Total Pipeline</span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewDealOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Deal</span>
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Unable to load pipeline"
          message={error}
          onRetry={fetchData}
        />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="Pipeline is currently empty"
          description="Track incoming customer proposals, discovery conversions, and won contracts in this CRM pipeline."
          actionLabel="Add First Deal"
          onAction={() => setIsNewDealOpen(true)}
        />
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
          {pipelineStages.map((stage) => {
            const stageDeals = deals.filter(
              (d) => d.stageId === stage.id || d.stage === stage.name || d.stage?.name === stage.name
            );
            const stageTotal = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);

            return (
              <div
                key={stage.id || stage.name}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.name)}
                className="w-72 shrink-0 bg-bg-surface rounded-lg border border-border-subtle p-3 flex flex-col min-h-[480px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: stage.color || "var(--accent)" }}
                    />
                    <span className="text-xs font-semibold text-text-primary tracking-wide">
                      {stage.name}
                    </span>
                    <span className="text-[11px] font-mono text-text-tertiary bg-bg-base px-1.5 py-0.2 rounded border border-border-subtle">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium tabular-nums text-text-primary">
                    ${stageTotal.toLocaleString()}
                  </span>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageDeals.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-text-tertiary">
                      Drop deals here
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", deal.id)}
                        className="p-3 rounded-md bg-bg-base border border-border-subtle hover:border-accent/40 cursor-grab active:cursor-grabbing transition-all space-y-2 shadow-xs"
                      >
                        <div className="font-semibold text-xs text-text-primary">{deal.title}</div>
                        {deal.business && (
                          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary truncate">
                            <Building2 className="w-3 h-3 text-text-tertiary shrink-0" />
                            <span className="truncate">{deal.business.name}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
                          <span className="font-mono font-semibold text-accent">
                            ${(deal.value || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-text-tertiary">
                            {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : "Active"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Deal Modal */}
      <Modal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        title="Create Pipeline Deal"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input
            label="Deal Title"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
            placeholder="e.g. Website Redesign Package"
            required
          />

          <Input
            label="Estimated Value ($)"
            type="number"
            value={newDealValue}
            onChange={(e) => setNewDealValue(e.target.value)}
            placeholder="e.g. 2500"
            required
          />

          {businesses.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Associated Business
              </label>
              <select
                value={newDealBusinessId}
                onChange={(e) => setNewDealBusinessId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Select a business (optional)</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city || "Local"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsNewDealOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-accent text-white font-semibold">
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
