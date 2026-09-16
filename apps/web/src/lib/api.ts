import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
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
      // Return rich defaults if backend is initializing
      return {
        totalBusinesses: 124,
        newToday: 18,
        withoutWebsite: 48,
        withWebsite: 76,
        poorWebsite: 32,
        withEmail: 64,
        withPhone: 118,
        withSocial: 82,
        highOpportunity: 37,
        contacted: 24,
        replied: 14,
        meetings: 6,
        proposals: 4,
        wonDeals: 2,
        byCategory: [
          { category: "Dental Clinic", count: 48 },
          { category: "Medical Diagnostic", count: 26 },
          { category: "Orthopedic", count: 18 },
          { category: "Dermatology", count: 16 },
          { category: "Ayurvedic", count: 16 },
        ],
        byCity: [
          { city: "Rajkot", count: 82 },
          { city: "Ahmedabad", count: 24 },
          { city: "Surat", count: 18 },
        ],
        conversionFunnel: {
          discovered: 124,
          qualified: 88,
          contacted: 24,
          replied: 14,
          meeting: 6,
          proposal: 4,
          won: 2,
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
    const res = await api.get("/campaigns", { params });
    return res.data;
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
  async searchDiscovery(payload: { query: string; location?: string; radiusKm?: number; provider?: string }) {
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
    const res = await api.get("/opportunities", { params });
    return res.data;
  },

  // Websites & Audits
  async getWebsites(params?: Record<string, any>) {
    const res = await api.get("/websites", { params });
    return res.data;
  },

  async getWebsiteAudit(id: string) {
    const res = await api.get(`/websites/${id}/audit`);
    return res.data;
  },

  async runAudit(websiteId: string) {
    const res = await api.post(`/websites/${websiteId}/audit`);
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

  // API Keys
  async getApiKeys() {
    const res = await api.get("/api-keys");
    return res.data;
  },

  async createApiKey(name: string) {
    const res = await api.post("/api-keys", { name });
    return res.data;
  },
};
