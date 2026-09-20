import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Menu,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
  Layers,
  Building,
  Check,
  Palette,
  Sun,
  Moon,
  Keyboard,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../lib/auth";
import { useTheme, THEME_PALETTES } from "../../lib/theme";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { GlobalSearchModal } from "../ui/GlobalSearchModal";

interface HeaderProps {
  onOpenQuickScrape?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickScrape,
  onToggleSidebar,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isAppearanceSubmenuOpen, setIsAppearanceSubmenuOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState("Primary Workspace");

  const userMenuRef = useRef<HTMLDivElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { palette, mode, setPalette, toggleMode } = useTheme();

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
        setIsAppearanceSubmenuOpen(false);
      }
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(e.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    } else {
      setIsSearchModalOpen(true);
    }
  };

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

  const activeTheme = THEME_PALETTES.find((t) => t.id === palette) || THEME_PALETTES[0];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 w-full border-b border-border-subtle bg-bg-surface flex items-stretch select-none shrink-0 transition-colors">
        {/* 1. LEFT BRAND BLOCK: Exactly w-60 (240px) on desktop to align seamlessly with the sidebar */}
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

        {/* 2. MAIN HEADER STRIP: Global Omnibar Search (Center) + Actions & Profile (Right) */}
        <div className="flex-1 h-full flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-3 sm:gap-4 min-w-0 bg-bg-surface/95 backdrop-blur-md">
          {/* CENTER: Global Omnibar Search with Ctrl+K shortcut */}
          <div className="flex-1 max-w-md lg:max-w-lg min-w-0">
            <form onSubmit={handleSearchSubmit} className="relative group w-full">
              <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-accent transition-colors pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => setIsSearchModalOpen(true)}
                placeholder="Search leads, businesses, cities, categories..."
                className="w-full pl-8 pr-16 py-1.5 rounded-lg bg-bg-base border border-border-default text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent transition-colors cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-[10px] font-mono text-text-tertiary"
              >
                ⌘K
              </button>
            </form>
          </div>

          {/* RIGHT: Workspace Selector, Primary CTA (+ New Scrape), User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            {/* Workspace Selector Dropdown */}
            <div className="relative hidden md:block" ref={workspaceMenuRef}>
              <button
                type="button"
                onClick={() => setIsWorkspaceMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-surface-hover text-xs text-text-secondary transition-colors"
                title="Select Active Workspace"
              >
                <Building className="w-3.5 h-3.5 text-text-tertiary" />
                <span className="font-medium text-text-primary truncate max-w-[130px]">
                  {activeWorkspace}
                </span>
                <ChevronDown className="w-3 h-3 text-text-tertiary" />
              </button>

              {isWorkspaceMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-bg-surface border border-border-subtle shadow-xl py-1.5 z-50 divide-y divide-border-subtle">
                  <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-text-tertiary tracking-wider">
                    Select Workspace
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
                        className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover text-left transition-colors"
                      >
                        <span className="font-medium">{ws}</span>
                        {activeWorkspace === ws && <Check className="w-3.5 h-3.5 text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Global CTA: + New Scrape */}
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenQuickScrape || (() => navigate("/discover"))}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 h-8 gap-1.5 shadow-sm bg-accent hover:bg-accent-hover text-white transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Scrape</span>
            </Button>

            {/* User Profile Dropdown */}
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
                    {user?.name || "Karan"}
                  </div>
                  <div className="text-[10px] text-text-tertiary leading-none">
                    {user?.role || "OWNER"}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-text-tertiary hidden lg:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-bg-surface border border-border-subtle shadow-2xl py-1.5 z-50 divide-y divide-border-subtle animate-in fade-in duration-100">
                  {/* User Identity */}
                  <div className="px-3.5 py-2.5">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {user?.name || "Karan Kacha"}
                    </p>
                    <p className="text-[11px] text-text-tertiary truncate mt-0.5">
                      {user?.email || "kachakaran6@gmail.com"}
                    </p>
                    <div className="mt-1.5">
                      <span className="text-[10px] font-bold text-accent uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                        Role: {user?.role || "OWNER"}
                      </span>
                    </div>
                  </div>

                  {/* Account & Workspace Links */}
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-text-tertiary" />
                      <span>Workspace Settings</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-text-tertiary" />
                      <span>Registry API Keys</span>
                    </Link>
                  </div>

                  {/* Appearance & Themes */}
                  <div className="py-1 px-3.5">
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Palette className="w-3.5 h-3.5 text-text-tertiary" />
                        <span>Theme / Mode</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleMode}
                        className="p-1 rounded-md border border-border-default bg-bg-base hover:bg-bg-surface-hover text-text-secondary transition-colors"
                        title={`Switch to ${mode === "dark" ? "Light" : "Dark"} mode`}
                      >
                        {mode === "dark" ? (
                          <Sun className="w-3 h-3 text-warning" />
                        ) : (
                          <Moon className="w-3 h-3 text-accent" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 pb-1">
                      {THEME_PALETTES.map((t) => {
                        const isSelected = t.id === palette;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPalette(t.id)}
                            className={cn(
                              "flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-[10px] font-medium transition-colors",
                              isSelected
                                ? "border-accent bg-accent/10 text-text-primary"
                                : "border-border-default bg-bg-base text-text-secondary hover:text-text-primary"
                            )}
                            title={t.description}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: t.primaryColor }}
                            />
                            <span className="truncate">{t.name.split(" ")[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shortcuts */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsSearchModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover text-left transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Keyboard className="w-3.5 h-3.5 text-text-tertiary" />
                        <span>Quick Search</span>
                      </div>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary bg-bg-base border border-border-default rounded">
                        ⌘K
                      </kbd>
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                        navigate("/login");
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-danger hover:bg-danger/10 text-left transition-colors font-medium"
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

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};
