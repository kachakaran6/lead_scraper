import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  Menu,
  LogOut,
  User,
  Settings,
  Shield,
  ChevronDown,
  Layers,
  Building,
  Bell,
  Check,
} from "lucide-react";
import { Button } from "../ui/Button";
import { ThemeSelector } from "../ui/ThemeSelector";
import { useAuth } from "../../lib/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cn } from "../../lib/utils";

interface HeaderProps {
  onOpenQuickScrape?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickScrape,
  onToggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState("Primary Workspace");
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getBreadcrumbs = (pathname: string) => {
    if (pathname === "/" || pathname === "") {
      return [{ label: "Intelligence Platform" }, { label: "Executive Dashboard" }];
    }
    if (pathname.startsWith("/discover")) {
      return [{ label: "Intelligence Platform" }, { label: "Discovery Engine" }];
    }
    if (pathname.startsWith("/leads/")) {
      return [
        { label: "Prospects" },
        { label: "Leads Database", path: "/leads" },
        { label: "Lead Intelligence Dossier" },
      ];
    }
    if (pathname.startsWith("/leads")) {
      return [{ label: "Prospects" }, { label: "Leads Database" }];
    }
    if (pathname.startsWith("/opportunities")) {
      return [{ label: "Opportunities" }, { label: "Scored Targets" }];
    }
    if (pathname.startsWith("/deals")) {
      return [{ label: "Opportunities" }, { label: "Deals Pipeline" }];
    }
    if (pathname.startsWith("/websites")) {
      return [{ label: "Intelligence" }, { label: "Website Audits" }];
    }
    if (pathname.startsWith("/campaigns")) {
      return [{ label: "Intelligence" }, { label: "Scrape Campaigns" }];
    }
    if (pathname.startsWith("/outreach")) {
      return [{ label: "Intelligence" }, { label: "Outreach & AI Studio" }];
    }
    if (pathname.startsWith("/settings")) {
      return [{ label: "System" }, { label: "Settings & Rules" }];
    }
    return [{ label: "Platform" }, { label: "Overview" }];
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "LE";
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-border-subtle bg-bg-surface flex items-stretch select-none shrink-0 transition-colors">
      {/* 1. LEFT BRAND BLOCK: Exactly w-60 (240px) on desktop to align perfectly with the sidebar aside */}
      <div className="hidden md:flex md:w-60 h-full items-center px-4 sm:px-5 border-r border-border-subtle shrink-0 bg-bg-surface">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-7 h-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm tracking-tight text-text-primary">
              LeadEngine
            </span>
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
              PRO
            </span>
          </div>
        </Link>
      </div>

      {/* Mobile brand & drawer toggle (<md devices) */}
      <div className="flex md:hidden items-center gap-2 px-3 h-full border-r border-border-subtle shrink-0 bg-bg-surface">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md border border-border-default bg-bg-base hover:bg-bg-surface-hover text-text-secondary shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-text-primary">LeadEngine</span>
          <span className="text-[9px] font-bold text-accent px-1 rounded bg-accent/10 border border-accent/20">PRO</span>
        </Link>
      </div>

      {/* 2. RIGHT WORKSPACE HEADER: Full-width workspace control strip directly above main content */}
      <div className="flex-1 h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-4 min-w-0 bg-bg-surface/95 backdrop-blur-md">
        {/* Breadcrumbs cleanly aligned with workspace content */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs min-w-0 shrink-0">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />}
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="text-text-secondary hover:text-text-primary transition-colors font-medium shrink-0"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      isLast
                        ? "text-text-primary font-semibold"
                        : "text-text-tertiary font-normal shrink-0"
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

      {/* 2. CENTER: Omnibar Search for quick filtering */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-xs lg:max-w-sm min-w-[120px] hidden md:block"
      >
        <div className="relative group w-full">
          <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, cities, categories... (Press Enter)"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </form>

      {/* 3. RIGHT: Workspace selector, Theme, Primary CTA (+ New Scrape), User Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
        {/* Workspace Selector Dropdown */}
        <div className="relative hidden xl:block" ref={workspaceMenuRef}>
          <button
            type="button"
            onClick={() => setIsWorkspaceMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border-default bg-bg-base hover:bg-bg-surface-hover text-xs text-text-secondary transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="font-medium text-text-primary truncate max-w-[120px]">
              {activeWorkspace}
            </span>
            <ChevronDown className="w-3 h-3 text-text-tertiary" />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-lg bg-bg-surface border border-border-subtle shadow-xl py-1 z-50 divide-y divide-border-subtle">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-text-tertiary tracking-wider">
                Workspaces
              </div>
              <div className="py-1">
                {["Primary Workspace", "Sales Dev Agency", "Enterprise Dental"].map((ws) => (
                  <button
                    key={ws}
                    type="button"
                    onClick={() => {
                      setActiveWorkspace(ws);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover text-left transition-colors"
                  >
                    <span>{ws}</span>
                    {activeWorkspace === ws && <Check className="w-3.5 h-3.5 text-accent" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Theme selector */}
        <ThemeSelector />

        {/* Primary CTA: + New Scrape */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickScrape || (() => navigate("/discover"))}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 h-8 gap-1.5 shadow-sm bg-accent hover:bg-accent-hover text-white transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">New Scrape</span>
        </Button>

        {/* User profile dropdown with real logout */}
        <div className="relative pl-1 border-l border-border-subtle" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-bg-surface-hover transition-colors focus:outline-none"
            aria-label="User profile menu"
          >
            <div className="w-7 h-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-[11px] font-bold text-accent shrink-0">
              {getInitials(user?.name, user?.email)}
            </div>
            <div className="hidden lg:block text-left shrink-0">
              <div className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[110px]">
                {user?.name || "Karan Kacha"}
              </div>
              <div className="text-[10px] text-text-tertiary leading-none">
                {user?.role || "OWNER"}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-text-tertiary hidden lg:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-bg-surface border border-border-subtle shadow-2xl py-1.5 z-50 divide-y divide-border-subtle">
              <div className="px-3.5 py-2.5">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || "Karan Kacha"}
                </p>
                <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                  {user?.email || "owner@leadengine.io"}
                </p>
                <div className="mt-1.5">
                  <span className="text-[10px] font-semibold text-accent uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                    Role: {user?.role || "OWNER"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>Workspace Settings</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>Registry API Keys</span>
                </Link>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-danger hover:bg-danger/10 text-left transition-colors font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
};
