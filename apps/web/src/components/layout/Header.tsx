import React, { useState } from "react";
import { Search, Plus, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";
import { RoleSwitcher } from "../ui/RoleSwitcher";
import { useAuth } from "../../lib/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";

interface HeaderProps {
  onOpenQuickScrape?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickScrape }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getBreadcrumb = (pathname: string) => {
    if (pathname === "/" || pathname === "") {
      return { section: "Platform", title: "Dashboard" };
    }
    if (pathname.startsWith("/discover")) {
      return { section: "Engine", title: "Discovery" };
    }
    if (pathname.startsWith("/leads/")) {
      return { section: "Prospects", title: "Leads Database", path: "/leads", sub: "Lead Intel" };
    }
    if (pathname.startsWith("/leads")) {
      return { section: "Prospects", title: "Leads Database" };
    }
    if (pathname.startsWith("/opportunities")) {
      return { section: "Intelligence", title: "Opportunities" };
    }
    if (pathname.startsWith("/deals")) {
      return { section: "Pipeline", title: "Deals Pipeline" };
    }
    if (pathname.startsWith("/websites")) {
      return { section: "Audits", title: "Website Center" };
    }
    if (pathname.startsWith("/campaigns")) {
      return { section: "Engine", title: "Campaigns" };
    }
    if (pathname.startsWith("/outreach")) {
      return { section: "Outreach", title: "AI Pitch Studio" };
    }
    if (pathname.startsWith("/settings")) {
      return { section: "Settings", title: "Engine Rules" };
    }
    return { section: "Platform", title: "Dashboard" };
  };

  const crumb = getBreadcrumb(location.pathname);

  const { role, user, can } = useAuth();
  const canScrape = can("DISCOVERY_RUN");

  const getInitials = (name?: string) => {
    if (!name) return "US";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="h-14 border-b border-border-subtle bg-bg-base sticky top-0 z-30 px-6 flex items-center justify-between gap-4 transition-colors">
      {/* Professional Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs shrink-0">
        <span className="text-text-tertiary font-medium">{crumb.section}</span>
        <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
        {crumb.sub ? (
          <>
            <Link
              to={crumb.path || "/"}
              className="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              {crumb.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-text-primary font-medium">{crumb.sub}</span>
          </>
        ) : (
          <span className="text-text-primary font-medium">{crumb.title}</span>
        )}
      </nav>

      {/* Omnibar & Action Buttons */}
      <div className="flex items-center gap-3 ml-auto">
        <form onSubmit={handleSearchSubmit} className="w-64 lg:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, cities, niches..."
              className="w-full pl-8 pr-10 py-1.5 rounded-md bg-bg-surface border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-bg-surface-hover rounded border border-border-default">
                ⌘K
              </kbd>
            </div>
          </div>
        </form>

        {/* Role Switcher (RBAC) */}
        <RoleSwitcher />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Clean Primary Scrape Button - Gated by RBAC */}
        <Button
          variant="primary"
          size="sm"
          disabled={!canScrape}
          onClick={canScrape ? (onOpenQuickScrape || (() => navigate("/discover"))) : undefined}
          className={`text-xs ${!canScrape ? "opacity-40 cursor-not-allowed" : ""}`}
          title={!canScrape ? `Role '${role}' cannot initiate discovery runs` : undefined}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Scrape Run</span>
        </Button>

        {/* User profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-border-subtle">
          <div className="w-7 h-7 rounded-md bg-bg-surface-hover border border-border-default flex items-center justify-center text-[11px] font-semibold text-text-primary">
            {getInitials(user?.name)}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[12px] font-medium text-text-primary leading-none capitalize">{user?.name || role}</div>
            <div className="text-[11px] text-text-tertiary leading-none mt-1">{user?.email || `${role}@leadengine.io`}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
