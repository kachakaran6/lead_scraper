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
  Radio,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Intelligence Platform",
    items: [
      { label: "Dashboard", path: "/", icon: LayoutDashboard },
      { label: "Discovery", path: "/discover", icon: Compass, badge: "Live" },
      { label: "Leads Database", path: "/leads", icon: Building2 },
    ],
  },
  {
    title: "Opportunities",
    items: [
      { label: "Opportunities", path: "/opportunities", icon: TrendingUp },
      { label: "Deals Pipeline", path: "/deals", icon: Kanban },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Website Audits", path: "/websites", icon: Globe },
      { label: "Campaigns", path: "/campaigns", icon: Megaphone },
      { label: "Outreach & AI", path: "/outreach", icon: Send },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings & Rules", path: "/settings", icon: Sliders },
    ],
  },
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

      {/* Sidebar Container */}
      <aside
        className={cn(
          "w-60 h-[calc(100vh-64px)] bg-bg-surface border-r border-border-subtle flex flex-col fixed md:sticky top-16 left-0 z-40 select-none transition-transform duration-200 ease-in-out shrink-0",
          // Mobile visibility: drawer overlay
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Navigation Section Groups */}
        <nav
          aria-label="Main Navigation"
          className="flex-1 px-3 py-4 space-y-5 overflow-y-auto"
        >
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-all duration-150 relative",
                          isActive
                            ? "text-text-primary bg-bg-surface-hover font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:bg-accent before:rounded-r"
                            : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover/70 font-normal"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={cn(
                                "w-4 h-4 shrink-0 transition-colors duration-150",
                                isActive
                                  ? "text-accent"
                                  : "text-text-tertiary group-hover:text-text-primary"
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-semibold text-accent uppercase px-1.5 py-0.2 rounded bg-accent/10 border border-accent/20">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Live Engine Status Footer */}
        <div className="p-3 border-t border-border-subtle bg-bg-base/50">
          <div className="flex items-center justify-between px-2 text-[11px] text-text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="w-3 h-3 text-success animate-pulse" />
              OSM & SearXNG
            </span>
            <span className="text-success font-semibold text-[10px] uppercase tracking-wide">
              Live Engine
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
