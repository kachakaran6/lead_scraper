import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  Building2,
  TrendingUp,
  Kanban,
  Globe,
  Megaphone,
  Send,
  Sliders,
  Layers,
  X,
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
  { label: "Opportunities", path: "/opportunities", icon: TrendingUp },
  { label: "Deals Pipeline", path: "/deals", icon: Kanban },
  { label: "Website Audits", path: "/websites", icon: Globe },
  { label: "Campaigns", path: "/campaigns", icon: Megaphone },
  { label: "Outreach & AI", path: "/outreach", icon: Send },
  { label: "Settings & Rules", path: "/settings", icon: Sliders },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed on Desktop, Slide-over on Mobile */}
      <aside
        className={cn(
          "w-60 h-screen bg-bg-base border-r border-border-subtle flex flex-col fixed left-0 top-0 z-50 select-none transition-transform duration-200 ease-in-out",
          // Mobile visibility
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent/15 border border-accent/25 flex items-center justify-center">
              <Layers className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-body text-text-primary tracking-tight">
                LeadEngine
              </span>
              <span className="text-[10px] font-semibold text-accent tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                PRO
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover md:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-3 pt-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
            Intelligence Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors duration-150 relative",
                    isActive
                      ? "text-accent bg-accent/10 font-medium before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-accent before:rounded-r"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover font-normal"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors duration-150",
                        isActive
                          ? "text-accent"
                          : "text-text-secondary group-hover:text-text-primary"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="p-3.5 border-t border-border-subtle bg-bg-surface/50">
          <div className="flex items-center justify-between px-2 text-xs text-text-tertiary">
            <span className="font-normal">Verified Providers</span>
            <span className="inline-flex items-center gap-1.5 text-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Live Real-Data
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
