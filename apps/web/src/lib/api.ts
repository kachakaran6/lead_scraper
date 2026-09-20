import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("leadengine-jwt") ||
    localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API client endpoints
export const leadEngineApi = {
  // Stats
  async getDashboardKpis() {
    try {
      const res = await api.get("/stats");
      return res.data;
    } catch {
      return {
        kpis: {
          total: 0,
          newToday: 0,
          newWeek: 0,
          newMonth: 0,
          withoutWebsite: 0,
          withWebsite: 0,
          highOpportunity: 0,
          contacted: 0,
          replied: 0,
          meetings: 0,
          proposals: 0,
          wonDeals: 0,
        },
        charts: {
          byCity: [],
          byCategory: [],
          byCountry: [],
          byState: [],
          opportunities: [],
          pipeline: [],
        },
      };
    }
  },

  // Businesses & Leads
  async getLeads(params?: Record<string, any>) {
    try {
      const res = await api.get("/businesses", { params });
      return res.data;
    } catch {
      return { items: [], meta: { total: 0, page: 1, limit: 20 } };
    }
  },

  async getLead(id: string) {
    const res = await api.get(`/businesses/${id}`);
    return res.data;
  },

  async updateLeadStatus(id: string, status: string) {
    const res = await api.patch(`/businesses/${id}`, { status });
    return res.data;
  },

  // Campaigns
  async getCampaigns(params?: Record<string, any>) {
    try {
      const res = await api.get("/campaigns", { params });
      return res.data?.items || res.data || [];
    } catch {
      return [];
    }
  },

  async getCampaign(id: string) {
    const res = await api.get(`/campaigns/${id}`);
    return res.data;
  },

  async createCampaign(data: any) {
    const res = await api.post("/campaigns", data);
    return res.data;
  },

  async startCampaign(id: string) {
    const res = await api.post(`/campaigns/${id}/start`);
    return res.data;
  },

  async pauseCampaign(id: string) {
    const res = await api.post(`/campaigns/${id}/pause`);
    return res.data;
  },

  // Universal Discovery
  async discoverLeads(payload: any) {
    return this.searchDiscovery(payload);
  },

  async searchDiscovery(payload: {
    query: string;
    location?: string;
    countryCode?: string;
    stateCode?: string;
    cityName?: string;
    radiusKm?: number;
    provider?: string;
  }) {
    const res = await api.post("/discovery/search", payload);
    return res.data;
  },

  // Deals / CRM
  async getDeals() {
    const res = await api.get("/deals");
    return res.data;
  },

  async updateDealStage(id: string, stageId: string) {
    const res = await api.patch(`/deals/${id}/stage`, { stageId });
    return res.data;
  },

  async createDeal(data: any) {
    const res = await api.post("/deals", data);
    return res.data;
  },

  // Opportunities
  async getOpportunities(params?: Record<string, any>) {
    try {
      const res = await api.get("/opportunities", { params });
      return res.data?.items || res.data || [];
    } catch {
      return [];
    }
  },

  // Websites & Audits
  async getWebsites(params?: Record<string, any>) {
    try {
      const res = await api.get("/websites", { params });
      return res.data?.items || res.data || [];
    } catch {
      return [];
    }
  },

  async getWebsiteAudit(id: string) {
    const res = await api.get(`/websites/${id}/audit`);
    return res.data;
  },

  async runAudit(websiteId: string) {
    const res = await api.post(`/websites/${websiteId}/audit`);
    return res.data;
  },

  async auditWebsite(url: string) {
    const res = await api.post(`/websites/audit`, { url });
    return res.data;
  },

  // Scoring
  async getScoringRules() {
    const res = await api.get("/scoring/rules");
    return res.data;
  },

  async updateScoringRule(id: string, data: any) {
    const res = await api.patch(`/scoring/rules/${id}`, data);
    return res.data;
  },

  // Jobs
  async getJobs(params?: Record<string, any>) {
    const res = await api.get("/jobs", { params });
    return res.data;
  },

  // Exports
  async exportData(params: { format: "csv" | "json" | "excel"; filters?: any }) {
    const res = await api.post("/exports", params, { responseType: "blob" });
    return res.data;
  },

  // AI Services (OpenRouter server-side abstraction)
  async getAiStatus() {
    const res = await api.get("/ai/status");
    return res.data;
  },

  async analyzeLead(lead: Record<string, unknown>) {
    const res = await api.post("/ai/analyze-lead", { lead });
    return res.data;
  },

  async summarizeLead(lead: Record<string, unknown>) {
    const res = await api.post("/ai/summarize-lead", { lead });
    return res.data;
  },

  async researchAssistant(lead: Record<string, unknown>, question: string) {
    const res = await api.post("/ai/research-assistant", { lead, question });
    return res.data;
  },

  async enhanceSearchQuery(query: string) {
    const res = await api.post("/ai/enhance-query", { query });
    return res.data;
  },

  // Providers & Diagnostics
  async getProviderStatus() {
    const res = await api.get("/discovery/status");
    return res.data;
  },

  async getAuditLogs() {
    const res = await api.get("/users/audit/logs");
    return res.data;
  },

  async changePassword(dto: { currentPassword?: string; newPassword?: string }) {
    const res = await api.post("/auth/change-password", dto);
    return res.data;
  },

  // API Keys
  async getApiKeys() {
    const res = await api.get("/api-keys");
    return res.data;
  },

  async createApiKey(name: string) {
    const res = await api.post("/api-keys", { name });
    return res.data;
  },

  // Autopilot 24/7 Discovery Engine
  async getAutopilotStatus() {
    try {
      const res = await api.get("/autopilot/status");
      return res.data;
    } catch {
      return {
        status: "IDLE",
        todayDiscovered: 0,
        dailyTarget: 150,
        totalDiscovered: 0,
        duplicatesPrevented: 0,
        currentRegion: "All Regions",
        currentNiche: "Dentist",
        currentCountry: "India",
        gridProgress: { totalCells: 1, completedCells: 0, percent: 0 },
        recentLogs: [],
        providersHealth: [],
      };
    }
  },

  async getAutopilotProfiles() {
    try {
      const res = await api.get("/autopilot/profiles");
      return res.data;
    } catch {
      return [];
    }
  },

  async createAutopilotProfile(data: {
    name: string;
    targetCountries: string[];
    targetRegions?: string[];
    targetCities?: string[];
    targetNiches: string[];
    opportunityFilters?: any;
    dailyTarget?: number;
    resourceBudget?: string;
    aiProcessingLevel?: string;
  }) {
    const res = await api.post("/autopilot/profiles", data);
    return res.data;
  },

  async updateAutopilotProfile(id: string, data: any) {
    const res = await api.patch(`/autopilot/profiles/${id}`, data);
    return res.data;
  },

  async toggleAutopilot(profileId: string) {
    const res = await api.post(`/autopilot/profiles/${profileId}/toggle`);
    return res.data;
  },

  async triggerAutopilotRun(profileId?: string) {
    const res = await api.post("/autopilot/trigger", { profileId });
    return res.data;
  },

  async getAutopilotActivity(limit = 15) {
    try {
      const res = await api.get("/autopilot/activity", { params: { limit } });
      return res.data;
    } catch {
      return [];
    }
  },

  async getTodayDigest(date?: string) {
    try {
      const res = await api.get("/autopilot/digest/today", { params: { date } });
      return res.data;
    } catch {
      return null;
    }
  },

  async expandNiche(niche: string, country?: string) {
    const res = await api.get("/autopilot/niches/expand", {
      params: { niche, country },
    });
    return res.data;
  },
};


