import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  Clock,
  Mail,
  User,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Calendar,
  Lock,
} from "lucide-react";
import { adminApi } from "../lib/api";
import { AdminUserItem, AuditLogItem } from "../types/admin";
import { formatDate, timeAgo } from "../lib/utils";

interface UserDetailsModalProps {
  userId: string | null;
  onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  userId,
  onClose,
}) => {
  const [data, setData] = useState<{
    user: (AdminUserItem & { failedLoginAttempts: number; counts: Record<string, number> }) | null;
    auditLogs: AuditLogItem[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    adminApi
      .getUserById(userId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Failed to load user details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  if (!userId) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>;
      case "PENDING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Approval</span>;
      case "SUSPENDED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">Suspended</span>;
      case "DISABLED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">Disabled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">User Account Details</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Loading user metadata & audit history...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          ) : data?.user ? (
            <>
              {/* Account Overview Card */}
              <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{data.user.name || "Unnamed User"}</h4>
                    <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      {data.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(data.user.accountStatus)}
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {data.user.role}
                    </span>
                  </div>
                </div>

                {/* Authorization Status Pill */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <div>
                      <span className="text-slate-400">Scraper Access: </span>
                      <span className={`font-bold ${data.user.scraperAccess ? "text-emerald-400" : "text-rose-400"}`}>
                        {data.user.scraperAccess ? "AUTHORIZED (Allowed to scrape)" : "REVOKED / RESTRICTED"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-400">Last Login: </span>
                      <span className="font-semibold text-slate-200">
                        {data.user.lastLoginAt ? timeAgo(data.user.lastLoginAt) : "Never logged in"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorization & Governance Metadata */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Governance & Authorization
                </h4>
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl divide-y divide-slate-800/60 text-xs">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Approved By:</span>
                    <span className="text-slate-200 font-mono">{data.user.approvedBy || "N/A (Pending/Self-registered)"}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Approved Date:</span>
                    <span className="text-slate-200">{formatDate(data.user.approvedAt)}</span>
                  </div>
                  {data.user.suspendedAt && (
                    <div className="p-3 flex justify-between text-orange-400">
                      <span>Suspended Date:</span>
                      <span>{formatDate(data.user.suspendedAt)}</span>
                    </div>
                  )}
                  {data.user.disabledAt && (
                    <div className="p-3 flex justify-between text-rose-400">
                      <span>Disabled Date:</span>
                      <span>{formatDate(data.user.disabledAt)}</span>
                    </div>
                  )}
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Created Account:</span>
                    <span className="text-slate-200">{formatDate(data.user.createdAt)}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Failed Login Attempts:</span>
                    <span className="text-slate-200 font-mono">{data.user.failedLoginAttempts || 0}</span>
                  </div>
                </div>
              </div>

              {/* Usage & Resource Counts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Resource Utilization
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-center">
                    <p className="text-xl font-bold text-indigo-400">{data.user.counts?.businesses || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Discovered Leads</p>
                  </div>
                  <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-center">
                    <p className="text-xl font-bold text-emerald-400">{data.user.counts?.discoveryProfiles || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Autopilot Profiles</p>
                  </div>
                  <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-center">
                    <p className="text-xl font-bold text-amber-400">{data.user.counts?.exports || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Data Exports</p>
                  </div>
                </div>
              </div>

              {/* Audit Logs Stream for this User */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Security & Action Audit Trail</span>
                  <span className="text-[10px] font-normal text-slate-500">Last 25 events</span>
                </h4>
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                  {data.auditLogs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No security audit events recorded for this user.
                    </div>
                  ) : (
                    data.auditLogs.map((log) => (
                      <div key={log.id} className="p-3 text-xs space-y-1 hover:bg-slate-800/30 transition">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-200 font-mono">
                            {log.action}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                        {log.metadata && (
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {JSON.stringify(log.metadata)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/50 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
