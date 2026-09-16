import React, { useState } from "react";
import { Search, Plus, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
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

  return (
    <header className="h-14 border-b border-[#232326] bg-[#0A0A0B] sticky top-0 z-30 px-6 flex items-center justify-between gap-4">
      {/* Professional Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs shrink-0">
        <span className="text-[#6B6B70] font-medium">{crumb.section}</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#3E3E44]" />
        {crumb.sub ? (
          <>
            <Link
              to={crumb.path || "/"}
              className="text-[#9B9BA1] hover:text-[#EDEDEF] transition-colors font-medium"
            >
              {crumb.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#3E3E44]" />
            <span className="text-[#EDEDEF] font-medium">{crumb.sub}</span>
          </>
        ) : (
          <span className="text-[#EDEDEF] font-medium">{crumb.title}</span>
        )}
      </nav>

      {/* Omnibar & Action Buttons */}
      <div className="flex items-center gap-3 ml-auto">
        <form onSubmit={handleSearchSubmit} className="w-64 lg:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B6B70] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, cities, niches..."
              className="w-full pl-8 pr-10 py-1.5 rounded-md bg-[#131315] border border-[#2E2E32] text-xs text-[#EDEDEF] placeholder:text-[#6B6B70] focus:outline-none focus:border-[#4C7CF0] focus:ring-1 focus:ring-[#4C7CF0] transition-colors"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[#6B6B70] bg-[#1B1B1E] rounded border border-[#2E2E32]">
                ⌘K
              </kbd>
            </div>
          </div>
        </form>

        {/* Clean Primary Scrape Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenQuickScrape || (() => navigate("/discover"))}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Scrape Run</span>
        </Button>

        {/* User profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#232326]">
          <div className="w-7 h-7 rounded-md bg-[#18181B] border border-[#2E2E32] flex items-center justify-center text-[11px] font-semibold text-[#EDEDEF]">
            AD
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[12px] font-medium text-[#EDEDEF] leading-none">Admin</div>
            <div className="text-[11px] text-[#6B6B70] leading-none mt-1">admin@ultimate-leads.com</div>
          </div>
        </div>
      </div>
    </header>
  );
};
