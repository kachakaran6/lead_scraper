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
    <aside className="w-60 h-screen bg-bg-base border-r border-border-subtle flex flex-col fixed left-0 top-0 z-40 transition-colors">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center gap-2.5 border-b border-border-subtle">
        <div className="w-7 h-7 rounded-md bg-bg-surface border border-border-default flex items-center justify-center">
          <Layers className="w-4 h-4 text-text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[14px] text-text-primary tracking-tight">LeadEngine</span>
          <span className="text-[11px] font-medium text-text-tertiary tracking-[0.02em]">B2B</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <div className="px-2.5 pt-1.5 pb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-text-tertiary">
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
                    ? "text-text-primary bg-bg-surface-hover font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-accent before:rounded-full"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover font-normal"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-text-primary" : "text-text-tertiary"
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
      <div className="p-3 border-t border-border-subtle">
        <div className="flex items-center justify-between px-2 text-[11px] text-text-tertiary">
          <span className="font-medium">System status</span>
          <span className="inline-flex items-center gap-1 text-semantic-success font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success"></span>
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
};
