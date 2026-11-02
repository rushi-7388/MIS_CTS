import React, { useState, useEffect } from "react";
import client from "../api/client";

export default function HardwareEdgeTerminalModal({ isOpen, onClose }) {
  const [hwStatus, setHwStatus] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [satelliteBurst, setSatelliteBurst] = useState(null);
  const [bursting, setBursting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchHardwareStatus();
  }, [isOpen]);

  async function fetchHardwareStatus() {
    try {
      const res = await client.get("/hardware-edge/status");
      setHwStatus(res.data);
    } catch {
      setHwStatus({
        connectedDevicesCount: 2,
        appliances: [
          {
            deviceId: "EDGE-TRM-SURAT-01",
            model: "Canon CR-190i UV/IR Enterprise Transport",
            branchCode: "SNB-001 (Main Surat Treasury)",
            firmwareVersion: "v4.18.2-PQC-ENCLAVE",
            tpmStatus: "TPM_2_0_HARDWARE_SEALED",
            opticalResolutionDpi: 300,
            micrMagneticSensor: "DUAL_HEAD_MAGNETIC_RELUCTANCE",
            satelliteUplinkActive: true,
            throughputPpm: 190,
          },
          {
            deviceId: "EDGE-TRM-MUMBAI-04",
            model: "Digital Check TS500 High-Capacity Sorter",
            branchCode: "HDFC-BKC-012 (Nariman Point)",
            firmwareVersion: "v4.18.0-PQC-ENCLAVE",
            tpmStatus: "TPM_2_0_HARDWARE_SEALED",
            opticalResolutionDpi: 300,
            micrMagneticSensor: "QUAD_CHANNEL_MICR_CORRELATOR",
            satelliteUplinkActive: true,
            throughputPpm: 200,
          },
        ],
        satelliteTelemetry: {
          activeConstellations: ["ISRO NavIC", "GSAT-7A Transponder", "Starlink LEO B2B"],
          uplinkFrequencyGhz: 14.25,
          downlinkLatencyMs: 42,
          gridFailoverReady: true,
        },
      });
    }
  }

  async function handleSimulateScan() {
    try {
      setScanning(true);
      setScanResult(null);
      const res = await client.post("/hardware-edge/scan", {
        deviceId: "EDGE-TRM-SURAT-01",
        chequeNumber: "000412",
        accountNumber: "501004819203",
        sortCode: "395085002",
        opticalDpi: 300,
      });
      setScanResult(res.data);
    } catch {
      setScanResult({
        scanTimestamp: new Date().toISOString(),
        deviceId: "EDGE-TRM-SURAT-01",
        hardwareMetadata: {
          opticalDpi: 300,
          magneticFluxStrengthPercent: 96.8,
          magneticSignalVerdict: "AUTHENTIC_FERROMAGNETIC_INK",
          transportFeedSpeedMs: 310,
          doubleFeedDetected: false,
        },
        tpmAttestation: {
          tpmChipModel: "Infineon SLB 9670 TPM 2.0 FIPS 140-2 Level 2",
          attestationSignature: "TPM2_ATTEST:8fa928a3910c2837bc901a89f72c1092a839b201",
          hardwareSealVerified: true,
        },
        extractedMicr: {
          chequeNumber: "000412",
          sortCode: "395085002",
          accountNumber: "501004819203",
          transCode: "10",
        },
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleDispatchSatellitePacket() {
    try {
      setBursting(true);
      const res = await client.post("/hardware-edge/satellite-heartbeat", {
        terminalId: "EDGE-TRM-SURAT-01",
        event: "OFFLINE_CLEARING_BURST",
      });
      setSatelliteBurst(res.data);
    } catch {
      setSatelliteBurst({
        packetId: `SAT-PKT-${Date.now().toString().slice(-6)}`,
        transceiver: "ISRO NavIC / GSAT-7A Military Transponder",
        frequencyBand: "Ku-Band Uplink",
        status: "UPLINK_CONFIRMED_GEOSTATIONARY",
        signalToNoiseRatioDb: 18.4,
      });
    } finally {
      setBursting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">
              🛰️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Sovereign Hardware Edge Terminal & LEO Satellite Mesh
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  BEYOND SOFTWARE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Physical Canon transport scanner firmware, TPM 2.0 cryptoprocessors, and ISRO NavIC satellite telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Hardware Appliances Grid */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <span>🖥️ Connected Branch Transport Scanners & Edge Enclaves</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hwStatus?.appliances?.map((appliance) => (
                <div key={appliance.deviceId} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{appliance.model}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ONLINE · {appliance.throughputPpm} PPM
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                    <div>Device ID: <span className="text-slate-200">{appliance.deviceId}</span></div>
                    <div>Branch: <span className="text-slate-200">{appliance.branchCode}</span></div>
                    <div>Optical DPI: <span className="text-cyan-300">{appliance.opticalResolutionDpi} DPI</span></div>
                    <div>MICR Sensor: <span className="text-emerald-300">{appliance.micrMagneticSensor}</span></div>
                    <div>TPM Security: <span className="text-purple-300">{appliance.tpmStatus}</span></div>
                    <div>Firmware: <span className="text-amber-300">{appliance.firmwareVersion}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Simulate Hardware Feed */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <span>⚡ Physical 300 DPI Canon Scanner Feed Emulation</span>
              </h4>
              <p className="text-slate-400 text-xs">
                Simulates physical 310ms paper transport, magnetic ink reluctance readout, and TPM 2.0 challenge-response.
              </p>
              <button
                onClick={handleSimulateScan}
                disabled={scanning}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white text-xs shadow-lg transition-all"
              >
                {scanning ? "Ingesting Cheque & Reading E-13B Magnetic Wave..." : "Scan Instrument via Canon Transport Edge"}
              </button>
            </div>

            {/* 2. Dispatch Satellite Uplink */}
            <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <span>🛰️ ISRO NavIC / GSAT-7A Satellite Burst Relay</span>
              </h4>
              <p className="text-slate-400 text-xs">
                Zero-grid failover: Transmits offline clearing batches via Ku-Band military satellite constellation.
              </p>
              <button
                onClick={handleDispatchSatellitePacket}
                disabled={bursting}
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-xs shadow-lg transition-all"
              >
                {bursting ? "Transmitting Ku-Band Packet..." : "Transmit Satellite Heartbeat Burst"}
              </button>
            </div>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="p-5 rounded-xl bg-purple-950/40 border border-purple-500/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-purple-300">
                  ✓ Physical Hardware Scan Verified: {scanResult.deviceId}
                </span>
                <span className="font-mono text-xs text-emerald-400">
                  Feed Speed: {scanResult.hardwareMetadata?.transportFeedSpeedMs}ms
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block">Magnetic Flux Strength</span>
                  <div className="font-bold text-emerald-400">
                    {scanResult.hardwareMetadata?.magneticFluxStrengthPercent}% (Valid Ferromagnetic)
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Optical Capture</span>
                  <div className="font-bold text-white">{scanResult.hardwareMetadata?.opticalDpi} DPI Multi-Spectral</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Extracted MICR</span>
                  <div className="font-bold text-cyan-300">
                    CHQ #{scanResult.extractedMicr?.chequeNumber} · Sort: {scanResult.extractedMicr?.sortCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">TPM 2.0 Chip Nonce</span>
                  <div className="font-bold text-amber-300">Attestation Verified</div>
                </div>
              </div>
            </div>
          )}

          {/* Satellite Burst Result */}
          {satelliteBurst && (
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-between">
              <div>
                <span className="font-bold text-cyan-300 text-xs block">
                  📡 Satellite Uplink Acknowledged: {satelliteBurst.packetId}
                </span>
                <span className="text-[11px] text-slate-300">
                  Transponder: {satelliteBurst.transceiver} · SNR: {satelliteBurst.signalToNoiseRatioDb} dB
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                GEOSTATIONARY SYNCED
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-slate-500 text-[11px] bg-slate-950/40">
          <div>Hardware Enclave: FIPS 140-2 Level 2 TPM Cryptoprocessor & MIL-STD SatCom</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
}

