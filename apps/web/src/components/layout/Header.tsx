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
} from "lucide-react";
import { Button } from "../ui/Button";
import { ThemeSelector } from "../ui/ThemeSelector";
import { useAuth } from "../../lib/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";

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
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
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

  const getBreadcrumb = (pathname: string) => {
    if (pathname === "/" || pathname === "") return { section: "Platform", title: "Dashboard" };
    if (pathname.startsWith("/discover")) return { section: "Engine", title: "Discovery" };
    if (pathname.startsWith("/leads/")) {
      return { section: "Prospects", title: "Leads Database", path: "/leads", sub: "Lead Intel" };
    }
    if (pathname.startsWith("/leads")) return { section: "Prospects", title: "Leads Database" };
    if (pathname.startsWith("/opportunities")) return { section: "Intelligence", title: "Opportunities" };
    if (pathname.startsWith("/deals")) return { section: "Pipeline", title: "Deals Pipeline" };
    if (pathname.startsWith("/websites")) return { section: "Audits", title: "Website Center" };
    if (pathname.startsWith("/campaigns")) return { section: "Engine", title: "Campaigns" };
    if (pathname.startsWith("/outreach")) return { section: "Outreach", title: "AI Pitch Studio" };
    if (pathname.startsWith("/settings")) return { section: "Settings", title: "Engine Rules & Config" };
    return { section: "Platform", title: "Dashboard" };
  };

  const crumb = getBreadcrumb(location.pathname);

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
    return "US";
  };

  return (
    <header className="sticky top-0 z-30 h-14 w-full border-b border-border-subtle bg-bg-base/95 backdrop-blur-sm px-4 sm:px-6 flex items-center justify-between gap-3 select-none shrink-0">
      {/* 1. Mobile Menu Toggle + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-border-default bg-bg-surface hover:bg-bg-surface-hover text-text-secondary md:hidden shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs min-w-0">
          <span className="text-text-tertiary font-normal shrink-0">{crumb.section}</span>
          <ChevronRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
          {crumb.sub ? (
            <>
              <Link
                to={crumb.path || "/"}
                className="text-text-secondary hover:text-text-primary transition-colors font-medium shrink-0"
              >
                {crumb.title}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
              <span className="text-text-primary font-medium truncate max-w-[120px] sm:max-w-none">
                {crumb.sub}
              </span>
            </>
          ) : (
            <span className="text-text-primary font-medium truncate">{crumb.title}</span>
          )}
        </nav>
      </div>

      {/* 2. Omnibar Search Input */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-xs md:max-w-sm mx-auto min-w-[140px] shrink hidden xs:block"
      >
        <div className="relative group w-full">
          <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-text-primary transition-colors pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, cities, niches..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-bg-surface border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </form>

      {/* 3. Action controls: Theme selector, New Scrape, User Menu */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <ThemeSelector />

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickScrape || (() => navigate("/discover"))}
          className="shrink-0 text-xs font-medium px-3 py-1.5 h-8 hidden sm:inline-flex"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Scrape</span>
        </Button>

        {/* User profile dropdown with real logout */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-2 border-l border-border-subtle hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-[11px] font-semibold text-accent shrink-0">
              {getInitials(user?.name, user?.email)}
            </div>
            <div className="hidden lg:block text-left shrink-0">
              <div className="text-xs font-medium text-text-primary leading-none capitalize truncate max-w-[110px]">
                {user?.name || "Member"}
              </div>
              <div className="text-[10px] text-text-tertiary leading-none mt-1">
                {user?.role || "MEMBER"}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-text-tertiary hidden lg:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-bg-surface border border-border-subtle shadow-xl py-1.5 z-50 divide-y divide-border-subtle">
              <div className="px-3.5 py-2.5">
                <p className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || "Active Member"}
                </p>
                <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                  {user?.email || "user@leadengine.io"}
                </p>
                <div className="mt-1.5">
                  <span className="text-[10px] font-semibold text-accent uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                    Role: {user?.role || "MEMBER"}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Account & Settings</span>
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security & API Keys</span>
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
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
