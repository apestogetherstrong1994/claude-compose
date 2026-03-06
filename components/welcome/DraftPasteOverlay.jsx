"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { C } from "../design-system";
import { ClaudeLogo } from "../icons/ClaudeLogo";

export function DraftPasteOverlay({ onSubmit, onBack }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const naturalH = textareaRef.current.scrollHeight;
      const maxH = 400;
      textareaRef.current.style.height = Math.min(naturalH, maxH) + "px";
      textareaRef.current.style.overflow = naturalH > maxH ? "auto" : "hidden";
    }
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (text.trim()) onSubmit(text.trim());
  };

  const paragraphCount = text.trim() ? text.trim().split(/\n\n+/).filter(Boolean).length : 0;

  return (
    <div style={{
      position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "28px 64px 32px", maxWidth: 700, margin: "0 auto", width: "100%",
    }}>
      <ClaudeLogo size={36} />
      <h2 style={{
        fontFamily: C.serif, fontStyle: "italic", fontWeight: 290, fontSize: 28,
        color: C.text, marginTop: 12, marginBottom: 8, letterSpacing: -0.3,
      }}>
        Paste your draft
      </h2>
      <p style={{
        fontFamily: C.sans, fontSize: 14, color: C.textMuted,
        marginBottom: 24, textAlign: "center", lineHeight: 1.5,
      }}>
        I'll read what you have, analyze your voice, and suggest what comes next.
      </p>

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div style={{
          background: C.bgComposer, borderRadius: 16,
          border: `0.5px solid ${C.border}`, boxShadow: C.shadowSoft,
          padding: "20px 24px 16px",
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && e.metaKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Paste your writing here... (separate paragraphs with blank lines)"
            rows={6}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              color: C.text, fontSize: 15, padding: 0, marginBottom: 16,
              fontFamily: C.serif, lineHeight: 1.8, resize: "none",
            }}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            borderTop: `1px solid ${C.border}`, paddingTop: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" onClick={onBack} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.textMuted, fontSize: 12,
                fontFamily: C.sans, cursor: "pointer",
              }}>
                <ArrowLeft size={12} /> Back
              </button>
              {paragraphCount > 0 && (
                <span style={{ fontSize: 12, color: C.textMuted, fontFamily: C.sans }}>
                  {paragraphCount} paragraph{paragraphCount !== 1 ? "s" : ""} detected
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.sans }}>
                ⌘+Enter
              </span>
              <button type="submit" disabled={!text.trim()} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 18px",
                borderRadius: 8, border: "none",
                background: text.trim() ? C.accent : C.bgHover,
                color: text.trim() ? "#fff" : C.textMuted,
                fontSize: 13, fontFamily: C.sans, fontWeight: 500,
                cursor: text.trim() ? "pointer" : "default",
                transition: "all 0.15s",
              }}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
