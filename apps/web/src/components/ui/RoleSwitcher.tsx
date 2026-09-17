import React, { useState, useRef, useEffect } from "react";
import { Shield, ChevronDown, Check } from "lucide-react";
import { useAuth, AppRole } from "../../lib/auth";

const ROLES_INFO: Record<AppRole, { label: string; desc: string; color: string }> = {
  owner: {
    label: "Owner",
    desc: "Full workspace control & billing",
    color: "bg-accent/15 text-accent border-accent/30",
  },
  admin: {
    label: "Admin",
    desc: "Operational control, settings, all data",
    color: "bg-accent/10 text-accent border-border-default",
  },
  manager: {
    label: "Manager",
    desc: "Manage leads, campaigns, stats",
    color: "bg-success/15 text-success border-success/30",
  },
  member: {
    label: "Member",
    desc: "Standard rep: view/work leads, run discovery",
    color: "bg-bg-surface-hover text-text-secondary border-border-default",
  },
  viewer: {
    label: "Viewer",
    desc: "Read-only across assigned resources",
    color: "bg-warning/15 text-warning border-warning/30",
  },
};

export const RoleSwitcher: React.FC = () => {
  const { role, setRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = ROLES_INFO[role] || ROLES_INFO.admin;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors bg-bg-surface border-border-default hover:bg-bg-surface-hover"
        title="Simulate Role (RBAC)"
      >
        <Shield className="w-3.5 h-3.5 text-accent" />
        <span className={`px-1.5 py-0.2 rounded text-[11px] font-mono uppercase tracking-wider border ${current.color}`}>
          {current.label}
        </span>
        <ChevronDown className="w-3 h-3 text-text-tertiary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 rounded-md bg-bg-surface border border-border-default shadow-xl py-1 z-50 divide-y divide-border-subtle">
          <div className="px-3 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider bg-bg-base">
            Active Role Simulation (RBAC)
          </div>

          {(Object.keys(ROLES_INFO) as AppRole[]).map((r) => {
            const info = ROLES_INFO[r];
            const isSelected = r === role;

            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-start justify-between text-xs hover:bg-bg-surface-hover transition-colors ${
                  isSelected ? "bg-bg-surface-hover" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-medium text-text-primary">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase border ${info.color}`}>
                      {info.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    {info.desc}
                  </div>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
