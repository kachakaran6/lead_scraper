import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Code,
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
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('REVOKED') || action.includes('SUSPENDED') || action.includes('DISABLED')) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (action.includes('ROLE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-slate-700" />
            <span>Administrative Audit Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit trail of all administrative events, user governance actions, and authentication attempts.
          </p>
        </div>

        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3 shadow-sm">
        <label className="text-xs font-semibold text-slate-700 shrink-0">Filter Event:</label>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 max-w-xs"
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Admin Actor</th>
                <th className="py-2.5 px-4">Target User</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-900" />
                      <span>Loading audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {log.adminUser ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {log.adminUser.name || log.adminUser.email.split('@')[0]}
                              </span>
                              <span className="text-[10px] text-slate-400">{log.adminUser.email}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-500">
                              {log.adminUserId ? log.adminUserId.slice(0, 8) + '...' : 'SYSTEM / BOOTSTRAP'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {log.targetUser ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {log.targetUser.name || log.targetUser.email.split('@')[0]}
                              </span>
                              <span className="text-[10px] text-slate-400">{log.targetUser.email}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-[11px] text-slate-400">
                              {log.targetUserId ? log.targetUserId.slice(0, 8) + '...' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {log.ipAddress || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-[11px] text-slate-700 font-medium transition-colors shadow-sm"
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="p-4 border-b border-slate-200">
                            <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 overflow-x-auto shadow-sm">
                              <div className="flex items-center space-x-1.5 text-slate-700 mb-1.5 font-semibold">
                                <Code className="h-3.5 w-3.5" />
                                <span>Event Payload Metadata:</span>
                              </div>
                              <pre className="text-slate-600">{JSON.stringify(log.metadata, null, 2)}</pre>
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
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="text-slate-900 font-semibold">{logs.length}</span> of{' '}
            <span className="text-slate-900 font-semibold">{total}</span> records
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-slate-700 font-medium">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
