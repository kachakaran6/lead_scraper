import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { LeadsPage } from "./pages/LeadsPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { OpportunitiesPage } from "./pages/OpportunitiesPage";
import { DealsPage } from "./pages/DealsPage";
import { WebsitesPage } from "./pages/WebsitesPage";
import { CampaignsPage } from "./pages/CampaignsPage";
import { OutreachPage } from "./pages/OutreachPage";
import { SettingsPage } from "./pages/SettingsPage";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Platform Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="discover" element={<DiscoverPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="websites" element={<WebsitesPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="outreach" element={<OutreachPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
