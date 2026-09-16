import React, { useEffect, useState } from "react";
import {
  Building2,
  Plus,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { leadEngineApi } from "../lib/api";

export const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState("");
  const [newDealValue, setNewDealValue] = useState("2000");
  const [newDealBusinessId, setNewDealBusinessId] = useState("");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dealsData, statsData, leadsData] = await Promise.all([
        leadEngineApi.getDeals(),
        leadEngineApi.getDashboardKpis(),
        leadEngineApi.getLeads({ limit: 20 }),
      ]);
      setDeals(dealsData || []);
      setStages(statsData?.charts?.pipeline || []);
      setBusinesses(leadsData?.items || []);
    } catch (err) {
      console.error("Failed to load deals", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealBusinessId || !newDealTitle) return;
    try {
      const defaultStage = stages[0]?.id;
      await leadEngineApi.createDeal({
        title: newDealTitle,
        value: Number(newDealValue) || 1500,
        businessId: newDealBusinessId,
        stageId: defaultStage,
      });
      setIsNewDealOpen(false);
      setNewDealTitle("");
      fetchData();
    } catch (err) {
      console.error("Failed to create deal", err);
    }
  };

  const handleMoveStage = async (dealId: string, newStageId: string) => {
    try {
      await leadEngineApi.updateDealStage(dealId, newStageId);
      fetchData();
    } catch (err) {
      console.error("Failed to move deal", err);
    }
  };

  const totalPipeline = deals.reduce((acc, d) => acc + (d.value || 0), 0);

  // Group deals by stage
  const stagesToRender = stages.length > 0
    ? stages
    : [
        { id: "s1", name: "NEW", color: "#6B6B70" },
        { id: "s2", name: "QUALIFIED", color: "#4C7CF0" },
        { id: "s3", name: "CONTACTED", color: "#4C7CF0" },
        { id: "s4", name: "MEETING", color: "#C98A2E" },
        { id: "s5", name: "PROPOSAL", color: "#C98A2E" },
        { id: "s6", name: "WON", color: "#34A874" },
      ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#232326] bg-[#131315] text-xs font-mono text-[#9B9BA1]">
          <span className="text-[#EDEDEF] font-semibold tabular-nums">${totalPipeline.toLocaleString()}</span>
          <span>Active Pipeline</span>
        </span>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewDealOpen(true)}
          className="flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Deal</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-[#9B9BA1]">
          <div className="w-6 h-6 border-2 border-[#4C7CF0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading pipeline...</p>
        </div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
          {stagesToRender.map((stage) => {
            const stageDeals = deals.filter(
              (d) => d.stageId === stage.id || d.stage?.name === stage.name
            );
            const stageTotal = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 bg-[#0E0E10] rounded-lg border border-[#232326] p-3 flex flex-col min-h-[500px]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#232326] mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: stage.color || "#4C7CF0" }}
                    />
                    <span className="text-xs font-semibold text-[#EDEDEF] tracking-wide">
                      {stage.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#6B6B70] bg-[#131315] px-1.5 py-0.5 rounded border border-[#232326]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium tabular-nums text-[#EDEDEF]">
                    ${stageTotal}
                  </span>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3.5 rounded-md bg-[#131315] border border-[#232326] hover:border-[#2E2E32] hover:bg-[#1B1B1E] transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-[#EDEDEF] text-xs leading-snug">
                          {deal.title}
                        </h4>
                        <span className="text-xs font-mono font-semibold tabular-nums text-[#EDEDEF] shrink-0">
                          ${deal.value}
                        </span>
                      </div>

                      {deal.business && (
                        <div className="text-[11px] text-[#9B9BA1] flex items-center gap-1.5 mt-2">
                          <Building2 className="w-3.5 h-3.5 text-[#6B6B70] shrink-0" />
                          <span className="truncate">{deal.business.name}</span>
                        </div>
                      )}

                      {/* Move stage selector */}
                      <div className="pt-2.5 mt-3 border-t border-[#232326] flex items-center justify-between">
                        <span className="text-[10px] text-[#6B6B70]">Stage:</span>
                        <select
                          value={deal.stageId || stage.id}
                          onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                          className="text-[11px] bg-[#0A0A0B] text-[#EDEDEF] rounded px-2 py-1 border border-[#2E2E32] focus:outline-none focus:border-[#4C7CF0] cursor-pointer"
                        >
                          {stagesToRender.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="h-28 border border-dashed border-[#232326] rounded-md flex items-center justify-center text-xs text-[#6B6B70]">
                      No deals in {stage.name}
                    </div>
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
        title="Create New Pipeline Deal"
        subtitle="Associate a target client with an estimated project value"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          <Input
            label="Deal Title"
            placeholder="e.g. Apex Diagnostic - Full Website & WhatsApp CRM"
            value={newDealTitle}
            onChange={(e) => setNewDealTitle(e.target.value)}
            required
          />

          <Input
            label="Estimated Value ($ USD)"
            type="number"
            value={newDealValue}
            onChange={(e) => setNewDealValue(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium uppercase tracking-wider text-[#6B6B70]">
              Select Client / Lead
            </label>
            <select
              value={newDealBusinessId}
              onChange={(e) => setNewDealBusinessId(e.target.value)}
              required
              className="w-full rounded-md border border-[#2E2E32] bg-[#0A0A0B] px-3 py-2 text-xs text-[#EDEDEF] focus:border-[#4C7CF0] focus:outline-none cursor-pointer"
            >
              <option value="">Select a business from CRM...</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.city || "Rajkot"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#232326]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewDealOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
