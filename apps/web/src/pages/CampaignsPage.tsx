import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Play,
  Pause,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Scraping Campaigns</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated multi-threaded worker queues extracting targets, audits, and contacts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Scraping Campaign</span>
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.map((camp) => (
          <Card key={camp.id} className="glass-panel border-slate-800">
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{camp.name}</h3>
                    <Badge
                      variant={
                        camp.status === "COMPLETED"
                          ? "success"
                          : camp.status === "RUNNING"
                          ? "warning"
                          : "default"
                      }
                      className="text-[10px] font-bold"
                    >
                      {camp.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">Target: {camp.query}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {camp.location || "Default Location"} ({camp.radiusKm || 15}km)
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Discovered</span>
                    <div className="text-base font-extrabold font-mono text-white mt-0.5">
                      {camp.discovered || 42}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase">Unique</span>
                    <div className="text-base font-extrabold font-mono text-indigo-400 mt-0.5">
                      {camp.unique || 38}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-amber-400 uppercase">No Website</span>
                    <div className="text-base font-extrabold font-mono text-amber-300 mt-0.5">
                      {camp.noWebsite || 14}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-rose-400 uppercase">Score &gt; 80</span>
                    <div className="text-base font-extrabold font-mono text-rose-300 mt-0.5">
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
                      className="text-xs text-amber-400"
                    >
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStart(camp.id)}
                      className="text-xs"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> Start Run
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && !isLoading && (
          <div className="text-center py-12 text-slate-400">
            <Megaphone className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p>No campaigns found. Create your first automated scraping run above.</p>
          </div>
        )}
      </div>

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

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Queue Campaign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
