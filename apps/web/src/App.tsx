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

import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
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
