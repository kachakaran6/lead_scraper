import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Play,
  Pause,
  Plus,
  MapPin,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { leadEngineApi } from "../lib/api";

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("Dental Clinics");
  const [location, setLocation] = useState("Rajkot, Gujarat");
  const [radiusKm, setRadiusKm] = useState("20");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await leadEngineApi.getCampaigns();
      setCampaigns(data || []);
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !query) return;
    try {
      await leadEngineApi.createCampaign({
        name,
        query,
        location,
        radiusKm: Number(radiusKm) || 15,
      });
      setIsModalOpen(false);
      setName("");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#EDEDEF] tracking-tight">Scraping Campaigns</h1>
          <p className="text-xs text-[#9B9BA1] mt-1">
            Automated multi-threaded worker queues extracting targets, audits, and contacts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Scraping Campaign</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-[#9B9BA1]">
          <div className="w-6 h-6 border-2 border-[#4C7CF0] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading campaigns...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-[#131315] border border-[#232326] rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-medium text-[#EDEDEF] text-sm">{camp.name}</h3>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#9B9BA1]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        camp.status === "COMPLETED"
                          ? "bg-[#34A874]"
                          : camp.status === "RUNNING"
                          ? "bg-[#C98A2E]"
                          : "bg-[#6B6B70]"
                      }`}
                    />
                    {camp.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#9B9BA1]">
                  <span>Target: <strong className="text-[#EDEDEF] font-normal">{camp.query}</strong></span>
                  <span className="text-[#6B6B70]">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#6B6B70]" />
                    {camp.location || "Default Location"} ({camp.radiusKm || 15}km)
                  </span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#232326] min-w-[70px]">
                  <span className="text-[10px] text-[#6B6B70] uppercase tracking-wider">Discovered</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-[#EDEDEF] mt-0.5">
                    {camp.discovered || 42}
                  </div>
                </div>
                <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#232326] min-w-[70px]">
                  <span className="text-[10px] text-[#6B6B70] uppercase tracking-wider">Unique</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-[#EDEDEF] mt-0.5">
                    {camp.unique || 38}
                  </div>
                </div>
                <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#232326] min-w-[70px]">
                  <span className="text-[10px] text-[#6B6B70] uppercase tracking-wider">No Website</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-[#C98A2E] mt-0.5">
                    {camp.noWebsite || 14}
                  </div>
                </div>
                <div className="p-2.5 rounded-md bg-[#0A0A0B] border border-[#232326] min-w-[70px]">
                  <span className="text-[10px] text-[#6B6B70] uppercase tracking-wider">Score &gt; 80</span>
                  <div className="text-xs font-semibold font-mono tabular-nums text-[#34A874] mt-0.5">
                    {camp.highOpportunity || 19}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {camp.status === "RUNNING" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePause(camp.id)}
                    className="text-xs"
                  >
                    <Pause className="w-3 h-3 mr-1 text-[#C98A2E]" /> Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStart(camp.id)}
                    className="text-xs"
                  >
                    <Play className="w-3 h-3 mr-1" /> Start Run
                  </Button>
                )}
              </div>
            </div>
          ))}

          {campaigns.length === 0 && !isLoading && (
            <div className="text-center py-16 text-[#9B9BA1] bg-[#131315] border border-[#232326] rounded-lg">
              <Megaphone className="w-8 h-8 mx-auto text-[#6B6B70] mb-2" />
              <p className="text-xs">No campaigns found. Create your first automated scraping run above.</p>
            </div>
          )}
        </div>
      )}

      {/* New Campaign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Launch Autonomous Scraping Campaign"
        subtitle="Queue high-speed worker bots to extract and score leads"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Campaign Name"
            placeholder="e.g. Rajkot Dental Clinics Wave 1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Search Query"
            placeholder="e.g. Dental Clinic, Implant Center"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />

          <Input
            label="Target City & State"
            placeholder="e.g. Rajkot, Gujarat, India"
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

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#232326]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Queue Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
