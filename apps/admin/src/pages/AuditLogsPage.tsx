import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Clock,
  Activity,
  Code,
  Globe,
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { AdminAuditLog } from '../types/admin';
import { formatDate } from '../lib/utils';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAuditLogs({
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        page,
        limit,
      });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadgeClass = (action: string) => {
    if (action.includes('APPROVED') || action.includes('GRANTED') || action.includes('ENABLED')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (action.includes('REVOKED') || action.includes('SUSPENDED') || action.includes('DISABLED')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (action.includes('ROLE')) {
      return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            <span>Administrative Audit Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of all user authorization, role change, and access mutations.
          </p>
        </div>

        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center space-x-4">
        <label className="text-xs font-medium text-slate-400 shrink-0">Filter by Event:</label>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
        >
          <option value="ALL">All Actions</option>
          <option value="USER_APPROVED">USER_APPROVED</option>
          <option value="SCRAPER_ACCESS_GRANTED">SCRAPER_ACCESS_GRANTED</option>
          <option value="SCRAPER_ACCESS_REVOKED">SCRAPER_ACCESS_REVOKED</option>
          <option value="USER_DISABLED">USER_DISABLED</option>
          <option value="USER_ENABLED">USER_ENABLED</option>
          <option value="USER_SUSPENDED">USER_SUSPENDED</option>
          <option value="ROLE_CHANGED">ROLE_CHANGED</option>
          <option value="BOOTSTRAP_ADMIN">BOOTSTRAP_ADMIN</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Admin Actor</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                      <span>Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {log.adminUser ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200">
                                {log.adminUser.name || log.adminUser.email.split('@')[0]}
                              </span>
                              <span className="text-[10px] text-slate-500">{log.adminUser.email}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-500">
                              {log.adminUserId ? log.adminUserId.slice(0, 8) + '...' : 'SYSTEM / BOOTSTRAP'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {log.targetUser ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200">
                                {log.targetUser.name || log.targetUser.email.split('@')[0]}
                              </span>
                              <span className="text-[10px] text-slate-500">{log.targetUser.email}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-500">
                              {log.targetUserId ? log.targetUserId.slice(0, 8) + '...' : 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {log.ipAddress || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 font-medium transition-colors"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950/60">
                          <td colSpan={6} className="p-4 border-b border-slate-800">
                            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                              <div className="flex items-center space-x-2 text-indigo-400 mb-2 font-semibold">
                                <Code className="h-3.5 w-3.5" />
                                <span>Event Payload Metadata:</span>
                              </div>
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-medium">{logs.length}</span> of{' '}
            <span className="text-slate-200 font-medium">{total}</span> records
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-slate-300">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
