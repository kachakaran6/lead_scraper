import React, { useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import {
  MapPin,
  Search,
  LayoutDashboard,
  Compass,
  Building2,
  Sliders,
} from "lucide-react";
import { leadEngineApi } from "../../lib/api";
import { cn } from "../../lib/utils";

export const AppLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickScrapeOpen, setIsQuickScrapeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Mumbai, Maharashtra");
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
        radiusKm: 25,
      });
      setIsQuickScrapeOpen(false);
      navigate("/campaigns");
    } catch {
      setIsQuickScrapeOpen(false);
      navigate(
        `/discover?query=${encodeURIComponent(query)}&location=${encodeURIComponent(
          location
        )}`
      );
    } finally {
      setIsSearching(false);
    }
  };

  const mobileBottomNav = [
    { label: "Home", path: "/", icon: LayoutDashboard },
    { label: "Discover", path: "/discover", icon: Compass },
    { label: "Leads", path: "/leads", icon: Building2 },
    { label: "Settings", path: "/settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col md:flex-row transition-colors overflow-x-hidden">
      {/* Responsive Sidebar (Fixed on desktop, drawer on mobile) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen min-w-0 pb-16 md:pb-0 overflow-x-hidden">
        <Header
          onOpenQuickScrape={() => setIsQuickScrapeOpen(true)}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 w-full min-w-0 px-4 sm:px-6 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (<md devices) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 h-14 bg-bg-surface/95 backdrop-blur-md border-t border-border-subtle z-40 md:hidden flex items-center justify-around px-2"
      >
        {mobileBottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] transition-colors",
                  isActive
                    ? "text-accent font-semibold"
                    : "text-text-secondary hover:text-text-primary font-normal"
                )
              }
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Discovery Modal */}
      <Modal
        isOpen={isQuickScrapeOpen}
        onClose={() => setIsQuickScrapeOpen(false)}
        title="Launch Instant Lead Discovery"
        subtitle="Search verified business registries for authentic contact & website details"
      >
        <form onSubmit={handleLaunchScrape} className="space-y-4">
          <Input
            label="Target Query / Category"
            placeholder="e.g. Dental Clinic, Orthopedic Hospital, Restaurant"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="w-3.5 h-3.5 text-text-tertiary" />}
            required
          />

          <Input
            label="Location / City"
            placeholder="e.g. Mumbai, Maharashtra, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            icon={<MapPin className="w-3.5 h-3.5 text-text-tertiary" />}
            required
          />

          <div className="rounded-lg bg-bg-base border border-border-subtle p-3 text-[12px] text-text-secondary leading-relaxed">
            Real data guaranteed: Queries official Google Places / OpenStreetMap registries. Missing websites are flagged as prime outreach targets.
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border-subtle">
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
              Start Discovery
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
