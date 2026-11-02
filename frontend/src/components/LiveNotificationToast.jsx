import React, { useState } from "react";
import { useClearingEvents } from "../hooks/useClearingEvents";

export default function LiveNotificationToast() {
  const [notification, setNotification] = useState(null);

  useClearingEvents((event) => {
    let title = "";
    let message = "";
    let type = "info";

    if (event.type === "PRESENTED") {
      title = "New Cheque Presented";
      message = `Cheque #${event.data?.chequeNumber} (₹${Number(event.data?.amount || 0).toLocaleString("en-IN")}) presented by ${event.data?.presentingBank || "Presenting Bank"}`;
      type = "presentation";
    } else if (event.type === "AWAITING_CHECKER") {
      title = "4-Eyes Sign-Off Required";
      message = `Cheque #${event.data?.chequeNumber} forwarded to Senior Approver (Checker) under 4-Eyes governance.`;
      type = "warning";
    } else if (event.type === "VERIFIED") {
      title = "Cheque Verified";
      message = `Cheque #${event.data?.chequeNumber} passed initial verification by Drawee Maker.`;
      type = "info";
    } else if (event.type === "CLEARED") {
      title = "Cheque Cleared";
      message = `Cheque #${event.data?.chequeNumber} cleared successfully. Ready for e-Kuber settlement.`;
      type = "success";
    } else if (event.type === "RETURNED") {
      title = "Cheque Dishonoured / Returned";
      message = `Cheque #${event.data?.chequeNumber} returned: ${event.data?.returnReason || "Dishonoured"}`;
      type = "danger";
    } else if (event.type === "SETTLEMENT") {
      title = "Net Settlement Executed";
      message = event.data?.message || "Continuous Clearing Batch Settled via RBI e-Kuber";
      type = "success";
    } else if (event.type === "WHATSAPP_SENT") {
      title = "💬 Instant WhatsApp Banking Alert";
      message = `To ${event.data?.recipient || "Customer"}: ${(event.data?.body || "").replace(/[*_`]/g, "").slice(0, 80)}...`;
      type = "whatsapp";
    }

    setNotification({ title, message, type, time: new Date().toLocaleTimeString() });

    setTimeout(() => {
      setNotification(null);
    }, 6000);
  });

  if (!notification) return null;

  const bgColors = {
    presentation: "bg-brand-950/95 border-brand-700 text-white",
    success: "bg-emerald-950/95 border-emerald-700 text-white",
    danger: "bg-rose-950/95 border-rose-700 text-white",
    warning: "bg-amber-950/95 border-amber-700 text-amber-100",
    info: "bg-slate-900/95 border-slate-700 text-white",
    whatsapp: "bg-[#0b291e] border-emerald-500/80 text-emerald-100 shadow-xl shadow-emerald-950/50",
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 rounded-xl shadow-2xl border flex items-start gap-3 max-w-sm ${bgColors[notification.type] || bgColors.info}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider">{notification.title}</h4>
            <span className="text-[10px] opacity-70 font-mono">{notification.time}</span>
          </div>
          <p className="text-xs opacity-90 mt-1">{notification.message}</p>
        </div>
        <button
          type="button"
          onClick={() => setNotification(null)}
          className="text-white/60 hover:text-white px-1.5 py-0.5 rounded text-xs transition-colors flex items-center justify-center cursor-pointer"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
