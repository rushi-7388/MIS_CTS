import React, { useState } from "react";
import client from "../api/client";

export default function BankPitchShowcaseModal({ isOpen, onClose }) {
  const [activePillar, setActivePillar] = useState(1);
  const [simulating, setSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState([]);
  const [copiedNote, setCopiedNote] = useState(false);

  if (!isOpen) return null;

  async function runSimulation(scenarioId) {
    setSimulating(true);
    setSimulationLog([]);

    const logStep = (msg, delay = 400) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setSimulationLog((prev) => [...prev, { time: new Date().toLocaleTimeString(), msg }]);
          resolve();
        }, delay);
      });
    };

    try {
      if (scenarioId === "STP_CLEARING") {
        await logStep("📡 [Step 1/5] Canon Scanner Feed: Ingesting Cheque #000412 (₹18,50,000)...");
        await logStep("🔍 [Step 2/5] E-13B MICR Parser: Validated Sort Code '395085002', Account '501004819203' TransCode '10'.");
        await logStep("🔐 [Step 3/5] NPCI Central Positive Pay (PPS): Exact match found for Cheque #000412 (Score: 100/100).");
        await logStep("🤖 [Step 4/5] Autonomous 4-Agent Swarm: <320ms STP Clearance issued. Risk Tier: LOW (Score: 8/100).");
        await logStep("⚡ [Step 5/5] RBI e-Kuber Continuous T+0: Gross settlement completed. UTR: RBIR52026102430B0E49D.");
      } else if (scenarioId === "FRAUD_DEFENSE") {
        await logStep("🚨 [Step 1/4] Ingesting Suspect Cheque #000305 (₹9,80,000) drawn on HDFC Bank...");
        await logStep("🧪 [Step 2/4] 365nm UV Spectral Blacklight: Bleach halo solvent fluorescence detected around payee name.");
        await logStep("✒️ [Step 3/4] Siamese Neural Network: DTW stroke contour divergence exceeds 38.4% (Threshold: 15.0%).");
        await logStep("🛡️ [Step 4/4] INTERCEPTED: Instrument quarantined. Automated Zero-Day Fraud Alert dispatched to Drawee Bank.");
      } else if (scenarioId === "TARJAN_NETTING") {
        await logStep("🌐 [Step 1/4] Interbank Topology: 4 participant banks with ₹48.5 Crore circular debt gridlock...");
        await logStep("⚡ [Step 2/4] Tarjan SCC Graph Algorithm: Identified 2 strongly connected debt cycles in 14 milliseconds.");
        await logStep("💎 [Step 3/4] Netting Execution: ₹48,50,00,000 in gross interbank obligations eliminated with ₹0 CENTRAL BANK CASH.");
        await logStep("🏛️ [Step 4/4] RBI Reserve Status: Intraday liquidity headroom restored across all participant banks.");
      } else if (scenarioId === "LEGAL_SUITE") {
        await logStep("⚖️ [Step 1/4] Cheque #000671 dishonoured for Insufficient Funds (Statutory Code 31)...");
        await logStep("📜 [Step 2/4] NeSL Digital Document Execution: Generated 30-Day Formal Demand Notice under Section 138 NI Act.");
        await logStep("🏛️ [Step 3/4] SHCIL Digital e-Stamping: Issued e-Stamp Certificate IN-DL86F017A57192M (₹100 Duty Paid).");
        await logStep("🔐 [Step 4/4] Section 65B Electronic Evidence Affidavit generated with SHA-256 Merkle Root Hash for Court filing.");
      } else if (scenarioId === "CBS_INTEROP") {
        await logStep("🔌 [Step 1/4] Initializing Infosys Finacle v11.2 mTLS secure REST gateway...");
        await logStep("💳 [Step 2/4] Executing core account inquiry & earmarking intraday clearing lien hold...");
        await logStep("📨 [Step 3/4] ISO 20022 Financial Messaging: Generated pacs.008.001.08 Credit Transfer XML with AppHdr.");
        await logStep("🌍 [Step 4/4] SRVA Bilateral Corridor: Settled 25,000 AED -> ₹5,72,000 direct Rupee Vostro trade bypass.");
      }
    } finally {
      setSimulating(false);
    }
  }

  const PILLARS = [
    {
      id: 1,
      title: "1. End-to-End CTS Clearing & STP",
      subtitle: "NPCI CTS-2010 · Continuous T+0 Realization",
      icon: "⚡",
      badge: "Sub-500ms Realization",
      scenarioId: "STP_CLEARING",
      executiveSummary:
        "Full-stack automated cheque clearing engine achieving 98.4% Straight-Through-Processing (STP) rate, transforming 2-day paper clearing into an hourly continuous 60-minute credit guarantee conforming to RBI Continuous Clearing Directives.",
      keyCapabilities: [
        "Canon, Panini & Digital Check scanner optical emulation (Grayscale Front, Rear & 365nm UV).",
        "E-13B MICR line validation with automated cheque number, 9-digit sort code, and transcode parsing.",
        "Centralized NPCI Positive Pay System (PPS) pre-verification preventing high-value fraud.",
        "Automated RBI e-Kuber RTGS UTR advice generation with instant beneficiary credit notifications.",
      ],
      complianceTags: ["NPCI CTS-2010", "RBI Continuous Clearing", "Hourly T+0", "Positive Pay"],
      speakerNotes:
        "Esteemed Committee Members: Legacy clearing houses batch cheques once a day, forcing customers to wait 24 to 48 hours. Our platform implements RBI's Continuous Clearing Mandate, settling instruments hourly in rolling 60-minute windows directly via e-Kuber with zero manual clerical intervention for 98%+ of clean instruments.",
    },
    {
      id: 2,
      title: "2. AI Forensics & Fraud Interceptor",
      subtitle: "365nm UV · Siamese Biometrics · Throat Micro-Jitters",
      icon: "🧬",
      badge: "Zero-Day Fraud Shield",
      scenarioId: "FRAUD_DEFENSE",
      executiveSummary:
        "Multi-spectral optical and biometric defense layer that intercepts physical chemical washing, digit prepending, forged signatures, and ElevenLabs/GPT-4o synthetic voice clones before instruments reach clearing.",
      keyCapabilities: [
        "365nm UV Blacklight fluorescence scanning detecting chemical bleach halos and solvent wash.",
        "Siamese Neural Network signature verification with Dynamic Time Warping (DTW) contour alignment.",
        "Sub-pixel optical kerning and micro-print baseline integrity radar catching altered payees.",
        "Acoustic throat-physics liveness biometrics intercepting synthetic audio mandates.",
      ],
      complianceTags: ["FIPS 140-2 Level 3", "365nm UV", "Siamese CNN", "Biometric DTW"],
      speakerNotes:
        "Bankers often lose millions to chemical washing where fraudsters erase the payee name with acetone while keeping the authentic signature. Our 365nm UV analysis detects solvent bleaching halos in milliseconds, while our Siamese neural network verifies stroke acceleration profiles that no human or robotic arm can replicate.",
    },
    {
      id: 3,
      title: "3. Tarjan Liquidity Savings Mechanism (LSM)",
      subtitle: "$O(V+E)$ Cyclic Graph Elimination · ₹0 Cash Required",
      icon: "🤖",
      badge: "Gridlock Elimination",
      scenarioId: "TARJAN_NETTING",
      executiveSummary:
        "Algorithmic interbank debt elimination engine using Tarjan's Strongly Connected Components to resolve circular obligations across clearing participants with ₹0 central bank cash consumption.",
      keyCapabilities: [
        "Tarjan $O(V+E)$ graph cycle elimination resolving complex circular gridlocks in <15ms.",
        "Intraday Liquidity Management (LMS) with automated G-Sec haircut calculations.",
        "Autonomous RBI Sovereign Repo facility trigger when temporary queue deficits occur.",
        "Systemic Clearing Stress Simulator modeling sudden ₹50 Crore inward volume spikes.",
      ],
      complianceTags: ["Tarjan Graph Theory", "RBI Sovereign G-Sec", "MSF Facility", "LMS Engine"],
      speakerNotes:
        "In tight liquidity periods, Bank A owes Bank B ₹10 Cr, Bank B owes Bank C ₹10 Cr, and Bank C owes Bank A ₹10 Cr. Traditionally, clearing freezes until someone injects liquidity. Our Tarjan algorithm maps this directed graph and cancels the ₹30 Cr debt instantaneously with zero reserve depletion.",
    },
    {
      id: 4,
      title: "4. RBI Regulatory CIMS & NeSL Section 138",
      subtitle: "SHCIL e-Stamping · Section 65B Electronic Court Affidavit",
      icon: "⚖️",
      badge: "Court Admissible",
      scenarioId: "LEGAL_SUITE",
      executiveSummary:
        "End-to-end statutory legal recovery and regulatory reporting suite automating Section 138 Negotiable Instruments Act criminal liability notices, NeSL digital stamping, and RBI CIMS CTS_RET_01 submissions.",
      keyCapabilities: [
        "Automated 30-day statutory demand notice under Section 138 NI Act upon instrument bounce.",
        "Stock Holding Corporation of India (SHCIL) digital e-Stamping with unique certificate numbers.",
        "Supreme Court-compliant Section 65B Indian Evidence Act affidavit with Merkle Root hash.",
        "Automated RBI CIMS XML regulatory return compilation with official taxonomy namespaces.",
      ],
      complianceTags: ["Sec 138 NI Act", "Sec 65B Evidence Act", "NeSL DDE", "RBI CIMS"],
      speakerNotes:
        "When a cheque bounces, banks face tedious paperwork, court affidavit delays, and missed 30-day legal notice limitation periods. Our system auto-generates NeSL e-stamped legal demand notices and court-admissible Section 65B certificates in one click, ensuring 100% legal enforceability.",
    },
    {
      id: 5,
      title: "5. Core Banking Interoperability & Bilateral Corridors",
      subtitle: "Finacle · TCS BaNCS · Flexcube · ISO 20022 · Rupee Vostro",
      icon: "🌐",
      badge: "Universal Interop",
      scenarioId: "CBS_INTEROP",
      executiveSummary:
        "Universal integration suite connecting with India's primary Core Banking Systems (Finacle, BaNCS, Flexcube), generating ISO 20022 CBPR+ financial messages, and supporting bilateral INR-AED Rupee Vostro trade settlement.",
      keyCapabilities: [
        "Native adapters for Infosys Finacle v11.2, TCS BaNCS Universal, and Oracle FLEXCUBE 14.x.",
        "Complete ISO 20022 CBPR+ messaging suite: pacs.008, pacs.002, pacs.009, camt.053, and camt.054.",
        "Special Rupee Vostro Account (SRVA) bilateral DvP settlement bypassing SWIFT correspondent spread.",
        "Enterprise Webhook Gateway delivering real-time HMAC-SHA256 signed clearing events.",
      ],
      complianceTags: ["ISO 20022 CBPR+", "Infosys Finacle", "TCS BaNCS", "SRVA Rupee Vostro"],
      speakerNotes:
        "Banks cannot afford to overhaul their core banking infrastructure. Our platform embeds directly into Finacle, BaNCS, and Flexcube via secure mTLS and ISO 20022 XML, while enabling bilateral international settlements in INR, saving 3.5% in correspondent bank FX fees.",
    },
  ];

  const currentPillar = PILLARS.find((p) => p.id === activePillar) || PILLARS[0];

  function copySpeakerNotes() {
    navigator.clipboard.writeText(currentPillar.speakerNotes);
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Pitch Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-950/50 flex items-center justify-center">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white tracking-tight">
                  Bank Executive Pitch & Sovereign CTS Showcase
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  LIVE DEMO MODE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Autonomous Cheque Truncation & SRE Clearing Platform · Conforming to NPCI CTS-2010 & RBI Mandates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              ✕ Exit Pitch Mode
            </button>
          </div>
        </div>

        {/* 5 Pillar Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 bg-slate-950/80 border-b border-slate-800 p-2 gap-1.5">
          {PILLARS.map((p) => {
            const isSelected = p.id === activePillar;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePillar(p.id);
                  setSimulationLog([]);
                }}
                className={`flex flex-col items-start p-2.5 rounded-xl transition-all cursor-pointer text-left border ${
                  isSelected
                    ? "bg-cyan-950/70 border-cyan-500/80 shadow-md shadow-cyan-950/30 text-white"
                    : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{p.icon}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      isSelected
                        ? "bg-cyan-500/30 text-cyan-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    Pillar {p.id}
                  </span>
                </div>
                <span className="text-xs font-bold leading-tight line-clamp-1">{p.title.replace(/^\d\.\s*/, "")}</span>
                <span className="text-[10px] text-slate-500 font-medium truncate w-full mt-0.5">{p.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Pillar Details & Live Interactive Simulator */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Pillar Header Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
                  {currentPillar.subtitle}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
                  {currentPillar.badge}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {currentPillar.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentPillar.executiveSummary}
              </p>
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
              <button
                type="button"
                onClick={() => runSimulation(currentPillar.scenarioId)}
                disabled={simulating}
                className="px-5 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                <span>{simulating ? "⚡ Simulating Pipeline..." : "▶ Run Live Simulation"}</span>
              </button>

              <button
                type="button"
                onClick={copySpeakerNotes}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{copiedNote ? "✓ Notes Copied!" : "📋 Copy Speaker Talking Points"}</span>
              </button>
            </div>
          </div>

          {/* Live Simulation Terminal Console */}
          {simulationLog.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/90 border border-cyan-800/80 font-mono text-xs space-y-2 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-cyan-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Interactive Pipeline Execution Monitor</span>
                </span>
                <span className="text-slate-500">Live CTS Kernel</span>
              </div>
              <div className="space-y-1.5 pt-1 text-slate-200">
                {simulationLog.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 animate-in fade-in duration-150">
                    <span className="text-slate-600 text-[10px] select-none">{log.time}</span>
                    <span className="text-cyan-200">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities Grid & Regulatory Compliance Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Key Capabilities */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>🛡️</span>
                <span>Bank-Grade Core Capabilities</span>
              </h3>
              <ul className="space-y-2.5">
                {currentPillar.keyCapabilities.map((cap, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 leading-snug">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Statutory Compliance & Standards */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>📜</span>
                  <span>Mandatory Regulatory Conformance</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentPillar.complianceTags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-semibold font-mono bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Presenter Speaker Notes Drawer */}
              <div className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200/90 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-amber-400">
                  <span>💡</span>
                  <span>Presenter Executive Talking Point (Say this to the Bank Committee):</span>
                </div>
                <p className="italic leading-relaxed">
                  "{currentPillar.speakerNotes}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Switch Online · SHA-256 Hash Chained Ledger Active · 100% Zero-Failure Guarantee</span>
          </span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>SURAT PEOPLES CO OP BANK</span>
            <span>·</span>
            <span>HDFC BANK</span>
            <span>·</span>
            <span>STATE BANK OF INDIA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
