import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  UserCheck,
  Key,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Ban,
  UserCog,
  Check,
  X,
  Shield,
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
    <div className="space-y-5 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Registered</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats ? stats.totalUsers : '—'}
            </span>
            <span className="text-xs text-slate-400">accounts</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 flex items-center space-x-1.5">
              <span>Pending Review</span>
              {stats && stats.pendingUsers > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-amber-700 tracking-tight">
              {stats ? stats.pendingUsers : '—'}
            </span>
            <span className="text-xs text-slate-400">awaiting approval</span>
          </div>
        </div>

        {/* Active Scraper Authorized */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Scraper Access Active</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-emerald-700 tracking-tight">
              {stats ? stats.scraperActiveUsers : '—'}
            </span>
            <span className="text-xs text-slate-400">authorized</span>
          </div>
        </div>

        {/* Suspended / Disabled */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Suspended / Disabled</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
              <Ban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {stats ? stats.suspendedUsers + stats.disabledUsers : '—'}
            </span>
            <span className="text-xs text-slate-400">restricted</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Controls Header */}
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">User Authorization Control Plane</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage accounts, grant/revoke scraper permissions, and govern administrative roles.
              </p>
            </div>

            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Search & Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
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
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Account Status</th>
                <th className="py-2.5 px-4">Scraper Access</th>
                <th className="py-2.5 px-4">Registered</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-900" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No users match the active search and filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                          {(u.name?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 truncate">
                            {u.name || 'Unnamed User'}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(u.accountStatus)}`}>
                        {u.accountStatus}
                      </span>
                    </td>

                    {/* Scraper Access */}
                    <td className="py-3 px-4">
                      {u.scraperAccess ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="h-3 w-3" />
                          <span>GRANTED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <X className="h-3 w-3" />
                          <span>DENIED</span>
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions Context Menu */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Quick View */}
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setIsDetailsOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
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
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold shadow-sm transition-all flex items-center space-x-1"
                            title="Approve User & Authorize Scraper"
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
                                className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
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
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
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
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
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
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold transition-all"
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
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold transition-all"
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
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
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
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="text-slate-900 font-semibold">{users.length}</span> of{' '}
            <span className="text-slate-900 font-semibold">{totalUsers}</span> accounts
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
        description={`Are you sure you want to revoke scraper access for ${actionUser?.email}? The user will be immediately blocked from starting discovery tasks or scraping leads.`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Change User Role</h3>
            <p className="text-xs text-slate-500">
              Select a new role for <span className="text-slate-900 font-semibold">{actionUser.email}</span>.
            </p>

            <div className="space-y-1.5">
              {(['MEMBER', 'ADMIN', 'OWNER', 'VIEWER'] as Role[]).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    targetRole === r
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={targetRole === r}
                      onChange={() => setTargetRole(r)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="font-semibold uppercase">{r}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsRoleModalOpen(false);
                  setActionUser(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeSubmit}
                disabled={actionLoading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
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
