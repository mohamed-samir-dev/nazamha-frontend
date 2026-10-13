"use client";

import { LogOut, ClipboardCheck, Lock } from "lucide-react";

interface Props {
  onLogout: () => void;
}

export function PendingScreen({ onLogout }: Props) {
  return (
    <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="glass-panel panel-content" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem 2rem" }}>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
          <ClipboardCheck size={32} />
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ffffff" }}>بانتظار موافقة الإدارة</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "1rem" }}>
          لقد تم تسجيل حسابك بنجاح، وهو الآن قيد المراجعة.
        </p>
        <div style={{ marginBottom: "2rem", padding: "1rem", background: "rgba(37, 211, 102, 0.1)", borderRadius: "8px", border: "1px solid rgba(37, 211, 102, 0.3)" }}>
          <p style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>أو يمكنك التواصل معنا لتأكيد التسجيل فوراً:</p>
          <a href="https://wa.me/201028583616" target="_blank" rel="noopener noreferrer" className="btn" style={{ background: "#25D366", color: "white", display: "inline-flex", gap: "0.5rem", border: "none" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            01028583616
          </a>
        </div>
        <button className="btn btn-secondary" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
          <LogOut size={16} /><span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}

export function BlockedScreen({ onLogout }: Props) {
  return (
    <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div className="glass-panel panel-content" style={{ maxWidth: "450px", textAlign: "center", padding: "3rem 2rem" }}>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#ffffff" }}>عذراً، الحساب معطل!</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "2rem" }}>
          انتهت صلاحية اشتراكك أو تم إيقاف حسابك. يرجى التواصل مع الدعم الفني.
        </p>
        <button className="btn btn-secondary" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
          <LogOut size={16} /><span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}
