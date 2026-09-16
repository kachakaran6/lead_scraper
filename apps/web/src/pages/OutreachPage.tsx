import React, { useState } from "react";
import {
  Send,
  Sparkles,
  Copy,
  Check,
  FileText,
  MessageSquare,
  Mail,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";

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

We specialize in launching high-converting, mobile-first websites with 1-click WhatsApp patient appointment booking for healthcare practices.

We built a quick 60-second interactive preview for ${businessName}. Would you be open to checking it out this week?

Best regards,
LeadEngine Agency Partner`,
    },
    redesign: {
      subject: `Technical audit findings for ${businessName}'s website`,
      body: `Hi Team at ${businessName},

We ran an automated mobile speed and SEO audit on your current web portal. 

We noticed three critical revenue leaks:
1. Mobile page load is over 2.5 seconds (leading to 40% bounce rate before seeing your phone number)
2. Missing structured Schema.org MedicalClinic tags, causing you to lose top Google Maps 3-Pack rankings in ${city}
3. No direct WhatsApp 1-tap booking widget for mobile visitors

We modernized clinics in your category, reducing bounce rates by 60% and increasing booked inquiries within 14 days.

Can I send over the free 1-page PDF audit report with the exact fixes?

Best regards,
LeadEngine Technical Lead`,
    },
    whatsapp: {
      subject: `Automated WhatsApp Patient Consultation Flow for ${businessName}`,
      body: `Hello Team ${businessName}! 👋 

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
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Outreach & Pitch Studio</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> High-Conversion Templates
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Generate bespoke, audit-backed cold emails and WhatsApp messages tailored to each lead's detected weaknesses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <Card className="glass-panel border-slate-800">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Target Lead Parameters</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Customize the dynamic pitch variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Identified Angle
              </label>
              {[
                { id: "no_website", label: "🚫 Missing Website (High ROI)", desc: "Pitch a complete modern web presence" },
                { id: "redesign", label: "⚡ Speed & Redesign Audit", desc: "Focus on slow load time and poor mobile UX" },
                { id: "whatsapp", label: "💬 WhatsApp Bot & CRM", desc: "Automate patient bookings on mobile" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPitchType(p.id as any)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    pitchType === p.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="font-bold text-slate-200">{p.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generated Pitch View */}
        <Card className="glass-panel border-slate-800 lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Generated Cold Pitch
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Ready to copy and send via Gmail, Outlook, or LinkedIn
                </CardDescription>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleCopy(`${currentPitch.subject}\n\n${currentPitch.body}`, "full")
                }
                className="text-xs shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
              >
                {copied === "full" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === "full" ? "Copied All!" : "Copy Subject & Body"}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Line */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 font-semibold mr-2 uppercase text-[10px]">Subject:</span>
                <span className="text-white font-medium">{currentPitch.subject}</span>
              </div>
              <button
                onClick={() => handleCopy(currentPitch.subject, "subj")}
                className="text-slate-400 hover:text-white p-1"
                title="Copy Subject"
              >
                {copied === "subj" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Email Body */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed">
                {currentPitch.body}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Engineered with high-conversion agency copywriting: personalized compliment &rarr; specific problem &rarr; low friction call-to-action.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
