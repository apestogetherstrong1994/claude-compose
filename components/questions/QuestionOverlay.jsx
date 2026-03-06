"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { C } from "../design-system";

export const QuestionOverlay = ({ question, questionIndex, totalQuestions, onSelect, onSkip }) => {
  const [showFreeText, setShowFreeText] = useState(false);
  const [freeText, setFreeText] = useState("");

  useEffect(() => {
    setShowFreeText(false);
    setFreeText("");
  }, [questionIndex]);

  return (
    <div style={{
      background: C.bgComposer, borderRadius: 20, boxShadow: C.shadow,
      padding: "20px 24px",
    }}>
      {/* Progress dots + Skip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {Array.from({ length: totalQuestions }, (_, i) => (
            <div key={i} style={{
              width: i === questionIndex ? 24 : 8, height: 3, borderRadius: 2,
              background: i <= questionIndex ? C.accent : C.border,
              opacity: i < questionIndex ? 0.4 : 1,
              transition: "all 0.3s",
            }} />
          ))}
          <span style={{ fontSize: 11, color: C.textMuted, marginLeft: 8, fontFamily: C.sans }}>
            {questionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <button onClick={onSkip} style={{
          background: "transparent", border: "none", color: C.textMuted,
          cursor: "pointer", fontSize: 12, fontFamily: C.sans,
          padding: "4px 8px", borderRadius: 6,
        }}
        onMouseOver={e => e.currentTarget.style.color = C.textSec}
        onMouseOut={e => e.currentTarget.style.color = C.textMuted}>
          Skip
        </button>
      </div>

      {/* Question title + description */}
      <div style={{ fontSize: 15, fontWeight: 500, color: C.text, marginBottom: 4, fontFamily: C.sans }}>
        {question.title}
      </div>
      {question.description && (
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16, lineHeight: 1.4, fontFamily: C.sans }}>
          {question.description}
        </div>
      )}

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {question.options.map((opt, i) => (
          <button key={i} onClick={() => onSelect(`${opt.label}${opt.description ? ': ' + opt.description : ''}`)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 10, border: `0.5px solid ${C.border}`, background: C.bg,
              cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans,
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.background = C.bgHover; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bg; }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, flexShrink: 0, opacity: 0.7 }} />
            <div>
              <div style={{ color: C.text, fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
              {opt.description && <div style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>{opt.description}</div>}
            </div>
          </button>
        ))}
        {/* Free text option */}
        {!showFreeText ? (
          <button onClick={() => setShowFreeText(true)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 10, border: `0.5px dashed ${C.border}`, background: "transparent",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: C.sans,
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = C.borderHover}
            onMouseOut={e => e.currentTarget.style.borderColor = C.border}>
            <MessageSquare size={13} color={C.textMuted} style={{ flexShrink: 0 }} />
            <div style={{ color: C.textMuted, fontSize: 13 }}>Something else...</div>
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input value={freeText} onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && freeText.trim()) onSelect(freeText.trim()); }}
              placeholder="Type your answer..."
              autoFocus
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, border: `0.5px solid ${C.border}`,
                background: C.bg, color: C.text, fontSize: 13, fontFamily: C.sans, outline: "none",
              }} />
            <button onClick={() => { if (freeText.trim()) onSelect(freeText.trim()); }}
              disabled={!freeText.trim()}
              style={{
                padding: "10px 16px", borderRadius: 10, border: "none",
                background: freeText.trim() ? C.accent : C.bgHover,
                color: freeText.trim() ? "#fff" : C.textMuted,
                cursor: freeText.trim() ? "pointer" : "default",
                fontSize: 13, fontFamily: C.sans, fontWeight: 500, flexShrink: 0,
              }}>
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
