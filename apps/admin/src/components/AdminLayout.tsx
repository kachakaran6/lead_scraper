import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuthSession } from '../lib/auth';
import { ShieldCheck, Users, FileText, LogOut, ExternalLink, Menu, X } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const navItems = [
    { label: 'User Management', path: '/users', icon: Users },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/users" className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs tracking-tight text-slate-900 uppercase">LEADENGINE ADMIN</span>
                  <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    CONTROL PLANE
                  </span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path || (item.path === '/users' && location.pathname === '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            <a
              href="https://leads.kachakaran.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 bg-white"
              title="Open Lead Discovery App"
            >
              <span>LeadEngine App</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>

            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800">
                    {user.name || user.email.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-end space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                    <span className="font-semibold text-slate-600 uppercase">{user.role}</span>
                  </div>
                </div>

                <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center">
                  {(user.name?.[0] || user.email[0]).toUpperCase()}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path || (item.path === '/users' && location.pathname === '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>LeadEngine Administration & Governance Console</span>
          <span className="text-[11px] text-slate-400 font-mono">
            Server-Enforced Access Control • Node Production
          </span>
        </div>
      </footer>
    </div>
  );
};
