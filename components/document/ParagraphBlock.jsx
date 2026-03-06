"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { C } from "../design-system";

export function ParagraphBlock({ block, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(block.text);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(block.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(block.text);
    setIsEditing(false);
  };

  const authorColor = {
    human: "transparent",
    claude: C.accent,
    collaborative: C.blue,
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        padding: "12px 16px 12px 20px",
        borderLeft: `2px solid ${authorColor[block.author] || "transparent"}`,
        borderRadius: 4,
        transition: "all 0.15s",
        background: isHovered && !isEditing ? C.bgHover : "transparent",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {isEditing ? (
        <div>
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={e => {
              setEditText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && e.metaKey) handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            style={{
              width: "100%", background: C.bgComposer, border: `1px solid ${C.borderHover}`,
              borderRadius: 8, padding: "12px 14px", color: C.text, fontSize: 16,
              fontFamily: C.serif, lineHeight: 1.8, resize: "none", outline: "none",
              minHeight: 60,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
            <button onClick={handleCancel} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent",
              color: C.textMuted, fontSize: 12, fontFamily: C.sans, cursor: "pointer",
            }}>
              <X size={12} /> Cancel
            </button>
            <button onClick={handleSave} style={{
              display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
              borderRadius: 6, border: "none", background: C.accent,
              color: "#fff", fontSize: 12, fontFamily: C.sans, cursor: "pointer",
            }}>
              <Check size={12} /> Save
            </button>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4, fontFamily: C.sans }}>
            ⌘+Enter to save · Esc to cancel
          </div>
        </div>
      ) : (
        <>
          <p style={{
            fontFamily: C.serif, fontSize: 16, lineHeight: 1.8,
            color: C.text, margin: 0, whiteSpace: "pre-wrap",
          }}>
            {block.text}
          </p>
          {/* Edit button on hover */}
          {isHovered && (
            <button onClick={() => setIsEditing(true)} style={{
              position: "absolute", top: 8, right: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`,
              background: C.bgComposer, cursor: "pointer", opacity: 0.8,
              transition: "opacity 0.15s",
            }}
            onMouseOver={e => e.currentTarget.style.opacity = "1"}
            onMouseOut={e => e.currentTarget.style.opacity = "0.8"}>
              <Pencil size={12} color={C.textMuted} />
            </button>
          )}
          {/* Author label */}
          {block.author !== "human" && (
            <div style={{
              fontSize: 10, color: block.author === "claude" ? C.accent : C.blue,
              fontFamily: C.sans, marginTop: 4, opacity: 0.6,
            }}>
              {block.author === "claude" ? "Claude" : "Collaborative"}
            </div>
          )}
        </>
      )}
    </div>
  );
}
