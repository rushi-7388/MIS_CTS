import React, { useState, useEffect, useRef } from "react";
import client from "../api/client";
import { useClearingEvents } from "../hooks/useClearingEvents";
import { playNotificationChime } from "../utils/sound.util";
import WhatsAppQrModal from "./WhatsAppQrModal";

const DUMMY_PRESETS = [
  { phone: "+91 98765 43210", label: "Dummy #1 (National Switch)", name: "Rajesh Varma" },
  { phone: "+91 98251 44012", label: "Dummy #2 (Surat Commercial)", name: "Ramesh Patel" },
  { phone: "+91 94280 88219", label: "Dummy #3 (Institutional)", name: "Amitabh Sen" },
];

export default function RealtimeWhatsAppFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [phone, setPhone] = useState("+91 98765 43210");
  const [customerName, setCustomerName] = useState("Rajesh Varma");
  const [isAutomated, setIsAutomated] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [statusNotification, setStatusNotification] = useState("");

  const [messages, setMessages] = useState([
    {
      id: "init-0",
      sender: "bank",
      text: "🏦 *SURAT PEOPLES CO OP BANK*\n*Official WhatsApp Real-Time Clearing Hub*\n\nNamaste! Your account is connected for *Instant Zero-Click CTS Notifications*.\n\n⚡ *Real-Time Automation Active:* Any cheque presented, verified, or cleared will notify you automatically without clicking.\n\n*Quick Commands:*\n1️⃣ *STATUS <chequeNo>*\n2️⃣ *BALANCE*\n3️⃣ *PPS <chequeNo> <amount> <payee>*\n4️⃣ *STOP <chequeNo>*\n5️⃣ *MENU*",
      time: "Just now",
      actions: ["STATUS 000101", "BALANCE", "PPS Register", "Menu"],
    },
  ]);

  const chatEndRef = useRef(null);
  const registerTimeoutRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen, isTyping]);

  // Load registered active phone on mount
  useEffect(() => {
    async function fetchActiveNumber() {
      try {
        const res = await client.get("/messaging/whatsapp/active-number");
        if (res.data?.customer?.phone) {
          setPhone(res.data.customer.phone);
          if (res.data.customer.name) setCustomerName(res.data.customer.name);
        }
      } catch {
        // Fallback to initial dummy
      }
    }
    fetchActiveNumber();
  }, []);

  // Listen to Live SSE Events for real-time WhatsApp pushes
  useClearingEvents((event) => {
    if (event.type === "WHATSAPP_SENT") {
      const wa = event.data;
      if (!wa) return;

      const newMsg = {
        id: wa.id || `wa-${Date.now()}`,
        sender: "bank",
        text: wa.body,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: wa.actions || ["STATUS 000101", "BALANCE", "Menu"],
        status: wa.status || "DELIVERED",
      };

      setMessages((prev) => {
        // Prevent duplicate IDs
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      playNotificationChime("whatsapp");

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } else if (event.type === "WHATSAPP_CUSTOMER_REGISTERED") {
      setStatusNotification(`⚡ Active WhatsApp Target: ${event.data?.phone} (Zero-Click Automation Enabled)`);
      setTimeout(() => setStatusNotification(""), 4000);
    }
  });

  // Zero-Click Automated Registration when user changes or selects phone number
  function handlePhoneChange(newPhone, newName = null) {
    setPhone(newPhone);
    const targetName = newName || customerName;
    if (newName) setCustomerName(newName);

    if (registerTimeoutRef.current) clearTimeout(registerTimeoutRef.current);

    // Debounce registration by 500ms
    registerTimeoutRef.current = setTimeout(async () => {
      try {
        await client.post("/messaging/whatsapp/register-active-number", {
          phone: newPhone,
          name: targetName,
          sendWelcome: true,
        });
        setStatusNotification(`✅ Linked ${newPhone}! Welcome alert pushed.`);
        setTimeout(() => setStatusNotification(""), 3500);
      } catch (err) {
        console.warn("Failed to register WhatsApp number:", err);
      }
    }, 500);
  }

  // Handle Quick Dummy Number Select (Instant Zero-Click Setup)
  function handleSelectPreset(preset) {
    handlePhoneChange(preset.phone, preset.name);
  }

  // Send Two-Way User Message to Bot
  async function handleSendMessage(customText = null) {
    const text = (customText || inputMessage).trim();
    if (!text) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await client.post("/messaging/whatsapp/simulate-incoming", {
        message: text,
        senderPhone: phone,
      });

      setIsTyping(false);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bank",
        text: res.data?.reply || "Message received by bank switch.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actions: res.data?.actions || ["Menu"],
      };

      setMessages((prev) => [...prev, botMsg]);
      playNotificationChime("whatsapp");
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bank",
          text: `⚠️ Network error: ${err.message}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }

  // Instant Zero-Click Real-Time Clearing Flow Simulation
  async function handleTriggerRealtimeDemo() {
    setDemoRunning(true);
    setStatusNotification("🚀 Launching real-time clearing lifecycle (Presentation ➔ Verification ➔ Settlement)...");

    try {
      await client.post("/messaging/whatsapp/trigger-demo", { phone });
      setTimeout(() => {
        setDemoRunning(false);
        setStatusNotification("");
      }, 4500);
    } catch (err) {
      setDemoRunning(false);
      setStatusNotification(`❌ Error: ${err.message}`);
    }
  }

  // Helper to format WhatsApp markdown (*bold*, _italic_, `monospace`)
  function formatWhatsAppText(text) {
    if (!text) return "";
    return text.split("\n").map((line, lineIdx) => {
      // Monospace backticks
      let parts = line.split(/(`[^`]+`)/g).map((chunk, i) => {
        if (chunk.startsWith("`") && chunk.endsWith("`")) {
          return (
            <code key={i} className="bg-black/30 px-1 py-0.5 rounded text-[11px] font-mono text-emerald-300">
              {chunk.slice(1, -1)}
            </code>
          );
        }

        // Bold asterisks
        return chunk.split(/(\*[^*]+\*)/g).map((subChunk, j) => {
          if (subChunk.startsWith("*") && subChunk.endsWith("*")) {
            return (
              <strong key={j} className="font-bold text-white">
                {subChunk.slice(1, -1)}
              </strong>
            );
          }

          // Italic underscores
          return subChunk.split(/(_[^_]+_)/g).map((italicChunk, k) => {
            if (italicChunk.startsWith("_") && italicChunk.endsWith("_")) {
              return (
                <em key={k} className="italic opacity-85">
                  {italicChunk.slice(1, -1)}
                </em>
              );
            }
            return italicChunk;
          });
        });
      });

      return (
        <span key={lineIdx} className="block min-h-[1.1rem]">
          {parts}
        </span>
      );
    });
  }

  return (
    <>
      {/* 1. Floating WhatsApp Banking Capsule Trigger Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-2xl transition-all duration-300 cursor-pointer border ${
            isOpen
              ? "bg-slate-900 border-emerald-500/80 text-emerald-400 scale-95"
              : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/60 hover:scale-105"
          }`}
          title="Open Instant WhatsApp Banking Assistant"
        >
          <div className="relative flex items-center justify-center">
            {/* WhatsApp Logo SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.043.101-.116.433-.506.549-.679.116-.173.231-.145.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.202.043.072.043.419-.101.824z" />
            </svg>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>

          <span className="text-xs font-bold tracking-tight">WhatsApp Banking</span>

          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            Real-Time
          </span>

          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Interactive Instant WhatsApp Banking Drawer / Phone Window */}
      {isOpen && (
        <div className="fixed bottom-18 right-3 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-h-[82vh] h-[640px] flex flex-col bg-slate-950 border border-emerald-600/60 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in slide-in-from-bottom-5 duration-200">
          {/* Top WhatsApp Verified Header */}
          <div className="px-4 py-3 bg-[#075E54] flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold shrink-0">
                🏦
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#075E54]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold truncate">SURAT PEOPLES CO OP BANK</h3>
                  {/* Verified Checkmark */}
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-[#075E54] flex items-center justify-center text-[9px] font-black shrink-0">
                    ✓
                  </span>
                </div>
                <p className="text-[10px] text-emerald-100/80 truncate">
                  {isTyping ? "Banking Assistant typing..." : "Official WhatsApp Banking Rail • 24/7"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-black/20 flex items-center justify-center text-xs text-white cursor-pointer transition-colors"
                title="Minimize WhatsApp Banking"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Zero-Click Customer WhatsApp Registration Deck */}
          <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Customer Mobile (Zero-Click Real-Time):
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                {isAutomated ? "Auto-Push ON" : "Manual"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Enter WhatsApp Mobile (+91...)"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono tracking-wide"
              />
              <button
                type="button"
                onClick={handleTriggerRealtimeDemo}
                disabled={demoRunning}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-md disabled:opacity-50 transition-all"
                title="Simulate instant clearing presentation, verification, and clearance"
              >
                {demoRunning ? "Pushing..." : "🚀 Test"}
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-600/50 font-bold text-[11px] shrink-0 cursor-pointer shadow-md transition-all flex items-center gap-1"
                title="Scan QR on your Phone Camera"
              >
                <span>📷 QR</span>
              </button>
            </div>

            {/* Quick 1-Click Dummy Number Selectors */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              <span className="text-slate-400 shrink-0 font-semibold">Quick Dummy:</span>
              {DUMMY_PRESETS.map((p) => (
                <button
                  key={p.phone}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2 py-0.5 rounded-lg border font-mono shrink-0 transition-all cursor-pointer ${
                    phone === p.phone
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {p.phone}
                </button>
              ))}
            </div>

            {statusNotification && (
              <div className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/80 animate-in fade-in duration-150">
                {statusNotification}
              </div>
            )}
          </div>

          {/* WhatsApp Chat Log Area */}
          <div
            className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0d1418] relative"
            style={{
              backgroundImage:
                "radial-gradient(#1f2c34 1px, transparent 1px), radial-gradient(#1f2c34 1px, #0d1418 1px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "0 0, 14px 14px",
            }}
          >
            {/* Timestamp Notice */}
            <div className="flex justify-center">
              <span className="px-3 py-1 rounded-full text-[10px] font-medium bg-slate-800/90 text-slate-400 border border-slate-700/60 shadow-xs">
                🔒 Messages are end-to-end encrypted & NPCI CTS-2010 logged
              </span>
            </div>

            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md border ${
                      isUser
                        ? "bg-[#005c4b] border-[#02735e] text-emerald-50 rounded-br-xs"
                        : "bg-[#202c33] border-[#2a3942] text-slate-200 rounded-bl-xs"
                    }`}
                  >
                    <div className="space-y-0.5 leading-relaxed break-words">{formatWhatsAppText(msg.text)}</div>

                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-400">
                      <span>{msg.time}</span>
                      {isUser && <span className="text-cyan-400 font-bold">✓✓</span>}
                    </div>
                  </div>

                  {/* Interactive Quick Action Buttons if supplied by bot */}
                  {!isUser && msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-w-[90%]">
                      {msg.actions.map((action, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#2a3942] hover:bg-[#324550] text-emerald-300 border border-[#3b4a54] transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-[#202c33] px-3 py-2 rounded-xl text-slate-400 text-xs w-28 border border-[#2a3942]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] ml-1">typing...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type command (e.g. STATUS 000101, BALANCE)..."
              className="flex-1 bg-[#2a3942] border border-[#3b4a54] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center text-sm font-bold shadow-md cursor-pointer transition-all"
              title="Send to Bank Assistant"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {showQrModal && (
        <WhatsAppQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          defaultPhone={phone}
          initialMessage="STATUS 000101"
        />
      )}
    </>
  );
}
