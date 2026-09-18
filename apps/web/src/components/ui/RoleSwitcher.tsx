import React, { useState, useRef, useEffect } from "react";
import { Shield, ChevronDown, Check } from "lucide-react";
import { useAuth, AppRole } from "../../lib/auth";

const ROLES_INFO: Record<AppRole, { label: string; desc: string }> = {
  owner: {
    label: "Owner",
    desc: "Full workspace control & billing",
  },
  admin: {
    label: "Admin",
    desc: "Operational control, settings, all data",
  },
  manager: {
    label: "Manager",
    desc: "Manage leads, campaigns, stats",
  },
  member: {
    label: "Member",
    desc: "Standard rep: view/work leads, run discovery",
  },
  viewer: {
    label: "Viewer",
    desc: "Read-only across assigned resources",
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
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium bg-accent-subtle border-accent/30 hover:bg-accent/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        title="Simulate Role (RBAC)"
      >
        <Shield className="w-3.5 h-3.5 text-accent" />
        <span className="text-[11px] font-medium text-accent uppercase tracking-wider">
          {current.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-text-tertiary transition-transform duration-150 ${
            isOpen ? "rotate-180 text-text-primary" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-lg bg-bg-surface border border-border-subtle shadow-dropdown py-1 z-50 divide-y divide-border-subtle">
          <div className="px-3 py-2 text-meta text-text-tertiary">
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
                className={`w-full px-3 py-2 text-left flex items-start justify-between text-xs hover:bg-bg-surface-hover transition-colors duration-100 ${
                  isSelected ? "bg-bg-surface-hover/80 font-medium" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-text-primary">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {info.label}
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
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
