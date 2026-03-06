"use client";

import { useRef, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { C } from "../design-system";
import { ClaudeLogo } from "../icons/ClaudeLogo";
import { StreamingDots } from "./StreamingDots";

export function ChatPanel({ messages, input, setInput, onSend, isStreaming }) {
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (input.trim() && !isStreaming) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div style={{
      width: 360, borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", background: C.bg,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <ClaudeLogo size={18} />
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text, fontFamily: C.sans }}>
          Claude
        </span>
        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.sans }}>
          co-author
        </span>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={{
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            animation: "fadeIn 0.3s ease",
          }}>
            {msg.role === "assistant" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <ClaudeLogo size={14} />
                <span style={{ fontSize: 11, color: C.textMuted, fontFamily: C.sans }}>Claude</span>
              </div>
            )}
            <div style={{
              maxWidth: "90%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user" ? C.accentSoft : C.bgComposer,
              border: `0.5px solid ${msg.role === "user" ? "rgba(218,119,86,0.2)" : C.border}`,
              fontSize: 13, lineHeight: 1.6, color: C.text, fontFamily: C.sans,
              whiteSpace: "pre-wrap",
            }}>
              {msg.displayContent || msg.content}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ClaudeLogo size={14} />
            <StreamingDots />
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            background: C.bgComposer, borderRadius: 14, padding: "10px 12px",
            border: `0.5px solid ${C.border}`,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Discuss your writing..."
              rows={1}
              disabled={isStreaming}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: C.text, fontSize: 13, fontFamily: C.sans, resize: "none",
                lineHeight: 1.5, padding: 0, maxHeight: 120,
                opacity: isStreaming ? 0.5 : 1,
              }}
            />
            <button type="submit" disabled={isStreaming || !input.trim()} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 14, border: "none",
              background: input.trim() && !isStreaming ? C.accent : C.bgHover,
              color: input.trim() && !isStreaming ? "#fff" : C.textMuted,
              cursor: input.trim() && !isStreaming ? "pointer" : "default",
              transition: "all 0.15s", flexShrink: 0,
            }}>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
