import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { MapPin, Search } from "lucide-react";
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
      setIsQuickScrapeOpen(false);
      navigate(`/discover?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#EDEDEF] flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen overflow-x-hidden">
        <Header onOpenQuickScrape={() => setIsQuickScrapeOpen(true)} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
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
            icon={<Search className="w-3.5 h-3.5 text-[#6B6B70]" />}
            required
          />

          <Input
            label="Location / City"
            placeholder="e.g. Rajkot, Gujarat, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            icon={<MapPin className="w-3.5 h-3.5 text-[#6B6B70]" />}
            required
          />

          <div className="rounded-md bg-[#131315] border border-[#232326] p-3 text-[12px] text-[#9B9BA1] leading-relaxed">
            Auto-triggers real-time verification: website DNS checks, missing website flags, social links extraction, and instant lead scoring.
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#232326]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsQuickScrapeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSearching}
            >
              Start Pipeline Run
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
