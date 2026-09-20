import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  ShieldAlert,
  Shield,
  Key,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Ban,
  UserCog,
  Check,
  X,
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { AdminStats, AdminUser, AccountStatus, Role } from '../types/admin';
import { formatDate, getStatusBadgeClass, getRoleBadgeClass } from '../lib/utils';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { UserDetailsModal } from '../components/UserDetailsModal';

export const UsersPage: React.FC = () => {
  // State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [scraperAccessFilter, setScraperAccessFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 15;

  // Modals & Confirmation states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [actionUser, setActionUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role change state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState<Role>('MEMBER');

  // Load data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers({
          search: search.trim() || undefined,
          status: statusFilter !== 'ALL' ? (statusFilter as AccountStatus) : undefined,
          scraperAccess:
            scraperAccessFilter === 'YES' ? true : scraperAccessFilter === 'NO' ? false : undefined,
          role: roleFilter !== 'ALL' ? (roleFilter as Role) : undefined,
          page,
          limit,
        }),
      ]);

      setStats(statsData);
      setUsers(usersData.users);
      setTotalUsers(usersData.total);
      setTotalPages(usersData.totalPages);
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err);
      showToast('error', err.response?.data?.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, scraperAccessFilter, roleFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Action Handlers
  const handleExecuteAction = async () => {
    if (!actionUser || !confirmAction) return;

    setActionLoading(true);
    try {
      switch (confirmAction) {
        case 'APPROVE':
          await adminApi.approveUser(actionUser.id);
          showToast('success', `User ${actionUser.email} has been approved with scraper access granted.`);
          break;
        case 'DISABLE':
          await adminApi.disableUser(actionUser.id);
          showToast('success', `User ${actionUser.email} account has been disabled.`);
          break;
        case 'ENABLE':
          await adminApi.enableUser(actionUser.id);
          showToast('success', `User ${actionUser.email} account has been re-enabled.`);
          break;
        case 'SUSPEND':
          await adminApi.suspendUser(actionUser.id);
          showToast('success', `User ${actionUser.email} account has been suspended.`);
          break;
        case 'GRANT_ACCESS':
          await adminApi.grantScraperAccess(actionUser.id);
          showToast('success', `Scraper access granted to ${actionUser.email}.`);
          break;
        case 'REVOKE_ACCESS':
          await adminApi.revokeScraperAccess(actionUser.id);
          showToast('success', `Scraper access revoked for ${actionUser.email}.`);
          break;
        default:
          break;
      }
      setConfirmAction(null);
      setActionUser(null);
      await fetchData();
    } catch (err: any) {
      console.error(`Action ${confirmAction} failed:`, err);
      showToast('error', err.response?.data?.message || `Failed to perform action on user`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChangeSubmit = async () => {
    if (!actionUser) return;
    setActionLoading(true);
    try {
      await adminApi.changeRole(actionUser.id, targetRole);
      showToast('success', `Role for ${actionUser.email} updated to ${targetRole}.`);
      setIsRoleModalOpen(false);
      setActionUser(null);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium transition-all transform animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Registered</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats ? stats.totalUsers : '...'}
            </span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300 flex items-center space-x-1.5">
              <span>Pending Authorization</span>
              {stats && stats.pendingUsers > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              {stats ? stats.pendingUsers : '...'}
            </span>
            <span className="text-xs text-slate-500">awaiting review</span>
          </div>
        </div>

        {/* Active Scraper Authorized */}
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Scraper Access Active</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {stats ? stats.scraperActiveUsers : '...'}
            </span>
            <span className="text-xs text-slate-500">authorized users</span>
          </div>
        </div>

        {/* Suspended / Disabled */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Suspended / Disabled</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-200 tracking-tight">
              {stats ? stats.suspendedUsers + stats.disabledUsers : '...'}
            </span>
            <span className="text-xs text-slate-500">restricted</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Controls Header */}
        <div className="p-5 border-b border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">User Authorization Matrix</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage user approval status, scraper access permissions, and roles.
              </p>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800/80 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search & Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Status: All</option>
                <option value="PENDING">Status: Pending Review</option>
                <option value="ACTIVE">Status: Active</option>
                <option value="SUSPENDED">Status: Suspended</option>
                <option value="DISABLED">Status: Disabled</option>
              </select>
            </div>

            {/* Scraper Access Filter */}
            <div>
              <select
                value={scraperAccessFilter}
                onChange={(e) => {
                  setScraperAccessFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Scraper Access: All</option>
                <option value="YES">Scraper Access: Enabled</option>
                <option value="NO">Scraper Access: Denied</option>
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Role: All</option>
                <option value="OWNER">Role: Owner</option>
                <option value="ADMIN">Role: Admin</option>
                <option value="MEMBER">Role: Member</option>
                <option value="VIEWER">Role: Viewer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Scraper Access</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No users match the active search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-semibold text-slate-300">
                          {(u.name?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-100 truncate">
                            {u.name || 'Unnamed User'}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(u.accountStatus)}`}>
                        {u.accountStatus}
                      </span>
                    </td>

                    {/* Scraper Access */}
                    <td className="py-3.5 px-4">
                      {u.scraperAccess ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="h-3 w-3" />
                          <span>GRANTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <X className="h-3 w-3" />
                          <span>DENIED</span>
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions Context Menu */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Quick View */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* If Pending: Approve Button */}
                        {u.accountStatus === 'PENDING' && (
                          <button
                            onClick={() => {
                              setActionUser(u);
                              setConfirmAction('APPROVE');
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold shadow-sm transition-all flex items-center space-x-1"
                            title="Approve User & Grant Access"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* If Active: Toggle Scraper Access */}
                        {u.accountStatus === 'ACTIVE' && (
                          <>
                            {u.scraperAccess ? (
                              <button
                                onClick={() => {
                                  setActionUser(u);
                                  setConfirmAction('REVOKE_ACCESS');
                                }}
                                className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors border border-transparent hover:border-amber-500/20"
                                title="Revoke Scraper Access"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionUser(u);
                                  setConfirmAction('GRANT_ACCESS');
                                }}
                                className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                                title="Grant Scraper Access"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                            )}

                            {/* Suspend or Disable */}
                            <button
                              onClick={() => {
                                setActionUser(u);
                                setConfirmAction('SUSPEND');
                              }}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                              title="Suspend User"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {/* If Suspended: Restore */}
                        {u.accountStatus === 'SUSPENDED' && (
                          <button
                            onClick={() => {
                              setActionUser(u);
                              setConfirmAction('ENABLE');
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all"
                            title="Restore User Account"
                          >
                            <span>Restore</span>
                          </button>
                        )}

                        {/* If Disabled: Enable */}
                        {u.accountStatus === 'DISABLED' && (
                          <button
                            onClick={() => {
                              setActionUser(u);
                              setConfirmAction('ENABLE');
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-all"
                            title="Re-enable Account"
                          >
                            <span>Enable</span>
                          </button>
                        )}

                        {/* Role Change */}
                        <button
                          onClick={() => {
                            setActionUser(u);
                            setTargetRole(u.role);
                            setIsRoleModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Change Role"
                        >
                          <UserCog className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="text-slate-200 font-medium">{users.length}</span> of{' '}
            <span className="text-slate-200 font-medium">{totalUsers}</span> users
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

      {/* User Details Modal */}
      <UserDetailsModal
        userId={selectedUser?.id || null}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedUser(null);
        }}
      />

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={confirmAction === 'APPROVE'}
        title="Approve User & Authorize Scraper"
        description={`Are you sure you want to approve ${actionUser?.email}? This will activate the account and grant full permission to use Lead Scrapper features.`}
        confirmText="Approve & Authorize"
        confirmVariant="success"
        isLoading={actionLoading}
        onConfirm={handleExecuteAction}
        onClose={() => {
          setConfirmAction(null);
          setActionUser(null);
        }}
      />

      <ConfirmationDialog
        isOpen={confirmAction === 'REVOKE_ACCESS'}
        title="Revoke Scraper Access"
        description={`Are you sure you want to revoke scraper access for ${actionUser?.email}? The user will be immediately blocked from starting scraper jobs or searching leads.`}
        confirmText="Revoke Access"
        confirmVariant="warning"
        isLoading={actionLoading}
        onConfirm={handleExecuteAction}
        onClose={() => {
          setConfirmAction(null);
          setActionUser(null);
        }}
      />

      <ConfirmationDialog
        isOpen={confirmAction === 'GRANT_ACCESS'}
        title="Grant Scraper Access"
        description={`Are you sure you want to grant scraper access to ${actionUser?.email}?`}
        confirmText="Grant Access"
        confirmVariant="success"
        isLoading={actionLoading}
        onConfirm={handleExecuteAction}
        onClose={() => {
          setConfirmAction(null);
          setActionUser(null);
        }}
      />

      <ConfirmationDialog
        isOpen={confirmAction === 'SUSPEND'}
        title="Suspend User Account"
        description={`Are you sure you want to suspend ${actionUser?.email}? The user's scraper access will be immediately terminated.`}
        confirmText="Suspend Account"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={handleExecuteAction}
        onClose={() => {
          setConfirmAction(null);
          setActionUser(null);
        }}
      />

      <ConfirmationDialog
        isOpen={confirmAction === 'ENABLE'}
        title="Re-enable User Account"
        description={`Are you sure you want to restore/enable ${actionUser?.email}?`}
        confirmText="Enable Account"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleExecuteAction}
        onClose={() => {
          setConfirmAction(null);
          setActionUser(null);
        }}
      />

      {/* Change Role Modal */}
      {isRoleModalOpen && actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Change User Role</h3>
            <p className="text-xs text-slate-400">
              Select a new role for <span className="text-indigo-400 font-semibold">{actionUser.email}</span>.
            </p>

            <div className="space-y-2">
              {(['MEMBER', 'ADMIN', 'OWNER', 'VIEWER'] as Role[]).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    targetRole === r
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={targetRole === r}
                      onChange={() => setTargetRole(r)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold uppercase">{r}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setActionUser(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeSubmit}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
