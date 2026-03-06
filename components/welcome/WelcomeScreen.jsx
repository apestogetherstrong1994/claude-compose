"use client";

import { useRef, useEffect } from "react";
import { ArrowRight, FileText, Sparkles, PenLine } from "lucide-react";
import { C } from "../design-system";
import { ClaudeLogo } from "../icons/ClaudeLogo";

export function WelcomeScreen({ welcomeInput, setWelcomeInput, onSubmit, onTaskCard }) {
  const welcomeRef = useRef(null);

  useEffect(() => {
    if (welcomeRef.current) {
      welcomeRef.current.style.height = "auto";
      const naturalH = welcomeRef.current.scrollHeight;
      const maxH = 240;
      if (naturalH <= maxH) {
        welcomeRef.current.style.height = naturalH + "px";
        welcomeRef.current.style.overflow = "hidden";
      } else {
        welcomeRef.current.style.height = maxH + "px";
        welcomeRef.current.style.overflow = "auto";
      }
    }
  }, [welcomeInput]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (welcomeInput.trim()) onSubmit(welcomeInput.trim());
  };

  const cards = [
    {
      icon: <FileText size={20} color={C.accent} />,
      label: "Continue a draft",
      sub: "Paste existing text and build on it together",
      action: () => onTaskCard("continue"),
    },
    {
      icon: <Sparkles size={20} color={C.accent} />,
      label: "Start from a spark",
      sub: "Describe an idea and co-write from scratch",
      action: () => onTaskCard("spark"),
    },
    {
      icon: <PenLine size={20} color={C.accent} />,
      label: "Polish what you have",
      sub: "Import text for Claude to help you refine",
      action: () => onTaskCard("polish"),
    },
  ];

  return (
    <div style={{
      position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column",
      padding: "28px 64px 32px", maxWidth: 900, margin: "0 auto", width: "100%", overflowY: "auto",
    }}>
      <ClaudeLogo size={48} />
      <h1 style={{
        fontFamily: C.serif, fontStyle: "italic", fontWeight: 290, fontSize: 42,
        color: C.text, marginTop: 12, marginBottom: 28, letterSpacing: -0.5, lineHeight: 1.15,
      }}>
        Write together, not alone
      </h1>

      {/* Task cards */}
      <div style={{
        background: C.bgComposer, borderRadius: 16, border: `0.5px solid ${C.border}`,
        padding: "20px 24px", marginBottom: 24, boxShadow: C.shadowSoft,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4-4 4 4M4 10l4 4 4-4" stroke={C.textMuted} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ color: C.text, fontSize: 14, fontWeight: 500 }}>Start a conversation</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {cards.map((card, i) => (
            <button key={i} onClick={card.action}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                borderRadius: 12, border: `0.5px solid ${C.border}`, background: C.bg,
                cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans,
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = C.borderHover}
              onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
              <div style={{ flexShrink: 0 }}>{card.icon}</div>
              <div>
                <div style={{ color: C.text, fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{card.label}</div>
                <div style={{ color: C.textMuted, fontSize: 11 }}>{card.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div style={{ marginTop: "auto", flexShrink: 0 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: C.bgComposer, borderRadius: 20, boxShadow: C.shadow, padding: "16px 20px 12px" }}>
            <textarea
              ref={welcomeRef}
              value={welcomeInput}
              onChange={e => setWelcomeInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Describe what you want to write, or paste your draft..."
              rows={1}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                color: C.text, fontSize: 14, padding: 0, marginBottom: 12,
                fontFamily: C.sans, lineHeight: 1.6, resize: "none", overflow: "hidden",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button type="submit"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: 18, border: "none",
                  background: C.accent, color: "#fff", cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseOver={e => e.currentTarget.style.background = C.accentHover}
                onMouseOut={e => e.currentTarget.style.background = C.accent}>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </form>
        <div style={{ textAlign: "center", padding: "8px 0 0", fontSize: 12, color: C.textMuted, fontFamily: C.sans }}>
          Claude is AI and can make mistakes. Please double-check responses.
        </div>
      </div>
    </div>
  );
}
