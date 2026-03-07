"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, ArrowLeft, Upload, FileText, Check, Loader } from "lucide-react";
import { C } from "../design-system";
import { ClaudeLogo } from "../icons/ClaudeLogo";

const MODE_CONFIG = {
  continue: {
    heading: "Paste your draft",
    subtitle: "I'll read what you have, analyze your voice, and suggest what comes next.",
  },
  polish: {
    heading: "Import your writing",
    subtitle: "I'll review your piece and suggest specific improvements.",
  },
};

export function DraftPasteOverlay({ onSubmit, onBack, mode = "continue" }) {
  const [text, setText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null); // { name }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const config = MODE_CONFIG[mode] || MODE_CONFIG.continue;

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

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadedFile(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setUploadError(data.error || "Failed to process file");
        return;
      }

      setText(data.text);
      setUploadedFile({ name: data.filename });
    } catch (err) {
      setUploadError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
        {config.heading}
      </h2>
      <p style={{
        fontFamily: C.sans, fontSize: 14, color: C.textMuted,
        marginBottom: 24, textAlign: "center", lineHeight: 1.5,
      }}>
        {config.subtitle}
      </p>

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <div style={{
          background: C.bgComposer, borderRadius: 16,
          border: `0.5px solid ${C.border}`, boxShadow: C.shadowSoft,
          padding: "20px 24px 16px",
        }}>
          {/* File upload zone */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 14, paddingBottom: 14,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                borderRadius: 8, border: `1px solid ${C.border}`,
                background: "transparent", color: C.textSec, fontSize: 12,
                fontFamily: C.sans, cursor: isUploading ? "wait" : "pointer",
                transition: "all 0.15s",
              }}
              onMouseOver={e => { if (!isUploading) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}}
              onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
            >
              {isUploading ? (
                <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Extracting text...</>
              ) : (
                <><Upload size={13} /> Upload .docx or .pdf</>
              )}
            </button>

            {uploadedFile && (
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, color: C.green, fontFamily: C.sans,
              }}>
                <Check size={12} /> {uploadedFile.name}
              </span>
            )}

            {uploadError && (
              <span style={{ fontSize: 12, color: C.red, fontFamily: C.sans }}>
                {uploadError}
              </span>
            )}

            <span style={{
              fontSize: 11, color: C.textMuted, fontFamily: C.sans,
              marginLeft: "auto",
            }}>
              or paste below
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => {
              setText(e.target.value);
              // Clear file badge if user modifies text manually
              if (uploadedFile) setUploadedFile(null);
            }}
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

      {/* Spin animation for loader */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
