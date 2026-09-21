import React, { useEffect, useState, useCallback } from "react";
import {
  Megaphone,
  Play,
  Pause,
  Plus,
  MapPin,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { leadEngineApi } from "../lib/api";
import {
  TableSkeleton,
  ErrorState,
  EmptyState,
} from "../components/ui/LoadingStates";

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState("25");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await leadEngineApi.getCampaigns();
      setCampaigns(data || []);
    } catch (err: any) {
      console.error("Failed to load campaigns", err);
      setError(
        err?.response?.data?.message ||
          "Unable to retrieve campaigns from backend service. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !query.trim() || !location.trim()) return;

    try {
      await leadEngineApi.createCampaign({
        name: name.trim(),
        query: query.trim(),
        location: location.trim(),
        radiusKm: Number(radiusKm) || 25,
      });
      setIsModalOpen(false);
      setName("");
      setQuery("");
      setLocation("");
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to create campaign", err);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await leadEngineApi.startCampaign(id);
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to start campaign", err);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await leadEngineApi.pauseCampaign(id);
      fetchCampaigns();
    } catch (err) {
      console.error("Failed to pause campaign", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Scraping Campaigns"
          description="Autonomous geo-targeted crawlers, real-time worker bot queues, and lead extraction schedules."
        />
        <TableSkeleton rows={4} cols={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <PageHeader
        title="Scraping Campaigns"
        description="Autonomous geo-targeted crawlers, real-time worker bot queues, and lead extraction schedules."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-accent text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Scraping Campaign</span>
          </Button>
        }
      />

      {error ? (
        <ErrorState
          title="Unable to load campaigns"
          message={error}
          onRetry={fetchCampaigns}
        />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No scraping campaigns configured"
          description="Create and schedule geo-targeted scraper runs across any trade category."
          actionLabel="Create Scraping Campaign"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-bg-surface border border-border-subtle hover:border-border-default rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors duration-150 shadow-sm"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-semibold text-text-primary text-sm truncate">{camp.name}</h3>
                  {camp.status === "COMPLETED" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-semantic-success font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
                      <span>Completed</span>
                    </span>
                  ) : camp.status === "RUNNING" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-semantic-warning font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning animate-ping" />
                      <span>Running</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border-default text-[11px] font-mono text-text-tertiary uppercase">
                      {camp.status || "Draft"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                  <span>Target: <strong className="text-text-primary font-medium">{camp.query}</strong></span>
                  <span className="text-text-tertiary">•</span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-text-tertiary shrink-0" />
                    <span className="truncate">{camp.location || "Default Location"} ({camp.radiusKm || 15}km)</span>
                  </span>
                </div>
              </div>

              {/* Real Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shrink-0">
                <div className="p-2.5 rounded-lg bg-bg-base border border-border-subtle min-w-[76px]">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider">Discovered</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-text-primary mt-1">
                    {typeof camp.discovered === "number" ? camp.discovered : 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-bg-base border border-border-subtle min-w-[76px]">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider">Unique</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-text-primary mt-1">
                    {typeof camp.unique === "number" ? camp.unique : 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-bg-base border border-border-subtle min-w-[76px]">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider">No Site</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-semantic-warning mt-1">
                    {typeof camp.noWebsite === "number" ? camp.noWebsite : 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-bg-base border border-border-subtle min-w-[76px]">
                  <span className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider">Score &gt; 80</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-semantic-success mt-1">
                    {typeof camp.highOpportunity === "number" ? camp.highOpportunity : 0}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {camp.status === "RUNNING" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePause(camp.id)}
                    className="text-xs"
                  >
                    <Pause className="w-3 h-3 mr-1 text-semantic-warning" /> Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStart(camp.id)}
                    className="text-xs bg-accent text-white font-semibold"
                  >
                    <Play className="w-3 h-3 mr-1" /> Start Run
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Campaign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch Scraping Campaign"
        subtitle="Queue high-speed worker bots to extract and score leads"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Campaign Name"
            placeholder="e.g. Dallas HVAC Contractors"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Search Query"
            placeholder="e.g. HVAC Contractor, AC Repair"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />

          <Input
            label="Target City & State / Country"
            placeholder="e.g. Dallas, Texas, USA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          <Input
            label="Search Radius (km)"
            type="number"
            value={radiusKm}
            onChange={(e) => setRadiusKm(e.target.value)}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-subtle">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-accent text-white font-semibold">
              Queue Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
