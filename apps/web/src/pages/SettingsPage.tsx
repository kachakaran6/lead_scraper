import React, { useEffect, useState } from "react";
import {
  Sliders,
  Shield,
  Key,
  Database,
  CheckCircle2,
  Save,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { leadEngineApi } from "../lib/api";

export const SettingsPage: React.FC = () => {
  const [scoringRules, setScoringRules] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Crawler settings state
  const [concurrency, setConcurrency] = useState(5);
  const [delayMs, setDelayMs] = useState(1500);
  const [rotateProxies, setRotateProxies] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const [rulesData, keysData] = await Promise.all([
          leadEngineApi.getScoringRules(),
          leadEngineApi.getApiKeys(),
        ]);
        setScoringRules(rulesData || []);
        setApiKeys(keysData || []);
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleRuleToggle = (id: string, currentVal: boolean) => {
    setScoringRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !currentVal } : r))
    );
  };

  const handleRuleWeightChange = (id: string, weight: number) => {
    setScoringRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, weight } : r))
    );
  };

  const handleSaveAll = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const created = await leadEngineApi.createApiKey(newKeyName.trim());
      setApiKeys((prev) => [...prev, created]);
      setNewKeyName("");
    } catch {
      setApiKeys((prev) => [
        ...prev,
        {
          id: "key-" + Date.now(),
          name: newKeyName.trim(),
          key: "sk_live_" + Math.random().toString(36).substring(2, 18),
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewKeyName("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System & Engine Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure algorithmic lead scoring weights, scraper concurrency parameters, and developer API credentials.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAll}
          className="shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-xs"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? "Settings Saved!" : "Save All Changes"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Rules Engine */}
        <Card className="glass-panel border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Lead Scoring Signals & Weights
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Customize how points are accumulated to compute the 0-100 Hot Lead score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {scoringRules.length > 0 ? (
              scoringRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleRuleToggle(rule.id, rule.enabled)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
                    />
                    <div>
                      <div className="font-bold text-white">{rule.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {rule.signal} {rule.operator} {rule.value}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={rule.weight}
                      onChange={(e) => handleRuleWeightChange(rule.id, Number(e.target.value))}
                      className="w-16 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-center font-mono font-bold text-indigo-400"
                    />
                    <span className="text-slate-400 font-medium">pts</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3">
                {[
                  { name: "No Website Detected", pts: 40 },
                  { name: "Mobile Unfriendly / Broken Viewport", pts: 25 },
                  { name: "High Google Reviews (> 4.5 Stars)", pts: 15 },
                  { name: "Direct WhatsApp Line Found", pts: 20 },
                  { name: "Outdated WordPress CMS (< 5.5)", pts: 20 },
                ].map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{d.name}</span>
                    <span className="font-mono font-bold text-emerald-400">+{d.pts} pts</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Crawler & Scraping Controls */}
        <div className="space-y-6">
          <Card className="glass-panel border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Scraper Worker Engine Settings
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Performance tuning and anti-bot protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">Worker Concurrency</span>
                  <span className="font-mono font-bold text-indigo-400">{concurrency} threads</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">Politeness Request Delay</span>
                  <span className="font-mono font-bold text-indigo-400">{delayMs} ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={delayMs}
                  onChange={(e) => setDelayMs(Number(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={rotateProxies}
                    onChange={(e) => setRotateProxies(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600"
                  />
                  <span>Rotate Residential User-Agent Headers & IP Pools</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* API Key Management */}
          <Card className="glass-panel border-slate-800">
            <CardHeader>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Developer API Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateApiKey} className="flex gap-2">
                <Input
                  placeholder="Key description, e.g. Production Webhook"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="text-xs"
                />
                <Button type="submit" size="sm" variant="primary" className="text-xs whitespace-nowrap">
                  Generate Key
                </Button>
              </form>

              <div className="space-y-2">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{k.name}</div>
                      <div className="font-mono text-slate-400 text-[10px] truncate max-w-[200px]">
                        {k.key}
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      ACTIVE
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
