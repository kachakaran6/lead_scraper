import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NewScrapeModal } from "../ui/NewScrapeModal";
import {
  LayoutDashboard,
  Compass,
  Building2,
  Sliders,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const AppLayout: React.FC = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickScrapeOpen, setIsQuickScrapeOpen] = useState(false);

  const mobileBottomNav = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Discover", path: "/discover", icon: Compass },
    { label: "Leads", path: "/leads", icon: Building2 },
    { label: "Settings", path: "/settings", icon: Sliders },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-bg-base text-text-primary select-none transition-colors">
      {/* 1. Global Header: Fixed 64px at the very top, full width, immune to content scrolling */}
      <Header
        onOpenQuickScrape={() => setIsQuickScrapeOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* 2. Workspace Split Shell: Sidebar (Left) + Independently Scrollable Workspace (Right) */}
      <div className="flex-1 flex overflow-hidden w-full relative min-h-0">
        {/* Sidebar: Persistent on Desktop, Slide-over Drawer on Mobile */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Scrollable Content Pane: Independent scroll container */}
        <main
          id="main-scroll-pane"
          className="flex-1 h-full min-w-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 focus:outline-none"
          tabIndex={-1}
        >
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Thumb Navigation Bar (<md devices) */}
      <nav
        aria-label="Mobile Bottom Navigation"
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

      {/* 4. Interactive Scrape Wizard Modal */}
      <NewScrapeModal
        isOpen={isQuickScrapeOpen}
        onClose={() => setIsQuickScrapeOpen(false)}
      />
    </div>
  );
};
