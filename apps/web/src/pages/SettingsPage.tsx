import React, { useEffect, useState } from "react";
import {
  Palette,
  User,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Moon,
  Sun,
  Lock,
  Server,
  Activity,
  Check,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useTheme, ThemePalette } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { leadEngineApi } from "../lib/api";

export const SettingsPage: React.FC = () => {
  const { palette, setPalette, mode, setMode } = useTheme();
  const { user, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<
    "appearance" | "account" | "smtp" | "whatsapp" | "integrations" | "security"
  >("appearance");

  // Account / Password Change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Integrations & Status
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // SMTP state
  const [smtpAccounts, setSmtpAccounts] = useState<any[]>([]);
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [isAddingSmtp, setIsAddingSmtp] = useState(false);
  const [smtpForm, setSmtpForm] = useState({
    name: "",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromName: "",
    fromEmail: "",
    isDefault: false,
  });
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isTestingSmtpId, setIsTestingSmtpId] = useState<string | null>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");

  // WhatsApp state
  const [whatsappAccounts, setWhatsappAccounts] = useState<any[]>([]);
  const [isLoadingWhatsapp, setIsLoadingWhatsapp] = useState(false);
  const [isAddingWhatsapp, setIsAddingWhatsapp] = useState(false);
  const [whatsappForm, setWhatsappForm] = useState({ name: "", phone: "" });
  const [whatsappFeedback, setWhatsappFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [ai, prov] = await Promise.all([
          leadEngineApi.getAiStatus().catch(() => null),
          leadEngineApi.getProviderStatus().catch(() => null),
        ]);
        setAiStatus(ai);
        setProviderStatus(prov);
      } catch (err) {
        console.error("Failed to load integration status", err);
      }
    };
    fetchStatus();
    loadSmtpAccounts();
    loadWhatsappAccounts();
  }, []);

  const loadSmtpAccounts = async () => {
    setIsLoadingSmtp(true);
    try {
      const data = await leadEngineApi.getSmtpAccounts();
      setSmtpAccounts(data || []);
    } catch (err) {
      console.warn("Failed to load SMTP accounts", err);
    } finally {
      setIsLoadingSmtp(false);
    }
  };

  const loadWhatsappAccounts = async () => {
    setIsLoadingWhatsapp(true);
    try {
      const data = await leadEngineApi.getWhatsappAccounts();
      setWhatsappAccounts(data || []);
    } catch (err) {
      console.warn("Failed to load WhatsApp accounts", err);
    } finally {
      setIsLoadingWhatsapp(false);
    }
  };

  const handleCreateSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpFeedback(null);
    try {
      await leadEngineApi.createSmtpAccount({
        name: smtpForm.name,
        host: smtpForm.host,
        port: Number(smtpForm.port),
        secure: smtpForm.secure,
        username: smtpForm.username,
        password: smtpForm.password,
        fromName: smtpForm.fromName || smtpForm.name,
        fromEmail: smtpForm.fromEmail || smtpForm.username,
        isDefault: smtpForm.isDefault,
      });
      setSmtpFeedback({ type: "success", message: "SMTP account verified and added successfully!" });
      setIsAddingSmtp(false);
      setSmtpForm({
        name: "",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        username: "",
        password: "",
        fromName: "",
        fromEmail: "",
        isDefault: false,
      });
      await loadSmtpAccounts();
    } catch (err: any) {
      setSmtpFeedback({
        type: "error",
        message: err?.response?.data?.message || "Verification failed. Check host, port, or app-password.",
      });
    }
  };

  const handleDeleteSmtp = async (id: string) => {
    if (!confirm("Are you sure you want to remove this SMTP account?")) return;
    try {
      await leadEngineApi.deleteSmtpAccount(id);
      await loadSmtpAccounts();
    } catch (err) {
      console.error("Failed to delete SMTP account", err);
    }
  };

  const handleSetDefaultSmtp = async (id: string) => {
    try {
      await leadEngineApi.setDefaultSmtpAccount(id);
      await loadSmtpAccounts();
    } catch (err) {
      console.error("Failed to set default SMTP", err);
    }
  };

  const handleTestSmtp = async (id: string) => {
    setIsTestingSmtpId(id);
    setSmtpFeedback(null);
    try {
      const res = await leadEngineApi.testSmtpAccount(id, testEmailRecipient || undefined);
      setSmtpFeedback({ type: "success", message: res.message || "SMTP verified successfully!" });
      await loadSmtpAccounts();
    } catch (err: any) {
      setSmtpFeedback({
        type: "error",
        message: err?.response?.data?.message || "SMTP test failed",
      });
    } finally {
      setIsTestingSmtpId(null);
    }
  };

  const handleCreateWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappFeedback(null);
    try {
      await leadEngineApi.createWhatsappAccount(whatsappForm);
      setWhatsappFeedback({ type: "success", message: "WhatsApp profile connected!" });
      setIsAddingWhatsapp(false);
      setWhatsappForm({ name: "", phone: "" });
      await loadWhatsappAccounts();
    } catch (err: any) {
      setWhatsappFeedback({
        type: "error",
        message: err?.response?.data?.message || "Failed to connect WhatsApp account",
      });
    }
  };

  const handleDeleteWhatsapp = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this WhatsApp profile?")) return;
    try {
      await leadEngineApi.deleteWhatsappAccount(id);
      await loadWhatsappAccounts();
    } catch (err) {
      console.error("Failed to delete WhatsApp account", err);
    }
  };

  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await leadEngineApi.getAuditLogs();
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSection === "security") {
      loadAuditLogs();
    }
  }, [activeSection]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", message: "New passwords do not match." });
      return;
    }

    setIsChangingPassword(true);
    try {
      await leadEngineApi.changePassword({ currentPassword, newPassword });
      setPasswordStatus({ type: "success", message: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({
        type: "error",
        message: err.response?.data?.message || "Failed to change password. Check your current password.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const themes: Array<{ id: ThemePalette; name: string; description: string; colors: string[] }> = [
    {
      id: "default",
      name: "Default (Slate & Indigo)",
      description: "Neutral slate dark tone with high-contrast vibrant indigo brand accents.",
      colors: ["#6366f1", "#4f46e5", "#0f172a", "#1e293b"],
    },
    {
      id: "ocean",
      name: "Ocean (Deep Navy & Cyan)",
      description: "Deep oceanic palette engineered for prolonged focused research sessions.",
      colors: ["#0284c7", "#0ea5e9", "#082f49", "#0c4a6e"],
    },
    {
      id: "emerald",
      name: "Emerald (Forest & Mint)",
      description: "High-growth organic green tokens representing qualified sales conversion.",
      colors: ["#10b981", "#059669", "#064e3b", "#065f46"],
    },
    {
      id: "violet",
      name: "Violet (Purple & Fuchsia)",
      description: "Modern executive violet theme with luminous accent highlights.",
      colors: ["#8b5cf6", "#7c3aed", "#2e1065", "#3b0764"],
    },
    {
      id: "amber",
      name: "Amber (Warm Bronze & Gold)",
      description: "Warm golden bronze accents designed for high-stakes dealmakers.",
      colors: ["#f59e0b", "#d97706", "#451a03", "#78350f"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings & Workspace Rules"
        description="Configure design system themes, user security, server-side data integrations, and audit logs."
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 sm:gap-6 border-b border-border-subtle overflow-x-auto">
        {[
          { id: "appearance", label: "Appearance & Themes", icon: Palette },
          { id: "account", label: "Account & Credentials", icon: User },
          { id: "smtp", label: "Email Accounts (SMTP)", icon: Mail },
          { id: "whatsapp", label: "WhatsApp Integration", icon: MessageSquare },
          { id: "integrations", label: "API & Data Integrations", icon: Server },
          { id: "security", label: "Security & Audit Trail", icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`pb-2.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors border-b-2 -mb-px ${
                activeSection === tab.id
                  ? "border-accent text-text-primary font-semibold"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Appearance & 5 Themes */}
      {activeSection === "appearance" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary">Theme System</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Choose from exactly 5 professionally curated design token systems. Saved automatically to your profile.
                </p>
              </div>

              {/* Light / Dark Mode Toggle */}
              <div className="flex items-center gap-2 p-1 bg-bg-base border border-border-default rounded-lg self-start sm:self-auto">
                <button
                  onClick={() => setMode("light")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    mode === "light"
                      ? "bg-bg-surface text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setMode("dark")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    mode === "dark"
                      ? "bg-bg-surface text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* 5 Themes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((t) => {
                const isSelected = palette === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setPalette(t.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border-subtle bg-bg-base hover:border-border-default hover:bg-bg-surface-hover"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-primary">{t.name}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                        {t.description}
                      </p>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border-subtle">
                      {t.colors.map((c, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full border border-border-default shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Account & Credentials */}
      {activeSection === "account" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-semibold text-text-primary">Profile Identity</h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-bg-base border border-border-subtle">
                <span className="text-text-tertiary block text-[11px]">Display Name</span>
                <span className="font-medium text-text-primary text-sm mt-0.5 block">
                  {user?.name || user?.email?.split("@")[0] || "User Profile"}
                </span>
              </div>

              <div className="p-3 rounded-md bg-bg-base border border-border-subtle">
                <span className="text-text-tertiary block text-[11px]">Email Address</span>
                <span className="font-mono text-text-primary mt-0.5 block">
                  {user?.email || "No email on record"}
                </span>
              </div>

              <div className="p-3 rounded-md bg-bg-base border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-text-tertiary block text-[11px]">System Role</span>
                  <span className="font-mono font-medium text-text-primary uppercase mt-0.5 block">
                    {user?.role || "MEMBER"}
                  </span>
                </div>
                <Badge variant="neutral" size="sm">{user?.role || "MEMBER"}</Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-border-subtle">
              <Button
                variant="danger"
                size="sm"
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of Active Session</span>
              </Button>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Update Account Password</h3>
              <p className="text-xs text-text-secondary mt-1">
                Passwords are authenticated server-side and hashed using secure bcrypt/Argon2id.
              </p>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  passwordStatus.type === "success"
                    ? "bg-semantic-success/10 text-semantic-success border border-semantic-success/30"
                    : "bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/30"
                }`}
              >
                {passwordStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">Current Password</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-primary">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isChangingPassword}
                className="text-xs flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isChangingPassword ? "Updating..." : "Change Password"}</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Section 3: API & Data Integrations */}
      {activeSection === "integrations" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">Server-Side Integration Hub</h3>
              <p className="text-xs text-text-secondary mt-1">
                All external API keys are strictly stored on the backend server (`.env`). Secrets are never exposed to the frontend.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* OpenRouter Integration */}
              <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">OpenRouter AI</span>
                    <Badge variant={aiStatus?.configured ? "success" : "neutral"} size="sm">
                      {aiStatus?.configured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    Provides server-side lead analysis, intelligent summaries, and research queries with zero hallucination.
                  </p>
                </div>
                <div className="pt-3 border-t border-border-subtle space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Key Mask:</span>
                    <span className="font-mono text-text-primary">
                      {aiStatus?.configured ? "sk-or-v1-••••••••••••" : "Missing in .env"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Active Model:</span>
                    <span className="font-mono text-text-primary">{aiStatus?.model || "google/gemini-2.0-flash-001"}</span>
                  </div>
                </div>
              </div>

              {/* Google Places Integration */}
              <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">Google Places API</span>
                    <Badge variant={providerStatus?.googlePlaces?.configured ? "success" : "neutral"} size="sm">
                      {providerStatus?.googlePlaces?.configured ? "Configured" : "Optional (Not Set)"}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    Optional provider: Enhances discovery when an official Google Maps API Key is provided. The platform works fully without it using keyless providers.
                  </p>
                </div>
                <div className="pt-3 border-t border-border-subtle space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Key Mask:</span>
                    <span className="font-mono text-text-primary">
                      {providerStatus?.googlePlaces?.maskedKey || "Not configured (Optional)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Provider:</span>
                    <span className="text-text-primary">Official Places API</span>
                  </div>
                </div>
              </div>

              {/* OpenStreetMap Overpass */}
              <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">OpenStreetMap Overpass</span>
                    <Badge variant="success" size="sm">Active (Keyless)</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    Permitted commercial POI provider querying global verified business coordinates and contact details without requiring API keys.
                  </p>
                </div>
                <div className="pt-3 border-t border-border-subtle space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Access:</span>
                    <span className="text-text-primary">Public Overpass / Nominatim</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Status:</span>
                    <span className="text-semantic-success font-medium">Ready (No Key Required)</span>
                  </div>
                </div>
              </div>

              {/* SearXNG Metasearch */}
              <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">SearXNG Metasearch</span>
                    <Badge variant="success" size="sm">Active (Keyless)</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                    Internal metasearch engine aggregating Google, Bing, and DuckDuckGo for live business discovery without requiring any API keys.
                  </p>
                </div>
                <div className="pt-3 border-t border-border-subtle space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Engine:</span>
                    <span className="text-text-primary">Self-Hosted SearXNG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">Status:</span>
                    <span className="text-semantic-success font-medium">Ready (No Key Required)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section: Email Accounts (SMTP) */}
      {activeSection === "smtp" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent" />
                  <span>Outgoing Email Accounts (SMTP)</span>
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Connect your custom email accounts (Gmail, Google Workspace, Outlook, Amazon SES, SendGrid, or custom cPanel).
                  Passwords are encrypted with AES-256 at rest.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingSmtp(!isAddingSmtp)}
                className="gap-1.5 text-xs self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingSmtp ? "Cancel" : "Add SMTP Account"}</span>
              </Button>
            </div>

            {smtpFeedback && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  smtpFeedback.type === "success"
                    ? "bg-semantic-success/15 text-semantic-success border border-semantic-success/30"
                    : "bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30"
                }`}
              >
                {smtpFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{smtpFeedback.message}</span>
              </div>
            )}

            {/* Add SMTP Form Card */}
            {isAddingSmtp && (
              <form onSubmit={handleCreateSmtp} className="p-5 rounded-xl bg-bg-base border border-border-default space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  New Outgoing Mail Server
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Friendly Name</label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Work Gmail or Primary Outreach"
                      value={smtpForm.name}
                      onChange={(e) => setSmtpForm({ ...smtpForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">SMTP Host</label>
                    <Input
                      type="text"
                      required
                      placeholder="smtp.gmail.com or mail.domain.com"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Port</label>
                    <Input
                      type="number"
                      required
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Security</label>
                    <select
                      value={smtpForm.secure ? "true" : "false"}
                      onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.value === "true" })}
                      className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border-default text-xs text-text-primary focus:outline-none focus:border-accent"
                    >
                      <option value="false">STARTTLS (Port 587 - Recommended)</option>
                      <option value="true">SSL / TLS (Port 465)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Username / Email</label>
                    <Input
                      type="text"
                      required
                      placeholder="yourname@gmail.com"
                      value={smtpForm.username}
                      onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Password or App Password</label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••••••••••"
                      value={smtpForm.password}
                      onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Sender Display Name (Optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. Karan from LeadEngine"
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary font-medium mb-1">Sender From Email (Optional)</label>
                    <Input
                      type="email"
                      placeholder="Defaults to username"
                      value={smtpForm.fromEmail}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={smtpForm.isDefault}
                    onChange={(e) => setSmtpForm({ ...smtpForm, isDefault: e.target.checked })}
                    className="rounded border-border-default text-accent focus:ring-accent"
                  />
                  <label htmlFor="isDefault" className="text-xs text-text-secondary cursor-pointer">
                    Set as default outgoing account for all cold outreach campaigns
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingSmtp(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Save Account</span>
                  </Button>
                </div>
              </form>
            )}

            {/* List of Connected SMTP Accounts */}
            {isLoadingSmtp ? (
              <div className="py-8 text-center text-xs text-text-tertiary">Loading SMTP accounts...</div>
            ) : smtpAccounts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
                  <Mail className="w-5 h-5" />
                </div>
                <p className="text-xs text-text-secondary">
                  No SMTP accounts added yet. Click "Add SMTP Account" to send personalized outreach directly from LeadEngine.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {smtpAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl bg-bg-base border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">{acc.name}</span>
                        {acc.isDefault && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent/20 text-accent">
                            DEFAULT
                          </span>
                        )}
                        {acc.isVerified && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-success/15 text-success">
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <div className="text-text-secondary flex flex-wrap items-center gap-2 font-mono text-[11px]">
                        <span>{acc.username}</span>
                        <span>•</span>
                        <span>{acc.host}:{acc.port}</span>
                        <span>•</span>
                        <span>Sender: {acc.fromName || acc.name}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="email"
                        placeholder="Test to: email@..."
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        className="px-2.5 py-1 rounded bg-bg-surface border border-border-default text-xs text-text-primary w-40"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestSmtp(acc.id)}
                        isLoading={isTestingSmtpId === acc.id}
                        className="text-xs gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Test</span>
                      </Button>
                      {!acc.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultSmtp(acc.id)}
                          className="text-xs"
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSmtp(acc.id)}
                        className="text-xs text-danger hover:bg-danger/10 border-border-default"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section: WhatsApp Integration */}
      {activeSection === "whatsapp" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-success" />
                  <span>WhatsApp Outreach Profiles</span>
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Connect your business phone lines for one-click deep link outreach and client conversation history tracking.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddingWhatsapp(!isAddingWhatsapp)}
                className="gap-1.5 text-xs self-start sm:self-auto bg-success hover:bg-success/90 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingWhatsapp ? "Cancel" : "Connect WhatsApp Profile"}</span>
              </Button>
            </div>

            {whatsappFeedback && (
              <div
                className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                  whatsappFeedback.type === "success"
                    ? "bg-success/15 text-success border border-success/30"
                    : "bg-danger/15 text-danger border border-danger/30"
                }`}
              >
                {whatsappFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{whatsappFeedback.message}</span>
              </div>
            )}

            {isAddingWhatsapp && (
              <form onSubmit={handleCreateWhatsapp} className="p-5 rounded-xl bg-bg-base border border-border-default space-y-4 max-w-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Connect WhatsApp Business Line
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Profile Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Sales WhatsApp Line"
                    value={whatsappForm.name}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Phone Number (with Country Code)</label>
                  <Input
                    type="tel"
                    required
                    placeholder="+91 99999 99999 or +1 (555) 000-0000"
                    value={whatsappForm.phone}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, phone: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingWhatsapp(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="bg-success hover:bg-success/90 text-white">
                    Save Profile
                  </Button>
                </div>
              </form>
            )}

            {isLoadingWhatsapp ? (
              <div className="py-8 text-center text-xs text-text-tertiary">Loading WhatsApp profiles...</div>
            ) : whatsappAccounts.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center mx-auto text-success">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-xs text-text-secondary">
                  No WhatsApp accounts registered. Add your phone line to enable instant deep-linking and outreach tracking.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {whatsappAccounts.map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl bg-bg-base border border-border-subtle flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">{w.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-success/15 text-success">
                          {w.status}
                        </span>
                      </div>
                      <div className="font-mono text-text-secondary text-[11px] mt-0.5">
                        {w.phone || "No phone set"}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWhatsapp(w.id)}
                      className="text-xs text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {activeSection === "security" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <span>Security Audit Log & Events</span>
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Immutable server-side audit trail tracking logins, failed attempts, and data exports.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadAuditLogs}
                disabled={isLoadingLogs}
                className="text-xs self-start sm:self-auto"
              >
                {isLoadingLogs ? "Refreshing..." : "Refresh Audit Trail"}
              </Button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary">
                {isLoadingLogs ? "Loading security events..." : "No recent security events recorded in the database audit table."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-primary">
                  <thead className="border-b border-border-subtle text-meta text-text-tertiary">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Timestamp</th>
                      <th className="py-2.5 px-3 font-medium">Action</th>
                      <th className="py-2.5 px-3 font-medium">Status</th>
                      <th className="py-2.5 px-3 font-medium">IP Address</th>
                      <th className="py-2.5 px-3 font-medium">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-surface-hover transition-colors h-12">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-text-primary">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                              log.status === "SUCCESS"
                                ? "bg-semantic-success/15 text-semantic-success"
                                : "bg-semantic-danger/15 text-semantic-danger"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-text-secondary">
                          {log.ipAddress || "::1"}
                        </td>
                        <td className="py-2.5 px-3 text-text-tertiary text-[11px] truncate max-w-[200px]">
                          {log.userAgent || "Browser Client"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
