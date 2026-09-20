import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuthSession } from '../lib/auth';
import { ShieldCheck, Users, FileText, LogOut, ExternalLink } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login');
  };

  const navItems = [
    { label: 'User Management', path: '/users', icon: Users },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/users" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
                <div className="h-full w-full bg-slate-900 rounded-[11px] flex items-center justify-center group-hover:bg-slate-900/80 transition-colors">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm tracking-tight text-white">LEAD SCRAPPER</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Control Plane
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Production Authorization Admin</span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/users' && location.pathname === '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            <a
              href="https://leads.kachakaran.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors py-1.5 px-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/30 bg-slate-900/40"
              title="Open Lead Scrapper Application"
            >
              <span>Lead Scrapper App</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {user && (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">{user.name || user.email.split('@')[0]}</div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end space-x-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span className="uppercase font-medium text-indigo-400">{user.role}</span>
                  </div>
                </div>

                <div className="h-8 w-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-semibold text-xs flex items-center justify-center">
                  {(user.name?.[0] || user.email[0]).toUpperCase()}
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Lead Scrapper Admin Security Layer • Production Node</span>
          <span className="text-[11px] text-slate-600 font-mono">Protected by Server-side RBAC & Access Guards</span>
        </div>
      </footer>
    </div>
  );
};
