import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  Building2,
  Sparkles,
  Kanban,
  Globe2,
  Megaphone,
  Send,
  Sliders,
  Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Discovery", path: "/discover", icon: Compass },
  { label: "Leads Database", path: "/leads", icon: Building2 },
  { label: "Opportunities", path: "/opportunities", icon: Sparkles },
  { label: "Deals Pipeline", path: "/deals", icon: Kanban },
  { label: "Website Audits", path: "/websites", icon: Globe2 },
  { label: "Campaigns", path: "/campaigns", icon: Megaphone },
  { label: "Outreach & AI", path: "/outreach", icon: Send },
  { label: "Settings & Rules", path: "/settings", icon: Sliders },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 h-screen bg-[#0A0A0B] border-r border-[#232326] flex flex-col fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-[#232326]">
        <div className="w-7 h-7 rounded-md bg-[#131315] border border-[#2E2E32] flex items-center justify-center">
          <Layers className="w-4 h-4 text-[#EDEDEF]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-[#EDEDEF] tracking-tight">LeadEngine</span>
          <span className="text-[11px] font-medium text-[#6B6B70] tracking-[0.02em]">B2B</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-[#6B6B70]">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors relative",
                  isActive
                    ? "text-[#EDEDEF] bg-[#1B1B1E] font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#4C7CF0] before:rounded-full"
                    : "text-[#9B9BA1] hover:text-[#EDEDEF] hover:bg-[#1B1B1E] font-normal"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-[#EDEDEF]" : "text-[#6B6B70]"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Subdued Footer info */}
      <div className="p-3 border-t border-[#232326]">
        <div className="flex items-center justify-between px-2 text-[11px] text-[#6B6B70]">
          <span className="font-medium">System status</span>
          <span className="inline-flex items-center gap-1 text-[#34A874] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34A874]"></span>
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
};
