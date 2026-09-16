import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Compass, Sparkles, MapPin, Search } from "lucide-react";
import { leadEngineApi } from "../../lib/api";

export const AppLayout: React.FC = () => {
  const [isQuickScrapeOpen, setIsQuickScrapeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Rajkot, Gujarat");
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const handleLaunchScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      await leadEngineApi.createCampaign({
        name: `Quick Scrape: ${query} in ${location}`,
        query,
        location,
        radiusKm: 15,
      });
      setIsQuickScrapeOpen(false);
      navigate("/campaigns");
    } catch {
      // Navigate to discover page as fallback
      setIsQuickScrapeOpen(false);
      navigate(`/discover?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <Header onOpenQuickScrape={() => setIsQuickScrapeOpen(true)} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          <Outlet />
        </main>
      </div>

      {/* Quick Scrape Modal */}
      <Modal
        isOpen={isQuickScrapeOpen}
        onClose={() => setIsQuickScrapeOpen(false)}
        title="Launch Instant Lead Discovery"
        subtitle="Extract high-intent businesses, emails, WhatsApp numbers, and tech audit data"
      >
        <form onSubmit={handleLaunchScrape} className="space-y-4">
          <Input
            label="Target Query / Category"
            placeholder="e.g. Dental Clinic, Diagnostic Center, Orthopedic Hospital"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Location / City"
            placeholder="e.g. Rajkot, Gujarat, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            icon={<MapPin className="w-4 h-4 text-slate-400" />}
            required
          />

          <div className="rounded-xl bg-indigo-950/30 border border-indigo-800/40 p-3 text-xs text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              Auto-triggers real-time verification: website DNS checks, missing website flags, social links extraction, and instant lead scoring.
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickScrapeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSearching}
              className="shadow-lg shadow-indigo-600/30"
            >
              Start Pipeline Run
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
