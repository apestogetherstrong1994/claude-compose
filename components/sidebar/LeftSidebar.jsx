"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { C } from "../design-system";

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 4 }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
        width: "100%", background: "transparent", border: "none",
        color: C.textMuted, fontSize: 11, fontWeight: 600, fontFamily: C.sans,
        cursor: "pointer", letterSpacing: 0.5, textTransform: "uppercase",
      }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
      </button>
      {open && <div style={{ padding: "0 12px 8px" }}>{children}</div>}
    </div>
  );
}

export function LeftSidebar({ blocks, voiceProfile, isAnalyzing }) {
  const accepted = blocks.filter(b => b.status === "accepted");
  const humanBlocks = accepted.filter(b => b.author === "human");
  const claudeBlocks = accepted.filter(b => b.author === "claude");
  const collabBlocks = accepted.filter(b => b.author === "collaborative");
  const totalWords = accepted.reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);

  return (
    <div style={{
      width: 220, minWidth: 220, flexShrink: 0, borderRight: `1px solid ${C.border}`,
      overflowY: "auto", background: C.bg,
      paddingTop: 12,
    }}>
      {/* Voice Profile */}
      <Section title="Voice Profile" defaultOpen={true}>
        {voiceProfile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(voiceProfile).map(([key, value]) => (
              <div key={key}>
                <div style={{
                  fontSize: 10, color: C.textMuted, fontFamily: C.sans,
                  textTransform: "capitalize", marginBottom: 2,
                }}>
                  {key}
                </div>
                <div style={{
                  fontSize: 12, color: C.text, fontFamily: C.sans, lineHeight: 1.4,
                }}>
                  {value}
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: C.sans, marginTop: 4 }}>
              Based on {humanBlocks.length} paragraph{humanBlocks.length !== 1 ? "s" : ""} analyzed
            </div>
          </div>
        ) : isAnalyzing ? (
          <div style={{
            fontSize: 12, color: C.textMuted, fontFamily: C.sans, fontStyle: "italic",
          }}>
            Analyzing your voice...
          </div>
        ) : (
          <div style={{
            fontSize: 12, color: C.textMuted, fontFamily: C.sans,
          }}>
            Write 2+ paragraphs to build your voice profile
          </div>
        )}
      </Section>

      {/* Stats */}
      <Section title="Contribution" defaultOpen={true}>
        {accepted.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <StatRow label="You wrote" value={`${humanBlocks.length} paragraph${humanBlocks.length !== 1 ? "s" : ""}`} />
            <StatRow label="Claude proposed" value={`${claudeBlocks.length + collabBlocks.length} paragraph${claudeBlocks.length + collabBlocks.length !== 1 ? "s" : ""}`} />
            {collabBlocks.length > 0 && (
              <StatRow label="Collaborative" value={`${collabBlocks.length} revision${collabBlocks.length !== 1 ? "s" : ""}`} />
            )}
            <div style={{
              borderTop: `1px solid ${C.border}`, paddingTop: 6, marginTop: 4,
              fontSize: 12, color: C.textSec, fontFamily: C.sans,
            }}>
              {totalWords} words total
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: C.sans }}>
            Start writing to see stats
          </div>
        )}
      </Section>

      {/* Document Outline */}
      <Section title="Outline" defaultOpen={true}>
        {accepted.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {accepted.map((block, i) => (
              <div key={block.id} style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, color: C.textSec, fontFamily: C.sans,
                lineHeight: 1.4, padding: "2px 0",
              }}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                  background: block.author === "human" ? C.textMuted
                    : block.author === "claude" ? C.accent
                    : C.blue,
                  opacity: 0.6,
                }} />
                <span style={{
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {block.text.substring(0, 40)}{block.text.length > 40 ? "..." : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: C.sans }}>
            No paragraphs yet
          </div>
        )}
      </Section>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: 12, fontFamily: C.sans,
    }}>
      <span style={{ color: C.textMuted }}>{label}</span>
      <span style={{ color: C.textSec }}>{value}</span>
    </div>
  );
}
