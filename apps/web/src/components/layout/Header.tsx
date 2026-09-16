import React, { useState } from "react";
import { Search, Plus, Bell, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onOpenQuickScrape?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickScrape }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Search Bar / Omnibar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads, domains, cities, phones, tech stacks... (Press Enter)"
            className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
              ⌘K
            </kbd>
          </div>
        </div>
      </form>

      {/* Action Buttons & Status */}
      <div className="flex items-center gap-3">
        {/* Live sync pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>API 4000 Connected</span>
        </div>

        {/* Quick Launch Discovery Scrape */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickScrape || (() => navigate("/discover"))}
          className="shadow-lg shadow-indigo-600/25 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Scrape Run</span>
        </Button>

        {/* Notification Bell */}
        <button className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 ring-2 ring-slate-950"></span>
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            AD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-white">Admin Engineer</div>
            <div className="text-[10px] text-slate-400">admin@ultimate-leads.com</div>
          </div>
        </div>
      </div>
    </header>
  );
};
