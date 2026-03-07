"use client";

import { useState } from "react";
import { Check, X, PenLine } from "lucide-react";
import { C } from "../design-system";

export function RevisionBlock({ originalBlock, proposal, onAccept, onReject, onRiff, isStreaming }) {
  const [isRiffing, setIsRiffing] = useState(false);
  const [riffText, setRiffText] = useState(proposal.text || "");

  const handleRiff = () => {
    setRiffText(proposal.text || "");
    setIsRiffing(true);
  };

  const handleSaveRiff = () => {
    if (riffText.trim()) {
      onRiff(riffText.trim());
      setIsRiffing(false);
    }
  };

  return (
    <div style={{
      background: C.accentSoft,
      borderRadius: 12,
      padding: "16px 20px",
      margin: "4px 16px 8px 20px",
      animation: "slideUp 0.4s ease",
    }}>
      {/* Header */}
      <div style={{
        fontSize: 11, fontFamily: C.sans, fontWeight: 500,
        color: C.accent, textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: 10,
      }}>
        Suggested revision
      </div>

      {/* Reasoning */}
      {proposal.reasoning && (
        <div style={{
          fontSize: 13, fontStyle: "italic", color: C.textSec,
          fontFamily: C.sans, marginBottom: 12, lineHeight: 1.5,
        }}>
          {proposal.reasoning}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
        {/* Left column: Original */}
        <div>
          <div style={{
            fontSize: 11, fontFamily: C.sans, color: C.textMuted,
            marginBottom: 6, fontWeight: 500,
          }}>
            Original
          </div>
          <div style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.15)",
            border: `1px solid ${C.border}`,
          }}>
            <p style={{
              fontFamily: C.serif, fontSize: 15, lineHeight: 1.8,
              color: C.textMuted, margin: 0, whiteSpace: "pre-wrap",
              opacity: 0.7,
            }}>
              {originalBlock.text}
            </p>
          </div>
        </div>

        {/* Right column: Suggested */}
        <div>
          <div style={{
            fontSize: 11, fontFamily: C.sans, color: C.accent,
            marginBottom: 6, fontWeight: 500,
          }}>
            Suggested
          </div>
          <div style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.accent}`,
          }}>
            {isRiffing ? (
              <div>
                <textarea
                  value={riffText}
                  onChange={e => setRiffText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && e.metaKey) handleSaveRiff();
                    if (e.key === "Escape") setIsRiffing(false);
                  }}
                  autoFocus
                  style={{
                    width: "100%", background: C.bgComposer,
                    border: `1px solid ${C.borderHover}`,
                    borderRadius: 8, padding: "12px 14px",
                    color: C.text, fontSize: 15,
                    fontFamily: C.serif, lineHeight: 1.8,
                    resize: "none", outline: "none", minHeight: 80,
                  }}
                />
                <div style={{
                  display: "flex", gap: 8, marginTop: 8,
                  justifyContent: "flex-end",
                }}>
                  <button onClick={() => setIsRiffing(false)} style={{
                    padding: "6px 12px", borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: "transparent", color: C.textMuted,
                    fontSize: 12, fontFamily: C.sans, cursor: "pointer",
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveRiff} style={{
                    padding: "6px 12px", borderRadius: 6,
                    border: "none", background: C.blue, color: "#fff",
                    fontSize: 12, fontFamily: C.sans, cursor: "pointer",
                  }}>
                    Use my version
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={!isStreaming ? handleRiff : undefined}
                style={{
                  fontFamily: C.serif, fontSize: 15, lineHeight: 1.8,
                  color: C.text, margin: 0, whiteSpace: "pre-wrap",
                  cursor: isStreaming ? "default" : "text",
                  borderRadius: 6, padding: "2px 0",
                  transition: "background 0.15s",
                }}
                onMouseOver={e => { if (!isStreaming) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                {proposal.text || ""}
                {isStreaming && <span style={{ animation: "pulse 1.4s ease-in-out infinite" }}>|</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isStreaming && proposal.text && !isRiffing && (
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button onClick={onAccept} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: C.radiusPill, border: "none",
            background: C.green, color: "#fff", fontSize: 12,
            fontFamily: C.sans, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
          onMouseOut={e => e.currentTarget.style.opacity = "1"}>
            <Check size={13} /> Accept
          </button>
          <button onClick={onReject} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: C.radiusPill, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMuted, fontSize: 12,
            fontFamily: C.sans, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}>
            <X size={13} /> Reject
          </button>
          <button onClick={handleRiff} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
            borderRadius: C.radiusPill, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textSec, fontSize: 12,
            fontFamily: C.sans, fontWeight: 500, cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}>
            <PenLine size={13} /> Riff
          </button>
        </div>
      )}
    </div>
  );
}
