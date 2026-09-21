import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Mail,
  Info,
  Building2,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";
import { leadEngineApi } from "../lib/api";
import { Business } from "../types";

export const OutreachPage: React.FC = () => {
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [pitchType, setPitchType] = useState<"no_website" | "redesign" | "whatsapp">("no_website");
  const [copied, setCopied] = useState<string | null>(null);
  const [leads, setLeads] = useState<Business[]>([]);

  useEffect(() => {
    leadEngineApi.getLeads({ limit: 8, sortBy: "leadScore", sortOrder: "desc" })
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        setLeads(items);
        if (items.length > 0 && !businessName) {
          setBusinessName(items[0].name);
          setCity(items[0].city || items[0].state || "your area");
        }
      })
      .catch(() => {});
  }, []);

  const bName = businessName || "[Business Name]";
  const cName = city || "[City]";

  const pitches = {
    no_website: {
      subject: `Quick idea for ${bName}'s client bookings in ${cName}`,
      body: `Hi Team at ${bName},

I was looking at the top commercial practices in ${cName} and came across your listing.

However, when searching online, I noticed that ${bName} doesn't currently have an official website. Right now, potential clients searching for services in ${cName} may be landing on general aggregator directories instead of booking directly with you.

We build modern, high-converting websites customized for businesses in your area, featuring direct mobile booking, Google Maps integration, and self-service appointment scheduling.

Would you be open to a quick 2-minute screenshot preview of what a site customized for ${bName} would look like?

Best regards,
LeadEngine Growth Team`,
    },
    redesign: {
      subject: `Modernizing the online client experience for ${bName}`,
      body: `Hi Team at ${bName},

I visited ${bName}'s web listing today while researching local commercial providers in ${cName}.

Your business has great ratings, but the online booking flow could be significantly streamlined for smartphone visitors to convert higher traffic into scheduled inquiries.

We help businesses modernize their digital presence, reducing visitor bounce rates and increasing booked appointments.

Would you like me to send over a 1-page summary of recommended speed and mobile conversion optimizations?

Best regards,
LeadEngine Technical Lead`,
    },
    whatsapp: {
      subject: `Automated WhatsApp Consultation Flow for ${bName}`,
      body: `Hello Team ${bName},

Did you know that a majority of local clients in ${cName} prefer inquiring directly via instant messaging or WhatsApp rather than making a phone call during busy work hours?

We deploy automated WhatsApp Client Receptionists that can:
- Answer common service questions & hours
- Collect prospect requirements and preferred time slots
- Confirm consultation requests straight to your calendar

Would you like to test a 1-minute live demo customized for ${bName}?`,
    },
  };

  const currentPitch = pitches[pitchType];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleSelectLead = (lead: Business) => {
    setBusinessName(lead.name);
    setCity(lead.city || lead.state || lead.country || "your area");
    if (!lead.website) {
      setPitchType("no_website");
    } else {
      setPitchType("redesign");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Outreach & AI Studio"
        description="Generate tailored cold email sequences, WhatsApp consultation hooks, and technical audit pitch decks."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div>
            <h2 className="text-h2 font-semibold text-text-primary tracking-tight">Lead Parameters</h2>
            <p className="text-xs text-text-secondary mt-1">
              Customize dynamic variables injected into the copy
            </p>
          </div>

          {/* Quick lead select chips */}
          {leads.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase text-text-tertiary block">
                Select from Database:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {leads.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleSelectLead(l)}
                    className={`text-[11px] px-2 py-1 rounded border transition-colors truncate max-w-[180px] ${
                      businessName === l.name
                        ? "bg-accent/15 border-accent text-accent font-semibold"
                        : "bg-bg-base border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Apex Commercial Services"
          />

          <Input
            label="City / Territory"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Austin, Texas"
          />

          <div className="space-y-2 pt-1">
            <label className="block text-meta text-text-tertiary">
              Outreach Angle
            </label>
            {[
              { id: "no_website", label: "Missing Website", desc: "Pitch a complete modern web presence" },
              { id: "redesign", label: "Speed & Redesign Audit", desc: "Focus on slow load time and mobile UX" },
              { id: "whatsapp", label: "WhatsApp Bot & CRM", desc: "Automate appointment bookings on mobile" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPitchType(p.id as any)}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition-colors duration-150 ${
                  pitchType === p.id
                    ? "bg-bg-surface-hover border-accent text-text-primary ring-1 ring-accent"
                    : "bg-bg-base border-border-subtle text-text-secondary hover:border-border-default hover:text-text-primary"
                }`}
              >
                <div className="font-medium text-text-primary">{p.label}</div>
                <div className="text-[11px] text-text-tertiary mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generated Pitch View */}
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 sm:p-6 space-y-4 lg:col-span-2 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                <h2 className="text-h2 font-semibold text-text-primary tracking-tight">Generated Cold Pitch</h2>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Engineered for high conversion via Email, LinkedIn, or WhatsApp outreach
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                handleCopy(`${currentPitch.subject}\n\n${currentPitch.body}`, "full")
              }
              className="text-xs flex items-center gap-1.5 self-start sm:self-auto bg-accent text-white font-semibold"
            >
              {copied === "full" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === "full" ? "Copied" : "Copy Subject & Body"}</span>
            </Button>
          </div>

          {/* Subject Line */}
          <div className="p-3.5 rounded-lg bg-bg-base border border-border-subtle flex justify-between items-center text-xs">
            <div className="truncate mr-3">
              <span className="text-text-tertiary font-mono uppercase text-[10px] tracking-wider mr-2">Subject:</span>
              <span className="text-text-primary font-medium">{currentPitch.subject}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(currentPitch.subject, "subj")}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-bg-surface transition-colors duration-150 shrink-0"
              title="Copy Subject"
            >
              {copied === "subj" ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Email Body */}
          <div>
            <pre className="p-4 rounded-lg bg-bg-base border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {currentPitch.body}
            </pre>
          </div>

          <div className="p-3.5 rounded-lg bg-bg-base border border-border-subtle text-xs text-text-secondary flex items-center gap-2.5">
            <Info className="w-4 h-4 text-text-tertiary shrink-0" />
            <span className="leading-relaxed">
              Engineered with 3-part conversion structure: personalized compliment &rarr; specific weakness &rarr; low-friction CTA.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
