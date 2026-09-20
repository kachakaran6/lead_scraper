import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { NewScrapeModal } from "../ui/NewScrapeModal";
import { useAuth } from "../../lib/auth";
import {
  LayoutDashboard,
  Compass,
  Building2,
  Sliders,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickScrapeOpen, setIsQuickScrapeOpen] = useState(false);

  const mobileBottomNav = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Discover", path: "/discover", icon: Compass },
    { label: "Leads", path: "/leads", icon: Building2 },
    { label: "Settings", path: "/settings", icon: Sliders },
  ];

  const isPending = user?.accountStatus === "PENDING";
  const isSuspended = user?.accountStatus === "SUSPENDED" || user?.accountStatus === "DISABLED";
  const isNoScraperAccess = user && user.accountStatus === "ACTIVE" && user.scraperAccess === false;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-bg-base text-text-primary select-none transition-colors">
      {/* 1. Global Header: Fixed 64px at the very top, full width, immune to content scrolling */}
      <Header
        onOpenQuickScrape={() => setIsQuickScrapeOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Authorization Status Banners */}
      {isPending && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Account Pending Approval:</strong> Your account has been registered and is awaiting administrator authorization. Scraping and lead discovery actions are currently restricted.
            </span>
          </div>
        </div>
      )}

      {isSuspended && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              <strong>Account Restricted:</strong> Your access to Lead Scrapper services has been suspended or disabled. Please contact an administrator.
            </span>
          </div>
        </div>
      )}

      {isNoScraperAccess && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Scraper Access Restricted:</strong> Your account is active, but scraper execution permissions have not been enabled by an administrator yet.
            </span>
          </div>
        </div>
      )}

      {/* 2. Workspace Split Shell: Sidebar (Left) + Independently Scrollable Workspace (Right) */}
      <div className="flex-1 flex overflow-hidden w-full relative min-h-0">
        {/* Sidebar: Persistent on Desktop, Slide-over Drawer on Mobile */}
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Scrollable Content Pane: Full-width fluid responsive workspace */}
        <main
          id="main-scroll-pane"
          className="flex-1 h-full min-w-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-8 focus:outline-none"
          tabIndex={-1}
        >
          <div className="w-full">
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
