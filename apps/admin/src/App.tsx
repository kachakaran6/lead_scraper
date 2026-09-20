import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, isAdmin } from './lib/auth';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Protected Route Guard
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (!isAuthenticated() || !isAdmin()) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/users"
          element={
            <ProtectedAdminRoute>
              <UsersPage />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/audit-logs"
          element={
            <ProtectedAdminRoute>
              <AuditLogsPage />
            </ProtectedAdminRoute>
          }
        />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
