"use client";

import { C } from "../design-system";

export function ContributionBar({ blocks }) {
  const accepted = blocks.filter(b => b.status === "accepted");
  if (accepted.length === 0) return null;

  const totalWords = accepted.reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
  if (totalWords === 0) return null;

  const segments = accepted.map(b => ({
    width: b.text.split(/\s+/).filter(Boolean).length / totalWords,
    author: b.author,
  }));

  const humanWords = accepted
    .filter(b => b.author === "human")
    .reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
  const collabWords = accepted
    .filter(b => b.author === "collaborative")
    .reduce((sum, b) => sum + b.text.split(/\s+/).filter(Boolean).length, 0);
  const humanPercent = Math.round(((humanWords + collabWords * 0.5) / totalWords) * 100);
  const claudePercent = 100 - humanPercent;

  const colorMap = {
    human: C.text,
    claude: C.accent,
    collaborative: C.blue,
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: "flex", height: 4, borderRadius: 2, overflow: "hidden",
        background: C.border,
      }}>
        {segments.map((seg, i) => (
          <div key={i} style={{
            width: `${seg.width * 100}%`,
            background: colorMap[seg.author] || C.textMuted,
            opacity: 0.7,
            transition: "width 0.3s ease",
          }} />
        ))}
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", marginTop: 6,
        fontSize: 11, color: C.textMuted, fontFamily: C.sans,
      }}>
        <span>{humanPercent}% you · {claudePercent}% Claude</span>
        <span>{totalWords} words</span>
      </div>
    </div>
  );
}
