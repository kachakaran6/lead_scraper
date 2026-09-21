import React, { useEffect, useState } from "react";
import {
  X,
  Shield,
  Clock,
  Mail,
  User,
  AlertCircle,
} from "lucide-react";
import { adminApi } from "../lib/api";
import { AdminUserItem, AuditLogItem } from "../types/admin";
import { formatDate, timeAgo, getStatusBadgeClass, getRoleBadgeClass } from "../lib/utils";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">User Account & Governance</h3>
              <p className="text-[11px] text-slate-500 font-mono">ID: {userId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-xs text-slate-500">Loading user metadata & audit history...</p>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : data?.user ? (
            <>
              {/* Account Overview Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{data.user.name || "Unnamed User"}</h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {data.user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getStatusBadgeClass(data.user.accountStatus)}`}>
                      {data.user.accountStatus}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getRoleBadgeClass(data.user.role)}`}>
                      {data.user.role}
                    </span>
                  </div>
                </div>

                {/* Authorization Status Pill */}
                <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <Shield className="w-4 h-4 text-slate-700" />
                    <div>
                      <span className="text-slate-500">Scraper Access: </span>
                      <span className={`font-bold ${data.user.scraperAccess ? "text-emerald-700" : "text-red-700"}`}>
                        {data.user.scraperAccess ? "AUTHORIZED" : "REVOKED / DENIED"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-slate-500">Last Login: </span>
                      <span className="font-semibold text-slate-800">
                        {data.user.lastLoginAt ? timeAgo(data.user.lastLoginAt) : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Governance & Authorization Metadata */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Governance & Authorization
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500">Approved By:</span>
                    <span className="text-slate-800 font-mono">{data.user.approvedBy || "N/A (Pending/Self-registered)"}</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500">Approved Date:</span>
                    <span className="text-slate-800">{formatDate(data.user.approvedAt)}</span>
                  </div>
                  {data.user.suspendedAt && (
                    <div className="p-2.5 flex justify-between text-orange-700">
                      <span>Suspended Date:</span>
                      <span>{formatDate(data.user.suspendedAt)}</span>
                    </div>
                  )}
                  {data.user.disabledAt && (
                    <div className="p-2.5 flex justify-between text-red-700">
                      <span>Disabled Date:</span>
                      <span>{formatDate(data.user.disabledAt)}</span>
                    </div>
                  )}
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500">Account Created:</span>
                    <span className="text-slate-800">{formatDate(data.user.createdAt)}</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className="text-slate-500">Failed Login Attempts:</span>
                    <span className="text-slate-800 font-mono">{data.user.failedLoginAttempts || 0}</span>
                  </div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Resource Utilization
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-lg font-bold text-slate-900">{data.user.counts?.businesses || 0}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Discovered Leads</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-lg font-bold text-slate-900">{data.user.counts?.discoveryProfiles || 0}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Autopilot Profiles</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <p className="text-lg font-bold text-slate-900">{data.user.counts?.exports || 0}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Data Exports</p>
                  </div>
                </div>
              </div>

              {/* Audit Logs Stream */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Security & Action Audit Trail</span>
                  <span className="text-[10px] font-normal text-slate-500">Last 25 events</span>
                </h4>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {data.auditLogs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No security audit events recorded for this user.
                    </div>
                  ) : (
                    data.auditLogs.map((log) => (
                      <div key={log.id} className="p-2.5 text-xs space-y-0.5 hover:bg-slate-50 transition">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 font-mono text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                        {log.metadata && (
                          <p className="text-[11px] text-slate-600 font-mono truncate">
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
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
