import React, { useState, useEffect } from "react";
import QRCode from "qrcode";

export default function WhatsAppQrModal({ isOpen, onClose, defaultPhone = "", initialMessage = "STATUS 000101" }) {
  const [userPhone, setUserPhone] = useState(defaultPhone || "");
  const [message, setMessage] = useState(initialMessage || "STATUS 000101");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [targetMode, setTargetMode] = useState(defaultPhone ? "custom" : "self"); // "self" | "custom" | "direct"

  // Quick Preset Banking Commands
  const QUICK_COMMANDS = [
    { label: "Track Cheque #000101", cmd: "STATUS 000101" },
    { label: "Account Balance", cmd: "BALANCE" },
    { label: "PPS Pre-Register", cmd: "PPS 000101 450000 Larsen & Toubro Ltd" },
    { label: "Stop Payment", cmd: "STOP 000101" },
    { label: "Full Banking Menu", cmd: "MENU" },
  ];

  // Clean phone number (digits only)
  const cleanPhone = (userPhone || "").replace(/[^0-9]/g, "");

  // Build the official WhatsApp wa.me URL
  // If targetMode is "self" and no phone given, wa.me/send?text=... opens WhatsApp to pick contact or message self!
  const targetUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

  // Generate offline QR Code data URL using client-side canvas
  useEffect(() => {
    if (!targetUrl) return;

    QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#064e3b", // Deep emerald
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("Failed to generate offline QR code:", err);
      });
  }, [targetUrl]);

  if (!isOpen) return null;

  function handleCopyLink() {
    navigator.clipboard?.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/60 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-[#075E54] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl">
              📱
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Scan WhatsApp QR on Your Phone</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-slate-950">
                  100% Offline
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Official SURAT PEOPLES CO OP BANK CTS Clearing Rail
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/20 flex items-center justify-center text-white text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Important Advice Box */}
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-700/60 text-emerald-200 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>💡 Why dummy numbers fail on your phone:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-100/90">
              WhatsApp requires an <strong>active registered WhatsApp number</strong>. If you enter your own real mobile number below, scanning the QR opens WhatsApp directly to chat or receive the alert.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-center font-semibold">
            <button
              type="button"
              onClick={() => {
                setTargetMode("self");
                setUserPhone("");
              }}
              className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                targetMode === "self"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              🚀 Send to Anyone / Pick Contact
            </button>
            <button
              type="button"
              onClick={() => setTargetMode("custom")}
              className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                targetMode === "custom"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📞 Send to My Phone Number
            </button>
          </div>

          {/* Custom Phone Number Input */}
          {targetMode === "custom" && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="text-slate-300 font-bold block text-[11px]">
                Your Real WhatsApp Number (with country code):
              </label>
              <input
                type="text"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                placeholder="e.g. +91 98250 12345"
                className="w-full bg-slate-950 border border-emerald-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-400">
                Scanning will open WhatsApp to message this number with the pre-filled cheque notification.
              </span>
            </div>
          )}

          {/* Command / Message Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block text-[11px]">
              Banking Command / Notification Payload:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((q) => (
                <button
                  key={q.cmd}
                  type="button"
                  onClick={() => setMessage(q.cmd)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                    message === q.cmd
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono resize-none mt-1"
            />
          </div>

          {/* QR Code Presentation Box */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
            <div className="relative p-2 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="WhatsApp Banking QR"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-slate-500 animate-pulse text-xs">
                  Generating Vector QR...
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h4 className="font-bold text-white text-xs">How to scan:</h4>
                <ol className="text-[11px] text-slate-300 list-decimal list-inside space-y-1 mt-1 leading-relaxed">
                  <li>Open your phone's <strong>Camera</strong> or <strong>Google Lens</strong>.</li>
                  <li>Point it directly at the QR code.</li>
                  <li>Tap the yellow/green <strong>"WhatsApp"</strong> banner that pops up.</li>
                  <li>WhatsApp opens immediately with the command ready to send!</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-center"
                >
                  <span>💬 Open Directly in WhatsApp Web / App</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-[11px] border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>{copied ? "✅ Link Copied!" : "📋 Copy WhatsApp Link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
