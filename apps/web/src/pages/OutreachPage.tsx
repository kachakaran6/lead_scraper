import React, { useState } from "react";
import {
  Copy,
  Check,
  Mail,
  Info,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Input } from "../components/ui/Input";

export const OutreachPage: React.FC = () => {
  const [businessName, setBusinessName] = useState("Shreeji Dental Clinic");
  const [city, setCity] = useState("Rajkot");
  const [pitchType, setPitchType] = useState<"no_website" | "redesign" | "whatsapp">("no_website");
  const [copied, setCopied] = useState<string | null>(null);

  const pitches = {
    no_website: {
      subject: `Quick idea for ${businessName}'s patient bookings in ${city}`,
      body: `Hi Team at ${businessName},

I was looking at the top-rated dental clinics in ${city} and noticed your stellar patient feedback (4.8+ rating).

However, when searching on Google, I couldn't find a direct official website for ${businessName}. Right now, patients searching for emergency appointments or cosmetic dentistry are landing on general aggregator directories instead of booking directly with your clinic.

We designed a modern, high-converting clinic website template customized specifically for dental practices in ${city}. It features direct WhatsApp booking, Google Maps integration, and mobile appointment scheduling.

Would you be open to a 2-minute screenshot preview of what your clinic's site would look like?

Best regards,
LeadEngine Growth Team`,
    },
    redesign: {
      subject: `Modernizing the patient experience on ${businessName}'s site`,
      body: `Hi Team at ${businessName},

I visited ${businessName}'s website today while researching healthcare services in ${city}.

Your clinic provides great care, but the current website is missing critical mobile-friendly booking CTAs and takes over 4 seconds to load on 4G connections. With 78% of local patients browsing on smartphones, this directly impacts daily consultation inquiries.

We modernized clinics in your category, reducing bounce rates by 60% and increasing booked inquiries within 14 days.

Can I send over the free 1-page PDF audit report with the exact fixes?

Best regards,
LeadEngine Technical Lead`,
    },
    whatsapp: {
      subject: `Automated WhatsApp Patient Consultation Flow for ${businessName}`,
      body: `Hello Team ${businessName},

Did you know that over 82% of local patients in ${city} prefer booking doctor appointments directly via WhatsApp rather than making a phone call during busy clinic hours?

We built an automated WhatsApp Patient Receptionist that can:
- Answer common queries (timings, doctor availability, location)
- Collect patient name, symptoms, and preferred time slot
- Confirm appointments straight to your clinic calendar

Would you like to test our 1-minute live demo on your smartphone?`,
    },
  };

  const currentPitch = pitches[pitchType];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
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
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-h2 font-semibold text-text-primary tracking-tight">Lead Parameters</h2>
            <p className="text-xs text-text-secondary mt-1">
              Customize dynamic variables injected into the copy
            </p>
          </div>

          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Shreeji Dental Clinic"
          />

          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Rajkot"
          />

          <div className="space-y-2 pt-1">
            <label className="block text-meta text-text-tertiary">
              Identified Angle
            </label>
            {[
              { id: "no_website", label: "Missing Website", desc: "Pitch a complete modern web presence" },
              { id: "redesign", label: "Speed & Redesign Audit", desc: "Focus on slow load time and mobile UX" },
              { id: "whatsapp", label: "WhatsApp Bot & CRM", desc: "Automate patient bookings on mobile" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPitchType(p.id as any)}
                className={`w-full text-left p-3.5 rounded-lg border text-xs transition-colors duration-150 ${
                  pitchType === p.id
                    ? "bg-bg-surface-hover border-accent text-text-primary"
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
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-6 space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-text-secondary" />
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
              className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
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
              onClick={() => handleCopy(currentPitch.subject, "subj")}
              className="text-text-secondary hover:text-text-primary p-1.5 rounded hover:bg-bg-surface transition-colors duration-150 shrink-0"
              title="Copy Subject"
            >
              {copied === "subj" ? <Check className="w-3.5 h-3.5 text-semantic-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Email Body */}
          <div>
            <pre className="p-4 rounded-lg bg-bg-base border border-border-subtle text-xs text-text-primary font-mono whitespace-pre-wrap leading-relaxed">
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
