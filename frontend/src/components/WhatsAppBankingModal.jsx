import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import client from "../api/client";
import logo from "../assets/logo.jpg";
import WhatsAppQrModal from "./WhatsAppQrModal";
import { playNotificationChime } from "../utils/sound.util";

export default function WhatsAppBankingModal({ onClose, defaultCheque = null }) {
  const [activeTab, setActiveTab] = useState("simulator"); // simulator, outbox, sender, templates, config
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [templates, setTemplates] = useState({});
  const [config, setConfig] = useState(null);
  const [notification, setNotification] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  // WhatsApp Simulator Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: "bot-init",
      sender: "bot",
      text: "🏦 *SURAT PEOPLES CO OP BANK*\n*Official WhatsApp Banking Assistant*\n\nNamaste! How may I assist you with clearing & banking today?\n\n*Quick Commands:*\n1️⃣ *STATUS <chequeNo>* — Track live clearance status (e.g. `STATUS 000101`)\n2️⃣ *PPS <chequeNo> <amount> <payee>* — Instant Positive Pay registration\n3️⃣ *BALANCE <accountNo>* — Check balance & lien holds\n4️⃣ *STOP <chequeNo>* — Request Stop Payment on cheque\n5️⃣ *DISPUTE <chequeNo>* — File DRM dispute on return\n\n_Type any command or tap an option below:_",
      time: "Just now",
      actions: ["STATUS 000101", "PPS Register", "BALANCE", "Menu"],
    },
  ]);
  const [userInput, setUserInput] = useState(defaultCheque ? `STATUS ${defaultCheque.chequeNumber}` : "");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Manual Dispatch Form
  const [recipientPhone, setRecipientPhone] = useState("+91 98251 44012");
  const [customerName, setCustomerName] = useState(defaultCheque ? defaultCheque.payeeName : "Rajesh Varma");
  const [selectedTemplate, setSelectedTemplate] = useState("CHEQUE_PRESENTED");
  const [dispatchParams, setDispatchParams] = useState({
    chequeNumber: defaultCheque ? defaultCheque.chequeNumber : "000101",
    amount: defaultCheque ? Number(defaultCheque.amount).toLocaleString("en-IN") : "4,50,000",
    accountNumber: defaultCheque ? defaultCheque.accountNumber : "102030401001",
    payeeName: defaultCheque ? defaultCheque.payeeName : "Larsen & Toubro Ltd",
    draweeBank: "SURAT PEOPLES CO OP BANK",
    presentingBank: "STATE BANK OF INDIA",
    utr: "EKUBER-20261016-UTR-800001",
    returnReason: "01 - Funds Insufficient",
    memoRef: "RM-20261016-000101",
    balance: "24,85,420.00",
    otp: "849201",
  });
  const [dispatchChannel, setDispatchChannel] = useState("BOTH"); // WHATSAPP, SMS, BOTH
  const [lastDispatched, setLastDispatched] = useState(null);
  const [callMeBotKey, setCallMeBotKey] = useState("");
  const [fast2SmsKey, setFast2SmsKey] = useState("");

  // Live QR Code & Universal Delivery States for Dispatch Tab
  const [dispatchQrMode, setDispatchQrMode] = useState("universal"); // "universal" | "direct"
  const [dispatchQrDataUrl, setDispatchQrDataUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Filter logs
  const [logFilter, setLogFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isBotTyping]);

  // Load initial logs & templates
  useEffect(() => {
    loadData();
    const interval = setInterval(loadLogs, 6000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    await Promise.all([loadLogs(), loadTemplates(), loadConfig()]);
  }

  async function loadLogs() {
    try {
      const res = await client.get("/messaging/logs?limit=100");
      if (res.data?.logs) setLogs(res.data.logs);
    } catch {
      // Fallback
    }
  }

  async function loadTemplates() {
    try {
      const res = await client.get("/messaging/templates");
      if (res.data?.templates) setTemplates(res.data.templates);
    } catch {
      // Fallback
    }
  }

  async function loadConfig() {
    try {
      const res = await client.get("/messaging/config");
      if (res.data) setConfig(res.data);
    } catch {
      // Fallback
    }
  }

  // Live computed message & live offline QR generation for Dispatch tab
  function getComputedAlertMessage() {
    const tmpl = templates[selectedTemplate];
    const rawTemplate = tmpl?.whatsapp || tmpl?.sms || (
      selectedTemplate === "CHEQUE_PRESENTED" ? "🏦 *SURAT PEOPLES CO OP BANK*\n*Inward Cheque Presentation Alert*\n\nDear Customer,\nCheque *#{chequeNumber}* for *₹{amount}* has been received in CTS clearing.\n\n📋 *Details:*\n• *Account:* {accountNumber}\n• *Payee:* {payeeName}\n• *Drawee Bank:* {draweeBank}\n• *Clearing Cycle:* Standard T+0\n\n_If you did not issue this instrument, reply *STOP {chequeNumber}* immediately._" :
      selectedTemplate === "CHEQUE_VERIFIED" ? "🔍 *SURAT PEOPLES CO OP BANK*\n*Cheque Verification In Progress*\n\nDear Customer,\nCheque *#{chequeNumber}* for *₹{amount}* has successfully passed Drawee Maker & AI Biometric Signature inspection.\n\n📋 *Clearing Tracker:*\n• *Payee:* {payeeName}\n• *Account:* {accountNumber}\n• *Current Stage:* 4-Eyes Senior Checker Sign-off\n• *Expected Settlement:* Continuous T+0 Cycle\n\n_We will notify you the moment e-Kuber funds settlement completes._" :
      selectedTemplate === "CHEQUE_CLEARED" ? "✅ *SURAT PEOPLES CO OP BANK*\n*Cheque Clearance Confirmation*\n\nDear Customer,\nYour Cheque *#{chequeNumber}* for *₹{amount}* has been successfully *CLEARED*.\n\n🧾 *Transaction Details:*\n• *Account Debited:* {accountNumber}\n• *Beneficiary:* {payeeName}\n• *e-Kuber UTR:* `{utr}`\n• *Settlement Mode:* RBI CONTINUOUS T+0\n• *Status:* Realised & Dispatched (T+0)\n\nThank you for banking with SURAT PEOPLES CO OP BANK." :
      selectedTemplate === "CHEQUE_RETURNED" ? "⚠️ *SURAT PEOPLES CO OP BANK*\n*Statutory Cheque Dishonour Alert (Rule 16)*\n\nDear Customer,\nCheque *#{chequeNumber}* for *₹{amount}* has been *RETURNED UNPAID*.\n\n❌ *Dishonour Details:*\n• *Return Reason Code:* {returnReason}\n• *Statutory Memo Ref:* `{memoRef}`\n• *Account:* {accountNumber}\n• *Presenting Bank:* {presentingBank}\n\n_Under Negotiable Instruments Act Section 138, a formal return memo has been generated. Please contact your branch immediately._" :
      selectedTemplate === "PPS_CONFIRMATION" ? "🛡️ *SURAT PEOPLES CO OP BANK*\n*Positive Pay System (PPS) Registration Confirmed*\n\nYour cheque has been pre-authorized for high-value clearance:\n\n• *Cheque No:* #{chequeNumber}\n• *Amount:* ₹{amount}\n• *Payee:* {payeeName}\n• *Registration Ref:* `{ppsRef}`\n• *Status:* ACTIVE / VERIFIED" :
      selectedTemplate === "HOURLY_BATCH_SETTLED" ? "⏱️ *SURAT PEOPLES CO OP BANK*\n*Hourly T+0 Continuous Clearing Realisation*\n\nDear Customer,\nYour cheque has been realised in RBI Continuous Clearing Session:\n\n• *Batch Ref:* `{batchId}`\n• *Cheque:* #{chequeNumber} (₹{amount})\n• *Realisation Time:* {settledAt}\n• *Credit Status:* INSTANT BENEFICIARY CREDIT (T+0)\n• *Statutory SLA:* 60-Minute Realisation Compliant" :
      selectedTemplate === "MULE_ALERT" ? "🛡️ *SURAT PEOPLES CO OP BANK — SECURITY RADAR*\n*Automated MuleHunter AI Anomaly Interception*\n\n⚠️ An anomalous transaction pattern was intercepted on Cheque *#{chequeNumber}* (₹{amount}).\n\n• *Risk Reason:* Velocity spike > 200% average volume\n• *Safety Action:* 24h MuleHold Protected\n• *Fraud Score:* 12/100" :
      selectedTemplate === "HIGH_VALUE_OTP" ? "🔐 *SURAT PEOPLES CO OP BANK*\n*High-Value Verification OTP*\n\nYour one-time authorization code is: *{otp}*\n\n• *Action:* Dual-Control Checker Release\n• *Instrument:* Cheque #{chequeNumber}\n• *Amount:* ₹{amount}\n• *Valid for:* 5 minutes" :
      "🏦 *SURAT PEOPLES CO OP BANK*\n*CTS Clearing Real-Time Alert*\n\nCheque *#{chequeNumber}* for *₹{amount}* processed for {payeeName}."
    );

    let text = rawTemplate;
    const vars = {
      ...dispatchParams,
      customerName,
      recipient: recipientPhone,
      ppsRef: "PPS-" + (dispatchParams.chequeNumber || "000101"),
      settlementMode: "RBI CONTINUOUS T+0",
      batchId: "BATCH-2026-HR-" + new Date().getHours(),
      settledAt: new Date().toLocaleTimeString("en-IN"),
      riskDetails: "Velocity spike > 200% average volume",
      fraudScore: "12",
    };
    for (const [key, val] of Object.entries(vars)) {
      text = text.replace(new RegExp(`{${key}}`, "g"), val || "N/A");
    }
    return text;
  }

  const computedAlertMessage = getComputedAlertMessage();
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
  const liveTargetUrl = dispatchQrMode === "direct" && cleanPhone && cleanPhone.length >= 10
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(computedAlertMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(computedAlertMessage)}`;

  useEffect(() => {
    if (!liveTargetUrl) return;
    let isCancelled = false;
    QRCode.toDataURL(liveTargetUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!isCancelled) setDispatchQrDataUrl(url);
      })
      .catch((err) => console.error("Offline QR generation error:", err));
    return () => {
      isCancelled = true;
    };
  }, [liveTargetUrl]);

  // Handle Send in WhatsApp Simulator
  async function handleSendChatMessage(textToSend) {
    const text = (textToSend || userInput).trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsBotTyping(true);

    try {
      const res = await client.post("/messaging/whatsapp/simulate-incoming", {
        message: text,
        senderPhone: recipientPhone,
      });

      setIsBotTyping(false);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.data?.reply || "Message received by bank switch.",
        actions: res.data?.actions || ["Menu"],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChatMessages((prev) => [...prev, botMsg]);
      loadLogs();
    } catch (err) {
      setIsBotTyping(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Error contacting banking switch: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }

  async function handleRecipientPhoneChange(newPhone) {
    setRecipientPhone(newPhone);
    try {
      await client.post("/messaging/whatsapp/register-active-number", {
        phone: newPhone,
        name: customerName,
        sendWelcome: true,
      });
      setNotification(`✅ Linked ${newPhone}! Real-time automated WhatsApp banking active.`);
      loadLogs();
    } catch (err) {
      console.warn("Failed to register WhatsApp:", err);
    }
  }

  async function handleTriggerDemoFlow() {
    try {
      setNotification("🚀 Dispatched real-time clearing lifecycle demo (Presentation ➔ Verification ➔ Clearance)...");
      await client.post("/messaging/whatsapp/trigger-demo", { phone: recipientPhone });
      setTimeout(loadLogs, 1500);
      setTimeout(loadLogs, 3500);
    } catch (err) {
      setNotification(`❌ Error triggering demo: ${err.message}`);
    }
  }

  // Manual Dispatch Action
  async function handleManualDispatch(e) {
    e.preventDefault();
    setLoading(true);
    setNotification("");

    try {
      let waData = null;
      let smsData = null;

      if (dispatchChannel === "WHATSAPP" || dispatchChannel === "BOTH") {
        const res = await client.post("/messaging/send-whatsapp", {
          recipient: recipientPhone,
          customerName,
          templateKey: selectedTemplate,
          params: dispatchParams,
        });
        waData = res.data?.whatsapp;
      }

      if (dispatchChannel === "SMS" || dispatchChannel === "BOTH") {
        const res = await client.post("/messaging/send-sms", {
          recipient: recipientPhone,
          customerName,
          templateKey: selectedTemplate,
          params: dispatchParams,
        });
        smsData = res.data?.sms;
      }

      const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
      const isDirect = dispatchQrMode === "direct" && cleanPhone && cleanPhone.length >= 10;
      const finalWaUrl = isDirect
        ? (waData?.directWhatsAppUrl || `https://wa.me/${cleanPhone}?text=${encodeURIComponent(computedAlertMessage)}`)
        : (waData?.universalWaUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(computedAlertMessage)}`);

      let localQrDataUrl = "";
      try {
        localQrDataUrl = await QRCode.toDataURL(finalWaUrl, {
          width: 280,
          margin: 2,
          color: { dark: "#064e3b", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
      } catch {
        localQrDataUrl = dispatchQrDataUrl;
      }

      setLastDispatched({
        id: waData?.id || smsData?.id || `MSG-${Date.now().toString().slice(-6)}`,
        phone: recipientPhone,
        cleanPhone,
        directWhatsAppUrl: finalWaUrl,
        universalWaUrl: waData?.universalWaUrl || `https://api.whatsapp.com/send?text=${encodeURIComponent(computedAlertMessage)}`,
        waMeUrl: finalWaUrl,
        qrUrl: localQrDataUrl || dispatchQrDataUrl,
        directSmsUri: smsData?.directSmsUri || `sms:${cleanPhone || "918320827300"}?body=${encodeURIComponent(computedAlertMessage)}`,
        body: waData?.body || smsData?.body || computedAlertMessage,
      });

      playNotificationChime("whatsapp");
      setNotification(`✅ Dispatched to ${recipientPhone}! Scannable QR code & instant delivery links updated.`);
      loadLogs();
    } catch (err) {
      setNotification(`❌ Dispatch error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig(e) {
    e.preventDefault();
    try {
      await client.post("/messaging/config", {
        callMeBotApiKey: callMeBotKey,
        fast2SmsApiKey: fast2SmsKey,
      });
      setNotification("✅ Free Gateway API credentials saved! Background server pushes will now use these live channels.");
      loadConfig();
    } catch (err) {
      setNotification(`❌ Failed to save config: ${err.message}`);
    }
  }

  // Filtered Logs
  const filteredLogs = logs.filter((l) => {
    if (logFilter !== "ALL" && l.channel !== logFilter) return false;
    if (logSearch) {
      const q = logSearch.toLowerCase();
      return (
        l.recipient?.toLowerCase().includes(q) ||
        l.customerName?.toLowerCase().includes(q) ||
        l.body?.toLowerCase().includes(q) ||
        l.id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-xl shadow-inner">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  WhatsApp Banking & SMS Notification Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  100% Free / Zero-Cost
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SURAT PEOPLES CO OP BANK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Two-way conversational WhatsApp Banking bot, regulatory DLT SMS alerts, and click-to-chat links.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-sm font-bold"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "simulator"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>📱 WhatsApp Phone Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab("outbox")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "outbox"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>📩 Live Outbox & Logs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-emerald-300 font-mono">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("sender")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "sender"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>🚀 Dispatch Test Alert</span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "templates"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>📋 DLT & WhatsApp Templates</span>
          </button>

          <button
            onClick={() => setActiveTab("config")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "config"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <span>⚙️ Free Gateway Setup</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <span>{notification}</span>
            <button onClick={() => setNotification("")} className="text-emerald-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/20">
          {/* TAB 1: WHATSAPP PHONE SIMULATOR */}
          {activeTab === "simulator" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Phone Frame Simulator (Left 7 Cols) */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="w-full max-w-md bg-slate-950 rounded-3xl border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[580px] relative">
                  {/* Smartphone Top Notch & WhatsApp Header */}
                  <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between border-b border-emerald-800/40 select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <img
                          src={logo}
                          alt="Bank"
                          className="w-8 h-8 rounded-full object-cover border border-emerald-400"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#075E54]" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs leading-tight">SURAT PEOPLES CO OP BANK</span>
                          <span className="text-[10px] text-emerald-300 font-bold" title="Verified Business Account">
                            ✅
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-200 leading-tight">
                          {isBotTyping ? "typing..." : "Official WhatsApp Banking • Online"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-emerald-100">
                      <span>📞</span>
                      <span>⋮</span>
                    </div>
                  </div>

                  {/* WhatsApp Chat Area Background with subtle pattern */}
                  <div className="flex-1 bg-[#0b141a] p-3 overflow-y-auto space-y-2.5 text-xs font-sans">
                    <div className="text-center my-1">
                      <span className="bg-[#182229] text-slate-400 px-2 py-0.5 rounded text-[10px] shadow-xs">
                        TODAY • END-TO-END ENCRYPTED 🔒
                      </span>
                    </div>

                    {chatMessages.map((msg) => {
                      const isUser = msg.sender === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in duration-150`}
                        >
                          <div
                            className={`max-w-[85%] rounded-xl px-3 py-2 shadow-md whitespace-pre-line text-xs ${
                              isUser
                                ? "bg-[#005c4b] text-white rounded-tr-none"
                                : "bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40"
                            }`}
                          >
                            <div>{msg.text}</div>
                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-300/80">
                              <span>{msg.time}</span>
                              {isUser && <span className="text-emerald-300 font-bold">✔✔</span>}
                            </div>
                          </div>

                          {/* Quick action buttons if available */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 max-w-[85%]">
                              {msg.actions.map((act, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSendChatMessage(act)}
                                  className="px-2 py-1 rounded-full bg-[#1f2c34] hover:bg-[#2a3942] border border-emerald-600/50 text-[10px] font-medium text-emerald-300 transition-colors cursor-pointer"
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isBotTyping && (
                      <div className="flex items-center gap-1.5 bg-[#202c33] text-slate-300 px-3 py-2 rounded-xl rounded-tl-none w-24 text-[10px] animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input Footer */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    className="p-2 bg-[#202c33] border-t border-slate-800 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type a command (e.g. STATUS 000101)..."
                      className="flex-1 bg-[#2a3942] text-white placeholder-slate-400 text-xs px-3 py-2 rounded-full border border-slate-700/60 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!userInput.trim()}
                      className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 disabled:hover:bg-[#00a884] text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer shadow-md"
                    >
                      ➤
                    </button>
                  </form>
                </div>
              </div>

              {/* Instructions & Features Guide (Right 5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                {/* Real-time WhatsApp Automation Box */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Zero-Click Real-Time Automation
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 font-mono font-semibold">
                      ACTIVE
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Enter any mobile number (or select a dummy) to fully automate real-time banking alerts without needing manual clicks:
                  </p>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => handleRecipientPhoneChange(e.target.value)}
                      className="w-full bg-slate-950 border border-emerald-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="+91 98765 43210"
                    />
                    <div className="flex items-center gap-1.5 text-[10px] overflow-x-auto scrollbar-none">
                      <span className="text-slate-400 font-semibold shrink-0">Dummy:</span>
                      {["+91 98765 43210", "+91 98251 44012", "+91 94280 88219"].map((dp) => (
                        <button
                          key={dp}
                          type="button"
                          onClick={() => handleRecipientPhoneChange(dp)}
                          className={`px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer shrink-0 ${
                            recipientPhone === dp
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                          }`}
                        >
                          {dp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerDemoFlow}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
                  >
                    <span>🚀 Run Real-Time Clearing Lifecycle Demo</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
                    <span>💡 Interactive WhatsApp Bot Commands</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Customers can interact with the bank 24/7. Try tapping any command to test live database resolution:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div
                      onClick={() => handleSendChatMessage("STATUS 000101")}
                      className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-emerald-300">STATUS 000101</div>
                      <div className="text-[11px] text-slate-400">Track clearance, payee & e-Kuber UTR of active cheque</div>
                    </div>

                    <div
                      onClick={() => handleSendChatMessage("STATUS 000108")}
                      className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-rose-300">STATUS 000108 (Dishonoured)</div>
                      <div className="text-[11px] text-slate-400">Inspect return reason code & Section 138 memo reference</div>
                    </div>

                    <div
                      onClick={() => handleSendChatMessage("PPS 000199 50000 Delta Logistics")}
                      className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-blue-300">PPS 000199 50000 Delta Logistics</div>
                      <div className="text-[11px] text-slate-400">Pre-authorize Positive Pay record directly into PostgreSQL</div>
                    </div>

                    <div
                      onClick={() => handleSendChatMessage("BALANCE 102030401001")}
                      className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-amber-300">BALANCE 102030401001</div>
                      <div className="text-[11px] text-slate-400">Check live ledger balance and active CTS lien holds</div>
                    </div>

                    <div
                      onClick={() => handleSendChatMessage("STOP 000102")}
                      className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="font-semibold text-purple-300">STOP 000102</div>
                      <div className="text-[11px] text-slate-400">Broadcast immediate stop-payment freeze across Clearing Grid</div>
                    </div>
                  </div>
                </div>

                {/* Real Free wa.me Link and QR for Testing on Phone */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">📱 Scan QR on Your Phone</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">100% OFFLINE</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Scan with your phone camera or Google Lens to immediately launch real WhatsApp with your account alert:
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                    >
                      <span>📷 Open Offline WhatsApp QR Code</span>
                    </button>
                    <a
                      href="https://api.whatsapp.com/send?text=STATUS%20000101"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-700 text-center"
                    >
                      <span>💬 Direct Web Link (wa.me)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE OUTBOX & LOGS */}
          {activeTab === "outbox" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filter Channel:</span>
                  {["ALL", "WHATSAPP", "SMS"].map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setLogFilter(ch)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        logFilter === ch
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Search phone, recipient, or text..."
                    className="bg-slate-950 text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none w-56"
                  />
                  <button
                    onClick={loadLogs}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium cursor-pointer"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No messaging logs found matching the filter.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800 uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Message ID</th>
                        <th className="py-2.5 px-3">Channel</th>
                        <th className="py-2.5 px-3">Recipient</th>
                        <th className="py-2.5 px-3">Template / Type</th>
                        <th className="py-2.5 px-3">Content / Payload</th>
                        <th className="py-2.5 px-3">Delivery Status</th>
                        <th className="py-2.5 px-3">Cost</th>
                        <th className="py-2.5 px-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 text-slate-300 font-semibold">{log.id}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.channel === "WHATSAPP"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {log.channel === "WHATSAPP" ? "💬 WhatsApp" : "📱 SMS"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-200">
                            <div>{log.recipient}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{log.customerName}</div>
                          </td>
                          <td className="py-2 px-3 text-slate-400">{log.templateId || "CUSTOM"}</td>
                          <td className="py-2 px-3 text-slate-300 max-w-xs truncate font-sans" title={log.body}>
                            {log.body}
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              ✔ {log.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{log.cost || "₹0.00"}</td>
                          <td className="py-2 px-3 text-slate-400 text-[10px] font-sans">
                            {new Date(log.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISPATCH TEST ALERT */}
          {activeTab === "sender" && (
            <div className="w-full max-w-5xl mx-auto space-y-4">
              {/* Header Banner */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>🚀 Manual & Instant Alert Dispatcher</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      100% Free / Instant Scan
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dispatch live DLT SMS or WhatsApp notifications with a real-time, scannable QR code ready on the screen as you type.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">Live Offline QR Active</span>
                </div>
              </div>

              {/* 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* LEFT COLUMN: PARAMETERS & FORM */}
                <div className="lg:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                  <form onSubmit={handleManualDispatch} className="space-y-4 text-xs">
                    {/* Recipient Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                          <span>Recipient Mobile Number</span>
                          <span className="text-[10px] text-slate-400">(Phone or Dummy)</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 font-mono text-xs"
                        required
                      />
                      {/* Quick Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400">Quick Autofill:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientPhone("+91 98251 44012");
                            setCustomerName("Rajesh Varma");
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          Rajesh Varma (+91 98251 44012)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientPhone("+91 99790 33411");
                            setCustomerName("Sunita Roy");
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                        >
                          Sunita Roy (+91 99790 33411)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecipientPhone("");
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/40 cursor-pointer"
                        >
                          + Enter My Real Phone
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Customer / Account Holder Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 mb-1 font-semibold">Channel Delivery</label>
                        <select
                          value={dispatchChannel}
                          onChange={(e) => setDispatchChannel(e.target.value)}
                          className="w-full bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="BOTH">WhatsApp & SMS (Simultaneous)</option>
                          <option value="WHATSAPP">WhatsApp Only</option>
                          <option value="SMS">SMS Only</option>
                        </select>
                      </div>
                    </div>

                    {/* Notification Template */}
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Notification Template (CTS Lifecycle)</label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full bg-slate-950 text-white px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="CHEQUE_PRESENTED">📥 Cheque Presented Alert</option>
                        <option value="CHEQUE_VERIFIED">🔍 Cheque Verified by Drawee Maker</option>
                        <option value="CHEQUE_CLEARED">✅ Cheque Cleared & Debited Confirmation</option>
                        <option value="CHEQUE_RETURNED">⚠️ Cheque Dishonoured / Return Memo (Rule 16)</option>
                        <option value="PPS_CONFIRMATION">🛡️ Positive Pay Registration Confirmed</option>
                        <option value="HOURLY_BATCH_SETTLED">⏱️ RBI Continuous Clearing Hourly Batch Settled</option>
                        <option value="MULE_ALERT">🚨 MuleHunter AI Anomaly Flagged</option>
                        <option value="HIGH_VALUE_OTP">🔐 High-Value Maker-Checker Approval OTP</option>
                      </select>
                    </div>

                    {/* Cheque Details */}
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Cheque Instrument Parameters</span>
                        <span className="text-[10px] text-emerald-400 font-normal">Auto-bound to live message</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Cheque Number:</span>
                          <input
                            type="text"
                            value={dispatchParams.chequeNumber}
                            onChange={(e) => setDispatchParams({ ...dispatchParams, chequeNumber: e.target.value })}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400">Amount (INR):</span>
                          <input
                            type="text"
                            value={dispatchParams.amount}
                            onChange={(e) => setDispatchParams({ ...dispatchParams, amount: e.target.value })}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400">Payee Name:</span>
                          <input
                            type="text"
                            value={dispatchParams.payeeName}
                            onChange={(e) => setDispatchParams({ ...dispatchParams, payeeName: e.target.value })}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-xs"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400">Account Number:</span>
                          <input
                            type="text"
                            value={dispatchParams.accountNumber}
                            onChange={(e) => setDispatchParams({ ...dispatchParams, accountNumber: e.target.value })}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400">e-Kuber UTR:</span>
                          <input
                            type="text"
                            value={dispatchParams.utr}
                            onChange={(e) => setDispatchParams({ ...dispatchParams, utr: e.target.value })}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400">Return Reason:</span>
                          <input
                            type="text"
                            value={dispatchParams.returnReason}
                            onChange={(e) => setDispatchParams({ ...dispatchParams, returnReason: e.target.value })}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/50"
                      >
                        <span>{loading ? "Dispatching..." : `🚀 Dispatch ${dispatchChannel} Notification (Free)`}</span>
                      </button>
                    </div>
                  </form>

                  {/* Dispatched Confirmation Banner */}
                  {lastDispatched && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-xs space-y-2 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>✅ Dispatched Successfully!</span>
                          <span className="text-[10px] font-mono text-emerald-400">({lastDispatched.id || "ACK-OK"})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setLastDispatched(null)}
                          className="text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-emerald-200">
                        Notification has been logged to Outbox and broadcasted over live SSE. Scan the QR code on the right or click below to launch in WhatsApp:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <a
                          href={lastDispatched.directWhatsAppUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                        >
                          <span>💬 Open Dispatched WhatsApp</span>
                        </a>
                        {lastDispatched.directSmsUri && (
                          <a
                            href={lastDispatched.directSmsUri}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <span>📱 Open Phone SMS</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: LIVE QR CODE & AS-IT-IS WHATSAPP PREVIEW */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-emerald-500/50 shadow-2xl space-y-4">
                  {/* Top Bar with Mode Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>📲 Live WhatsApp QR Code</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500 text-slate-950 font-black uppercase">
                          As It Is
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowQrModal(true)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                      >
                        Enlarge Fullscreen ↗
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Scan directly with your phone camera or Google Lens. Pre-filled with the active banking alert:
                    </p>
                  </div>

                  {/* QR Mode Switcher */}
                  <div className="p-1 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDispatchQrMode("universal")}
                      className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                        dispatchQrMode === "universal"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>🌟 Universal (Any Phone)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDispatchQrMode("direct")}
                      className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                        dispatchQrMode === "direct"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>📱 Direct to Number</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 px-1">
                    {dispatchQrMode === "universal" ? (
                      <span className="text-emerald-400 font-medium">
                        ✨ <strong>Guaranteed 100% reliable:</strong> Opens WhatsApp to "Message yourself" or any contact. Never gives "Number not on WhatsApp" error!
                      </span>
                    ) : (
                      <span className="text-blue-400 font-medium">
                        📲 Directly targets mobile number <strong>{cleanPhone || "None specified"}</strong> via wa.me link.
                      </span>
                    )}
                  </div>

                  {/* High Contrast Vector QR Box */}
                  <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/80">
                    {dispatchQrDataUrl ? (
                      <img
                        src={dispatchQrDataUrl}
                        alt="WhatsApp Live Alert QR"
                        className="w-[220px] h-[220px] object-contain rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-[220px] h-[220px] flex items-center justify-center text-slate-500 text-xs">
                        Generating offline QR...
                      </div>
                    )}
                    <div className="mt-2 text-[10px] font-mono font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                      <span>✓ SURAT PEOPLES CO OP BANK • CTS ALERT</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={liveTargetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow transition-transform hover:scale-102 cursor-pointer"
                    >
                      <span>💬 Open WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(liveTargetUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    >
                      <span>{copiedLink ? "✓ Link Copied!" : "📋 Copy Link"}</span>
                    </button>
                  </div>

                  {/* WhatsApp Message Preview Balloon */}
                  <div className="bg-[#0b141a] p-3 rounded-xl border border-emerald-900/40 text-xs space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <span>💬 WhatsApp Preview</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(computedAlertMessage);
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        {copiedText ? "✓ Copied!" : "Copy Text"}
                      </button>
                    </div>

                    <div className="bg-[#005c4b] p-3 rounded-xl text-white font-sans text-[11px] leading-relaxed shadow space-y-1 whitespace-pre-wrap">
                      {computedAlertMessage}
                      <div className="text-[9px] text-emerald-200/70 text-right flex items-center justify-end gap-1 pt-1">
                        <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-sky-300 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Scan Instructions Tip */}
                  <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-200/90 leading-relaxed flex items-start gap-2">
                    <span className="text-base">💡</span>
                    <span>
                      <strong>How to test on your phone:</strong> Point your phone camera or Google Lens at the QR code above. Tap the link to open WhatsApp, and tap <em>"Message yourself"</em> to see the official bank alert delivered instantly!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATES REGISTRY */}
          {activeTab === "templates" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                All templates comply with <strong>TRAI DLT Regulations</strong> (Telecom Commercial Communications Customer Preference) and <strong>WhatsApp Business Cloud API Guidelines</strong> for Indian Banking.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(templates).map(([key, tmpl]) => (
                  <div key={key} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{tmpl.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {tmpl.id}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400">SMS Format (DLT Approved)</span>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-sans">
                        {tmpl.sms}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">WhatsApp Rich Format</span>
                      <div className="bg-[#0b141a] p-2.5 rounded-lg border border-emerald-900/50 text-[11px] text-emerald-100 whitespace-pre-line font-sans">
                        {tmpl.whatsapp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FREE GATEWAY CONFIGURATION */}
          {activeTab === "config" && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚙️ Zero-Cost Gateway Deployment Options</span>
                </h3>

                <div className="space-y-3 text-slate-300">
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
                      <span>1️⃣ Virtual Telecom & Sandbox Gateway (Active - 100% Free)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Already enabled out-of-the-box! Full simulated two-way WhatsApp Bot, SMS delivery outbox, SSE real-time streaming, and customer notifications work with <strong>zero external accounts, zero API keys, and zero cost</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-blue-300 flex items-center gap-1.5 mb-1">
                      <span>2️⃣ Meta WhatsApp Business Cloud API (Free Sandbox Tier)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mb-2">
                      Meta provides a free developer sandbox with 1,000 free service conversations per month.
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-1">
                      <li>Go to <code>developers.facebook.com</code> → Create WhatsApp App (Free).</li>
                      <li>Copy your free <strong>Phone Number ID</strong> and <strong>Temporary Access Token</strong>.</li>
                      <li>Webhook URL to paste in Meta Portal:</li>
                    </ul>
                    <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-700 font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                      <span>http://localhost:5000/api/messaging/whatsapp/webhook</span>
                      <button
                        onClick={() => navigator.clipboard.writeText("http://localhost:5000/api/messaging/whatsapp/webhook")}
                        className="text-slate-400 hover:text-white text-[10px] font-sans"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      Verify Token: <code className="text-white">misdesc_whatsapp_webhook_2026</code>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
                      <span>3️⃣ Direct WhatsApp Click-to-Chat (wa.me)</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Uses standard <code>https://wa.me/&lt;number&gt;?text=&lt;encoded&gt;</code> links. Opens genuine WhatsApp on your phone or computer with pre-populated banking templates with 1 click at zero cost.
                    </p>
                  </div>

                  {/* 4. CallMeBot Free WhatsApp API (Automated Server Delivery) */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>4️⃣ CallMeBot Free WhatsApp Gateway (Automated Real Phone Push)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Server se direct real WhatsApp push pane ke liye 100% free CallMeBot use karein:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                      <li>Apne WhatsApp se <code>+34 644 44 22 84</code> par message bhejein: <code>I allow callmebot to send me messages</code></li>
                      <li>CallMeBot aapko turant reply me aapka <strong>Free API Key</strong> de dega.</li>
                      <li>Neeche apna API Key paste karein:</li>
                    </ol>
                    <input
                      type="text"
                      value={callMeBotKey}
                      onChange={(e) => setCallMeBotKey(e.target.value)}
                      placeholder="Enter CallMeBot API Key (e.g. 1234567)"
                      className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono"
                    />
                  </div>

                  {/* 5. Fast2SMS Free Indian SMS Gateway */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="font-bold text-blue-400 flex items-center gap-1.5">
                      <span>5️⃣ Fast2SMS Free Indian SMS Gateway (Real Indian Mobile Delivery)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Indian numbers par real SMS deliver karne ke liye fast2sms.com ka free signup use karein:
                    </p>
                    <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                      <li><code>fast2sms.com</code> par free account banayein (Free trial balance milta hai).</li>
                      <li>Dev API tab se apna <strong>Authorization API Key</strong> copy karein.</li>
                      <li>Neeche paste karein:</li>
                    </ol>
                    <input
                      type="text"
                      value={fast2SmsKey}
                      onChange={(e) => setFast2SmsKey(e.target.value)}
                      placeholder="Enter Fast2SMS Authorization Key"
                      className="w-full bg-slate-900 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveConfig}
                      className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
                    >
                      💾 Save Live Gateway Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showQrModal && (
        <WhatsAppQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          defaultPhone={cleanPhone || recipientPhone}
          initialMessage={computedAlertMessage || "STATUS 000101"}
        />
      )}
    </div>
  );
}
