import React from "react";
import { Shield } from "lucide-react";
import { useAuth } from "../../lib/auth";

export const RoleSwitcher: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || "MEMBER";

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-bg-surface border-border-default">
      <Shield className="w-3.5 h-3.5 text-accent" />
      <span className="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
        {role}
      </span>
    </div>
  );
};
