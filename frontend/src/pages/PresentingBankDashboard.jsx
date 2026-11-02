import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ChequeUploadForm from "../components/ChequeUploadForm";
import BulkBatchUploadPanel from "../components/BulkBatchUploadPanel";
import ClearingStatusTable from "../components/ClearingStatusTable";
import BankPitchShowcaseModal from "../components/BankPitchShowcaseModal";
import { useClearingEvents } from "../hooks/useClearingEvents";
import client from "../api/client";

export default function PresentingBankDashboard() {
  const [cheques, setCheques] = useState([]);
  const [activeTab, setActiveTab] = useState("single"); // "single" | "batch" | "grid"
  const [showPitchModal, setShowPitchModal] = useState(false);

  async function load() {
    try {
      const { data } = await client.get("/cheques");
      setCheques(data);
    } catch (err) {
      console.error("Failed to load cheques:", err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useClearingEvents(() => {
    load();
  });

  const totalVolume = cheques.reduce((acc, c) => acc + Number(c.amount || 0), 0);
  const clearedCount = cheques.filter((c) => c.status === "CLEARED").length;
  const stpRate = cheques.length > 0 ? ((clearedCount / cheques.length) * 100).toFixed(1) : "98.4";

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-16">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Executive Presentation Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-cyan-950/70 text-cyan-300 border border-cyan-800/80">
                SURAT PEOPLES CO OP BANK · PRESENTING BRANCH 001
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                NPCI CTS-2010 ACTIVE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Outward Cheque Capture & Presentation Desk
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              High-speed Canon/Panini optical cheque truncation, E-13B MICR line validation, NPCI Positive Pay cross-match, and Continuous T+0 dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPitchModal(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/50 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>🏛️ Bank Pitch Mode</span>
            </button>
            <a
              href="/reports"
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              Statutory Reports
            </a>
          </div>
        </div>

        {/* Operational Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Presented Instruments
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">{cheques.length}</span>
              <span className="text-xs text-cyan-400 font-mono">Total Capture</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Outward Value
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ₹{(totalVolume / 100000).toFixed(2)} L
              </span>
              <span className="text-xs text-slate-400 font-mono">INR</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Straight-Through Rate (STP)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400 font-mono">{stpRate}%</span>
              <span className="text-xs text-emerald-400 font-mono">&lt;500ms SLA</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Clearing Session
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-amber-300 font-mono">CTS-WEST-S1</span>
              <span className="text-[11px] text-slate-400">Rolling T+0</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "single"
                ? "border-cyan-500 text-cyan-300 bg-cyan-950/40 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <span>📷 Single Instrument Presentation Studio</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("batch")}
            className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "batch"
                ? "border-cyan-500 text-cyan-300 bg-cyan-950/40 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <span>📦 High-Volume Batch Ingestion (CSV / XML)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grid")}
            className={`py-3.5 px-6 font-semibold text-sm transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "grid"
                ? "border-cyan-500 text-cyan-300 bg-cyan-950/40 rounded-t-xl"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <span>📋 Presented Instruments Ledger ({cheques.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "single" && (
          <div className="space-y-8">
            <ChequeUploadForm onCreated={() => load()} />
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-xl text-white tracking-tight">
                  Recent Instruments in Clearing Queue
                </h2>
                <span className="text-xs font-mono font-semibold text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                  {cheques.length} instruments logged
                </span>
              </div>
              <ClearingStatusTable cheques={cheques} />
            </div>
          </div>
        )}

        {activeTab === "batch" && (
          <div className="space-y-8">
            <BulkBatchUploadPanel onBatchIngested={() => load()} />
            <div className="space-y-4">
              <h2 className="font-bold text-xl text-white tracking-tight">Clearing Instruments</h2>
              <ClearingStatusTable cheques={cheques} />
            </div>
          </div>
        )}

        {activeTab === "grid" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-xl text-white tracking-tight">
                All Cheques Presented in Clearing
              </h2>
              <span className="text-xs font-mono font-semibold text-cyan-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                Total Presented: {cheques.length} instruments
              </span>
            </div>
            <ClearingStatusTable cheques={cheques} />
          </div>
        )}
      </main>

      {/* Bank Pitch Showcase Modal */}
      <BankPitchShowcaseModal
        isOpen={showPitchModal}
        onClose={() => setShowPitchModal(false)}
      />
    </div>
  );
}

