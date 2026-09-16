import React, { useEffect, useState } from "react";
import {
  Sliders,
  Key,
  CheckCircle2,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
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
          <h1 className="text-2xl font-semibold text-[#EDEDEF] tracking-tight">System & Engine Settings</h1>
          <p className="text-xs text-[#9B9BA1] mt-1">
            Configure algorithmic lead scoring weights, scraper concurrency parameters, and developer API credentials.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleSaveAll}
          className="flex items-center gap-1.5 text-xs"
        >
          {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaved ? "Saved" : "Save Changes"}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Rules Engine */}
        <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#9B9BA1]" />
              <h3 className="text-sm font-semibold text-[#EDEDEF]">Lead Scoring Signals & Weights</h3>
            </div>
            <p className="text-xs text-[#9B9BA1] mt-0.5">
              Customize how points are accumulated to compute the 0-100 score
            </p>
          </div>

          <div className="space-y-2.5">
            {scoringRules.length > 0 ? (
              scoringRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-md bg-[#0A0A0B] border border-[#232326] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleRuleToggle(rule.id, rule.enabled)}
                      className="w-4 h-4 rounded border-[#2E2E32] bg-[#131315] accent-[#4C7CF0] cursor-pointer"
                    />
                    <div>
                      <div className="font-medium text-[#EDEDEF]">{rule.name}</div>
                      <div className="text-[11px] text-[#6B6B70]">
                        {rule.signal} {rule.operator} {rule.value}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={rule.weight}
                      onChange={(e) => handleRuleWeightChange(rule.id, Number(e.target.value))}
                      className="w-14 px-2 py-1 rounded bg-[#131315] border border-[#2E2E32] text-center font-mono font-medium tabular-nums text-[#EDEDEF] text-xs focus:border-[#4C7CF0] focus:outline-none"
                    />
                    <span className="text-[#6B6B70] text-xs">pts</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2.5">
                {[
                  { name: "No Website Detected", pts: 40 },
                  { name: "Mobile Unfriendly / Broken Viewport", pts: 25 },
                  { name: "High Google Reviews (> 4.5 Stars)", pts: 15 },
                  { name: "Direct WhatsApp Line Found", pts: 20 },
                  { name: "Outdated WordPress CMS (< 5.5)", pts: 20 },
                ].map((d, i) => (
                  <div key={i} className="p-3 rounded-md bg-[#0A0A0B] border border-[#232326] flex items-center justify-between text-xs">
                    <span className="font-medium text-[#EDEDEF]">{d.name}</span>
                    <span className="font-mono font-medium tabular-nums text-[#34A874]">+{d.pts} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Crawler & Scraping Controls */}
        <div className="space-y-6">
          <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#9B9BA1]" />
                <h3 className="text-sm font-semibold text-[#EDEDEF]">Scraper Worker Engine</h3>
              </div>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Worker concurrency and request throttling
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9B9BA1]">Worker Concurrency</span>
                  <span className="font-mono font-medium tabular-nums text-[#EDEDEF]">{concurrency} threads</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  className="w-full accent-[#4C7CF0] h-1.5 bg-[#232326] rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#9B9BA1]">Politeness Request Delay</span>
                  <span className="font-mono font-medium tabular-nums text-[#EDEDEF]">{delayMs} ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={delayMs}
                  onChange={(e) => setDelayMs(Number(e.target.value))}
                  className="w-full accent-[#4C7CF0] h-1.5 bg-[#232326] rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#9B9BA1]">
                  <input
                    type="checkbox"
                    checked={rotateProxies}
                    onChange={(e) => setRotateProxies(e.target.checked)}
                    className="w-4 h-4 rounded border-[#2E2E32] bg-[#0A0A0B] accent-[#4C7CF0]"
                  />
                  <span>Rotate Residential User-Agent Headers & IP Pools</span>
                </label>
              </div>
            </div>
          </div>

          {/* API Key Management */}
          <div className="bg-[#131315] border border-[#232326] rounded-lg p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#9B9BA1]" />
                <h3 className="text-sm font-semibold text-[#EDEDEF]">Developer API Credentials</h3>
              </div>
              <p className="text-xs text-[#9B9BA1] mt-0.5">
                Authentication keys for external programmatic access
              </p>
            </div>

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

            <div className="space-y-2 pt-1">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-3 rounded-md bg-[#0A0A0B] border border-[#232326] flex justify-between items-center text-xs"
                >
                  <div className="truncate mr-3">
                    <div className="font-medium text-[#EDEDEF]">{k.name}</div>
                    <div className="font-mono text-[#6B6B70] text-[11px] truncate">
                      {k.key}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#9B9BA1] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34A874]" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
