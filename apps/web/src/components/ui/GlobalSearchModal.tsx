import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  Compass,
  LayoutDashboard,
  Zap,
  Globe,
  DollarSign,
  Send,
  Sliders,
  ArrowRight,
  Sparkles,
  Command,
  Clock,
} from "lucide-react";
import { leadEngineApi } from "../../lib/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const navItems = [
    { title: "Dashboard Overview", path: "/", icon: LayoutDashboard, category: "Navigation" },
    { title: "24/7 Discovery Engine", path: "/discover", icon: Zap, category: "Engine" },
    { title: "Leads Database", path: "/leads", icon: Building2, category: "Data" },
    { title: "Opportunities & Deal Signals", path: "/opportunities", icon: Sparkles, category: "Pipeline" },
    { title: "Website Intelligence Audits", path: "/websites", icon: Globe, category: "Intelligence" },
    { title: "Deals & Revenue Pipeline", path: "/deals", icon: DollarSign, category: "Pipeline" },
    { title: "AI Outreach Studio", path: "/outreach", icon: Send, category: "Campaigns" },
    { title: "System Settings & Keys", path: "/settings", icon: Sliders, category: "System" },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Live lead search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await leadEngineApi.getLeads({
          search: query.trim(),
          limit: 6,
        });
        setResults(data?.items || []);
      } catch (err) {
        console.warn("Global search failed:", err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSelectLead = (id: string) => {
    navigate(`/leads/${id}`);
    onClose();
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/leads?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const filteredNav = navItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      <div
        className="bg-bg-surface border border-border-subtle rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={handleFullSearch}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle bg-bg-surface"
        >
          <Search className="w-5 h-5 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads, cities, categories, commands... (Press Enter)"
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-text-tertiary hover:text-text-primary px-1.5 py-0.5 rounded bg-bg-base"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-text-tertiary bg-bg-base border border-border-default rounded">
            ESC
          </kbd>
        </form>

        {/* Results / Navigation Body */}
        <div className="overflow-y-auto p-3 space-y-4 text-xs">
          {/* Direct Lead Results */}
          {results.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center justify-between">
                <span>Matching Leads</span>
                <span>{results.length} found</span>
              </div>
              <div className="space-y-1">
                {results.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectLead(lead.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-surface-hover text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text-primary group-hover:text-accent truncate">
                          {lead.name}
                        </div>
                        <div className="text-[11px] text-text-tertiary truncate">
                          {lead.category || "Business"} · {lead.city || lead.state || lead.country || "Verified"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                        {typeof lead.leadScore === "number" ? `${lead.leadScore} Score` : "—"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation / Quick Shortcuts */}
          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              {query ? "Navigation & Shortcuts" : "Quick Navigation"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelectNav(item.path)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-bg-surface-hover text-left transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-md bg-bg-base border border-border-default flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:border-accent/40 transition-colors shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-text-secondary group-hover:text-text-primary truncate">
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2 bg-bg-base border-t border-border-subtle flex items-center justify-between text-[11px] text-text-tertiary">
          <span>Search LeadEngine platform globally</span>
          <span>Press Enter to search all database leads</span>
        </div>
      </div>
    </div>
  );
};
