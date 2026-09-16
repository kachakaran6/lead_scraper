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
  Database,
  Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Discovery", path: "/discover", icon: Compass, badge: "Live", badgeColor: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" },
  { label: "Leads Database", path: "/leads", icon: Building2 },
  { label: "Opportunities", path: "/opportunities", icon: Sparkles, badge: "High ROI", badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30" },
  { label: "Deals Pipeline", path: "/deals", icon: Kanban },
  { label: "Website Audits", path: "/websites", icon: Globe2 },
  { label: "Campaigns", path: "/campaigns", icon: Megaphone },
  { label: "Outreach & AI", path: "/outreach", icon: Send },
  { label: "Settings & Rules", path: "/settings", icon: Sliders },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 h-screen bg-slate-950/80 border-r border-slate-800/80 flex flex-col fixed left-0 top-0 z-40 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base tracking-tight text-white">LeadEngine</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">B2B Intelligence Suite</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm",
                        isActive ? "bg-white/20 text-white" : item.badgeColor
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Pill */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Cluster Status</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operational
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span>PostgreSQL 17</span>
              <span className="text-slate-300 font-mono">5450 OK</span>
            </div>
            <div className="flex justify-between">
              <span>Redis Engine</span>
              <span className="text-slate-300 font-mono">6379 OK</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
